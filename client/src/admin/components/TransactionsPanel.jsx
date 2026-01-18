import { useState } from "react";
import { 
  Search, 
  ChevronDown, 
  Calendar,
  Download,
  Eye,
  MoreVertical,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  Copy
} from "lucide-react";

export default function TransactionsPanel() {
  const [type, setType] = useState("All Types");
  const [status, setStatus] = useState("All Status");
  const [openType, setOpenType] = useState(false);
  const [openStatus, setOpenStatus] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [actionMenu, setActionMenu] = useState(null);

  const types = ["All Types", "Deposit", "Withdrawal", "Trade"];
  const statuses = ["All Status", "Completed", "Pending", "Failed"];

  const transactions = [
    {
      id: "TX001",
      transactionId: "TXID123456789",
      user: { email: "john.doe@example.com", userId: "USR001" },
      type: "Deposit",
      amount: 120,
      currency: "USDT",
      status: "Completed",
      date: "12/10/2025, 14:33",
      fee: 0.5,
      network: "TRC20",
      hash: "0x1234567890abcdef1234567890abcdef1234567890abcdef",
      fromAddress: "TXYZ123456789",
      toAddress: "TABC456789012"
    },
    {
      id: "TX002",
      transactionId: "TXID987654321",
      user: { email: "jane.smith@example.com", userId: "USR002" },
      type: "Withdrawal",
      amount: 75.5,
      currency: "BTC",
      status: "Pending",
      date: "12/10/2025, 12:15",
      fee: 0.001,
      network: "Bitcoin",
      hash: "0xfedcba0987654321fedcba0987654321fedcba0987654321",
      fromAddress: "BC1XYZ789012",
      toAddress: "BC1ABC345678"
    },
    {
      id: "TX003",
      transactionId: "TXID456789123",
      user: { email: "mike.wilson@example.com", userId: "USR003" },
      type: "Trade",
      amount: -500,
      currency: "USDT",
      status: "Completed",
      date: "12/10/2025, 10:45",
      fee: 2.5,
      pair: "BTC/USDT",
      price: 51234.56
    },
    {
      id: "TX004",
      transactionId: "TXID789123456",
      user: { email: "sarah.jones@example.com", userId: "USR004" },
      type: "Deposit",
      amount: 2500,
      currency: "USDT",
      status: "Failed",
      date: "11/10/2025, 16:20",
      fee: 1.25,
      network: "ERC20",
      hash: "0x9876543210fedcba9876543210fedcba9876543210fedcba",
      error: "Insufficient gas"
    }
  ];

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = type === "All Types" || transaction.type === type;
    const matchesStatus = status === "All Status" || transaction.status === status;
    
    const transactionDate = new Date(transaction.date.split(',')[0].split('/').reverse().join('-'));
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    const matchesDate = (!start || transactionDate >= start) && (!end || transactionDate <= end);
    
    return matchesSearch && matchesType && matchesStatus && matchesDate;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case "Completed": return <CheckCircle className="h-3 w-3 text-green-500" />;
      case "Pending": return <Clock className="h-3 w-3 text-yellow-500" />;
      case "Failed": return <AlertCircle className="h-3 w-3 text-red-500" />;
      default: return <Clock className="h-3 w-3 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "Pending": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "Failed": return "bg-red-500/20 text-red-400 border-red-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getAmountColor = (type, amount) => {
    if (type === "Withdrawal") return "text-red-400";
    return amount >= 0 ? "text-green-400" : "text-red-400";
  };

  const getAmountSign = (type, amount) => {
    if (type === "Trade") return amount >= 0 ? "+" : "";
    return type === "Withdrawal" ? "-" : "+";
  };

  const handleViewDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setActionMenu(null);
  };

  const closeModal = () => {
    setSelectedTransaction(null);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
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
      default:
        explorerUrl = `https://blockchain.com/explorer/transactions/${hash}`;
    }
    window.open(explorerUrl, '_blank');
  };

  const clearDateFilter = () => {
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl font-semibold mb-1">Transactions</h1>
          <p className="text-gray-400 text-sm">Manage platform transactions</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => console.log("Refresh")}
            className="flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition text-sm"
          >
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
          
        
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3 mb-6 sm:items-cente">
        {/* Search */}
        <div className="flex-1 bg-gray-950 rounded-3xl flex items-center px-3 border border-gray-700 ">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent outline-none p-3 text-sm"
          />
        </div>

        {/* Type Filter */}
        <div className="relative w-full lg:w-40">
          <button
            onClick={() => { setOpenType(!openType); setOpenStatus(false); setShowDatePicker(false); }}
            className="w-full bg-gray-900 rounded-lg px-3 py-2 text-left border border-gray-800 flex items-center justify-between text-sm hover:border-gray-600 transition"
          >
            <span className="text-gray-300">{type}</span>
            <ChevronDown size={16} className="text-gray-400" />
          </button>

          {openType && (
            <div className="absolute w-full bg-gray-900 border border-gray-800 rounded-lg mt-1 z-20 text-sm">
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

        {/* Status Filter */}
        <div className="relative w-full lg:w-40">
          <button
            onClick={() => { setOpenStatus(!openStatus); setOpenType(false); setShowDatePicker(false); }}
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

        {/* Date Picker */}
        <div className="relative w-full lg:w-48">
          <button
            onClick={() => { setShowDatePicker(!showDatePicker); setOpenType(false); setOpenStatus(false); }}
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

      {/* Desktop Table */}
      <div className="hidden lg:block bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 text-gray-400">
            <tr>
              <th className="p-3 text-left font-medium">Transaction ID</th>
              <th className="p-3 text-left font-medium">User</th>
              <th className="p-3 text-left font-medium">Type</th>
              <th className="p-3 text-left font-medium">Amount</th>
              <th className="p-3 text-left font-medium">Status</th>
              <th className="p-3 text-left font-medium">Date</th>
              <th className="p-3 text-left font-medium">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredTransactions.map((transaction) => (
              <tr key={transaction.id} className="border-t border-gray-800 hover:bg-gray-850 transition">
                <td className="p-3">
                  <div className="text-blue-400 font-mono text-xs">
                    {transaction.transactionId}
                  </div>
                </td>
                <td className="p-3">
                  <div>
                    <div className="text-white text-sm">{transaction.user.email}</div>
                    <div className="text-gray-400 text-xs">{transaction.user.userId}</div>
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    {transaction.type === "Deposit" && <ArrowDown className="h-3 w-3 text-green-400" />}
                    {transaction.type === "Withdrawal" && <ArrowUp className="h-3 w-3 text-red-400" />}
                    <span className="text-white text-sm">{transaction.type}</span>
                  </div>
                </td>
                <td className="p-3">
                  <div className={`font-semibold text-sm ${getAmountColor(transaction.type, transaction.amount)}`}>
                    {getAmountSign(transaction.type, transaction.amount)}
                    {Math.abs(transaction.amount)} {transaction.currency}
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(transaction.status)}
                    <span className={`px-2 py-1 text-xs border rounded ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </div>
                </td>
                <td className="p-3 text-gray-300 text-sm">{transaction.date}</td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewDetails(transaction)}
                      className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-xs"
                    >
                      <Eye size={12} />
                      View
                    </button>
                    
                    <div className="relative">
                      <button
                        onClick={() => setActionMenu(actionMenu === transaction.id ? null : transaction.id)}
                        className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition"
                      >
                        <MoreVertical size={12} />
                      </button>

                      {actionMenu === transaction.id && (
                        <div className="absolute right-0 top-6 bg-gray-800 border border-gray-700 rounded shadow z-10 min-w-28">
                          <button
                            onClick={() => handleViewDetails(transaction)}
                            className="flex items-center gap-1 w-full px-2 py-1 text-xs hover:bg-gray-700 transition text-left"
                          >
                            <Eye size={12} />
                            Details
                          </button>
                          
                          {transaction.hash && (
                            <button
                              onClick={() => viewOnExplorer(transaction.hash, transaction.network)}
                              className="flex items-center gap-1 w-full px-2 py-1 text-xs hover:bg-gray-700 transition text-left"
                            >
                              <ExternalLink size={12} />
                              Explorer
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {filteredTransactions.map((transaction) => (
          <div key={transaction.id} className="bg-gray-900 rounded-lg p-3 border border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-blue-400 text-xs font-mono mb-1">{transaction.transactionId}</div>
                <div className="text-white text-sm">{transaction.user.email}</div>
              </div>
              <div className="flex items-center gap-2">
                {transaction.type === "Deposit" && <ArrowDown className="h-3 w-3 text-green-400" />}
                {transaction.type === "Withdrawal" && <ArrowUp className="h-3 w-3 text-red-400" />}
                <span className={`px-2 py-1 text-xs border rounded ${getStatusColor(transaction.status)}`}>
                  {transaction.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
              <div>
                <div className="text-gray-400 text-xs">Amount</div>
                <div className={`font-semibold ${getAmountColor(transaction.type, transaction.amount)}`}>
                  {getAmountSign(transaction.type, transaction.amount)}
                  {Math.abs(transaction.amount)} {transaction.currency}
                </div>
              </div>
              <div>
                <div className="text-gray-400 text-xs">Date</div>
                <div className="text-white text-xs">{transaction.date.split(',')[0]}</div>
              </div>
            </div>

            <button
              onClick={() => handleViewDetails(transaction)}
              className="w-full flex items-center justify-center gap-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm"
            >
              <Eye size={14} />
              View Details
            </button>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredTransactions.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <div className="text-sm">No transactions found</div>
        </div>
      )}

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg border border-gray-800 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <div>
                <h2 className="text-lg font-semibold text-white">Transaction Details</h2>
                <p className="text-gray-400 text-xs mt-1">{selectedTransaction.transactionId}</p>
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
                  <span className="text-gray-400">Type:</span>
                  <span className="text-white">{selectedTransaction.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount:</span>
                  <span className={`font-semibold ${getAmountColor(selectedTransaction.type, selectedTransaction.amount)}`}>
                    {getAmountSign(selectedTransaction.type, selectedTransaction.amount)}
                    {Math.abs(selectedTransaction.amount)} {selectedTransaction.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedTransaction.status)}
                    <span className={`px-2 py-1 text-xs border rounded ${getStatusColor(selectedTransaction.status)}`}>
                      {selectedTransaction.status}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Date:</span>
                  <span className="text-white">{selectedTransaction.date}</span>
                </div>
                {selectedTransaction.fee && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Fee:</span>
                    <span className="text-white">{selectedTransaction.fee} {selectedTransaction.currency}</span>
                  </div>
                )}
                {selectedTransaction.hash && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Hash:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-blue-400 text-xs truncate max-w-[100px]">
                        {selectedTransaction.hash}
                      </span>
                      <button
                        onClick={() => copyToClipboard(selectedTransaction.hash)}
                        className="p-1 text-gray-400 hover:text-white transition"
                      >
                        <Copy size={12} />
                      </button>
                    </div>
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
    </div>
  );
}