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
  Check, 
  X as XIcon, 
  Image, 
  AlertCircle, 
  RefreshCw, 
  Filter,
  BarChart3,
  DollarSign
} from "lucide-react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../../context/AuthContext";

export default function DepositsPanel() {
  const { backendUrl, token } = useAuth();
  
  // State management
  const [status, setStatus] = useState("All Status");
  const [currency, setCurrency] = useState("All Currency");
  const [openStatus, setOpenStatus] = useState(false);
  const [openCurrency, setOpenCurrency] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDeposit, setSelectedDeposit] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [approvedAmount, setApprovedAmount] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showDetails, setShowDetails] = useState(false);

  // Backend integration states
  const [deposits, setDeposits] = useState([]);
  const [filteredDeposits, setFilteredDeposits] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    rejected: 0,
    totalAmount: 0
  });
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDeposits, setTotalDeposits] = useState(0);
  const [processingAction, setProcessingAction] = useState(false);

  // Options
  const statuses = ["All Status", "pending", "processing", "completed", "rejected", "failed", "under_review"];
  const currencies = ["All Currency", "BTC", "ETH", "USDT", "BNB"];

  // Fetch deposits from backend
  const fetchDeposits = async () => {
    setLoading(true);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const params = {
        page,
        limit: 20,
        sortBy: "createdAt",
        sortOrder: "desc"
      };

      // Add filters if selected
      if (status !== "All Status") params.status = status;
      if (currency !== "All Currency") params.currency = currency;
      if (searchTerm) params.search = searchTerm;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await axios.get(`${backendUrl}api/deposits`, {
        ...config,
        params
      });

      if (response.data.success) {
        console.log({'resrers':response})
        setDeposits(response.data.data || []);
        setFilteredDeposits(response.data.data || []);
        setTotalPages(response.data.pagination?.pages || 1);
        setTotalDeposits(response.data.pagination?.total || 0);
        
        // Calculate stats from fetched data
        calculateStats(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching deposits:", error);
      toast.error(error.response?.data?.message || "Failed to load deposits");
    } finally {
      setLoading(false);
    }
  };

  // Fetch dashboard stats
  const fetchDashboardStats = async () => {
    setLoadingStats(true);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const response = await axios.get(`${backendUrl}api/deposits/admin/stats`, config);

      if (response.data.success) {
        setStats({
          total: response.data.data.totals?.count || 0,
          completed: response.data.data.totals?.completed || 0,
          pending: response.data.data.totals?.pending || 0,
          rejected: response.data.data.totals?.rejected || 0,
          totalAmount: response.data.data.totals?.total || 0
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      // Fallback to calculating from deposits data
      calculateStats(deposits);
    } finally {
      setLoadingStats(false);
    }
  };

  // Calculate stats from deposits data
  const calculateStats = (depositData) => {
    const stats = {
      total: depositData.length,
      completed: depositData.filter(d => d.status === "completed").length,
      pending: depositData.filter(d => d.status === "pending" || d.status === "processing").length,
      rejected: depositData.filter(d => d.status === "rejected").length,
      totalAmount: depositData
        .filter(d => d.status === "completed")
        .reduce((sum, d) => sum + (d.approvedAmount || d.amount || 0), 0)
    };
    setStats(stats);
  };

  // Initial data fetch
  useEffect(() => {
    fetchDeposits();
    fetchDashboardStats();
  }, [page, status, currency, searchTerm, startDate, endDate]);

  // Status and UI helpers
  const getStatusIcon = (status) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-3 w-3 text-green-500" />;
      case "processing": return <BarChart3 className="h-3 w-3 text-blue-500" />;
      case "pending": return <Clock className="h-3 w-3 text-yellow-500" />;
      case "rejected": return <XCircle className="h-3 w-3 text-red-500" />;
      case "failed": return <AlertCircle className="h-3 w-3 text-red-500" />;
      case "under_review": return <AlertCircle className="h-3 w-3 text-orange-500" />;
      default: return <Clock className="h-3 w-3 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "processing": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "pending": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "rejected": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "failed": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "under_review": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const formatStatus = (status) => {
    if (!status) return "Unknown";
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatAmount = (amount, currency) => {
    if (!amount) return "0";
    const decimals = currency === 'BTC' ? 8 : currency === 'ETH' ? 6 : 2;
    return parseFloat(amount).toFixed(decimals);
  };

  // Event handlers
  const handleViewDetails = async (deposit) => {
   
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const response = await axios.get(`${backendUrl}api/deposits/${deposit._id}`, config);


      
      if (response.data.success) {
        setSelectedDeposit(response.data.data);
        setShowDetails(true);
      }
    } catch (error) {
      console.error("Error fetching deposit details:", error);
      toast.error("Failed to load deposit details");
    }
  };

  const closeModal = () => {
    setSelectedDeposit(null);
    setShowDetails(false);
    setShowApproveModal(false);
    setShowRejectModal(false);
  };

  const handleApprove = (deposit) => {
    setSelectedDeposit(deposit);
    setApprovedAmount(deposit.amount?.toString() || "");
    setShowApproveModal(true);
  };

  const handleReject = (deposit) => {
    setSelectedDeposit(deposit);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const submitApproval = async () => {
    if (!selectedDeposit || !approvedAmount || parseFloat(approvedAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setProcessingAction(true);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const payload = {
        approvedAmount: parseFloat(approvedAmount)
      };

      const response = await axios.put(
        `${backendUrl}api/deposits/${selectedDeposit._id}/approve`, 
        payload, 
        config
      );

      if (response.data.success) {
        toast.success("Deposit approved successfully!");
        setShowApproveModal(false);
        setApprovedAmount("");
        
        // Refresh data
        fetchDeposits();
        fetchDashboardStats();
      }
    } catch (error) {
      console.error("Error approving deposit:", error);
      toast.error(error.response?.data?.message || "Failed to approve deposit");
    } finally {
      setProcessingAction(false);
    }
  };

  const submitRejection = async () => {
    if (!selectedDeposit || !rejectReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    setProcessingAction(true);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const response = await axios.put(
        `${backendUrl}api/deposits/${selectedDeposit._id}/reject`, 
        { reason: rejectReason }, 
        config
      );

      if (response.data.success) {
        toast.success("Deposit rejected successfully!");
        setShowRejectModal(false);
        setRejectReason("");
        
        // Refresh data
        fetchDeposits();
        fetchDashboardStats();
      }
    } catch (error) {
      console.error("Error rejecting deposit:", error);
      toast.error(error.response?.data?.message || "Failed to reject deposit");
    } finally {
      setProcessingAction(false);
    }
  };

  const markForReview = async (depositId) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const response = await axios.put(
        `${backendUrl}api/deposits/${depositId}/review`, 
        { note: 'Marked for review by admin' }, 
        config
      );

      if (response.data.success) {
        toast.success("Deposit marked for review!");
        fetchDeposits();
      }
    } catch (error) {
      console.error("Error marking for review:", error);
      toast.error(error.response?.data?.message || "Failed to mark for review");
    }
  };

  const clearDateFilter = () => {
    setStartDate("");
    setEndDate("");
  };

  const clearAllFilters = () => {
    setStatus("All Status");
    setCurrency("All Currency");
    setSearchTerm("");
    clearDateFilter();
    setPage(1);
  };

  const getActionButtons = (deposit) => {
    switch (deposit.status) {
      case "pending":
        return (
          <>
            {/* <button
              onClick={() => handleApprove(deposit)}
              disabled={processingAction}
              className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition text-xs disabled:opacity-50"
            >
              <Check size={12} />
              Approve
            </button> */}
            {/* <button
              onClick={() => handleReject(deposit)}
              disabled={processingAction}
              className="flex items-center gap-1 px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition text-xs disabled:opacity-50"
            >
              <XIcon size={12} />
              Reject
            </button> */}
          </>
        );
      case "processing":
        return (
          <button
            onClick={() => markForReview(deposit._id)}
            disabled={processingAction}
            className="flex items-center gap-1 px-2 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 transition text-xs disabled:opacity-50"
          >
            <AlertCircle size={12} />
            Review
          </button>
        );
      default:
        return null;
    }
  };

  const handleExportReport = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob'
      };

      const params = {};
      if (status !== "All Status") params.status = status;
      if (currency !== "All Currency") params.currency = currency;
      if (searchTerm) params.search = searchTerm;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await axios.get(`${backendUrl}api/deposits/export`, {
        ...config,
        params
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `deposits-report-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success("Report exported successfully!");
    } catch (error) {
      console.error("Error exporting report:", error);
      toast.error("Failed to export report");
    }
  };

  const handleRefresh = () => {
    fetchDeposits();
    fetchDashboardStats();
    toast.info("Data refreshed");
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const viewOnExplorer = (hash, network) => {
    let explorerUrl = "";
    switch (network) {
      case "TRC20":
      case "TronTRC20":
        explorerUrl = `https://tronscan.org/#/transaction/${hash}`;
        break;
      case "Bitcoin":
        explorerUrl = `https://blockstream.info/tx/${hash}`;
        break;
      case "Ethereum":
      case "ERC20":
      case "Arbitrum":
        explorerUrl = `https://etherscan.io/tx/${hash}`;
        break;
      case "BEP20":
        explorerUrl = `https://bscscan.com/tx/${hash}`;
        break;
      default:
        explorerUrl = `https://blockchain.com/explorer/transactions/${hash}`;
    }
    window.open(explorerUrl, '_blank');
  };

  // Loading skeleton
  const renderSkeleton = () => {
    return Array.from({ length: 15 }).map((_, i) => (
      <tr key={i} className="border-t border-gray-800 animate-pulse">
        <td className="p-3">
          <div className="h-4 bg-gray-700 rounded w-32"></div>
        </td>
        <td className="p-3">
          <div className="h-4 bg-gray-700 rounded w-24 mb-2"></div>
          <div className="h-3 bg-gray-800 rounded w-32"></div>
        </td>
        <td className="p-3">
          <div className="h-4 bg-gray-700 rounded w-20"></div>
        </td>
        <td className="p-3">
          <div className="h-4 bg-gray-700 rounded w-12"></div>
        </td>
        <td className="p-3">
          <div className="h-6 bg-gray-700 rounded w-16"></div>
        </td>
        <td className="p-3">
          <div className="h-4 bg-gray-700 rounded w-24"></div>
        </td>
        <td className="p-3">
          <div className="h-8 bg-gray-700 rounded w-24"></div>
        </td>
      </tr>
    ));
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl font-semibold mb-1">Deposit Management</h1>
          <p className="text-gray-400 text-sm">Manage user deposit transactions</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition text-sm disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            onClick={handleExportReport}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
          >
            <Download size={14} />
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {loadingStats ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-gray-900 rounded-lg p-3 border border-gray-800 animate-pulse">
              <div className="h-4 bg-gray-800 rounded mb-2"></div>
              <div className="h-6 bg-gray-800 rounded"></div>
            </div>
          ))
        ) : (
          <>
            <div className="bg-gray-900 rounded-lg p-3 border border-gray-800">
              <div className="text-gray-400 text-xs mb-1">Total Deposits</div>
              <div className="text-xl font-semibold">{stats.total}</div>
            </div>
            <div className="bg-gray-900 rounded-lg p-3 border border-gray-800">
              <div className="text-gray-400 text-xs mb-1">Pending</div>
              <div className="text-xl font-semibold text-yellow-400">{stats.pending}</div>
            </div>
            <div className="bg-gray-900 rounded-lg p-3 border border-gray-800">
              <div className="text-gray-400 text-xs mb-1">Completed</div>
              <div className="text-xl font-semibold text-green-400">{stats.completed}</div>
            </div>
            <div className="bg-gray-900 rounded-lg p-3 border border-gray-800">
              <div className="text-gray-400 text-xs mb-1">Rejected</div>
              <div className="text-xl font-semibold text-red-400">{stats.rejected}</div>
            </div>
            <div className="bg-gray-900 rounded-lg p-3 border border-gray-800">
              <div className="text-gray-400 text-xs mb-1">Total Amount</div>
              <div className="text-xl font-semibold text-blue-400">
                ${stats.totalAmount.toLocaleString()}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="flex-1 bg-gray-950 rounded-3xl flex items-center px-3 border border-gray-700">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search by transaction ID, email, name, or hash..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent outline-none p-2 text-sm"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="p-1 text-gray-400 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="relative w-full lg:w-40">
          <button
            onClick={() => { setOpenStatus(!openStatus); setOpenCurrency(false); setShowDatePicker(false); }}
            className="w-full bg-gray-900 rounded-lg px-3 py-2 text-left border border-gray-800 flex items-center justify-between text-sm hover:border-gray-600 transition"
          >
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-gray-400" />
              <span className="text-gray-300">{formatStatus(status)}</span>
            </div>
            <ChevronDown size={16} className="text-gray-400" />
          </button>

          {openStatus && (
            <div className="absolute w-full bg-gray-900 border border-gray-800 rounded-lg mt-1 z-20 text-sm max-h-60 overflow-y-auto">
              {statuses.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setStatus(s);
                    setOpenStatus(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-800 text-gray-300 transition flex items-center gap-2"
                >
                  {getStatusIcon(s === "All Status" ? "pending" : s)}
                  {formatStatus(s)}
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
            <div className="flex items-center gap-2">
              <DollarSign size={14} className="text-gray-400" />
              <span className="text-gray-300">{currency}</span>
            </div>
            <ChevronDown size={16} className="text-gray-400" />
          </button>

          {openCurrency && (
            <div className="absolute w-full bg-gray-900 border border-gray-800 rounded-lg mt-1 z-20 text-sm max-h-60 overflow-y-auto">
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

        {/* Clear All Filters */}
        {(status !== "All Status" || currency !== "All Currency" || searchTerm || startDate || endDate) && (
          <button
            onClick={clearAllFilters}
            className="px-3 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition text-sm whitespace-nowrap"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-gray-400 text-sm">
          {loading ? (
            "Loading deposits..."
          ) : (
            `Showing ${deposits.length} of ${totalDeposits} deposits`
          )}
        </div>
        <div className="text-gray-400 text-sm">
          {!loading && deposits.length > 0 && (
            <span>Total: ${deposits.reduce((sum, deposit) => sum + (deposit.amount || 0), 0).toLocaleString()}</span>
          )}
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
          <div className="hidden lg:block bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-800 text-gray-400">
                <tr>
                  <th className="p-3 text-left font-medium">Transaction ID</th>
                  <th className="p-3 text-left font-medium">User</th>
                  <th className="p-3 text-left font-medium">Amount</th>
                  <th className="p-3 text-left font-medium">Currency</th>
                  <th className="p-3 text-left font-medium">Status</th>
                  <th className="p-3 text-left font-medium">Date</th>
                  <th className="p-3 text-left font-medium">Actions</th>
                </tr>
              </thead>

              <tbody>
                {deposits.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-gray-400">
                      No deposits found
                    </td>
                  </tr>
                ) : (
                  deposits.map((deposit) => (
                    <tr key={deposit._id} className="border-t border-gray-800 hover:bg-gray-850 transition">
                      <td className="p-3">
                        <div className="text-blue-400 font-mono text-xs cursor-pointer hover:underline"
                             onClick={() => copyToClipboard(deposit.transactionId)}>
                          {deposit.transactionId}
                        </div>
                        {deposit.txHash && (
                          <div className="text-gray-500 text-xs font-mono mt-1 truncate max-w-xs">
                            Hash: {deposit.txHash.slice(0, 16)}...
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <div>
                          <div className="text-white text-sm">{deposit.user?.name || "N/A"}</div>
                          <div className="text-gray-400 text-xs">{deposit.user?.email || "N/A"}</div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-green-400 text-sm">
                          +{formatAmount(deposit.amount, deposit.currency)} {deposit.currency}
                        </div>
                        {deposit.approvedAmount && deposit.approvedAmount !== deposit.amount && (
                          <div className="text-gray-400 text-xs">
                            Approved: {formatAmount(deposit.approvedAmount, deposit.currency)}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="text-white text-sm">{deposit.currency}</span>
                        <div className="text-gray-400 text-xs">{deposit.network}</div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(deposit.status)}
                          <span className={`px-2 py-1 text-xs border rounded ${getStatusColor(deposit.status)}`}>
                            {formatStatus(deposit.status)}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-gray-300 text-sm">{formatDate(deposit.createdAt)}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewDetails(deposit)}
                            className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-xs"
                          >
                            <Eye size={12} />
                            View
                          </button>
                          {getActionButtons(deposit)}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-3">
            {deposits.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No deposits found
              </div>
            ) : (
              deposits.map((deposit) => (
                <div key={deposit._id} className="bg-gray-900 rounded-lg p-3 border border-gray-800">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-blue-400 text-xs font-mono mb-1">{deposit.transactionId}</div>
                      <div className="text-white text-xs">{deposit.user?.name || "N/A"}</div>
                      <div className="text-gray-400 text-xs">{deposit.user?.email || "N/A"}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(deposit.status)}
                      <span className={`px-2 py-1 text-xs border rounded ${getStatusColor(deposit.status)}`}>
                        {formatStatus(deposit.status)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                    <div>
                      <div className="text-gray-400 text-xs">Amount</div>
                      <div className="font-semibold text-green-400">
                        +{formatAmount(deposit.amount, deposit.currency)} {deposit.currency}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-xs">Date</div>
                      <div className="text-white text-xs">{formatDate(deposit.createdAt).split(',')[0]}</div>
                      <div className="text-gray-400 text-xs">{deposit.network}</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDetails(deposit)}
                      className="flex-1 flex items-center justify-center gap-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm"
                    >
                      <Eye size={14} />
                      View Details
                    </button>
                    {getActionButtons(deposit)}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 bg-gray-800 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-gray-400 text-sm">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 bg-gray-800 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && deposits.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <DollarSign className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <div className="text-sm mb-2">No deposits found matching your filters</div>
          <button
            onClick={clearAllFilters}
            className="text-blue-400 hover:text-blue-300 text-sm transition"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Deposit Details Modal */}
      {showDetails && selectedDeposit && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg border border-gray-800 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <div>
                <h2 className="text-lg font-semibold text-white">Deposit Details</h2>
                <p className="text-gray-400 text-xs mt-1">{selectedDeposit.transactionId}</p>
              </div>
              <button
                onClick={closeModal}
                className="p-1 text-gray-400 hover:text-white rounded transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Proof Image */}
              {selectedDeposit.proofImage?.url && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-white">Payment Proof</h3>
                  <div className="relative">
                    <img
                      src={selectedDeposit.proofImage.url}
                      alt="Payment proof"
                      className="w-full h-48 object-cover rounded border border-gray-700"
                    />
                    <button
                      onClick={() => window.open(selectedDeposit.proofImage.url, '_blank')}
                      className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded hover:bg-black/70 transition"
                    >
                      <Image size={14} />
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">User:</span>
                  {console.log({selectedDeposit})}
                  <span className="text-white">{selectedDeposit?.name || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Email:</span>
                  <span className="text-white">{selectedDeposit?.email || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount:</span>
                  <span className="text-white">
                    {formatAmount(selectedDeposit.amount, selectedDeposit.currency)} {selectedDeposit.currency}
                  </span>
                </div>
                {selectedDeposit.approvedAmount && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Approved Amount:</span>
                    <span className="text-green-400">
                      {formatAmount(selectedDeposit.approvedAmount, selectedDeposit.currency)} {selectedDeposit.currency}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedDeposit.status)}
                    <span className={`px-2 py-1 text-xs border rounded ${getStatusColor(selectedDeposit.status)}`}>
                      {formatStatus(selectedDeposit.status)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Network:</span>
                  <span className="text-white">{selectedDeposit.network}</span>
                </div>
                {selectedDeposit.txHash && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Transaction Hash:</span>
                    <span 
                      className="text-blue-400 text-xs cursor-pointer hover:underline"
                      onClick={() => copyToClipboard(selectedDeposit.txHash)}
                    >
                      {selectedDeposit.txHash.slice(0, 20)}...
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">From Address:</span>
                  <span className="text-gray-300 text-xs">{selectedDeposit.fromAddress?.slice(0, 20)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">To Address:</span>
                  <span className="text-gray-300 text-xs">{selectedDeposit.toAddress?.slice(0, 20)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Date:</span>
                  <span className="text-white">{formatDate(selectedDeposit.createdAt)}</span>
                </div>
                {selectedDeposit.rejectReason && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Reject Reason:</span>
                    <span className="text-red-400 text-xs text-right">{selectedDeposit.rejectReason}</span>
                  </div>
                )}
                {selectedDeposit.approvalNote && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Approval Note:</span>
                    <span className="text-green-400 text-xs text-right">{selectedDeposit.approvalNote}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 pt-3 border-t border-gray-700">
                {selectedDeposit.txHash && (
                  <button
                    onClick={() => viewOnExplorer(selectedDeposit.txHash, selectedDeposit.network)}
                    className="w-full py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition text-sm"
                  >
                    View on Explorer
                  </button>
                )}
                
                {selectedDeposit.status === "pending" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(selectedDeposit)}
                      className="flex-1 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm font-medium"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(selectedDeposit)}
                      className="flex-1 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm font-medium"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>

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
      {showApproveModal && selectedDeposit && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg border border-gray-800 max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">Approve Deposit</h2>
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
                  <span className="text-white">{selectedDeposit.user?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Requested Amount:</span>
                  <span className="text-white">
                    {formatAmount(selectedDeposit.amount, selectedDeposit.currency)} {selectedDeposit.currency}
                  </span>
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
                    step="0.00000001"
                  />
                  <span className="text-gray-400 text-sm">{selectedDeposit.currency}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to approve full amount
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={submitApproval}
                  disabled={processingAction}
                  className="flex-1 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition font-medium disabled:opacity-50"
                >
                  {processingAction ? "Processing..." : "Confirm Approval"}
                </button>
                <button
                  onClick={() => setShowApproveModal(false)}
                  disabled={processingAction}
                  className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedDeposit && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg border border-gray-800 max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">Reject Deposit</h2>
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
                  <span className="text-white">{selectedDeposit.user?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount:</span>
                  <span className="text-white">
                    {formatAmount(selectedDeposit.amount, selectedDeposit.currency)} {selectedDeposit.currency}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Rejection Reason</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition h-20 resize-none"
                  placeholder="Enter reason for rejection..."
                  maxLength={500}
                />
                <div className="text-right text-xs text-gray-500 mt-1">
                  {rejectReason.length}/500 characters
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={submitRejection}
                  disabled={processingAction}
                  className="flex-1 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition font-medium disabled:opacity-50"
                >
                  {processingAction ? "Processing..." : "Confirm Rejection"}
                </button>
                <button
                  onClick={() => setShowRejectModal(false)}
                  disabled={processingAction}
                  className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition disabled:opacity-50"
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