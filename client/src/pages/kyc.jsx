import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { User, Mail, Smartphone, IdCard, Upload, ArrowLeft, ArrowRight, CheckCircle, ShieldCheck, FileText, ShieldUser } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
//import FloatingParticles from "../components/FloatingParticles";
import axios from 'axios'
import Tips from "../components/Tips";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import { ClipLoader } from "react-spinners";
  // enum: ["passport", "national_id", "driving_license", "other"],
export default function KycPage() {
  const navigate = useNavigate()
  const { backendUrl, userData } = useAuth()
  const [form, setForm] = useState({
    fullName: userData?.name || '',
    email: userData?.email || '',
    username: "",
    idType: "national_id",
    idNumber: "",
    idFrontFile: null,
    idBackFile: null,
  });


  const token = localStorage.getItem("token");
  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);


  const fileInputFrontRef = useRef(null);
  const fileInputBackRef = useRef(null);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleFileClick = (side) => {
    if (side === "front") {
      fileInputFrontRef.current.click();
    } else {
      fileInputBackRef.current.click();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (step === 1) {
      setStep(2);
      return;
    }

    setIsUploading(true)
    try {
      const formData = new FormData();
      formData.append("name", form.fullName);
      formData.append("documentType", form.idType);
      formData.append("documentNumber", form.idNumber);
    //  formData.append("userName", form.username)
      if (form.idFrontFile) formData.append("documentFront", form.idFrontFile);
      if (form.idBackFile) formData.append("documentBack", form.idBackFile);

      const res = await axios.post(`${backendUrl}api/kyc/submit`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      });

      if (res.data.success) {
        toast.success(res.data.message)
        setIsSubmitted(true);

      } else {
        toast.error(res.data.message || 'something went wrong')

      }

    } catch (error) {
      console.log(error)
      toast.error(error.message || 'server error')

    } finally {
      setIsUploading(false)
    }


  };

  const renderStepContent = () => {
    if (isSubmitted) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-8"
        >
          <div className="flex justify-center mb-6">
            <div className="bg-blue-500/20 p-4 rounded-full">
              <CheckCircle className="w-10 h-10 text-blue-500" />
            </div>
          </div>
          <h3 className="text-xl font-bold mb-3">Verification Submitted!</h3>
          <p className="text-gray-400 mb-6 text-sm">
            Your KYC documents are under review. We'll notify you via email once
            your verification is complete. This usually takes 24hr.
          </p>

          <button
            onClick={() => {
              navigate('/')
             // window.location.reload()
            }

            }
            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition font-medium">
              ok
            {/* ok<ArrowRight className="ml-2 w-5 h-5" /> */}
          </button>
        </motion.div>
      );
    }

    if (step === 1) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-5"
        >
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck className="w-10 h-10 text-blue-500" />
              <h2 className="text-2xl font-bold">Identity Verification</h2>
            </div>
            <p className="text-gray-400 text-sm">
              To comply with regulations, we need to verify your identity. This helps
              prevent fraud and keeps our platform secure.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-blue-400">Step 1 of 2</span>
              <span className="text-gray-500">Personal Information</span>
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-blue-500"
                initial={{ width: "0%" }}
                animate={{ width: "50%" }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {/* Full Name */}
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                name="fullName"
                placeholder="Full Name"
                value={form.fullName}
                onChange={handleChange}

                required
                disabled={true}
                className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition cursor-not-allowed"
              />
            </div>

            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                disabled={true}
                type="email"
                name="email"

                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition cursor-not-allowed"
              />
            </div>

            {/* <div className="relative">

              <ShieldUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                name="username"
                placeholder="username"
                value={form.user}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
              />
            </div> */}

            {/* Submit */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition font-semibold flex items-center justify-center shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
            >
              Continue to Verification <ArrowRight className="ml-2 w-5 h-5" />
            </motion.button>
          </div>
        </motion.div>
      );
    }

    if (step === 2) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-5"
        >
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-10 h-10 text-blue-500" />
              <h2 className="text-xl font-bold">Document Verification</h2>
            </div>
            <p className="text-gray-400 text-sm">
              Please upload both front and back of your government-issued ID.
              Ensure all details are visible and not obscured.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-blue-400">Step 2 of 2</span>
              <span className="text-gray-500">Document Upload</span>
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-blue-500"
                initial={{ width: "50%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {/* ID Type & Number */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  ID Type
                </label>
                <div className="relative">
                  <select
                    name="idType"
                    value={form.idType}
                    onChange={handleChange}
                    className="w-full py-3 pl-10 pr-4 bg-gray-900 border border-gray-800 rounded-xl focus:outline-none focus:border-blue-500 text-sm"
                  >
                   
                    <option value={'national_id'} >National ID</option>
                    <option value={'driving_license'} disabled={true}>Driver's License</option>
                    <option value={'passport'}>Passport</option>
                  </select>
                  <IdCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                </div>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  ID Number
                </label>
                <input
                  type="text"
                  name="idNumber"
                  placeholder="ID Number"
                  value={form.idNumber}
                  onChange={handleChange}
                  // optional
                  className="w-full py-3 px-4 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 focus:outline-none text-sm"
                />
              </div>
            </div>

            {/* Upload Files - Front & Back */}
            <div className="space-y-4 p-2">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Front ID Upload */}
                <div>
                  {/* <label className="block text-sm font-medium text-gray-400 mb-2">
                    Front of ID
                  </label> */}
                  <div
                    onClick={() => handleFileClick("front")}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors h-full flex flex-col items-center justify-center ${form.idFrontFile
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-gray-300 hover:border-blue-500/50"
                      }`}
                  >
                    <div className="mb-3">
                      <IdCard className="w-8 h-8 mx-auto text-blue-500" />
                    </div>
                    {form.idFrontFile ? (
                      <>
                        <p className="text-gray-300 text-sm truncate w-full">
                          {form.idFrontFile.name}
                        </p>
                        <span className="text-blue-400 text-xs mt-1">
                          Uploaded
                        </span>
                      </>
                    ) : (
                      <>
                        <p className="text-gray-300 mb-1">Front of ID</p>
                        <p className="text-gray-500 text-xs">Click to upload</p>
                      </>
                    )}
                    <input
                      type="file"
                      ref={fileInputFrontRef}
                      name="idFrontFile"
                      onChange={handleChange}
                      className="hidden"
                      accept="image/*"
                    />
                  </div>
                </div>

                {/* Back ID Upload */}
                <div>
                  {/* <label className="block text-sm font-medium text-gray-400 mb-2">
                    Back of ID
                  </label> */}
                  <div
                    onClick={() => handleFileClick("back")}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors h-full flex flex-col items-center justify-center ${form.idBackFile
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-gray-300 hover:border-blue-500/50"
                      }`}
                  >
                    {/* <div className="mb-3">
                      <IdCard className="w-8 h-8 mx-auto text-blue-500 " />
                    </div> */}
                    <div className="w-8 h-5 mx-auto border border-blue-500 text-blue-500 mb-3 rounded">
                      ---
                    </div>
                    {form.idBackFile ? (
                      <>
                        <p className="text-gray-300 text-sm truncate w-full">
                          {form.idBackFile.name}
                        </p>
                        <span className="text-blue-400 text-xs mt-1">
                          Uploaded
                        </span>
                      </>
                    ) : (
                      <>
                        <p className="text-gray-300 mb-1"> Back of ID</p>
                        <p className="text-gray-500 text-xs">Click to upload</p>
                      </>
                    )}
                    <input
                      type="file"
                      ref={fileInputBackRef}
                      name="idBackFile"
                      onChange={handleChange}
                      className="hidden"
                      accept="image/*"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Tips */}
            {/* <Tips/> */}

            {/* Progress Bar for Upload */}
            {isUploading && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-300">
                    {uploadProgress < 100 ? "Uploading documents..." : "Processing..."}
                  </span>
                  <span className="text-sm text-blue-400">
                    {uploadProgress < 100 ? `${uploadProgress}%` : "Please wait"}
                  </span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-blue-500"
                    initial={{ width: "0%" }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            )}


            {/* Submit */}
            <div className="pt-4">
              <motion.button
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={!form.idFrontFile || !form.idBackFile || isUploading}
                className={`w-full py-3.5 text-white rounded-xl transition font-semibold flex items-center justify-center shadow-lg ${(form.idFrontFile && form.idBackFile && !isUploading)
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-blue-500/20 hover:shadow-blue-500/30"
                  : "bg-gray-800 cursor-not-allowed"
                  }`}
              >
                {isUploading ? <ClipLoader size={20} color="white" /> : "Submit Verification"}
                {!isUploading && <ArrowRight className="ml-2 w-5 h-5" />}
              </motion.button>
            </div>
          </div>
        </motion.div>
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-950 to-black text-white px-4 py-8">
      {/* Floating Particles Background */}
      {/* //<FloatingParticles /> */}

      <div className="relative z-10 w-full max-w-md">
        {/* {!isSubmitted && (
          <div className="mb-5 flex items-center">
            <Link
              to="/"
              className="flex items-center text-sm text-gray-400 hover:text-white transition"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Link>
          </div>
        )} */}

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl"
        >
          <form onSubmit={handleSubmit}>
            {renderStepContent()}
          </form>
        </motion.div>

        {!isSubmitted && (
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Your information is securely encrypted</p>
            <div className="flex items-center justify-center mt-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>256-bit SSL encryption</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}