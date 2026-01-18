import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userModel from "../models/usermodel.js";
//import { sendWelcomeEmail } from "../utils/sendEmail.js"; 
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await userModel.findOne({ email });
    console.log("Existing user:", existingUser);

    if (existingUser) {
      return res.json({
        success: false,
        message: "User already exists. Please login."
      });
    }



    if (!name || !email || !password) {
      return res.json({
        success: false,
        message: "Name, email, and password are required."
      });
    }



    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = String(Math.floor(100000 + Math.random() * 900000));

    await userModel.create({
      name,
      email,
      password: hashedPassword,
      verifyOtp: otp,
      verifyOtpExpireAt: Date.now() + 15 * 60 * 1000
    });

    return res.json({
      success: true,
      message: "Verify your account",
      userEmail: email
    });

  } catch (error) {
    console.error("Registration error:", error);
    return res.json({
      success: false,
      message: "Server error"
    });
  }
};

export const firebase = async (req, res) => {
  try {

    const { googleId, name, email, avatar } = req.body;



    const hashedPassword = await bcrypt.hash(googleId, 10);
    let user = await userModel.findOne({ googleId });
    let msg = 'Login successful'
    if (!user) {
      
      const existingUser = await userModel.findOne({ email });
      console.log("Existing user:", existingUser);

      if (existingUser) {
        return res.json({
          success: false,
          message: "User already exists. Please login."
        });
      }
      msg = 'Registration successful'
      user = new userModel({ avatar, googleId, name, email, isAccountVerified: true, password: hashedPassword });
      //await sendWelcomeEmail(email,name)
      await user.save();
    }
    await user.save();
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const data = {
      name: user.name,
      email: user.email,
      kycStatus: user.kycStatus,
      isAccountVerified: user.isAccountVerified,

    }
    res.json({
      success: true,
      message: msg, token, userData: data
    })

  } catch (error) {
    res.json({
      success: false,
      message: error.message
    })
  }
}


export const reSend = async (req, res) => {
  const { email } = req.body
  const otp = String(Math.floor(100000 + Math.random() * 900000))

  try {
    const user = await userModel.findOne({ email })
    if (!user) {
      return res.json({
        success: false, message: 'user not found'
      })
    }
    user.verifyOtp = otp
    user.verifyOtpExpireAt = Date.now() + 12 * 60 * 1000
    await user.save()
    res.json({ success: true, message: 'otp is resend check your email' })
  } catch (er) {
    res.send({
      success: false, message: er.message
    })
  }

}

export const verify = async (req, res) => {
  const { email, otp } = req.body
  try {
    const user = await userModel.findOne({ email })
    if (!user) {
      return res.json({
        success: false, message: 'user not found'
      })
    }
    if (user.verifyOtp !== otp || user.verify === " ") {
      return res.json({
        success: false, message: 'otp invalidate'
      })
    }

    if (user.verifyOtpExpireAt < Date.now()) {
      return res.json({
        success: false, message: "otp expired"
      })
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );



    user.isAccountVerified = true
    user.verifyOtp = ''
    user.verifyOtpExpireAt = 0
    await user.save()

    const data = {
      name: user.name,
      email: user.email,
      kycStatus: user.kycStatus,
      isAccountVerified: user.isAccountVerified,

    }
    res.json({
      success: true,
      message: 'Account is verified', token, userData: data
    })
  } catch (er) {
    res.send({
      success: false, message: er.message
    })
  }
}


export const login = async (req, res) => {
  try {
    console.log('test')
    const { email, password } = req.body;
    console.log({ email, password })
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: 'Invalid credentials' });
    }
    // Check if password is correct
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.json({ success: false, message: 'Invalid credentials.' });
    }

    // Create JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    let userRole = user.role === 'admin' ? {role: 'admin'} : {};

    const data = {
      name: user.name,
      email: user.email,
      kycStatus: user.kycStatus,
      isAccountVerified: user.isAccountVerified,
      ...userRole
      

    }

    res.json({ success: true, message: 'login success', token, userData: data });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};


