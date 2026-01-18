import React, { useState, useRef, useEffect } from "react";
import { Mail, Lock, RotateCw, CheckCircle, XCircle, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedTitle from "../reset-password-components/AnimatedTitle";
import AnimatedDescription from "../reset-password-components/AnimatedDescription";
import StepOne from "../reset-password-components/StepOne";
import StepTwo from "../reset-password-components/StepTwo";
import StepThree from "../reset-password-components/StepThree";
export default function ResetPasswordPage() {
  const [step, setStep] = useState(1); // 1: email, 2: OTP, 3: reset password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  const [verificationStatus, setVerificationStatus] = useState(null);
  const titles = {
    1: "Enter Your Email to Begin",
    2: "Verify Your Identity",
    3: "Create a New Password",
  };
  const descriptions = {
    1: "We'll send a verification code to your email address. Make sure it's one you have access to.",
    2: "Please enter the 6-digit code we just sent to your inbox. Didn’t receive it? Check your spam folder.",
    3: "Choose a strong password that you haven't used before to protect your account.",
  };

  return (
    <div className="min-h-screen flex items-center justify-center sm:px-4 py-8 bg-gray-900">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gray-900/80 backdrop-blur-lg sm:border sm:border-gray-800/50 rounded-3xl p-6 sm:p-8 max-w-md w-full sm:shadow-2xl"
      >
        
        <AnimatedTitle step={step} titles={titles} />
        <AnimatedDescription step={step} descriptions={descriptions} />


        {/* Progress Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center w-full max-w-md">
            {[1, 2, 3].map((num) => (
              <React.Fragment key={num}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= num
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white"
                    : "bg-gray-800 text-gray-400"
                    }`}
                >
                  {num}
                </div>
                {num < 3 && (
                  <div
                    className={`flex-1 h-1 ${step > num ? "bg-gradient-to-r from-blue-600 to-blue-700" : "bg-gray-800"
                      }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step 1: Email Input */}
        {step === 1 && (
          <StepOne
            setEmail={setEmail}
            email={email}
            verificationStatus={verificationStatus}
            setVerificationStatus={setVerificationStatus}
            setStep={setStep}
            

          />
        )}

        {/* Step 2: OTP Verification */}
        {step === 2 && (
          <StepTwo
            setEmail={setEmail}
            email={email}
            verificationStatus={verificationStatus}
            setVerificationStatus={setVerificationStatus}
            step={step}
            setStep={setStep}
            setOtp={setOtp}
            otp={otp}
          />
        )}

        {/* Step 3: Password Reset */}
        {step === 3 && (
          <StepThree
            verificationStatus={verificationStatus}
            setVerificationStatus={setVerificationStatus}
            email={email}
            otp={otp}

          />
        )}

        {/* Navigation/Back Button */}
        <div className="text-center text-sm text-blue-200/80 mt-6">
          {step === 1 ? (
            <motion.a
              href="/login"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-blue-400 hover:text-blue-300 font-medium flex items-center justify-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Login
            </motion.a>
          ) : step === 2 ? (
            <motion.button
              onClick={() => setStep(1)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-blue-400 hover:text-blue-300 font-medium flex items-center justify-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" /> Change Email
            </motion.button>
          ) : (
            <motion.button
              onClick={() => setStep(2)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-blue-400 hover:text-blue-300 font-medium flex items-center justify-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Verification
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
}