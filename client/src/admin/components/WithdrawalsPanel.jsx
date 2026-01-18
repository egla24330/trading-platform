import { useState, useEffect } from "react";
import { 
  Search, 
  ChevronDown, 
  Calendar,
  Download,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  X,
  Copy,
  ExternalLink,
  Check,
  X as XIcon,
  Edit,
  AlertCircle,
  RefreshCw, 
} from "lucide-react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext.jsx";
import { toast } from "react-toastify";
import SkeletonLoader from "./SkeletonLoader.jsx";

export default function WithdrawalsPanel() {
  const { backendUrl, token } = useAuth();
  
  const [status, setStatus] = useState("All Status");
  const [currency, setCurrency] = useState("All Currency");
  const [openStatus, setOpenStatus] = useState(false);
  const [openCurrency, setOpenCurrency] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [approvedAmount, setApprovedAmount] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [transactionHash, setTransactionHash] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [withdrawals, setWithdrawals] = useState([]);

  const statuses = ["All Status", "Completed", "Pending", "Failed", "Rejected", "Processing"];
  const currencies = ["All Currency", "USDT", "BTC", "ETH", "BNB"];

  // Fetch withdrawals from backend
  useEffect(() => {
    if (token) {
      fetchWithdrawals();
    }
  }, [token, status, currency, searchTerm, startDate, endDate]);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      
      const params = {
        ...(status !== "All Status" && { status }),
        ...(currency !== "All Currency" && { currency }),
        ...(searchTerm && { search: searchTerm }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      };

      const response = await axios.get(`${backendUrl}api/withdrawals`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params
      });

      if (response.data.success) {
        setWithdrawals(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
      toast.error("Failed to load withdrawals");
      setWithdrawals([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredWithdrawals = withdrawals.filter(withdrawal => {
    const matchesSearch = 
      withdrawal.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      withdrawal.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      withdrawal.user?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = status === "All Status" || withdrawal.status === status;
    const matchesCurrency = currency === "All Currency" || withdrawal.currency === currency;
    
    const withdrawalDate = new Date(withdrawal.createdAt);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    const matchesDate = (!start || withdrawalDate >= start) && (!end || withdrawalDate <= end);
    
    return matchesSearch && matchesStatus && matchesCurrency && matchesDate;
  });

  const showNotification = (message, type = "success") => {
    toast[type === "error" ? "error" : type === "warning" ? "warning" : "success"](message);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Completed": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "Processing": return <Clock className="h-4 w-4 text-blue-500" />;
      case "Pending": return <Clock className="h-4 w-4 text-yellow-500" />;
      case "Failed": return <XCircle className="h-4 w-4 text-red-500" />;
      case "Rejected": return <XIcon className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed": return "bg-green-500/20 text-green-400";
      case "Processing": return "bg-blue-500/20 text-blue-400";
      case "Pending": return "bg-yellow-500/20 text-yellow-400";
      case "Failed": return "bg-red-500/20 text-red-400";
      case "Rejected": return "bg-red-500/20 text-red-400";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  const handleViewDetails = (withdrawal) => {
    setSelectedWithdrawal(withdrawal);
  };

  const closeModal = () => {
    setSelectedWithdrawal(null);
  };

  const handleApprove = (withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setApprovedAmount(withdrawal.requestedAmount?.toString() || withdrawal.amount.toString());
    setShowApproveModal(true);
  };

  const handleReject = (withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const handleProcess = (withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setTransactionHash(withdrawal.transactionHash || "");
    setShowProcessModal(true);
  };

  const submitApproval = async () => {
    if (!approvedAmount || parseFloat(approvedAmount) <= 0) {
      showNotification("Please enter a valid amount", "error");
      return;
    }

    if (selectedWithdrawal && parseFloat(approvedAmount) > selectedWithdrawal.userBalance) {
      showNotification("Approved amount exceeds user balance", "error");
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await axios.put(
        `${backendUrl}api/withdrawals/${selectedWithdrawal._id}/approve`,
        { approvedAmount: parseFloat(approvedAmount) },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        showNotification(`Withdrawal ${selectedWithdrawal.transactionId} approved successfully`);
        setShowApproveModal(false);
        setApprovedAmount("");
        fetchWithdrawals(); // Refresh data
      }
    } catch (error) {
      console.error("Approval error:", error);
      showNotification(error.response?.data?.message || "Approval failed", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const submitProcessing = async () => {
    if (!transactionHash.trim()) {
      showNotification("Please enter a transaction hash", "error");
      return;
    }

    if (transactionHash.length < 64) {
      showNotification("Transaction hash must be at least 64 characters", "error");
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await axios.put(
        `${backendUrl}api/withdrawals/${selectedWithdrawal._id}/hash`,
        { transactionHash },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        showNotification(`Transaction hash updated for withdrawal ${selectedWithdrawal.transactionId}`);
        setShowProcessModal(false);
        setTransactionHash("");
        fetchWithdrawals(); // Refresh data
      }
    } catch (error) {
      console.error("Processing error:", error);
      showNotification(error.response?.data?.message || "Update failed", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const submitRejection = async () => {
    if (!rejectReason.trim()) {
      showNotification("Please enter a rejection reason", "error");
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await axios.put(
        `${backendUrl}api/withdrawals/${selectedWithdrawal._id}/reject`,
        { rejectReason },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        showNotification(`Withdrawal ${selectedWithdrawal.transactionId} rejected`, "warning");
        setShowRejectModal(false);
        setRejectReason("");
        fetchWithdrawals(); // Refresh data
      }
    } catch (error) {
      console.error("Rejection error:", error);
      showNotification(error.response?.data?.message || "Rejection failed", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showNotification("Copied to clipboard");
  };

  const viewOnExplorer = (hash, network) => {
    let explorerUrl = "";
    switch (network) {
      case "TRC20":
        explorerUrl = `https://tronscan.org/#/transaction/${hash}`;
        break;
      case "Bitcoin":
        explorerUrl = `https://blockstream.info/tx/${hash}`;
        break;
      case "Ethereum":
      case "ERC20":
        explorerUrl = `https://etherscan.io/tx/${hash}`;
        break;
      case "BSC":
        explorerUrl = `https://bscscan.com/tx/${hash}`;
        break;
      default:
        explorerUrl = `https://blockchain.com/explorer/transactions/${hash}`;
    }
    window.open(explorerUrl, '_blank');
  };

  const clearDateFilter = () => {
    setStartDate("");
    setEndDate("");
  };

  const stats = {
    total: withdrawals.length,
    pending: withdrawals.filter(d => d.status === "Pending").length,
    processing: withdrawals.filter(d => d.status === "Processing").length,
    completed: withdrawals.filter(d => d.status === "Completed").length,
    totalAmount: withdrawals.filter(d => d.status === "Completed").reduce((sum, d) => sum + d.amount, 0)
  };

  const getActionButtons = (withdrawal) => {
    switch (withdrawal.status) {
      case "Pending":
        return (
          <>
            {/* <button
              onClick={() => handleApprove(withdrawal)}
              className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition text-xs"
            >
              <Check size={12} />
              Approve
            </button>
            <button
              onClick={() => handleReject(withdrawal)}
              className="flex items-center gap-1 px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition text-xs"
            >
              <XIcon size={12} />
              Reject
            </button> */}
          </>
        );
      case "Processing":
        return (
          <></>
          
          /*
          <button
            onClick={() => handleProcess(withdrawal)}
            className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-xs"
          >
            <Edit size={12} />
            Update Hash
          </button>
          */
        );
      default:
        return null;
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB') + ', ' + date.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl font-semibold mb-1">Withdrawals</h1>
          <p className="text-gray-400 text-sm">Manage user withdrawal requests</p>
        </div>
         <div className="flex items-center gap-2">
          <button
            onClick={()=>fetchWithdrawals()}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition text-sm disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
          //  onClick={handleExportReport}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
          >
            <Download size={14} />
            Export 
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="flex-1 bg-gray-950 rounded-3xl flex items-center px-3 border border-gray-700">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search by withdrawal ID, email, or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent outline-none p-2 text-sm"
          />
        </div>

        {/* Status Filter */}
        <div className="relative w-full lg:w-40">
          <button
            onClick={() => { setOpenStatus(!openStatus); setOpenCurrency(false); setShowDatePicker(false); }}
            className="w-full bg-gray-900 rounded-lg px-3 py-2 text-left border border-gray-800 flex items-center justify-between text-sm hover:border-gray-600 transition"
          >
            <span className="text-gray-300">{status}</span>
            <ChevronDown size={16} className="text-gray-400" />
          </button>

          {openStatus && (
            <div className="absolute w-full bg-gray-900 border border-gray-800 rounded-lg mt-1 z-20 text-sm">
              {statuses.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setStatus(s);
                    setOpenStatus(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-800 text-gray-300 transition"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Currency Filter */}
        <div className="relative w-full lg:w-40">
          <button
            onClick={() => { setOpenCurrency(!openCurrency); setOpenStatus(false); setShowDatePicker(false); }}
            className="w-full bg-gray-900 rounded-lg px-3 py-2 text-left border border-gray-800 flex items-center justify-between text-sm hover:border-gray-600 transition"
          >
            <span className="text-gray-300">{currency}</span>
            <ChevronDown size={16} className="text-gray-400" />
          </button>

          {openCurrency && (
            <div className="absolute w-full bg-gray-900 border border-gray-800 rounded-lg mt-1 z-20 text-sm">
              {currencies.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setCurrency(c);
                    setOpenCurrency(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-800 text-gray-300 transition"
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Date Picker */}
        <div className="relative w-full lg:w-48">
          <button
            onClick={() => { setShowDatePicker(!showDatePicker); setOpenStatus(false); setOpenCurrency(false); }}
            className="w-full bg-gray-900 rounded-lg px-3 py-2 text-left border border-gray-800 flex items-center justify-between text-sm hover:border-gray-600 transition"
          >
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-gray-400" />
              <span className="text-gray-300 text-xs">
                {startDate && endDate 
                  ? `${startDate} → ${endDate}`
                  : startDate || endDate
                  ? "Date Set"
                  : "Date Range"}
              </span>
            </div>
            <ChevronDown size={16} className="text-gray-400" />
          </button>

          {showDatePicker && (
            <div className="absolute w-full bg-gray-900 border border-gray-800 rounded-lg mt-1 z-20 p-3">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-white">Date Range</h3>
                  {(startDate || endDate) && (
                    <button
                      onClick={clearDateFilter}
                      className="text-xs text-red-400 hover:text-red-300 transition"
                    >
                      Clear
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">From</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">To</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <SkeletonLoader/>
      )}

      {/* Desktop Table */}
      {!loading && (
        <div className="hidden lg:block bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-800 text-gray-400">
              <tr>
                <th className="p-3 text-left font-medium">Withdrawal ID</th>
                <th className="p-3 text-left font-medium">User</th>
                <th className="p-3 text-left font-medium">Amount</th>
                <th className="p-3 text-left font-medium">Currency</th>
                <th className="p-3 text-left font-medium">Status</th>
                <th className="p-3 text-left font-medium">Date</th>
                <th className="p-3 text-left font-medium">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredWithdrawals.map((withdrawal) => (
                <tr key={withdrawal._id} className="border-t border-gray-800 hover:bg-gray-850 transition">
                  <td className="p-3">
                    <div className="text-blue-400 font-mono text-xs">
                      {withdrawal.transactionId}
                    </div>
                  </td>
                  <td className="p-3">
                    <div>
                      <div className="text-white text-sm">{withdrawal.user?.name || 'N/A'}</div>
                      <div className="text-gray-400 text-xs">{withdrawal.user?.email || 'N/A'}</div>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="font-semibold text-red-400 text-sm">
                      -{withdrawal.amount} {withdrawal.currency}
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="text-white text-sm">{withdrawal.currency}</span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(withdrawal.status)}
                      <span className={`px-2 py-1 text-xs rounded ${getStatusColor(withdrawal.status)}`}>
                        {withdrawal.status}
                      </span>
                    </div>
                  </td>
                  <td className="p-3 text-gray-300 text-sm">{formatDate(withdrawal.createdAt)}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewDetails(withdrawal)}
                        className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-xs"
                      >
                        <Eye size={12} />
                        View
                      </button>
                      
                      {getActionButtons(withdrawal)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {filteredWithdrawals.map((withdrawal) => (
          <div key={withdrawal._id} className="bg-gray-900 rounded-lg p-3 border border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-blue-400 text-xs font-mono mb-1">{withdrawal.transactionId}</div>
                <div className="text-white text-sm">{withdrawal.user?.name || 'N/A'}</div>
                <div className="text-gray-400 text-xs">{withdrawal.user?.email || 'N/A'}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs rounded ${getStatusColor(withdrawal.status)}`}>
                  {withdrawal.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
              <div>
                <div className="text-gray-400 text-xs">Amount</div>
                <div className="font-semibold text-red-400">
                  -{withdrawal.amount} {withdrawal.currency}
                </div>
              </div>
              <div>
                <div className="text-gray-400 text-xs">Date</div>
                <div className="text-white text-xs">{formatDate(withdrawal.createdAt).split(',')[0]}</div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleViewDetails(withdrawal)}
                className="flex-1 flex items-center justify-center gap-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm"
              >
                <Eye size={14} />
                View
              </button>
              
              {withdrawal.status === "Pending" && (
                <>
                  {/* <button
                    onClick={() => handleApprove(withdrawal)}
                    className="flex-1 flex items-center justify-center gap-1 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm"
                  >
                    <Check size={14} />
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(withdrawal)}
                    className="flex-1 flex items-center justify-center gap-1 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm"
                  >
                    <XIcon size={14} />
                    Reject
                  </button> */}
                </>
              )}
              {withdrawal.status === "Processing" && (
                <button
                  onClick={() => handleProcess(withdrawal)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm"
                >
                  <Edit size={14} />
                  Update Hash
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredWithdrawals.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-400">
          <div className="text-sm">No withdrawals found</div>
        </div>
      )}

      {/* Withdrawal Details Modal */}
      {selectedWithdrawal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg border border-gray-800 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <div>
                <h2 className="text-lg font-semibold text-white">Withdrawal Details</h2>
                <p className="text-gray-400 text-xs mt-1">{selectedWithdrawal.transactionId}</p>
              </div>
              <button
                onClick={closeModal}
                className="p-1 text-gray-400 hover:text-white rounded transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">User:</span>
                  <span className="text-white">{selectedWithdrawal.user?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Email:</span>
                  <span className="text-white">{selectedWithdrawal.user?.email || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">User Balance:</span>
                  <span className="text-white">{selectedWithdrawal.userBalance || 'N/A'} {selectedWithdrawal.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount:</span>
                  <span className="text-red-400 font-semibold">
                    -{selectedWithdrawal.amount} {selectedWithdrawal.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Fee:</span>
                  <span className="text-white">{selectedWithdrawal.fee} {selectedWithdrawal.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedWithdrawal.status)}
                    <span className={`px-2 py-1 text-xs rounded ${getStatusColor(selectedWithdrawal.status)}`}>
                      {selectedWithdrawal.status}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Network:</span>
                  <span className="text-white">{selectedWithdrawal.network}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">To Address:</span>
                  <div className="flex items-center gap-1">
                    <span className="text-white text-xs truncate max-w-[120px]">
                      {selectedWithdrawal.toAddress}
                    </span>
                    <button
                      onClick={() => copyToClipboard(selectedWithdrawal.toAddress)}
                      className="p-1 text-gray-400 hover:text-white transition"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Date:</span>
                  <span className="text-white">{formatDate(selectedWithdrawal.createdAt)}</span>
                </div>
                {selectedWithdrawal.transactionHash && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Transaction Hash:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-blue-400 text-xs truncate max-w-[100px]">
                        {selectedWithdrawal.transactionHash}
                      </span>
                      <button
                        onClick={() => copyToClipboard(selectedWithdrawal.transactionHash)}
                        className="p-1 text-gray-400 hover:text-white transition"
                      >
                        <Copy size={12} />
                      </button>
                      <button
                        onClick={() => viewOnExplorer(selectedWithdrawal.transactionHash, selectedWithdrawal.network)}
                        className="p-1 text-gray-400 hover:text-white transition"
                      >
                        <ExternalLink size={12} />
                      </button>
                    </div>
                  </div>
                )}
                {selectedWithdrawal.rejectReason && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Reject Reason:</span>
                    <span className="text-red-400 text-xs text-right">{selectedWithdrawal.rejectReason}</span>
                  </div>
                )}
              </div>

              {(selectedWithdrawal.status === "Pending" || selectedWithdrawal.status === "Processing") && (
                <div className="flex gap-2 pt-3 border-t border-gray-700">
                  {selectedWithdrawal.status === "Pending" && (
                    <>
                      <button
                        onClick={() => handleApprove(selectedWithdrawal)}
                        className="flex-1 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm font-medium"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(selectedWithdrawal)}
                        className="flex-1 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm font-medium"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {selectedWithdrawal.status === "Processing" && (
                    <button
                      onClick={() => handleProcess(selectedWithdrawal)}
                      className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm font-medium"
                    >
                      Update Hash
                    </button>
                  )}
                </div>
              )}

              <button
                onClick={closeModal}
                className="w-full py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg border border-gray-800 max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">Approve Withdrawal</h2>
              <button
                onClick={() => setShowApproveModal(false)}
                className="p-1 text-gray-400 hover:text-white rounded transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">User:</span>
                  <span className="text-white">{selectedWithdrawal.user?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">User Balance:</span>
                  <span className="text-white">{selectedWithdrawal.userBalance || 'N/A'} {selectedWithdrawal.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Requested Amount:</span>
                  <span className="text-white">{selectedWithdrawal.requestedAmount || selectedWithdrawal.amount} {selectedWithdrawal.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">To Address:</span>
                  <span className="text-white text-xs truncate max-w-[200px]">{selectedWithdrawal.toAddress}</span>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Approved Amount</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={approvedAmount}
                    onChange={(e) => setApprovedAmount(e.target.value)}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition"
                    placeholder="Enter approved amount"
                  />
                  <span className="text-gray-400 text-sm">{selectedWithdrawal.currency}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  User balance: {selectedWithdrawal.userBalance || 'N/A'} {selectedWithdrawal.currency}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={submitApproval}
                  disabled={isLoading}
                  className="flex-1 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Processing..." : "Confirm Approval"}
                </button>
                <button
                  onClick={() => setShowApproveModal(false)}
                  className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Process Modal */}
      {showProcessModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg border border-gray-800 max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">Update Transaction Hash</h2>
              <button
                onClick={() => setShowProcessModal(false)}
                className="p-1 text-gray-400 hover:text-white rounded transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">User:</span>
                  <span className="text-white">{selectedWithdrawal.user?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount:</span>
                  <span className="text-white">{selectedWithdrawal.amount} {selectedWithdrawal.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">To Address:</span>
                  <span className="text-white text-xs truncate max-w-[200px]">{selectedWithdrawal.toAddress}</span>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Transaction Hash</label>
                <input
                  type="text"
                  value={transactionHash}
                  onChange={(e) => setTransactionHash(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition font-mono"
                  placeholder="Enter transaction hash (64 characters)"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Enter the blockchain transaction hash after processing the withdrawal
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={submitProcessing}
                  disabled={isLoading}
                  className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Processing..." : "Update Hash"}
                </button>
                <button
                  onClick={() => setShowProcessModal(false)}
                  className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg border border-gray-800 max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">Reject Withdrawal</h2>
              <button
                onClick={() => setShowRejectModal(false)}
                className="p-1 text-gray-400 hover:text-white rounded transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="text-sm">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">User:</span>
                  <span className="text-white">{selectedWithdrawal.user?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount:</span>
                  <span className="text-white">{selectedWithdrawal.amount} {selectedWithdrawal.currency}</span>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Rejection Reason</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition h-20 resize-none"
                  placeholder="Enter reason for rejection..."
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={submitRejection}
                  disabled={isLoading}
                  className="flex-1 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Processing..." : "Confirm Rejection"}
                </button>
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition"
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
}