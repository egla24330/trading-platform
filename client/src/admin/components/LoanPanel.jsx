import { useState, useEffect } from "react";
import { Search, ChevronDown, Calendar, Download, Eye, CheckCircle, Clock, XCircle, X, Check, X as XIcon, DollarSign, AlertCircle, BarChart3, RefreshCw, Filter } from "lucide-react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../../context/AuthContext";

// API configuration
//const API_BASE_URL = "http://localhost:3000/api"; // Change this to your backend URL

export default function LoansPanel() {
  const { backendUrl, token } = useAuth();
  const [status, setStatus] = useState("All Status");
  const [type, setType] = useState("All Types");
  const [openStatus, setOpenStatus] = useState(false);
  const [openType, setOpenType] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [approvedAmount, setApprovedAmount] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [repaymentPeriod, setRepaymentPeriod] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  const [showD,setShowD] = useState(false)

  // New state for backend integration
  const [loans, setLoans] = useState([]);
  const [filteredLoans, setFilteredLoans] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    active: 0,
    completed: 0,
    totalAmount: 0,
    defaulted: 0
  });
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLoans, setTotalLoans] = useState(0);
  const [processingAction, setProcessingAction] = useState(false);

  const statuses = ["All Status", "Pending", "Approved", "Active", "Rejected", "Completed", "Defaulted"];
  const types = ["All Types",];

  // Fetch loans from backend
  const fetchLoans = async () => {
    setLoading(true);
    try {
     // const token = localStorage.getItem("token"); // Assuming you store JWT token
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const params = {
        page,
        limit: 10,
        sortBy: "createdAt",
        sortOrder: "desc"
      };

      // Add filters if selected
      if (status !== "All Status") params.status = status.toLowerCase();
      if (type !== "All Types") params.type = type;
      if (searchTerm) params.search = searchTerm;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await axios.get(`${backendUrl}api/loans`, {
        ...config,
        params
      })

      setLoans(response.data.loans);
      console.log(response.data.loans)
      setFilteredLoans(response.data.loans); // For client-side filtering if needed
      setTotalPages(response.data.totalPages);
      setTotalLoans(response.data.total);

      // Calculate stats from fetched data
      calculateStats(response.data.loans);
    } catch (error) {
      console.error("Error fetching loans:", error);
      toast.error("Failed to load loans. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch dashboard stats
  const fetchDashboardStats = async () => {
    setLoadingStats(true);
    try {
    //  const token = localStorage.getItem("token");
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const response = await axios.get(`${backendUrl}api/loans/dashboard/stats`, config);

      setStats({
        total: response.data.stats.totalLoans || 0,
        pending: response.data.stats.pendingCount || 0,
        active: response.data.stats.activeCount || 0,
        completed: response.data.stats.completedCount || 0,
        totalAmount: response.data.stats.totalAmountApproved || 0,
        defaulted: response.data.stats.defaultedCount || 0
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      // Fallback to calculating from loans data
      calculateStats(loans);
    } finally {
      setLoadingStats(false);
    }
  };

  // Calculate stats from loans data
  const calculateStats = (loanData) => {
    const stats = {
      total: loanData.length,
      pending: loanData.filter(l => l.status === "pending").length,
      active: loanData.filter(l => l.status === "active").length,
      completed: loanData.filter(l => l.status === "completed").length,
      totalAmount: loanData
        .filter(l => l.status === "active" || l.status === "approved")
        .reduce((sum, l) => sum + (l.amountApproved || 0), 0),
      defaulted: loanData.filter(l => l.status === "defaulted").length
    };
    setStats(stats);
  };

  // Initial data fetch
  useEffect(() => {
    fetchLoans();
    fetchDashboardStats();
  }, [page, status, type, searchTerm, startDate, endDate]);

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-3 w-3 text-green-500" />;
      case "approved": return <CheckCircle className="h-3 w-3 text-blue-500" />;
      case "active": return <BarChart3 className="h-3 w-3 text-purple-500" />;
      case "pending": return <Clock className="h-3 w-3 text-yellow-500" />;
      case "rejected": return <XCircle className="h-3 w-3 text-red-500" />;
      case "defaulted": return <AlertCircle className="h-3 w-3 text-red-500" />;
      default: return <Clock className="h-3 w-3 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "approved": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "active": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "pending": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "rejected": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "defaulted": return "bg-red-500/20 text-red-400 border-red-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const formatStatus = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
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

  const handleViewDetails = (loan) => {
    setSelectedLoan(loan);
    setShowD(true)

  };

  const closeModal = () => {
    setSelectedLoan(null);
  };

  const handleApprove = (loan) => {
    setSelectedLoan(loan);
    setApprovedAmount(loan.amountRequested.toString());
    setInterestRate(loan.interestRate ? loan.interestRate.toString() : "12.5");
    setRepaymentPeriod(loan.repaymentPeriod ? loan.repaymentPeriod.toString() : "30");
    setShowApproveModal(true);
  };

  const handleReject = (loan) => {
    setSelectedLoan(loan);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const submitApproval = async () => {
    if (!selectedLoan || !approvedAmount || !interestRate || !repaymentPeriod) {
      toast.error("Please fill all required fields");
      return;
    }

    setProcessingAction(true);
    try {
     // const token = localStorage.getItem("token");
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const payload = {
        amountApproved: parseFloat(approvedAmount),
        interestRate: parseFloat(interestRate),
        repaymentPeriod: parseInt(repaymentPeriod),
      };

      await axios.put(`${backendUrl}api/loans/${selectedLoan._id}/approve`, payload, config);

      toast.success("Loan approved successfully!");
      setShowApproveModal(false);
      setApprovedAmount("");
      setInterestRate("");
      setRepaymentPeriod("");

      // Refresh data
      fetchLoans();
      fetchDashboardStats();
    } catch (error) {
      console.error("Error approving loan:", error);
      toast.error(error.response?.data?.message || "Failed to approve loan");
    } finally {
      setProcessingAction(false);
    }
  };

  const submitRejection = async () => {
    if (!selectedLoan || !rejectReason) {
      toast.error("Please provide a rejection reason");
      return;
    }

    setProcessingAction(true);
    try {
      //const token = localStorage.getItem("token");
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      await axios.put(`${backendUrl}api/loans/${selectedLoan._id}/reject`, { rejectReason }, config);

      toast.success("Loan rejected successfully!");
      setShowRejectModal(false);
      setRejectReason("");

      // Refresh data
      fetchLoans();
      fetchDashboardStats();
    } catch (error) {
      console.error("Error rejecting loan:", error);
      toast.error(error.response?.data?.message || "Failed to reject loan");
    } finally {
      setProcessingAction(false);
    }
  };

  const disburseLoan = async (loanId) => {
    try {
    //  const token = localStorage.getItem("token");
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      await axios.put(`${backendUrl}api/loans/${loanId}/disburse`, {}, config);

      toast.success("Loan disbursed successfully!");
      fetchLoans();
      fetchDashboardStats();
    } catch (error) {
      console.error("Error disbursing loan:", error);
      toast.error(error.response?.data?.message || "Failed to disburse loan");
    }
  };

  const clearDateFilter = () => {
    setStartDate("");
    setEndDate("");
  };

  const clearAllFilters = () => {
    setStatus("All Status");
    setType("All Types");
    setSearchTerm("");
    clearDateFilter();
    setPage(1);
  };

  const getActionButtons = (loan) => {
    switch (loan.status) {
      case "pending":
        return (
          <>
            <button
              onClick={() => handleApprove(loan)}
              disabled={processingAction}
              className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check size={12} />
              Approve
            </button>
            <button
              onClick={() => handleReject(loan)}
              disabled={processingAction}
              className="flex items-center gap-1 px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XIcon size={12} />
              Reject
            </button>
          </>
        );
      case "approved":
        return (
          <p></p>
         /* 

         <button
            onClick={() => disburseLoan(loan._id)}
            disabled={processingAction}
            className="flex items-center gap-1 px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition text-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <DollarSign size={12} />
            Disburse
          </button>
          */
        );
      default:
        return null;
    }
  };

  const handleExportReport = async () => {
    try {
     // const token = localStorage.getItem("token");
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob' // Important for file download
      };

      const params = {};
      if (status !== "All Status") params.status = status.toLowerCase();
      if (type !== "All Types") params.type = type;
      if (searchTerm) params.search = searchTerm;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await axios.get(`${backendUrl}api/loans/export`, {
        ...config,
        params
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `loans-report-${new Date().toISOString().split('T')[0]}.csv`);
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
    fetchLoans();
    fetchDashboardStats();
    toast.info("Data refreshed");
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl font-semibold mb-1">Loan Management</h1>
          <p className="text-gray-400 text-sm">Manage user loan applications and disbursements</p>
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
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
        {loadingStats ? (
          // Loading skeleton for stats
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-gray-900 rounded-lg p-3 border border-gray-800 animate-pulse">
              <div className="h-4 bg-gray-800 rounded mb-2"></div>
              <div className="h-6 bg-gray-800 rounded"></div>
            </div>
          ))
        ) : (
          <>
            <div className="bg-gray-900 rounded-lg p-3 border border-gray-800">
              <div className="text-gray-400 text-xs mb-1">Total Loans</div>
              <div className="text-xl font-semibold">{stats.total}</div>
            </div>
            <div className="bg-gray-900 rounded-lg p-3 border border-gray-800">
              <div className="text-gray-400 text-xs mb-1">Pending</div>
              <div className="text-xl font-semibold text-yellow-400">{stats.pending}</div>
            </div>
            <div className="bg-gray-900 rounded-lg p-3 border border-gray-800">
              <div className="text-gray-400 text-xs mb-1">Active</div>
              <div className="text-xl font-semibold text-purple-400">{stats.active}</div>
            </div>
            <div className="bg-gray-900 rounded-lg p-3 border border-gray-800">
              <div className="text-gray-400 text-xs mb-1">Completed</div>
              <div className="text-xl font-semibold text-green-400">{stats.completed}</div>
            </div>
            <div className="bg-gray-900 rounded-lg p-3 border border-gray-800">
              <div className="text-gray-400 text-xs mb-1">Total Amount</div>
              <div className="text-xl font-semibold text-blue-400">${stats.totalAmount.toLocaleString()}</div>
            </div>
            <div className="bg-gray-900 rounded-lg p-3 border border-gray-800">
              <div className="text-gray-400 text-xs mb-1">Defaulted</div>
              <div className="text-xl font-semibold text-red-400">{stats.defaulted}</div>
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
            placeholder="Search loans by ID, email, or user ID..."
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
            onClick={() => { setOpenStatus(!openStatus); setOpenType(false); setShowDatePicker(false); }}
            className="w-full bg-gray-900 rounded-lg px-3 py-2 text-left border border-gray-800 flex items-center justify-between text-sm hover:border-gray-600 transition"
          >
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-gray-400" />
              <span className="text-gray-300">{status}</span>
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
                  {getStatusIcon(s === "All Status" ? "pending" : s.toLowerCase())}
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Type Filter */}
        <div className="relative w-full lg:w-40">
          <button
            onClick={() => { setOpenType(!openType); setOpenStatus(false); setShowDatePicker(false); }}
            className="w-full bg-gray-900 rounded-lg px-3 py-2 text-left border border-gray-800 flex items-center justify-between text-sm hover:border-gray-600 transition"
          >
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-gray-400" />
              <span className="text-gray-300">{type}</span>
            </div>
            <ChevronDown size={16} className="text-gray-400" />
          </button>

          {openType && (
            <div className="absolute w-full bg-gray-900 border border-gray-800 rounded-lg mt-1 z-20 text-sm max-h-60 overflow-y-auto">
              {types.map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setType(t);
                    setOpenType(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-800 text-gray-300 transition"
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Date Picker */}
        <div className="relative w-full lg:w-48">
          <button
            onClick={() => { setShowDatePicker(!showDatePicker); setOpenStatus(false); setOpenType(false); }}
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
        {(status !== "All Status" || type !== "All Types" || searchTerm || startDate || endDate) && (
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
            "Loading loans..."
          ) : (
            `Showing ${loans.length} of ${totalLoans} loans`
          )}
        </div>
        <div className="text-gray-400 text-sm">
          {!loading && loans.length > 0 && (
            <span>Total: ${loans.reduce((sum, loan) => sum + loan.amountRequested, 0).toLocaleString()}</span>
          )}
        </div>
      </div>

      {/* Desktop Table */}
      {loading ? (
        // Loading skeleton
        <div className="hidden lg:block bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
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
                  <th className="p-3 text-left font-medium">Loan ID</th>
                  {/* <th className="p-3 text-left font-medium">User</th> */}
                  <th className="p-3 text-left font-medium">Amount</th>
                  <th className="p-3 text-left font-medium">Type</th>
                  <th className="p-3 text-left font-medium">Status</th>
                  <th className="p-3 text-left font-medium">Application Date</th>
                  <th className="p-3 text-left font-medium">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loans.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-gray-400">
                      No loans found
                    </td>
                  </tr>
                ) : (
                  loans.map((loan) => (
                    <tr key={loan._id} className="border-t border-gray-800 hover:bg-gray-850 transition">
                      <td className="p-3">
                        <div className="text-blue-400 font-mono text-xs">
                         {loan.loanId}
                        </div>
                        <div className="text-gray-500 text-xs">user id:{loan.userId || "N/A"}</div>
                      </td>
                      
                      <td className="p-3">
                        <div className="font-semibold text-green-400 text-sm">
                          ${loan.amountRequested?.toLocaleString() || "0"}
                        </div>
                        {loan.amountApproved > 0 && loan.status !== "rejected" && (
                          <div className="text-gray-400 text-xs">
                            Approved: ${loan.amountApproved.toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="text-white text-sm">{loan.packageTitle || "N/A"}</span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(loan.status)}
                          <span className={`px-2 py-1 text-xs border rounded ${getStatusColor(loan.status)}`}>
                            {formatStatus(loan.status)}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-gray-300 text-sm">{formatDate(loan.applicationDate)}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {/* <button
                            onClick={() => handleViewDetails(loan)}
                            className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-xs"
                          >
                            <Eye size={12} />
                            View
                          </button> */}

                          {getActionButtons(loan)}
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
            {loans.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No loans found
              </div>
            ) : (
              loans.map((loan) => (
                <div key={loan._id} className="bg-gray-900 rounded-lg p-3 border border-gray-800">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-blue-400 text-xs font-mono mb-1">{loan.loanId}</div>
                      <div className="text-white text-xs">user ID:{loan.userId || "N/A"}</div>
                     
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(loan.status)}
                      <span className={`px-2 py-1 text-xs border rounded ${getStatusColor(loan.status)}`}>
                        {formatStatus(loan.status)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                    <div>
                      <div className="text-gray-400 text-xs">Amount</div>
                      <div className="font-semibold text-green-400">
                        ${loan.amountRequested?.toLocaleString() || "0"}
                      </div>
                      {loan.amountApproved > 0 && loan.status !== "rejected" && (
                        <div className="text-gray-400 text-xs">
                          Approved: ${loan.amountApproved.toLocaleString()}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-gray-400 text-xs">Type</div>
                      <div className="text-white text-xs">{loan.packageTitle || "N/A"}</div>
                      <div className="text-gray-400 text-xs">{formatDate(loan.applicationDate).split(',')[0]}</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {/* <button
                      onClick={() => handleViewDetails(loan)}
                      className="flex-1 flex items-center justify-center gap-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm"
                    >
                      <Eye size={14} />
                      View Details
                    </button> */}

                    {getActionButtons(loan)}
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
      {!loading && loans.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <DollarSign className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <div className="text-sm mb-2">No loans found matching your filters</div>
          <button
            onClick={clearAllFilters}
            className="text-blue-400 hover:text-blue-300 text-sm transition"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Loan Details Modal */}
      {false && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg border border-gray-800 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <div>
                <h2 className="text-lg font-semibold text-white">Loan Details</h2>
                <p className="text-gray-400 text-xs mt-1">{selectedLoan.loanId}</p>
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
                  <span className="text-gray-400">User ID:</span>
                  <span className="text-gray-300 text-xs">{selectedLoan.userId || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Requested Amount:</span>
                  <span className="text-green-400 font-semibold">
                    ${selectedLoan.amountRequested?.toLocaleString() || "0"}
                  </span>
                </div>
                {selectedLoan.amountApproved > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Approved Amount:</span>
                    <span className="text-blue-400 font-semibold">
                      ${selectedLoan.amountApproved.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">Loan Type:</span>
                  <span className="text-white">{selectedLoan.packageTitle || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedLoan.status)}
                    <span className={`px-2 py-1 text-xs border rounded ${getStatusColor(selectedLoan.status)}`}>
                      {formatStatus(selectedLoan.status)}
                    </span>
                  </div>
                </div>
                
                {selectedLoan.interestRate && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Interest Rate:</span>
                    <span className="text-white">{selectedLoan.interestRate}%</span>
                  </div>
                )}
                {selectedLoan.repaymentPeriod && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Repayment Period:</span>
                    <span className="text-white">{selectedLoan.repaymentPeriod} days</span>
                  </div>
                )}
                {selectedLoan.rejectReason && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Reject Reason:</span>
                    <span className="text-red-400 text-xs text-right">{selectedLoan.rejectReason}</span>
                  </div>
                )}
            
                {selectedLoan.overdueAmount && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Overdue Amount:</span>
                    <span className="text-red-400">${selectedLoan.overdueAmount.toLocaleString()}</span>
                  </div>
                )}
                {selectedLoan.nextPaymentDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Next Payment:</span>
                    <span className="text-white">{formatDate(selectedLoan.nextPaymentDate)}</span>
                  </div>
                )}
                {selectedLoan.dueDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Due Date:</span>
                    <span className="text-white">{formatDate(selectedLoan.dueDate)}</span>
                  </div>
                )}
              </div>

              {selectedLoan.status === "pending" && (
                <div className="flex gap-2 pt-3 border-t border-gray-700">
                  <button
                    onClick={() => handleApprove(selectedLoan)}
                    className="flex-1 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm font-medium"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(selectedLoan)}
                    className="flex-1 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm font-medium"
                  >
                    Reject
                  </button>
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
      {showApproveModal  && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg border border-gray-800 max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">Approve Loan</h2>
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
                  <span className="text-gray-400">User ID:</span>
                  <span className="text-white">{selectedLoan.userId || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Requested Amount:</span>
                  <span className="text-white">${selectedLoan.amountRequested?.toLocaleString() || "0"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Credit Score:</span>
                  <span className="text-white">{selectedLoan.creditScore || "N/A"}</span>
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
                    min="0"
                    max={selectedLoan.amountRequested * 2}
                  />
                  <span className="text-gray-400 text-sm">{selectedLoan.currency || "USDT"}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Interest Rate %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition"
                    placeholder="Rate %"
                    min="0"
                    max="50"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Repayment Days</label>
                  <input
                    type="number"
                    value={repaymentPeriod}
                    onChange={(e) => setRepaymentPeriod(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition"
                    placeholder="Days"
                    min="1"
                    max="3650"
                  />
                </div>
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
      {showRejectModal  && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg border border-gray-800 max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">Reject Loan</h2>
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
                  <span className="text-gray-400">User ID:</span>
                  <span className="text-white">{selectedLoan.userId || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount:</span>
                  <span className="text-white">${selectedLoan.amountRequested?.toLocaleString() || "0"}</span>
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