import React from 'react'
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, time } from "framer-motion";
import { Mail, RotateCw, CheckCircle, XCircle } from 'lucide-react';
import TimerprogressBar from '../components/TimerprogressBar';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
const StepTwo = ({ email, otp, setOtp, step, setStep, verificationStatus, setVerificationStatus }) => {
    const [newTimer,setNewTimer] =useState(15)
    console.log(newTimer )
    const inputsRef = useRef([]);
    const { backendUrl } = useAuth()
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        let countdown;
        if (step === 2 && newTimer > 0) {
            countdown = setInterval(() => {
                setNewTimer((prev) => (prev > 0 ? prev - 1 : 0));
            }, 1000);
        }
        return () => clearInterval(countdown);
    }, [step, newTimer]);

    // OTP Handling
    const handleOtpChange = (value, index) => {
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

            let res = await axios.post(`${backendUrl}api/auth/verify-reset-opt`, {
                email: email,
                otp: code
            })

            if (res.data.success) {
                toast.info(res.data.message)
                // setToken(res.data.token)
                //localStorage.setItem('token', res.data.token)
                //await new Promise(resolve => setTimeout(resolve, 2000));
                setStep(3);
                setVerificationStatus(null);

            } else {
                toast.error(res.data.message || 'something went wrong')
                setOtp(["", "", "", "", "", ""]);
                inputsRef.current[1].focus();
            }
        } catch (error) {
            setVerificationStatus('error');
            toast.error('server error')
        } finally {
            setIsLoading(false);
        }
    };
    const handleResend = async () => {
        setIsLoading(true);
        setVerificationStatus(null);
     
        try {
            let res = await axios.post(`${backendUrl}api/auth/re-send-reset-otp`, {
                email:email,
            })

            if (res.data.success) {
                toast.info(res.data.message)
                if (newTimer === 0) {
                    setNewTimer(10);
                    setVerificationStatus(null);
                    setOtp(["", "", "", "", "", ""]);
                    inputsRef.current[0].focus();
                }

            } else {
                toast.error(res.data.message|| 'something went wrong 404')
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
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
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
                        className={`p-3 rounded-full ${verificationStatus === 'success'
                            ? 'bg-blue-900/30'
                            : verificationStatus === 'error'
                                ? 'bg-rose-900/30'
                                : 'bg-blue-600/20'
                            }`}
                    >
                        {verificationStatus === 'success' ? (
                            <CheckCircle className="h-6 w-6 text-blue-400" />
                        ) : verificationStatus === 'error' ? (
                            <XCircle className="h-6 w-6 text-rose-400" />
                        ) : (
                            <Mail className="h-6 w-6 text-blue-400" />
                        )}
                    </motion.div>

                    <AnimatePresence>
                        {verificationStatus === 'otp_sent' && (
                            <motion.p
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="text-blue-300 text-center text-xs bg-blue-900/30 py-2 px-2 rounded mt-4"
                            >
                                Verification code sent to {email}
                            </motion.p>
                        )}
                    </AnimatePresence>
                </div>

                <AnimatePresence>
                    {verificationStatus === 'error' && (
                        <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-rose-300 text-center text-sm mb-4 bg-rose-900/30 py-3 px-4 rounded-xl"
                        >
                            Invalid verification code. Please try again.
                        </motion.p>
                    )}
                </AnimatePresence>

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
                                    onChange={(e) => handleOtpChange(e.target.value, i)}
                                    onKeyDown={(e) => {
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
                                    className={`w-12 h-12 text-xl font-bold text-white text-center bg-gray-800/70 border-2 ${verificationStatus === 'error'
                                        ? 'border-rose-500 shake'
                                        : 'border-blue-500/30'
                                        } rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30 outline-none transition-all duration-200`}
                                />
                                {/* {i === 3 && (
                                    <div className="absolute top-1/2 right-0 translate-x-3 -translate-y-1/2 text-blue-500">-</div>
                                )} */}
                            </motion.div>
                        ))}
                    </div>

                    {/* Timer progress bar */}
                    <TimerprogressBar timer={newTimer} />


                    <button
                        type="submit"
                        disabled={isLoading || otp.includes("") || verificationStatus === 'success'}
                        className={`w-full py-4 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${verificationStatus === 'success'
                            ? 'bg-blue-600/30 text-blue-400'
                            : verificationStatus === 'error'
                                ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white'
                                : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-lg shadow-blue-500/20'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {isLoading ? (
                            <>
                                <RotateCw className="h-5 w-5 animate-spin" />
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
                            'Verify Code'
                        )}
                    </button>
                </form>


                <div className="text-center text-sm text-gray-400 mt-6">
                    Didn't receive the code?{" "}
                    {newTimer > 0 ? (
                        <span className="text-gray-500">Resend in {newTimer}s</span>
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

                    <p className="text-gray-400 text-center text-[10px] mt-2">
                        Didn't Get the Code? Check Your Spam Folder
                    </p>
                </div>
            </motion.div>
        </>
    )
}

export default StepTwo
