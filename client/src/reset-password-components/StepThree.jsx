import React from 'react'
import { motion, AnimatePresence } from "framer-motion";
import { Lock, RotateCw, CheckCircle, Eye, EyeOff } from "lucide-react";
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
const StepThree = ({ verificationStatus, setVerificationStatus, email, otp }) => {
    const navigate = useNavigate()
    const { backendUrl, setToken, setUserData } = useAuth()
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const [showPassword, setShowPassword] = useState(false);

    const handlePasswordReset = async () => {
        if (password !== confirmPassword) {
            setVerificationStatus('password_mismatch');
            return;
        }

        if (password.length < 8) {
            setVerificationStatus('password_short');
            return;
        }

        setIsLoading(true);

        const code = otp.join("")
        setVerificationStatus(null);

        try {

            let res = await axios.post(`${backendUrl}api/auth/reset-password`, {
                newPassword: password,
                email: email,
                otp: code
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
                setOtp(["", "", "", "", "", ""]);
                inputsRef.current[1].focus();
            }
        } catch (error) {
            toast.error('server error')
        } finally {
            setIsLoading(false);
        }


    };
    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
            >
                <div className="mb-6 flex flex-col items-center">
                    <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{
                            scale: verificationStatus === 'success' ? 1.1 : 1,
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 10
                        }}
                        className={`p-4 rounded-full ${verificationStatus === 'success'
                            ? 'bg-blue-900/30'
                            : 'bg-blue-600/20'
                            }`}
                    >
                        {verificationStatus === 'success' ? (
                            <CheckCircle className="h-8 w-8 text-blue-400" />
                        ) : (
                            <Lock className="h-8 w-8 text-blue-400" />
                        )}
                    </motion.div>
                </div>

                <AnimatePresence>
                    {verificationStatus === 'password_mismatch' && (
                        <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-rose-300 text-center text-sm bg-rose-900/30 py-3 px-4 rounded-xl"
                        >
                            Passwords don't match. Please try again.
                        </motion.p>
                    )}
                    {verificationStatus === 'password_short' && (
                        <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-amber-300 text-center text-sm bg-amber-900/30 py-3 px-4 rounded-xl"
                        >
                            Password must be at least 8 characters.
                        </motion.p>
                    )}
                </AnimatePresence>

                <div>
                    <label htmlFor="password" className="block text-blue-200 text-sm mb-2 font-medium">
                        New Password
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-blue-400" />
                        </div>
                        <input
                            type={showPassword ? "text" : "password"}
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-10 pr-10 py-3 bg-gray-800/50 border border-blue-500/30 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition placeholder:text-blue-200/40"
                            placeholder="••••••••"
                            disabled={isLoading || verificationStatus === 'success'}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-blue-400 hover:text-blue-300"
                        >
                            {showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                        </button>
                    </div>
                </div>

                <div>
                    <label htmlFor="confirmPassword" className="block text-blue-200 text-sm mb-2 font-medium">
                        Confirm Password
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-blue-400" />
                        </div>
                        <input
                            type={showPassword ? "text" : "password"}
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full pl-10 pr-3 py-3 bg-gray-800/50 border border-blue-500/30 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition placeholder:text-blue-200/40"
                            placeholder="••••••••"
                            disabled={isLoading || verificationStatus === 'success'}
                        />
                    </div>
                </div>

                <button
                    onClick={handlePasswordReset}
                    disabled={isLoading || password === "" || confirmPassword === "" || verificationStatus === 'success'}
                    className={`w-full py-4 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${verificationStatus === 'success'
                        ? 'bg-blue-600/30 text-blue-400'
                        : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-lg shadow-blue-500/20'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    {isLoading ? (
                        <>
                            <RotateCw className="h-5 w-5 animate-spin" />
                            Resetting...
                        </>
                    ) : verificationStatus === 'success' ? (
                        <>
                            <CheckCircle className="h-5 w-5" />
                            Password Reset
                        </>
                    ) : (
                        'Reset Password'
                    )}
                </button>
            </motion.div>
        </>
    )
}

export default StepThree
