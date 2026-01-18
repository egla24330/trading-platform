import React from 'react'
import { motion, AnimatePresence } from "framer-motion";
import { useState } from 'react'
import { Mail, RotateCw } from 'lucide-react'
import { toast } from 'react-toastify';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';


const StepOne = ({ setEmail, email, verificationStatus, setVerificationStatus, setStep  }) => {
    const [isLoading, setIsLoading] = useState(false);
   const { backendUrl } = useAuth()
    const handleSendOTP = async () => {
        if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
            setVerificationStatus('invalid_email');
            return;
        }
        setIsLoading(true)

        try {

            let res = await axios.post(`${backendUrl}api/auth/send-reset-opt`, {
                email: email,
            })

            if (res.data.success) {
                toast.success(res.data.message)
              //   setToken(res.data.token)
                //localStorage.setItem('token', res.data.token)
                //await new Promise(resolve => setTimeout(resolve, 2000));
                setIsLoading(false);
                setVerificationStatus('otp_sent');
                setStep(2);

            } else {
                toast.error(res.data.message || 'something went wrong')

            }

        } catch (error) {
            console.log(error)
            toast.error('server error ')
        } finally {
            setIsLoading(false);
            setVerificationStatus(null);
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
                <AnimatePresence>
                    {verificationStatus === 'invalid_email' && (
                        <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-rose-300 text-center text-sm bg-rose-900/30 py-3 px-4 rounded-xl"
                        >
                            Please enter a valid email address
                        </motion.p>
                    )}
                </AnimatePresence>

                <div>
                    <label htmlFor="email" className="block text-blue-200 text-sm mb-2 font-medium">
                        Email Address
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-blue-400" />
                        </div>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-10 pr-3 py-3 bg-gray-800/50 border border-blue-500/30 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition placeholder:text-blue-200/40"
                            placeholder="your@email.com"
                            disabled={isLoading}
                        />
                    </div>
                </div>

                <button
                    onClick={handleSendOTP}
                    disabled={isLoading}
                    className="w-full py-4 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <>
                            <RotateCw className="h-5 w-5 animate-spin" />
                            Sending...
                        </>
                    ) : (
                        'Send Verification Code'
                    )}
                </button>
            </motion.div>

        </>
    )
}

export default StepOne
