import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    ArrowRight,
    Lock,
    Mail,
    Eye,
    EyeOff,
    User,
    ArrowLeft,
} from "lucide-react";
import { Link } from "react-router-dom";
//import FloatingParticles from "../components/FloatingParticles";
import { useAuth } from "../context/AuthContext";
import axios from 'axios'
import { useNavigate } from "react-router-dom";
import { ClipLoader } from "react-spinners"
import { toast } from "react-toastify";
import { assets } from "../assets/assets";
import { auth, provider, signInWithPopup } from '../firebase.js'


const SignUp = () => {
    const navigate = useNavigate()
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);


    const { backendUrl, setIsOtpSend,setToken, setUserData  } = useAuth()
    const [loadingGoogle, setLoadingGoogle] = useState(false)

    const [showPassword, setShowPassword] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [loading, setLoading] = useState(false)


    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        console.log(formData)
        e.preventDefault();
        setLoading(true)

        try {
            const fullName = (formData.firstName + ' ' + formData.lastName)
            let res = await axios.post(`${backendUrl}api/auth/register`, {
                name: fullName,
                email: formData.email,
                password: formData.password,
            })

            console.log(res)

            if (res.data.success) {
                toast.success(res.data.message)
                localStorage.setItem('registerEmail', res.data.userEmail)
                setIsOtpSend(true)
                navigate('/verify')

            } else {
                toast.error(res.data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.response?.data?.message || 'Network error, please try again.')

        } finally {
            setLoading(false)

        }


    };

    const handleGoogleLogin = async () => {
        try {
          setLoadingGoogle(true)
          const result = await signInWithPopup(auth, provider)
          const { displayName, email, photoURL, uid } = result.user
          console.log({
            googleId: uid,
            name: displayName,
            email,
            avatar: photoURL,
    
    
          })
 console.log(backendUrl)
    
          const res = await axios.post(`${backendUrl}api/auth/firebase`, {
            googleId: uid,
            name: displayName,
            email,
            avatar: photoURL,
          })

          console.log(res)
    
          if (res.data.success) {
            toast.success(res.data.message)
            setToken(res.data.token)
            localStorage.setItem('token', res.data.token)
            setUserData(res.data.userData)
            localStorage.setItem('userData', JSON.stringify(res.data.userData))
            navigate('/')
    
          }
        } catch (error) {
          console.log(error)
          toast.error('Google login failed. Please try again.')
        } finally {
          setLoadingGoogle(false)
        }
      }





    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black text-white overflow-hidden">
            {/* <FloatingParticles /> */}
            <div className="relative z-10 max-w-6xl mx-auto px-4 py-10 flex flex-col md:flex-row items-center justify-center">
                <motion.div
                    className="w-full md:w-1/2 lg:w-2/5"
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg">
                        <div className="text-center mb-6">
                            <motion.div
                                className="inline-flex items-center px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium mb-3"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                <User size={14} className="mr-1" />
                                CREATE ACCOUNT
                            </motion.div>
                            <h1 className="text-xl font-semibold mb-1">Join Us Today</h1>
                            {/* <p className="text-gray-400 text-sm">Create an account to get started</p> */}
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">


                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">First Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                        <input
                                            name="firstName"
                                            type="text"
                                            placeholder="Abebe"
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            className="w-full py-2.5 pl-10 pr-4 bg-gray-900 border border-gray-800 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                                            required
                                            autoComplete="firstName"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Last Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                        <input
                                            name="lastName"
                                            type="text"
                                            placeholder="Kebede"
                                            value={formData.lastName}
                                            onChange={handleChange}
                                            className="w-full py-2.5 pl-10 pr-4 bg-gray-900 border border-gray-800 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                                            required
                                            autoComplete="lastName"

                                        />
                                    </div>
                                </div>



                            </div>

                            {/* Email */}
                            <div className="mb-4">
                                <label className="block text-sm text-gray-400 mb-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="your@email.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full py-2.5 pl-10 pr-4 bg-gray-900 border border-gray-800 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                                        autoComplete="email"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Passwords */}


                            <div className="mb-4">
                                <label className="block text-sm text-gray-400 mb-1">
                                    password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                    <input
                                        name='password'
                                        type={showPassword ? "text" : "password"}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        className="w-full py-2.5 pl-10 pr-10 bg-gray-900 border border-gray-800 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                                        autoComplete="password"
                                        required
                                    />
                                    <button type="button" onClick={(p) => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                                        {showPassword ? <Eye size={16} className="text-gray-500" /> : <EyeOff size={16} className="text-gray-500" />}
                                    </button>
                                </div>
                            </div>

                            {/* 
                            

                            {/* Submit */}
                            <motion.button
                                disabled={loading}
                                type="submit"
                                className="w-full bg-blue-500  hover:to-blue-700 text-white font-medium py-2.5 rounded-lg flex items-center justify-center transition-all shadow-md mb-5"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                            >
                                {loading ? <ClipLoader size={20} /> : <>Create Account <ArrowRight className="ml-2 w-4 h-4" /></>}
                            </motion.button>
                        </form>

                       

                        {/* Social */}
                        {/* <div className="mb-4">
                            <div className="flex items-center mb-3">
                                <div className="flex-grow h-px bg-gray-800" />
                                <span className="px-3 text-xs text-gray-500">Or sign up with</span>
                                <div className="flex-grow h-px bg-gray-800" />
                            </div>

                            <div className="grid grid-cols-1 gap-2">
                                {socialLogins.map((social) => (
                                    <motion.button
                                        key={social.name}
                                        className="flex items-center justify-center gap-2 py-2.5 px-4 text-sm rounded-lg border border-blue-400 hover:border-blue-400/60 transition"
                                        whileHover={{ y: -2 }}
                                        whileTap={{ scale: 0.97 }}
                                    >
                                        {social.icon} {social.name}
                                    </motion.button>
                                ))}
                            </div>
                        </div> */}

                        {/* Already have account */}
                        <div className="text-center text-sm text-gray-500">
                            Already have an account?{" "}
                            <Link to="/login" className="text-blue-500 hover:text-blue-400 font-medium">
                                Sign in
                            </Link>
                        </div>

                         <div className="flex items-center gap-3 mt-2">
                            <div className="h-px bg-gray-600 flex-1"></div>
                            <span className="text-xs text-gray-400">OR</span>
                            <div className="h-px bg-gray-600 flex-1"></div>
                        </div>

                        <div className="flex flex-col gap-4 mt-4">

                            {/* Google */}
                            <button
                            disabled={loadingGoogle}
                            onClick={handleGoogleLogin}
                            className="group w-full flex items-stretch rounded-xl overflow-hidden bg-white cursor-pointer">
                                <div className=" w-14 flex items-center justify-center ansition-colors">
                                    <img src={assets.google} className="w-6 h-6" alt="Google" />
                                </div>
                                <div className="flex-1 p-3 flex items-center justify-between">
                                    <span className="font-semibold text-gray-700 ml-2">
                                        
                                       { loadingGoogle ? <ClipLoader size={20} /> :'Continue with Google'}
                                        
                                    </span>
                                    <span className="text-black group-hover:text-blue-500 transition-colors pr-2">→</span>
                                </div>
                            </button>

                            {/* Telegram */}
                            {/* <button className="group w-full flex items-stretch rounded-xl overflow-hidden bg-white cursor-pointer">
                                        <div className=" w-14 flex items-center justify-center transition-colors">
                                          <img src={assets.telegram} className="w-6 h-6" alt="Telegram" />
                                        </div>
                                        <div className="flex-1 p-2 flex items-center justify-between">
                                          <span className="font-semibold text-gray-700 ml-2">Continue with Telegram</span>
                                          <span className="text-black group-hover:text-blue-500 transition-colors pr-2">→</span>
                                        </div>
                                      </button> */}

                        </div>

                        <motion.div
                            className="my-6 text-center text-gray-500 text-sm"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                        >
                            <Link to="/" className="inline-flex items-center hover:text-gray-300">
                                <ArrowLeft className="w-4 h-4 mr-1" /> Back to homepage
                            </Link>
                        </motion.div>
                    </div>

                    {/* <motion.div
                        className="mt-6 text-center text-gray-500 text-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                    >
                        <Link to="/" className="inline-flex items-center hover:text-gray-300">
                            <ArrowLeft className="w-4 h-4 mr-1" /> Back to homepage
                        </Link>
                    </motion.div> */}
                </motion.div>
            </div >
        </div >
    );
};

export default SignUp;
