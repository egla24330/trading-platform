import React, { useState, useRef, useEffect } from "react";
import { MailCheck, RotateCw, CheckCircle, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import TimerprogressBar from "../components/TimerprogressBar";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import axios from 'axios'

import { useNavigate } from "react-router-dom";

export default function EmailOtpVerificationPage() {
    const {backendUrl,setToken, setUserData,setIsOtpSend } = useAuth()
    const navigate = useNavigate()
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [timer, setTimer] = useState(60);
    const [isLoading, setIsLoading] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState(null); // null, 'success', 'error'
    const inputsRef = useRef([]);
    const email = localStorage.getItem('registerEmail')

    useEffect(() => {
        const countdown = setInterval(() => {
            setTimer((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(countdown);
    }, []);

    const handleChange = (value, index) => {
        if (/^\d$/.test(value)) {
            const newOtp = [...otp];
            newOtp[index] = value;
            setOtp(newOtp);

            if (index < 5) {
                inputsRef.current[index + 1].focus();
            }

            if (index === 5 && newOtp.every((d) => d !== "")) {
                handleSubmit(newOtp.join(""));
            }
        } else if (value === "" && index > 0) {
            // Handle backspace
            const newOtp = [...otp];
            newOtp[index] = "";
            setOtp(newOtp);
            inputsRef.current[index - 1].focus();
        }
    };

    const handlePaste = (e) => {
        const paste = e.clipboardData.getData("text").trim();
        if (/^\d{6}$/.test(paste)) {
            const newOtp = paste.split("");
            setOtp(newOtp);
            inputsRef.current[5].focus();
            handleSubmit(paste);
        }
    };

    const handleSubmit = async (code) => {
        setIsLoading(true);
        setVerificationStatus(null);
        try {
            let res = await axios.post(`${backendUrl}api/auth/verify`, {
                otp: code,
                email: email,
            })

            const isSuccess = res.data.success
            setVerificationStatus(isSuccess ? 'success' : 'error');

            if (res.data.success) {
                console.log(res)
                toast.success(res.data.message)
                 setToken(res.data.token)
                 localStorage.setItem('token', res.data.token)
                 setUserData(res.data.userData)
                 localStorage.setItem('userData',JSON.stringify(res.data.userData))
                 setIsOtpSend(false)
                 navigate('/')

            } else {
                toast.error(res.data.message || 'something went wrong 404')
                setOtp(["", "", "", "", "", ""]);
                inputsRef.current[0].focus();
            }
        } catch (error) {
            setOtp(["", "", "", "", "", ""]);
            inputsRef.current[0].focus();
            setVerificationStatus('error');
            toast.error('server error 500')
            console.log(error)
        } finally {
            setIsLoading(false);

        }
    };

    const handleResend = async () => {

        setIsLoading(true);
        setVerificationStatus(null);
        try {
            let res = await axios.post(`${backendUrl}api/auth/resend`, {
                email: email,
            })



            if (res.data.success) {
                toast.success(res.data.message)
                if (timer === 0) {
                    setTimer(60);
                    setVerificationStatus(null);
                    setOtp(["", "", "", "", "", ""]);
                    inputsRef.current[0].focus();
                    console.log("Resending OTP...");
                }

            } else {
                toast.error(res.data.message || 'something went wrong 404')
                setOtp(["", "", "", "", "", ""]);
                inputsRef.current[0].focus();
            }
        } catch (error) {
            setOtp(["", "", "", "", "", ""]);
            inputsRef.current[0].focus();
            toast.error('server error 500')
        } finally {
            setIsLoading(false)

        }
    };

    return (
        <div className="min-h-screen flex pt-10 sm:Lpt-0 sm:items-center justify-center bg-gradient-to-br from-gray-900 to-black px-4 ">
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="sm:bg-gray-900 sm:border sm:border-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl backdrop-blur-sm"
            >
                <div className="flex flex-col items-center mb-3 ">
                    <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{
                            scale: verificationStatus === 'success' ? 1.1 : 1,
                            rotate: verificationStatus ? 0 : -10
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 10
                        }}
                        className={`p-2 rounded-full ${verificationStatus === 'success'
                            ? 'bg-blue-900/30'
                            : verificationStatus === 'error'
                                ? 'bg-rose-900/30'
                                : 'bg-blue-600/20'
                            }`}
                    >
                        {verificationStatus === 'success' ? (
                            <CheckCircle className="h-5 w-5 text-blue-500" />
                        ) : verificationStatus === 'error' ? (
                            <XCircle className="h-5 w-5 text-rose-500" />
                        ) : (
                            <MailCheck className="h-5 w-5 text-blue-400" />
                        )}
                    </motion.div>

                    <AnimatePresence mode="wait">
                        {verificationStatus === 'success' ? (
                            <motion.h2
                                key="success"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="text-xl font-bold text-white text-center mt-2"
                            >
                                Verification Successful!
                            </motion.h2>
                        ) : verificationStatus === 'error' ? (
                            <motion.h2
                                key="error"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="text-xl font-bold text-white text-center mt-2"
                            >
                                Verification Failed
                            </motion.h2>
                        ) : (
                            <motion.h2
                                key="default"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="text-xl font-bold text-white text-center mt-2"
                            >
                                Verify your Email
                            </motion.h2>
                        )}
                    </AnimatePresence>
                </div>

                <AnimatePresence>
                    {verificationStatus === 'error' && (
                        <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-rose-400 text-center text-sm mb-4 bg-rose-900/30 py-2 rounded-lg"
                        >
                            Invalid verification code. Please try again.
                        </motion.p>
                    )}
                </AnimatePresence>

                <p className="text-gray-400 text-center text-sm mb-3">
                    Enter the 6-digit code sent to your email
                </p>


                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSubmit(otp.join(""));
                    }}
                    className="space-y-8"
                >
                    <div
                        className="flex justify-center gap-3 relative"
                        onPaste={handlePaste}
                    >
                        {otp.map((digit, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="relative"
                            >
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    ref={(el) => (inputsRef.current[i] = el)}
                                    onChange={(e) => handleChange(e.target.value, i)}
                                    onKeyDown={(e) => {
                                        //if (e.key === 'Backspace' && digit === '' && i > 0) {
                                        // inputsRef.current[i - 1].focus();
                                        // }

                                        if (e.key === 'Backspace') {
                                            if (digit === '' && i > 0) {
                                                inputsRef.current[i - 1].focus();
                                                const newOtp = [...otp];
                                                newOtp[i - 1] = '';
                                                setOtp(newOtp);
                                            } else {
                                                const newOtp = [...otp];
                                                newOtp[i] = '';
                                                setOtp(newOtp);
                                            }
                                        }

                                    }}
                                    disabled={isLoading || verificationStatus === 'success'}
                                    className={` w-10 h-10 text-xl text-white text-center  border-2 ${verificationStatus === 'error'
                                        ? 'border-rose-500 shake'
                                        : 'border-gray-700'
                                        } rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 outline-none transition-all duration-200`}
                                />

                            </motion.div>
                        ))}
                    </div>

                    {/* Timer progress bar */}
                    <TimerprogressBar timer={timer} verificationStatus={verificationStatus} />

                    <button
                        type="submit"
                        disabled={isLoading || otp.includes("") || verificationStatus === 'success'}
                        className={`w-full py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${verificationStatus === 'success'
                            ? 'bg-blue-600/30 text-blue-400'
                            : verificationStatus === 'error'
                                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                                : 'bg-blue-600 hover:bg-blue-500 text-white'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {isLoading ? (
                            <>
                                <RotateCw className="h-4 w-4 animate-spin" />
                                Verifying...
                            </>
                        ) : verificationStatus === 'success' ? (
                            <>
                                <CheckCircle className="h-5 w-5" />
                                Verified
                            </>
                        ) : verificationStatus === 'error' ? (
                            'Try Again'
                        ) : (
                            'Verify'
                        )}
                    </button>
                </form>


                <div className="text-center text-sm text-gray-400 mt-6">


                    Didn't receive the code?{" "}
                    {timer > 0 ? (
                        <span className="text-gray-500">Resend in {timer}s</span>
                    ) : (
                        <motion.button
                            onClick={handleResend}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="text-blue-500 hover:text-blue-400 font-medium hover:underline"
                        >
                            Resend OTP
                        </motion.button>
                    )}

                    <AnimatePresence>
                        <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-blue-300 text-center text-xs  mt-2"
                        >
                            Verification code sent to {email || 'undefined'}
                        </motion.p>
                    </AnimatePresence>



                    <p className="text-gray-400 text-center text-[10px] mt-2">
                        Didn't Get the Code? Check Your Spam Folder
                    </p>
                </div>
            </motion.div>


        </div>
    );
}