// step one
export const sendResetOtp = async (req, res) => {
  console.log('reset req hit server')
  try {
    const { email } = req.body
    if (!email) {
      return res.json({
        success: false, message: 'please enter your email'
      })
    }

    console.log('email found', email)


    const user = await userModel.findOne({ email })

    console.log('user found', user)

    if (!user) {
      return res.json({
        success: false, message: 'user not exist'
      })
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000))

    user.resetOtp = otp;
    user.resetOtpExpireAt = Date.now() + 45 * 60 * 1000; // 45 min
    await user.save()
    console.log(otp, user.name, user.email)
    /// await RestEmail(otp, user.name, user.email)

    res.json({
      success: true, message: 'reset otp is send check your email'
    })

  } catch (error) {
    console.log(error)
    res.json({
      success: false, message: error.message
    })

  }

}
// step two
export const verifyResetOtp = async (req, res) => {
  const { email, otp } = req.body

  if (!email || !otp) {
    return res.json({
      success: false, message: 'OTP required'
    });
  }
  try {

    const user = await userModel.findOne({ email })
    if (!user) {
      return res.json({
        success: false, message: 'user not found'
      })
    }

    if (user.resetOtp !== otp || user.resetOtp === " ") {
      return res.json({
        success: false, message: 'rest otp invalidate'
      })
    }

    if (user.resetOtpExpireAt < Date.now()) {
      return res.json({
        success: false, message: "otp expired"
      })
    }

    res.json({
      success: true,
      message: 'Create a New Password',

    })

  } catch (er) {
    return res.send({
      success: false, message: er.message

    })
  }

}

//step three
export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body

  
  if (!email || !otp || !newPassword) {
    return res.json({
      success: false, message: 'New password are required'
    });
  }
  try {

    
    const user = await userModel.findOne({ email })
    if (!user) {
      return res.json({
        success: false, message: 'user not found'
      })
    }

    if (user.resetOtp !== otp || user.resetOtp === " ") {
      return res.json({
        success: false, message: 'rest otp invalidate'
      })
    }

    if (user.resetOtpExpireAt < Date.now()) {
      return res.json({
        success: false, message: "otp expired"
      })
    }

    const hashPass = await bcrypt.hash(newPassword, 10);
    user.password = hashPass

    user.resetOtp = ""
    user.resetOtpExpireAt = 0
    await user.save()

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const data = {
      name: user.name,
      email: user.email,
      kycStatus: user.kycStatus,
      isAccountVerified: user.isAccountVerified,

    }


    res.json({
      success: true, message: 'your pasword successful reset', token, userData: data
    })

  } catch (er) {
    return res.send({
      success: false, message: er.messages

    })
  }

}

export const reSendResetOtp = async (req, res) => {
  const { email } = req.body
  const otp = String(Math.floor(100000 + Math.random() * 900000))

  try {
    const user = await userModel.findOne({ email })
    if (!user) {
      return res.json({
        success: false, message: 'user not found'
      })
    }
    user.resetOtp = otp;
    user.resetOtpExpireAt = Date.now() + 45 * 60 * 1000; // 45 min
    await user.save()
    res.json({ success: true, message: 'Reset otp is resend check your email' })
  } catch (er) {
    res.send({
      success: false, message: er.message
    })
  }

}

export const getProfile = async (req, res) => {
  try {
    const user = await userModel.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const responseUser = {
      name: user.name || "",
      email: user.email || "",
      avatar: user.avatar || "",
      wallet: {
        usdt: user.wallet.usdt || 0,
        btc: user.wallet.btc || 0,
        eth: user.wallet.eth || 0,
        loanUsdt: user.loanUsdt || 0
      }
    };

    res.json({
      success: true,
      user: responseUser
    });

  } catch (error) {
    res.json({
      success: false,
      message: "Server error"
    });
  }
};




