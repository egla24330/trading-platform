import express from 'express';
import { login,register, reSend, reSendResetOtp, resetPassword, sendResetOtp, verify, verifyResetOtp,firebase, getProfile } from '../controllers/authController.js';
/*,, adminLogin,firebase,userData,countUser,telegramAuth*/ 
import { protect } from '../middlewares/authMiddleware.js';

const authRouter = express.Router();
authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/verify',verify)
authRouter.post('/resend',reSend)
authRouter.post('/send-reset-opt',sendResetOtp)
authRouter.post('/verify-reset-opt',verifyResetOtp)
authRouter.post('/reset-password',resetPassword)
authRouter.post('/re-send-reset-otp',reSendResetOtp)
authRouter.post('/firebase',firebase)
authRouter.get('/profile',protect,getProfile)

/*
authRouter.post('/me',auth,userData)
authRouter.post('/login', loginUser);
authRouter.post('/admin', adminLogin);
authRouter.post('/google-auth', firebase);
authRouter.get('/user-count',adminMiddleware,countUser)
authRouter.post("/telegram-login",telegramAuth)
*/
export default authRouter;