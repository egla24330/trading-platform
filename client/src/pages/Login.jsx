import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowLeft
} from "lucide-react";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
//import FloatingParticles from "../components/FloatingParticles";
import { ClipLoader } from "react-spinners"
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { assets } from "../assets/assets";
import { auth, provider, signInWithPopup } from '../firebase.js'

const Login = () => {
  const navigate = useNavigate()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  const { backendUrl, setToken, setUserData } = useAuth()
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState('')
  const [pass, setPas] = useState('')
  const togglePassword = () => setShowPassword(!showPassword);
  const [loading, setLoading] = useState(false)
  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const [loadingSetTelegram, setLoadingSetTelegram] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {

      if (email == '') {
        return toast.warn('email required')
      }

      if (pass == '') {
        return toast.warn('password required')
      }

      console.log(backendUrl)

      let res = await axios.post(`${backendUrl}api/auth/login`, {
        password: pass,
        email: email,
      })

      if (res.data.success) {
        toast.success(res.data.message)
        setToken(res.data.token)
        localStorage.setItem('token', res.data.token)
        setUserData(res.data.userData)
        localStorage.setItem('userData', JSON.stringify(res.data.userData))
        navigate('/')

      } else {
        toast.error(res.data.message || 'something went wrong')

      }
    } catch (error) {

      toast.error('server error 500')
    } finally {
      setLoading(false);

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


      const res = await axios.post(`${backendUrl}api/auth/firebase`, {
        googleId: uid,
        name: displayName,
        email,
        avatar: photoURL,
        
      })

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


  const handleTelegramLogin = async () => {
    try {
      const initData = window.Telegram?.WebApp?.initData;
      if (!initData) {
        toast.error("Telegram is not available");
        return;
      }
      setLoadingSetTelegram(true)
      const res = await axios.post(`${backendurl}/api/user/telegram-login`, {
        initData,
        
      });


      if (res.data.success) {
        setToken(res.data.token)
        localStorage.setItem('token', res.data.token)
        navigate('/')

      } else {
        toast.error(res.data.message || 'Telegram login failed. Please try again.')
      }
    } catch (error) {
      console.log(error)
      toast.error('Telegram login failed. Please try again.')
    } finally {
      setLoadingSetTelegram(false)
    }
  }


  return (
    <div className="min-h-screen  text-white overflow-hidden">
      {/* <FloatingParticles /> */}
      <div className="h-screen relative z-10 max-w-7xl mx-auto px-4 py-8 md:py-12 flex flex-col md:flex-row items-center justify-center">
        <motion.div
          className="w-full md:w-1/2 lg:w-2/6"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-800 rounded-2xl p-5 shadow-xl">
            <div className="text-center mb-5">
              <motion.div
                className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium mb-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Lock size={16} className="mr-2" />
                SECURE LOGIN
              </motion.div>
              {/* <h1 className="text-xl font-semibold mb-1">Welcome Back</h1> */}
              {/* <p className="text-gray-400 text-sm">Sign in to access your account</p> */}
            </div>

            <form onSubmit={handleSubmit}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail size={18} className="text-gray-500" />
                    </div>
                    <input
                      type="email"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
                      placeholder="your@email.com"
                      required
                      onChange={e => setEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </div>
                </div>
              </motion.div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={18} className="text-gray-500" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full pl-10 pr-10 py-2.5 bg-gray-900 border border-gray-800 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
                    placeholder="••••••••"
                    required
                    onChange={e => setPas(e.target.value)}
                    autoComplete="password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={togglePassword}
                  >
                    {showPassword ? (
                      <EyeOff size={18} className="text-gray-500 hover:text-gray-300" />
                    ) : (
                      <Eye size={18} className="text-gray-500 hover:text-gray-300" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between mb-5">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="form-checkbox rounded bg-gray-800 border-gray-700 text-blue-500 focus:ring-blue-500"
                    checked={rememberMe}
                    onChange={() => setRememberMe(!rememberMe)}
                  />
                  <span className="ml-2 text-sm text-gray-400">Remember me</span>
                </label>

                <Link to="/reset" className="text-xs text-white-500 hover:text-blue-400 transition-colors">
                  Forgot password?
                </Link>
              </div>

              <motion.button
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center transition-all duration-300 shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 mb-5"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}

                onClick={handleSubmit}
              >
                {loading ? <ClipLoader size={20} /> : <>Sign In <ArrowRight className="ml-2 w-4 h-4" /></>}
              </motion.button>
            </form>



            <div className="text-center text-xs text-gray-500">
              Don't have an account?{" "}
              <Link to="/signup" className="text-blue-500 font-medium hover:text-blue-400 transition-colors">
                Sign up now
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
                onClick={handleGoogleLogin}
                disabled={loadingGoogle}
                className="group w-full flex items-stretch rounded-xl overflow-hidden bg-white cursor-pointer">
                <div className=" w-14 flex items-center justify-center ansition-colors">
                  <img src={assets.google} className="w-6 h-6" alt="Google" />
                </div>
                <div className="flex-1 p-3 flex items-center justify-between">
                  <span className="font-semibold text-gray-700 ml-2">
                    {loadingGoogle ? 'Processing...' : 'Continue with Google'}
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
              className="my-6 text-center text-gray-500 text-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <Link to="/" className="inline-flex items-center hover:text-gray-300 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to homepage
              </Link>
            </motion.div>



          </div>


        </motion.div>
      </div>
    </div>
  );
};

export default Login;
