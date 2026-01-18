import React, { useState, useEffect } from 'react';
import {
  Search, Filter, Download, Eye, CheckCircle, Clock, XCircle,
  FileText, X, ZoomIn, Download as DownloadIcon, RefreshCw, User
} from 'lucide-react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../../context/AuthContext';



export default function KYCVerification() {
  const { backendUrl } = useAuth()
  const API_URL = `${backendUrl}api`;

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedKyc, setSelectedKyc] = useState(null);
  const [zoomImage, setZoomImage] = useState(null);
  const [kycRequests, setKycRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');

  // Fetch KYC requests from backend
  const fetchKYCRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/kyc`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { status: statusFilter === 'all' ? '' : statusFilter }
      });
      setKycRequests(response.data.kycs || []);

    } catch (error) {
     // console.error('Error fetching KYC requests:', error);
      toast.error('Failed to load KYC requests');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchKYCRequests();
  }, [statusFilter]);

  // Filter requests based on search
  const filteredRequests = kycRequests.filter(request => {
    const searchLower = searchTerm.toLowerCase();
    return (
      request.name?.toLowerCase().includes(searchLower) ||
      request.userId?.email?.toLowerCase().includes(searchLower) ||
      request.documentNumber?.toLowerCase().includes(searchLower) ||
      request.kycId?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'pending':
        return <Clock className="h-3 w-3 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="h-3 w-3 text-red-500" />;
      case 'under_review':
        return <Clock className="h-3 w-3 text-blue-500" />;
      default:
        return <Clock className="h-3 w-3 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = "px-1.5 py-0.5 text-xs font-medium rounded";
    switch (status) {
      case 'approved':
        return `${baseClasses} bg-green-500/20 text-green-400 border border-green-500/30`;
      case 'pending':
        return `${baseClasses} bg-yellow-500/20 text-yellow-400 border border-yellow-500/30`;
      case 'rejected':
        return `${baseClasses} bg-red-500/20 text-red-400 border border-red-500/30`;
      case 'under_review':
        return `${baseClasses} bg-blue-500/20 text-blue-400 border border-blue-500/30`;
      default:
        return `${baseClasses} bg-gray-500/20 text-gray-400 border border-gray-500/30`;
    }
  };

  const formatStatus = (status) => {
    return status.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const handleApprove = async (id) => {
    try {
      setProcessing(true);
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/kyc/${id}/approve`,
        { verificationNotes },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('KYC approved successfully!');
      setVerificationNotes('');
      fetchKYCRequests();

      // Close modal if open
      if (selectedKyc && selectedKyc._id === id) {
        setSelectedKyc(null);
      }
    } catch (error) {
      console.error('Error approving KYC:', error);
      toast.error(error.response?.data?.message || 'Failed to approve KYC');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (id) => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      setProcessing(true);
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/kyc/${id}/reject`,
        { rejectionReason: rejectReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('KYC rejected successfully!');
      setRejectReason('');
      setShowRejectModal(false);
      fetchKYCRequests();

      // Close modal if open
      if (selectedKyc && selectedKyc._id === id) {
        setSelectedKyc(null);
      }
    } catch (error) {
      console.error('Error rejecting KYC:', error);
      toast.error(error.response?.data?.message || 'Failed to reject KYC');
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkForReview = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/kyc/${id}/review`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('KYC marked for review!');
      fetchKYCRequests();
    } catch (error) {
      console.error('Error marking for review:', error);
      toast.error(error.response?.data?.message || 'Failed to mark for review');
    }
  };

  const handleViewDetails = (kyc) => {
    setSelectedKyc(kyc);
  };

  const closeModal = () => {
    setSelectedKyc(null);
    setZoomImage(null);
    setRejectReason('');
    setVerificationNotes('');
  };

  const downloadImage = (imageUrl, imageName) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = imageName;
    link.click();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const stats = {
    total: kycRequests.length,
    pending: kycRequests.filter(r => r.status === 'pending').length,
    approved: kycRequests.filter(r => r.status === 'approved').length,
    rejected: kycRequests.filter(r => r.status === 'rejected').length,
    under_review: kycRequests.filter(r => r.status === 'under_review').length
  };

  return (
    <div className="p-3 lg:p-4 space-y-4">
      <ToastContainer position="top-right" theme="dark" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg lg:text-xl font-bold text-white">KYC Verification</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchKYCRequests}
            disabled={loading}
            className="flex items-center gap-1 px-2 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition text-xs disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400">Total</p>
              <p className="text-lg font-bold text-white mt-1">{stats.total}</p>
            </div>
            <div className="p-1.5 rounded bg-blue-500/10">
              <FileText className="h-4 w-4 text-blue-400" />
            </div>
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400">Pending</p>
              <p className="text-lg font-bold text-yellow-400 mt-1">{stats.pending}</p>
            </div>
            <div className="p-1.5 rounded bg-yellow-500/10">
              <Clock className="h-4 w-4 text-yellow-400" />
            </div>
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400">Under Review</p>
              <p className="text-lg font-bold text-blue-400 mt-1">{stats.under_review}</p>
            </div>
            <div className="p-1.5 rounded bg-blue-500/10">
              <Filter className="h-4 w-4 text-blue-400" />
            </div>
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400">Approved</p>
              <p className="text-lg font-bold text-green-400 mt-1">{stats.approved}</p>
            </div>
            <div className="p-1.5 rounded bg-green-500/10">
              <CheckCircle className="h-4 w-4 text-green-400" />
            </div>
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400">Rejected</p>
              <p className="text-lg font-bold text-red-400 mt-1">{stats.rejected}</p>
            </div>
            <div className="p-1.5 rounded bg-red-500/10">
              <XCircle className="h-4 w-4 text-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search by name, email, or document number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-700 rounded-3xl text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition text-sm"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 transition text-xs"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Desktop Table */}
      {loading ? (
       <div className="hidden lg:block bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="p-4 border-t border-gray-800 animate-pulse">
              <div className="flex justify-between">
                <div className="h-4 bg-gray-800 rounded w-1/4"></div>
                <div className="h-4 bg-gray-800 rounded w-1/6"></div>
                <div className="h-4 bg-gray-800 rounded w-1/6"></div>
                <div className="h-4 bg-gray-800 rounded w-1/6"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="hidden lg:block bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden">
            <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-gray-700/50 border-b border-gray-600 text-xs font-medium text-gray-400">
              <div className="col-span-2">Date</div>
              <div className="col-span-3">Name</div>
              <div className="col-span-2">Document</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-3 text-center">Actions</div>
            </div>

            <div className="divide-y divide-gray-700">
              {filteredRequests.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">
                  No KYC requests found
                </div>
              ) : (
                filteredRequests.map((request) => (
                  <div key={request._id} className="grid grid-cols-12 gap-3 px-4 py-3 items-center hover:bg-gray-700/30 transition">
                    <div className="col-span-2">
                      <p className="text-white text-sm">{formatDate(request.submittedAt)}</p>
                    </div>

                    <div className="col-span-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                          {request.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{request.name || 'N/A'}</p>
                          <p className="text-gray-400 text-xs">{request.email || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-2">
                      <p className="text-white text-sm">{request.documentType || 'N/A'}</p>
                      {/* <p className="text-gray-400 text-xs">{request.documentNumber || 'N/A'}</p> */}
                    </div>

                    <div className="col-span-2">
                      <div className="flex items-center gap-1">
                        {getStatusIcon(request.status)}
                        <span className={getStatusBadge(request.status)}>
                          {formatStatus(request.status)}
                        </span>
                      </div>
                    </div>

                    <div className="col-span-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleViewDetails(request)}
                          className="flex items-center gap-1 px-2 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-xs"
                        >
                          <Eye size={12} />
                          View
                        </button>

                        {/*
                      {request.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(request._id)}
                            disabled={processing}
                            className="px-2 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition text-xs disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setSelectedKyc(request);
                              setShowRejectModal(true);
                            }}
                            disabled={processing}
                            className="px-2 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition text-xs disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      )}
                     */}

                        {request.status === 'under_review' && (
                          <button
                            onClick={() => handleMarkForReview(request._id)}
                            className="px-2 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-xs"
                          >
                            Review
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-3">
            {filteredRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No KYC requests found</p>
              </div>
            ) : (
              filteredRequests.map((request) => (
                <div key={request._id} className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {request.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{request.name || 'N/A'}</p>
                        <p className="text-gray-400 text-xs">{request.email || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(request.status)}
                      <span className={getStatusBadge(request.status)}>
                        {formatStatus(request.status)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                    <div>
                      <p className="text-gray-400 text-xs">Date</p>
                      <p className="text-white text-sm">{formatDate(request.submittedAt)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Document</p>
                      <p className="text-white text-sm">{request.documentType || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => handleViewDetails(request)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-xs"
                    >
                      <Eye size={12} />
                      View Details
                    </button>

                    {/*
                  
                    {request.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(request._id)}
                          disabled={processing}
                          className="flex-1 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition text-xs disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            setSelectedKyc(request);
                            setShowRejectModal(true);
                          }}
                          disabled={processing}
                          className="flex-1 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition text-xs disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  */}

                    {request.status === 'under_review' && (
                      <button
                        onClick={() => handleMarkForReview(request._id)}
                        className="flex-1 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-xs"
                      >
                        Review
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* KYC Details Modal */}
      {selectedKyc && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 z-50">
          <div className="bg-gray-800 rounded-xl border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <div>
                <h2 className="text-lg font-bold text-white">KYC Details</h2>
                <p className="text-gray-400 text-xs mt-1">{selectedKyc.kycId}</p>
              </div>
              <button
                onClick={closeModal}
                className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-4">
              {/* User Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h3 className="text-base font-semibold text-white">User Info</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Name:</span>
                      <span className="text-white">{selectedKyc.name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Email:</span>
                      <span className="text-white">{selectedKyc.email || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">User ID:</span>
                      <span className="text-white">{selectedKyc._id || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-base font-semibold text-white">Document Info</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Type:</span>
                      <span className="text-white">{selectedKyc.documentType || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Number:</span>
                      <span className="text-white">{selectedKyc.documentNumber || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Submitted:</span>
                      <span className="text-white">{formatDate(selectedKyc.submittedAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span className={getStatusBadge(selectedKyc.status)}>
                        {formatStatus(selectedKyc.status)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Document Images */}
              <div className="space-y-3">
                <h3 className="text-base font-semibold text-white">Document Images</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Front Image */}
                  <div className="bg-gray-700/50 rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white text-sm font-medium">Front</span>
                      {selectedKyc.documentFrontImage && (
                        <button
                          onClick={() => downloadImage(selectedKyc.documentFrontImage, `${selectedKyc.name}_front.jpg`)}
                          className="p-1 text-gray-400 hover:text-white transition text-xs"
                          title="Download"
                        >
                          <DownloadIcon size={14} />
                        </button>
                      )}
                    </div>
                    {selectedKyc.documentFrontImage ? (
                      <div className="relative group">
                        <img
                          src={selectedKyc.documentFrontImage}
                          alt="Front of document"
                          className="w-full h-32 object-cover rounded cursor-pointer"
                          onClick={() => setZoomImage(selectedKyc.documentFrontImage)}
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                          <ZoomIn className="text-white" size={20} />
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-32 bg-gray-900 rounded flex items-center justify-center">
                        <p className="text-gray-400 text-sm">No front image</p>
                      </div>
                    )}
                  </div>

                  {/* Back Image */}
                  <div className="bg-gray-700/50 rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white text-sm font-medium">Back</span>
                      {selectedKyc.documentBackImage && (
                        <button
                          onClick={() => downloadImage(selectedKyc.documentBackImage, `${selectedKyc.name}_back.jpg`)}
                          className="p-1 text-gray-400 hover:text-white transition text-xs"
                          title="Download"
                        >
                          <DownloadIcon size={14} />
                        </button>
                      )}
                    </div>
                    {selectedKyc.documentBackImage ? (
                      <div className="relative group">
                        <img
                          src={selectedKyc.documentBackImage}
                          alt="Back of document"
                          className="w-full h-32 object-cover rounded cursor-pointer"
                          onClick={() => setZoomImage(selectedKyc.documentBackImage)}
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                          <ZoomIn className="text-white" size={20} />
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-32 bg-gray-900 rounded flex items-center justify-center">
                        <p className="text-gray-400 text-sm">No back image</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              {(selectedKyc.rejectionReason || selectedKyc.verificationNotes) && (
                <div className="space-y-3">
                  <h3 className="text-base font-semibold text-white">Additional Information</h3>
                  <div className="space-y-2 text-sm">
                    {selectedKyc.rejectionReason && (
                      <div>
                        <span className="text-gray-400">Rejection Reason:</span>
                        <p className="text-red-400 mt-1">{selectedKyc.rejectionReason}</p>
                      </div>
                    )}
                    {selectedKyc.verificationNotes && (
                      <div>
                        <span className="text-gray-400">Verification Notes:</span>
                        <p className="text-white mt-1">{selectedKyc.verificationNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {selectedKyc.status === 'pending' && (
                <div className="space-y-3 pt-3 border-t border-gray-700">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Verification Notes (Optional)</label>
                    <textarea
                      value={verificationNotes}
                      onChange={(e) => setVerificationNotes(e.target.value)}
                      className="w-full p-2 bg-gray-900 border border-gray-700 rounded text-white text-sm"
                      placeholder="Add verification notes..."
                      rows="2"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(selectedKyc._id)}
                      disabled={processing}
                      className="flex-1 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm font-medium disabled:opacity-50"
                    >
                      {processing ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => setShowRejectModal(true)}
                      disabled={processing}
                      className="flex-1 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm font-medium disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )}

              {selectedKyc.status === 'under_review' && (
                <div className="flex gap-2 pt-3 border-t border-gray-700">
                  <button
                    onClick={() => handleMarkForReview(selectedKyc._id)}
                    className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm font-medium"
                  >
                    Complete Review
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedKyc && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 z-50">
          <div className="bg-gray-800 rounded-xl border border-gray-700 max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-lg font-bold text-white">Reject KYC</h2>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Reason for Rejection (Required)
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full p-2 bg-gray-900 border border-gray-700 rounded text-white text-sm h-32"
                  placeholder="Enter reason for rejection..."
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleReject(selectedKyc._id)}
                  disabled={processing || !rejectReason.trim()}
                  className="flex-1 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm font-medium disabled:opacity-50"
                >
                  {processing ? 'Processing...' : 'Confirm Rejection'}
                </button>
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason('');
                  }}
                  className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Zoomed Image Modal */}
      {zoomImage && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-3 z-50"
          onClick={() => setZoomImage(null)}
        >
          <div className="relative max-w-2xl max-h-[90vh]">
            <img
              src={zoomImage}
              alt="Zoomed document"
              className="max-w-full max-h-full object-contain rounded"
            />
            <button
              onClick={() => setZoomImage(null)}
              className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded hover:bg-black/70 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}