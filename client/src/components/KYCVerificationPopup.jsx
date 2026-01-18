import React, { useState, useEffect } from 'react';
import { User, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';



const KYCVerificationPopup = () => {
  const { backendUrl, userData, token } = useAuth()
  const [showPopup, setShowPopup] = useState(false);
  const [kycStatus, setKycStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [rejectReason, setRejectReason] = useState('');

  // Check user's KYC status
  const checkKYCStatus = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${backendUrl}api/kyc/user/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        console.log(response)

        setKycStatus(response.data.status);
        setRejectReason(response.data.rejectionReason || '')
        setShowPopup(true);

      } else {

      }

      // Show popup if KYC is not verified

    } catch (error) {
      console.error('Error checking KYC status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const login = localStorage.getItem('token')
    if (login) {
      checkKYCStatus()

    }
  }, []);

  const handleVerifyNow = () => {
    setShowPopup(false);
    navigate('/kyc');
  };

  const handleClose = () => {
    setShowPopup(false);
    // Store in localStorage to not show again for 24 hours
    localStorage.setItem('kycPopupClosed', Date.now().toString());
  };

  const getStatusMessage = () => {
    switch (kycStatus) {
      case 'pending':
        return {
          title: 'KYC Under Review',
          message: 'Your KYC application is being reviewed by our team.',
          icon: <AlertCircle className="h-6 w-6 text-yellow-500" />,
          buttonText: 'View Status',

        };
      case 'under_review':
        return {
          title: 'KYC Requires Attention',
          message: 'Your KYC needs additional verification. Please check your application.',
          icon: <AlertCircle className="h-6 w-6 text-blue-500" />,
          buttonText: 'Review Application'
        };
      case 'rejected':
        return {
          title: 'KYC Rejected',
          message: `Your KYC application was rejected. Please submit a new application.`,
          icon: <X className="h-6 w-6 text-red-500" />,
          buttonText: 'Submit New KYC'
        };
      default:
        return {
          title: 'Verify Your Identity',
          message: 'Complete KYC verification to access all features and higher limits.',
          icon: <User className="h-6 w-6 text-blue-500" />,
          buttonText: 'Verify Now'
        };
    }
  };

  if (loading || !showPopup || kycStatus === 'approved' || kycStatus === 'under_review' || kycStatus === 'pending') {
    return null;
  }

  const statusInfo = getStatusMessage();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-700 max-w-md w-full transform transition-all duration-300 scale-100">
        {/* Header */}

        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-800 rounded-lg">
              {statusInfo.icon}
            </div>
            <div>
              <h2 className="text-md font-bold text-white">{statusInfo.title}</h2>
              <p className="text-gray-400 text-sm">Account Verification Required</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            <p className="text-gray-300 text-sm">
              {statusInfo.message}
            </p>

            {rejectReason && (
              <div className='flex my-3 text-xs gap-2 justify-center'>
                <span className="text-gray-400">Rejection Reason:</span>
                <p className="text-red-400">{rejectReason}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6  border-gray-700">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleVerifyNow}
              className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-medium flex items-center justify-center gap-2"
            >
              <FileText className="h-5 w-5" />


              {statusInfo.buttonText}
            </button>
            <button
              onClick={handleClose}
              className="px-6 py-3 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700 transition-all duration-300 font-medium"
            >
              Later
            </button>
          </div>


          {/* <p className="text-center text-gray-500 text-xs mt-3">
            KYC verification usually takes 24hr
          </p> */}
        </div>
      </div>
    </div>
  );
};

export default KYCVerificationPopup;