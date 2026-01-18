import { useState, useEffect } from "react";
import {
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  User,
  X,
  Check,
  AlertCircle,
  RefreshCw,
  Filter,
  Download,
  Hash,
  Wallet,
  CreditCard,
  ExternalLink,
  Image as ImageIcon,
  File,
  Link,
  Copy
} from "lucide-react";
import axios from "axios";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// API configuration
const API_URL = 'http://localhost:3000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Admin service for payment reviews
const adminPaymentService = {
  // Get all payments for review
  getPaymentsForReview: async (filters = {}) => {
    try {
      const response = await api.get('/loans/admin/payments', { params: filters });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error' };
    }
  },

  // Get payment details
  getPaymentDetails: async (paymentId) => {
    try {
      const response = await api.get(`/loans/admin/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error' };
    }
  },

  // Review payment (approve/reject)
  reviewPayment: async (paymentId, status, reviewNote = '') => {
    try {
      
      const response = await api.put(`/loans/admin/payments/${paymentId}/review`, {
        status,
        reviewNote
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error' };
    }
  },

  // Export payments data
  exportPayments: async (filters = {}) => {
    try {
      const response = await api.get('/loans/admin/payments/export', {
        params: filters,
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error' };
    }
  }
};

const AdminLoanPaymentReview = () => {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [imageError, setImageError] = useState({});
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImage, setCurrentImage] = useState(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    filterPayments();
  }, [searchTerm, statusFilter, paymentMethodFilter, payments, dateRange]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const filters = {};
      
      if (dateRange.startDate) filters.startDate = dateRange.startDate;
      if (dateRange.endDate) filters.endDate = dateRange.endDate;
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (paymentMethodFilter !== 'all') filters.paymentMethod = paymentMethodFilter;
      if (searchTerm) filters.search = searchTerm;
      
      const response = await adminPaymentService.getPaymentsForReview(filters);
      
      if (response.success) {
        const transformedPayments = response.data.map(payment => ({
          id: payment._id,
          loanId: payment.loanReference || payment.loanId || `LOAN-${payment.loanId}`,
          userName: payment.user?.name || 
                   `${payment.user?.firstName || ''} ${payment.user?.lastName || ''}`.trim() || 
                   'Unknown User',
          userEmail: payment.user?.email || 'N/A',
          userPhone: payment.user?.phone || 'N/A',
          amount: payment.amount,
          currency: payment.currency || 'USDT',
          paymentDate: payment.date || payment.createdAt || new Date().toISOString(),
          submissionDate: payment.createdAt || new Date().toISOString(),
          status: payment.status || 'pending',
          paymentMethod: payment.paymentMethod || 'external_wallet',
          proofFiles: getProofFiles(payment),
          txHash: payment.txHash,
          network: payment.network,
          fromAddress: payment.fromAddress,
          toAddress: payment.toAddress,
          proofImage: payment.proofImage,
          reviewNote: payment.reviewNote,
          reviewedBy: payment.reviewedBy,
          reviewerName: payment.reviewerName,
          reviewerEmail: payment.reviewerEmail,
          loanDetails: {
            totalAmount: payment.loan?.totalAmountDue || 0,
            amountPaid: payment.loan?.amountPaid || 0,
            remainingBalance: payment.loan?.remainingBalance || 0,
            loanStatus: payment.loan?.status || 'active'
          },
          metadata: payment.metadata,
          depositTransactionId: payment.depositTransactionId,
          originalData: payment
        }));
        
        setPayments(transformedPayments);
        setFilteredPayments(transformedPayments);
      } else {
        toast.error(response.message || 'Failed to load payments');
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error(error.message || 'Failed to load payments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getProofFiles = (payment) => {
    const files = [];
    
    if (payment.proofImage?.url) {
      files.push({
        id: 'proof-image',
        name: payment.proofImage.filename || 'payment_proof.jpg',
        type: 'image',
        url: payment.proofImage.url,
        publicId: payment.proofImage.publicId,
        uploadDate: payment.date || new Date().toISOString()
      });
    }
    
    if (payment.txHash) {
      files.push({
        id: 'tx-hash',
        name: 'transaction_details.txt',
        type: 'text',
        content: `Transaction Hash: ${payment.txHash}\nNetwork: ${payment.network || 'N/A'}\nFrom: ${payment.fromAddress || 'N/A'}\nTo: ${payment.toAddress || 'N/A'}\nDate: ${new Date(payment.date || new Date()).toLocaleString()}`,
        uploadDate: payment.date || new Date().toISOString()
      });
    }
    
    if (payment.depositTransactionId) {
      files.push({
        id: 'deposit-tx',
        name: 'deposit_transaction.txt',
        type: 'text',
        content: `Deposit Transaction ID: ${payment.depositTransactionId}\nPayment Method: Deposit Account\nAmount: ${payment.amount} ${payment.currency}\nDate: ${new Date(payment.date || new Date()).toLocaleString()}`,
        uploadDate: payment.date || new Date().toISOString()
      });
    }
    
    return files;
  };

  const getImageUrl = (proofImage) => {
    if (!proofImage) return null;
    
    if (proofImage.url && proofImage.url.startsWith('http')) {
      return proofImage.url;
    }
    
    if (proofImage.url) {
      return `${API_URL}${proofImage.url}`;
    }
    
    return null;
  };

  const handleImageError = (paymentId) => {
    setImageError(prev => ({ ...prev, [paymentId]: true }));
  };

  const openImageModal = (imageUrl, filename) => {
    setCurrentImage({ url: imageUrl, filename });
    setShowImageModal(true);
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  const filterPayments = () => {
    let filtered = [...payments];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(payment =>
        payment.loanId.toLowerCase().includes(searchLower) ||
        payment.userName.toLowerCase().includes(searchLower) ||
        payment.userEmail.toLowerCase().includes(searchLower) ||
        (payment.txHash && payment.txHash.toLowerCase().includes(searchLower)) ||
        (payment.fromAddress && payment.fromAddress.toLowerCase().includes(searchLower)) ||
        (payment.proofImage?.filename && payment.proofImage.filename.toLowerCase().includes(searchLower))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === statusFilter);
    }

    if (paymentMethodFilter !== 'all') {
      filtered = filtered.filter(payment => payment.paymentMethod === paymentMethodFilter);
    }

    if (dateRange.startDate || dateRange.endDate) {
      filtered = filtered.filter(payment => {
        const paymentDate = new Date(payment.paymentDate);
        const startDate = dateRange.startDate ? new Date(dateRange.startDate) : null;
        const endDate = dateRange.endDate ? new Date(dateRange.endDate) : null;
        
        let valid = true;
        if (startDate) valid = valid && paymentDate >= startDate;
        if (endDate) valid = valid && paymentDate <= endDate;
        
        return valid;
      });
    }

    setFilteredPayments(filtered);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPayments();
  };

  const handleExport = async () => {
    try {
      const filters = {};
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (paymentMethodFilter !== 'all') filters.paymentMethod = paymentMethodFilter;
      if (dateRange.startDate) filters.startDate = dateRange.startDate;
      if (dateRange.endDate) filters.endDate = dateRange.endDate;
      if (searchTerm) filters.search = searchTerm;
      
      toast.info('Preparing export...');
      
      const blob = await adminPaymentService.exportPayments(filters);
      
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payments-export-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Payments exported successfully');
    } catch (error) {
      console.error('Error exporting payments:', error);
      toast.error('Failed to export payments');
    }
  };

  const handleViewDetails = async (payment) => {
    try {
      const response = await adminPaymentService.getPaymentDetails(payment.id);
      
      if (response.success) {
        const detailedPayment = {
          ...payment,
          details: response.data
        };
        
        setSelectedPayment(detailedPayment);
        setShowDetailModal(true);
      } else {
        toast.error(response.message || 'Failed to load payment details');
      }
    } catch (error) {
      console.error('Error fetching payment details:', error);
      toast.error('Failed to load payment details');
    }
  };

  const handleAction = (payment, action) => {
    setSelectedPayment(payment);
    setActionType(action);
    setRejectionReason("");
    setShowActionModal(true);
  };

  const confirmAction = async () => {
    if (!selectedPayment) return;

    try {
      const status = actionType === 'approve' ? 'approved' : 'rejected';
      const reviewNote = actionType === 'reject' ? rejectionReason : 'Payment approved by admin';
      
      const response = await adminPaymentService.reviewPayment(
        selectedPayment.id,
        status,
        reviewNote
      );

      console.log({response})

      if (response.success) {
        toast.success(`Payment ${status} successfully`);
        
        fetchPayments();
        
        setShowActionModal(false);
        setSelectedPayment(null);
        setShowDetailModal(false);
      } else {
        toast.error(response.message || 'Failed to process payment');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error(error.message || 'Failed to process payment');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "rejected":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "completed":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getPaymentMethodBadge = (method) => {
    switch (method) {
      case 'external_wallet':
        return <span className="px-2 py-1 text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded flex items-center gap-1"><Wallet size={10} /> External Wallet</span>;
      case 'deposit_account':
        return <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 border border-green-500/30 rounded flex items-center gap-1"><CreditCard size={10} /> Deposit Account</span>;
      case 'card':
        return <span className="px-2 py-1 text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded flex items-center gap-1"><CreditCard size={10} /> Card</span>;
      default:
        return <span className="px-2 py-1 text-xs bg-gray-500/20 text-gray-400 border border-gray-500/30 rounded">Other</span>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount, currency = 'USDT') => {
   /*
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(amount);
   */
  
  };

  const validateProofData = (payment) => {
    const issues = [];
    
    if (!payment.amount || payment.amount <= 0) {
      issues.push("Invalid payment amount");
    }
    
    if (payment.paymentMethod === 'external_wallet' && !payment.proofImage?.url && !payment.txHash) {
      issues.push("Missing proof image or transaction hash");
    }
    
    if (!payment.paymentDate) {
      issues.push("Missing payment date");
    }
    
    return issues;
  };

  const openTransactionExplorer = (txHash, network) => {
    if (!txHash) return;
    
    let explorerUrl = '';
    switch (network) {
      case 'TronTRC20':
        explorerUrl = `https://tronscan.org/#/transaction/${txHash}`;
        break;
      case 'Ethereum':
      case 'ERC20':
        explorerUrl = `https://etherscan.io/tx/${txHash}`;
        break;
      case 'Bitcoin':
        explorerUrl = `https://www.blockchain.com/explorer/transactions/btc/${txHash}`;
        break;
      default:
        toast.info('No explorer available for this network');
        return;
    }
    
    window.open(explorerUrl, '_blank');
  };

  const getProofImageThumbnail = (payment) => {
    if (!payment.proofImage?.url) {
      return null;
    }
    
    const imageUrl = getImageUrl(payment.proofImage);
    
    if (imageError[payment.id]) {
      return (
        <div className="w-16 h-12 bg-gray-800 rounded border border-gray-700 flex items-center justify-center">
          <FileText size={16} className="text-gray-500" />
        </div>
      );
    }
    
    return (
      <div 
        className="w-16 h-12 bg-gray-800 rounded border border-gray-700 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
        onClick={() => openImageModal(imageUrl, payment.proofImage?.filename)}
      >
        <img 
          src={imageUrl} 
          alt="Proof" 
          className="w-full h-full object-cover"
          onError={() => handleImageError(payment.id)}
        />
      </div>
    );
  };

  if (loading && payments.length === 0) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-3 text-gray-400 text-sm">Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">Payment Review</h1>
            <p className="text-gray-400 text-sm">Review and manage loan payment submissions</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition text-sm disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            <span className="hidden sm:block">Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1 bg-gray-950 rounded-3xl flex items-center px-3 border border-gray-600">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search by loan ID, user, email, or transaction hash..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent outline-none p-2 text-sm"
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="completed">Completed</option>
        </select>

        <select
          value={paymentMethodFilter}
          onChange={(e) => setPaymentMethodFilter(e.target.value)}
          className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition"
        >
          <option value="all">All Methods</option>
          <option value="external_wallet">External Wallet</option>
          <option value="deposit_account">Deposit Account</option>
          <option value="card">Card</option>
          <option value="other">Other</option>
        </select>

        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition text-sm"
        >
          <Filter size={16} />
          <span className="hidden sm:block">Filters</span>
        </button>

        <button 
          onClick={handleExport}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 border border-blue-700 rounded-lg hover:bg-blue-700 transition text-sm"
        >
          <Download size={16} />
          <span className="hidden sm:block">Export</span>
        </button>
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="bg-gray-900 rounded-lg p-4 mb-4 border border-gray-800">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-gray-400 text-xs mb-2 block">Start Date</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-2 block">End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={() => {
                  setDateRange({ startDate: '', endDate: '' });
                  setShowAdvancedFilters(false);
                }}
                className="flex-1 px-3 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition text-sm"
              >
                Clear Filters
              </button>
              <button
                onClick={() => setShowAdvancedFilters(false)}
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payments List */}
      <div className="grid gap-3">
        {filteredPayments.map((payment) => {
          const validationIssues = validateProofData(payment);
          
          return (
            <div key={payment.id} className="bg-gray-900 rounded-lg p-4 border border-gray-800 transition-all">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left Section */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <div className="text-blue-400 font-mono text-sm font-bold">{payment.loanId}</div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(payment.status)}
                      <span className={`px-2 py-1 text-xs border rounded ${getStatusColor(payment.status)}`}>
                        {payment.status.toUpperCase()}
                      </span>
                    </div>
                    {getPaymentMethodBadge(payment.paymentMethod)}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <User size={14} className="text-gray-400" />
                        <span className="text-white text-sm font-medium">{payment.userName}</span>
                      </div>
                      <div className="text-gray-400 text-xs">{payment.userEmail}</div>
                    </div>

                    <div>
                      <div className="text-green-400 font-bold text-lg">
                        {formatCurrency(payment.amount, payment.currency)}
                      </div>
                      <div className="text-gray-400 text-xs">
                        Balance: {formatCurrency(payment.loanDetails.remainingBalance, payment.currency)}
                      </div>
                    </div>

                    <div>
                      <div className="text-gray-400 text-xs">Payment Date</div>
                      <div className="text-white text-sm">{formatDate(payment.paymentDate)}</div>
                    </div>

                    <div>
                      <div className="text-gray-400 text-xs">Submitted</div>
                      <div className="text-white text-sm">{formatDate(payment.submissionDate)}</div>
                    </div>
                  </div>
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-3">
                  {/* Proof Preview */}
                  {getProofImageThumbnail(payment)}

                  {/* Transaction Hash */}
                  {payment.txHash && (
                    <button
                      onClick={() => openTransactionExplorer(payment.txHash, payment.network)}
                      className="flex items-center gap-1 px-2 py-1 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition text-xs"
                      title="View on explorer"
                    >
                      <Hash size={12} />
                      <span className="hidden sm:inline">View TX</span>
                    </button>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDetails(payment)}
                      className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-xs"
                    >
                      <Eye size={14} />
                      <span className="hidden sm:inline">Review</span>
                    </button>
                    
                    {payment.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleAction(payment, 'approve')}
                          className="flex items-center gap-1 px-2 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition text-xs"
                          title="Approve"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => handleAction(payment, 'reject')}
                          className="flex items-center gap-1 px-2 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition text-xs"
                          title="Reject"
                        >
                          <X size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Validation Warnings */}
              {validationIssues.length > 0 && payment.status === 'pending' && (
                <div className="flex items-center gap-2 mt-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs">
                  <AlertCircle size={14} className="text-yellow-500" />
                  <span className="text-yellow-400">Validation issues: {validationIssues.join(", ")}</span>
                </div>
              )}

              {/* Quick Info */}
              <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-gray-800 text-xs">
                {payment.txHash && (
                  <div className="flex items-center gap-1 text-gray-400">
                    <Hash size={10} />
                    <span className="font-mono truncate max-w-[120px]">{payment.txHash}</span>
                  </div>
                )}
                {payment.fromAddress && (
                  <div className="flex items-center gap-1 text-gray-400">
                    <span>From:</span>
                    <span className="font-mono truncate max-w-[100px]">{payment.fromAddress}</span>
                  </div>
                )}
                {payment.proofImage?.filename && (
                  <div className="flex items-center gap-1 text-gray-400">
                    <ImageIcon size={10} />
                    <span className="truncate max-w-[150px]">{payment.proofImage.filename}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredPayments.length === 0 && !loading && (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-600 mx-auto mb-3" />
          <div className="text-gray-400 text-sm mb-2">No payments found</div>
          {searchTerm || statusFilter !== 'all' || paymentMethodFilter !== 'all' || dateRange.startDate || dateRange.endDate ? (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setPaymentMethodFilter('all');
                setDateRange({ startDate: '', endDate: '' });
              }}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              Clear all filters
            </button>
          ) : (
            <div className="text-gray-500 text-xs">No payments available for review</div>
          )}
        </div>
      )}

      {/* Payment Detail Modal */}
      {showDetailModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg border border-gray-800 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-800 sticky top-0 bg-gray-900">
              <div>
                <h2 className="text-lg font-semibold">Payment Review Details</h2>
                <p className="text-gray-400 text-sm">{selectedPayment.loanId}</p>
              </div>
              <div className="flex items-center gap-2">
                {selectedPayment.txHash && (
                  <button
                    onClick={() => openTransactionExplorer(selectedPayment.txHash, selectedPayment.network)}
                    className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-xs"
                  >
                    <ExternalLink size={12} />
                    View TX
                  </button>
                )}
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-1 text-gray-400 hover:text-white rounded transition"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-6">
              {/* Header Info */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className={`px-3 py-1 text-sm border rounded ${getStatusColor(selectedPayment.status)}`}>
                  {selectedPayment.status.toUpperCase()}
                </span>
                {getPaymentMethodBadge(selectedPayment.paymentMethod)}
                <span className="text-gray-400 text-sm">
                  Submitted: {formatDate(selectedPayment.submissionDate)}
                </span>
              </div>

              {/* Main Info Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - User & Payment Info */}
                <div className="space-y-4">
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="font-semibold mb-3 text-gray-300">User Information</h3>
                    <div className="space-y-2">
                      <div>
                        <div className="text-gray-400 text-xs">Full Name</div>
                        <div className="text-white">{selectedPayment.userName}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-xs">Email</div>
                        <div className="text-white">{selectedPayment.userEmail}</div>
                      </div>
                      {selectedPayment.userPhone && (
                        <div>
                          <div className="text-gray-400 text-xs">Phone</div>
                          <div className="text-white">{selectedPayment.userPhone}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="font-semibold mb-3 text-gray-300">Payment Information</h3>
                    <div className="space-y-2">
                      <div>
                        <div className="text-gray-400 text-xs">Amount</div>
                        <div className="text-green-400 font-bold text-xl">
                          {formatCurrency(selectedPayment.amount, selectedPayment.currency)}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-xs">Payment Method</div>
                        <div className="text-white">{selectedPayment.paymentMethod.replace('_', ' ').toUpperCase()}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-xs">Payment Date</div>
                        <div className="text-white">{formatDate(selectedPayment.paymentDate)}</div>
                      </div>
                      {selectedPayment.depositTransactionId && (
                        <div>
                          <div className="text-gray-400 text-xs">Deposit Transaction ID</div>
                          <div className="text-white font-mono text-sm">{selectedPayment.depositTransactionId}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Middle Column - Transaction & Loan Info */}
                <div className="space-y-4">
                  {/* Transaction Details */}
                  {(selectedPayment.txHash || selectedPayment.fromAddress || selectedPayment.toAddress) && (
                    <div className="bg-gray-800 rounded-lg p-4">
                      <h3 className="font-semibold mb-3 text-gray-300">Transaction Details</h3>
                      <div className="space-y-2">
                        {selectedPayment.txHash && (
                          <div>
                            <div className="text-gray-400 text-xs">Transaction Hash</div>
                            <div className="text-blue-400 font-mono text-sm break-all flex items-center gap-2">
                              {selectedPayment.txHash}
                              <button
                                onClick={() => copyToClipboard(selectedPayment.txHash)}
                                className="text-gray-400 hover:text-white"
                                title="Copy to clipboard"
                              >
                                <Copy size={12} />
                              </button>
                            </div>
                          </div>
                        )}
                        {selectedPayment.network && (
                          <div>
                            <div className="text-gray-400 text-xs">Network</div>
                            <div className="text-white">{selectedPayment.network}</div>
                          </div>
                        )}
                        {selectedPayment.fromAddress && (
                          <div>
                            <div className="text-gray-400 text-xs">From Address</div>
                            <div className="text-green-400 font-mono text-sm break-all flex items-center gap-2">
                              {selectedPayment.fromAddress}
                              <button
                                onClick={() => copyToClipboard(selectedPayment.fromAddress)}
                                className="text-gray-400 hover:text-white"
                                title="Copy to clipboard"
                              >
                                <Copy size={12} />
                              </button>
                            </div>
                          </div>
                        )}
                        {selectedPayment.toAddress && (
                          <div>
                            <div className="text-gray-400 text-xs">To Address</div>
                            <div className="text-yellow-400 font-mono text-sm break-all flex items-center gap-2">
                              {selectedPayment.toAddress}
                              <button
                                onClick={() => copyToClipboard(selectedPayment.toAddress)}
                                className="text-gray-400 hover:text-white"
                                title="Copy to clipboard"
                              >
                                <Copy size={12} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Loan Details */}
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="font-semibold mb-3 text-gray-300">Loan Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-gray-400 text-xs">Total Amount</div>
                        <div className="text-white font-bold">
                          {formatCurrency(selectedPayment.loanDetails.totalAmount, selectedPayment.currency)}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-xs">Amount Paid</div>
                        <div className="text-green-400 font-bold">
                          {formatCurrency(selectedPayment.loanDetails.amountPaid, selectedPayment.currency)}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-xs">Remaining Balance</div>
                        <div className="text-yellow-400 font-bold">
                          {formatCurrency(selectedPayment.loanDetails.remainingBalance, selectedPayment.currency)}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-xs">Loan Status</div>
                        <div className="text-white">{selectedPayment.loanDetails.loanStatus.toUpperCase()}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Proof & Actions */}
                <div className="space-y-4">
                  {/* Proof Section */}
                  {selectedPayment.proofImage?.url && (
                    <div className="bg-gray-800 rounded-lg p-4">
                      <h3 className="font-semibold mb-3 text-gray-300">Payment Proof</h3>
                      <div className="space-y-3">
                        <div className="relative">
                          <img 
                            src={getImageUrl(selectedPayment.proofImage)} 
                            alt="Payment proof" 
                            className="w-full h-auto rounded-lg max-h-64 object-contain border border-gray-700 cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => openImageModal(getImageUrl(selectedPayment.proofImage), selectedPayment.proofImage?.filename)}
                          />
                          <button
                            onClick={() => openImageModal(getImageUrl(selectedPayment.proofImage), selectedPayment.proofImage?.filename)}
                            className="absolute top-2 right-2 p-1 bg-black/50 rounded hover:bg-black/70 transition"
                            title="View full image"
                          >
                            <ExternalLink size={14} className="text-white" />
                          </button>
                        </div>
                        
                        <div className="space-y-2">
                          {selectedPayment.proofImage.filename && (
                            <div>
                              <div className="text-gray-400 text-xs">Filename</div>
                              <div className="text-white text-sm flex items-center gap-2">
                                <File size={12} />
                                {selectedPayment.proofImage.filename}
                              </div>
                            </div>
                          )}
                          
                          {selectedPayment.proofImage.publicId && (
                            <div>
                              <div className="text-gray-400 text-xs">Public ID</div>
                              <div className="text-gray-300 font-mono text-xs break-all flex items-center gap-2">
                                {selectedPayment.proofImage.publicId}
                                <button
                                  onClick={() => copyToClipboard(selectedPayment.proofImage.publicId)}
                                  className="text-gray-400 hover:text-white"
                                  title="Copy to clipboard"
                                >
                                  <Copy size={10} />
                                </button>
                              </div>
                            </div>
                          )}
                          
                          {selectedPayment.proofImage.url && (
                            <div>
                              <div className="text-gray-400 text-xs">URL</div>
                              <div className="text-blue-400 text-xs break-all flex items-center gap-2">
                                <Link size={12} />
                                <span className="truncate">{selectedPayment.proofImage.url}</span>
                                <button
                                  onClick={() => copyToClipboard(selectedPayment.proofImage.url)}
                                  className="text-gray-400 hover:text-white flex-shrink-0"
                                  title="Copy to clipboard"
                                >
                                  <Copy size={10} />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Review History */}
                  {(selectedPayment.reviewNote || selectedPayment.reviewedBy) && (
                    <div className="bg-gray-800 rounded-lg p-4">
                      <h3 className="font-semibold mb-3 text-gray-300">Review History</h3>
                      <div className="space-y-2">
                        {selectedPayment.reviewNote && (
                          <div>
                            <div className="text-gray-400 text-xs">Review Note</div>
                            <div className="text-white text-sm italic">"{selectedPayment.reviewNote}"</div>
                          </div>
                        )}
                        {selectedPayment.reviewerName && (
                          <div>
                            <div className="text-gray-400 text-xs">Reviewed By</div>
                            <div className="text-white text-sm">{selectedPayment.reviewerName}</div>
                          </div>
                        )}
                        {selectedPayment.reviewerEmail && (
                          <div>
                            <div className="text-gray-400 text-xs">Reviewer Email</div>
                            <div className="text-white text-sm">{selectedPayment.reviewerEmail}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {selectedPayment.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t border-gray-800">
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      handleAction(selectedPayment, 'approve');
                    }}
                    className="flex-1 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition font-medium text-sm flex items-center justify-center gap-2"
                  >
                    <Check size={18} />
                    Approve Payment
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      handleAction(selectedPayment, 'reject');
                    }}
                    className="flex-1 py-3 bg-red-600 text-white rounded hover:bg-red-700 transition font-medium text-sm flex items-center justify-center gap-2"
                  >
                    <X size={18} />
                    Reject Payment
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {showImageModal && currentImage && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
          <div className="relative max-w-4xl max-h-[90vh]">
            <div className="absolute top-4 right-4 flex gap-2 z-10">
              <button
                onClick={() => copyToClipboard(currentImage.url)}
                className="p-2 bg-black/50 rounded hover:bg-black/70 transition text-white"
                title="Copy image URL"
              >
                <Copy size={18} />
              </button>
              <button
                onClick={() => setShowImageModal(false)}
                className="p-2 bg-black/50 rounded hover:bg-black/70 transition text-white"
              >
                <X size={20} />
              </button>
            </div>
            <img 
              src={currentImage.url} 
              alt="Proof" 
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            {currentImage.filename && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded text-sm">
                {currentImage.filename}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg border border-gray-800 max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h2 className="text-lg font-semibold">
                {actionType === 'approve' ? 'Approve Payment' : 'Reject Payment'}
              </h2>
              <button
                onClick={() => setShowActionModal(false)}
                className="p-1 text-gray-400 hover:text-white rounded transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="text-sm text-gray-300">
                {actionType === 'approve' 
                  ? `Approve payment of ${formatCurrency(selectedPayment.amount, selectedPayment.currency)} from ${selectedPayment.userName}?`
                  : `Reject payment proof from ${selectedPayment.userName}?`
                }
              </div>

              <div className="text-xs text-gray-500">
                Loan: {selectedPayment.loanId}
              </div>

              {actionType === 'reject' && (
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Rejection Reason</label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a reason for rejection..."
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition h-32 resize-none"
                    required
                  />
                  <div className="text-gray-500 text-xs mt-1">
                    This reason will be visible to the user
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={confirmAction}
                  disabled={actionType === 'reject' && !rejectionReason.trim()}
                  className={`flex-1 py-2.5 rounded transition font-medium text-sm ${
                    actionType === 'approve' 
                      ? 'bg-green-600 hover:bg-green-700 text-white disabled:opacity-50'
                      : 'bg-red-600 hover:bg-red-700 text-white disabled:opacity-50'
                  }`}
                >
                  {actionType === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
                </button>
                <button
                  onClick={() => setShowActionModal(false)}
                  className="px-4 py-2.5 bg-gray-700 text-white rounded hover:bg-gray-600 transition text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLoanPaymentReview;