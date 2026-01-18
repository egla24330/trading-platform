import React, { useState, useEffect } from "react";
import {
  Lock,
  Unlock,
  Trash2,
  Pencil,
  Search,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Loader2,
} from "lucide-react";
import axios from "axios";

import { useAuth } from "../../context/AuthContext.jsx";
import { assets } from "../../assets/assets";

export default function UsersManagement() {
  const { backendUrl, token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showBalanceEdit, setShowBalanceEdit] = useState(null);
  const [newBalance, setNewBalance] = useState("");
  const [balanceCurrency, setBalanceCurrency] = useState("usd");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({ totalUsers: 0 });
  const [actionLoading, setActionLoading] = useState({});
  const [error, setError] = useState(null);
  const usersPerPage = 10;

  // Create axios instance with auth header
  const api = axios.create({
    baseURL: backendUrl,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  // Fetch users from backend
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit: usersPerPage,
        search: searchTerm,
        sortBy: sortField,
        sortOrder: sortDirection
      };

      const response = await api.get('/api/users', { params });
      
      if (response.data.success) {
        setUsers(response.data.data || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
        setStats({
          totalUsers: response.data.pagination?.total || 0
        });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch user stats
  const fetchStats = async () => {
    try {
      const response = await api.get('/api/users/stats');
      if (response.data.success) {
        setStats(prev => ({ ...prev, ...response.data.data }));
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== '') {
        fetchUsers();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch on sort change
  useEffect(() => {
    fetchUsers();
  }, [sortField, sortDirection, currentPage]);

  // Initial fetch
  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, []);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const toggleBlockUser = async (userId) => {
    setActionLoading(prev => ({ ...prev, [userId]: true }));
    try {
      const response = await api.put(`/api/users/${userId}/toggle-block`);
      
      if (response.data.success) {
        setUsers(prevUsers =>
          prevUsers.map(user =>
            user._id === userId ? { ...user, isBlocked: !user.isBlocked } : user
          )
        );
      }
    } catch (error) {
      console.error('Error toggling block:', error);
      alert('Failed to update user status');
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
      setMobileMenuOpen(null);
    }
  };

  const toggleForceWin = async (userId) => {
    setActionLoading(prev => ({ ...prev, [userId]: true }));
    try {
      const response = await api.put(`/api/users/${userId}/toggle-force-win`);
      
      if (response.data.success) {
        setUsers(prevUsers =>
          prevUsers.map(user =>
            user._id === userId ? { ...user, forceWin: !user.forceWin } : user
          )
        );
      }
    } catch (error) {
      console.error('Error toggling force win:', error);
      alert('Failed to update force win');
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }

    setActionLoading(prev => ({ ...prev, [userId]: true }));
    try {
      const response = await api.delete(`/api/users/${userId}`);
      
      if (response.data.success) {
        setUsers(prevUsers => prevUsers.filter(user => user._id !== userId));
        setSelectedUsers(prev => prev.filter(id => id !== userId));
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
      setMobileMenuOpen(null);
    }
  };

  const handleBalanceEdit = (userId, currentBalance) => {
    setShowBalanceEdit(userId);
    setNewBalance(currentBalance.toString());
  };

  const saveBalance = async (userId) => {
    const balanceValue = parseFloat(newBalance);
    if (isNaN(balanceValue)) {
      alert('Please enter a valid number');
      return;
    }

    setActionLoading(prev => ({ ...prev, [userId]: true }));
    try {
      const response = await api.put(`/api/users/${userId}/balance`, {
        currency: balanceCurrency,
        amount: balanceValue,
        operation: 'set'
      });
      
      if (response.data.success) {
        setUsers(prevUsers =>
          prevUsers.map(user =>
            user._id === userId ? {
              ...user,
              balances: { ...user.balances, [balanceCurrency]: balanceValue }
            } : user
          )
        );
        setShowBalanceEdit(null);
        setNewBalance("");
      }
    } catch (error) {
      console.error('Error saving balance:', error);
      alert('Failed to update balance');
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
      setMobileMenuOpen(null);
    }
  };

  const toggleSelectUser = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    setSelectedUsers(
      selectedUsers.length === users.length
        ? []
        : users.map(user => user._id)
    );
  };

  const bulkDeleteUsers = async () => {
    if (selectedUsers.length === 0) return;
    
    if (!window.confirm(`Are you sure you want to delete ${selectedUsers.length} users?`)) {
      return;
    }

    setActionLoading(prev => ({ ...prev, bulkDelete: true }));
    try {
      const response = await api.delete('/api/users', {
        data: { userIds: selectedUsers }
      });
      
      if (response.data.success) {
        setUsers(prevUsers => prevUsers.filter(user => !selectedUsers.includes(user._id)));
        setSelectedUsers([]);
        alert(`${response.data.data?.deletedCount || selectedUsers.length} users deleted successfully`);
        // Refresh users list
        fetchUsers();
      }
    } catch (error) {
      console.error('Error bulk deleting users:', error);
      alert('Failed to delete users');
    } finally {
      setActionLoading(prev => ({ ...prev, bulkDelete: false }));
    }
  };

  const getCurrencyIcon = (currency) => {
    switch (currency.toLowerCase()) {
      case "btc":
        return <img src={assets.bitcoin} alt="BTC" className="w-5 h-5" />;
      case "eth":
        return <img src={assets.ethereum} alt="ETH" className="w-5 h-5" />;
      case "usdt":
      case "usd":
        return <img src={assets.tether} alt="USDT" className="w-5 h-5" />;
      default:
        return <img src={assets.tether} alt="Default" className="w-5 h-5" />;
    }
  };

  const formatBalance = (balance, currency) => {
    if (!balance && balance !== 0) return '$0';
    
    if (currency === 'usd') {
      return `$${parseFloat(balance).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`;
    } else if (currency === 'btc') {
      return `${parseFloat(balance).toFixed(3)} BTC`;
    } else if (currency === 'eth') {
      return `${parseFloat(balance).toFixed(2)} ETH`;
    }
    return balance;
  };

  const SortableHeader = ({ field, children, className = "" }) => (
    <button
      onClick={() => handleSort(field)}
      className={`flex items-center gap-1 hover:text-white transition ${className}`}
    >
      {children}
      {sortField === field && (
        sortDirection === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />
      )}
    </button>
  );

  const CurrencySelector = () => (
    <div className="flex sm:bg-gray-800 rounded-lg p-1">
      {[
        { key: 'usd', label: 'USD' },
        { key: 'btc', label: 'BTC' },
        { key: 'eth', label: 'ETH' }
      ].map((currency) => (
        <button
          key={currency.key}
          onClick={() => setBalanceCurrency(currency.key)}
          className={`flex items-center gap-1 px-2 py-1 rounded text-md transition ${
            balanceCurrency === currency.key
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          {getCurrencyIcon(currency.key)}
          <span className="sm:inline">{currency.label}</span>
        </button>
      ))}
    </div>
  );

  const loadMore = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="w-full p-4 lg:p-6 text-white flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-gray-400">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error && users.length === 0) {
    return (
      <div className="w-full p-4 lg:p-6 text-white flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <p className="text-red-400">{error}</p>
          <button
            onClick={fetchUsers}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 lg:p-6 text-white overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-semibold">Users Management</h1>
          <div className="text-sm text-gray-400 mt-1">
            Total: {stats.totalUsers} users | Showing: {users.length} users
          </div>
        </div>
        
        <CurrencySelector />
      </div>

      {/* Search and Actions Bar */}
      <div className="flex flex-col lg:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search by email or user ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-700 rounded-3xl text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition text-sm"
          />
        </div>
        
        <div className="flex gap-2">
          {selectedUsers.length > 0 && (
            <button 
              onClick={bulkDeleteUsers}
              disabled={actionLoading.bulkDelete}
              className="flex items-center gap-2 px-3 lg:px-4 py-3 bg-red-600 rounded-xl text-white hover:bg-red-700 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading.bulkDelete ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 size={16} />
              )}
              <span className="hidden sm:inline">Delete ({selectedUsers.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-800 border-b border-gray-700 text-sm font-medium text-gray-400">
          <div className="col-span-1 flex items-center">
            <input
              type="checkbox"
              checked={selectedUsers.length === users.length && users.length > 0}
              onChange={selectAllUsers}
              className="rounded border-gray-600 bg-gray-700"
            />
          </div>
          <div className="col-span-3">
            <SortableHeader field="email">User</SortableHeader>
          </div>
          <div className="col-span-1 text-center">Status</div>
          <div className="col-span-2 text-center">
            <SortableHeader field="balance">Balance</SortableHeader>
          </div>
          <div className="col-span-2 text-center">
            <SortableHeader field="createdAt">Join Date</SortableHeader>
          </div>
          <div className="col-span-2 text-center">Win/Loss</div>
          <div className="col-span-1 text-center">Actions</div>
        </div>

        {/* Desktop Users List */}
        <div className="divide-y divide-gray-800">
          {users.map((user) => (
            <div
              key={user._id}
              className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-850 transition"
            >
              {/* Checkbox */}
              <div className="col-span-1">
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(user._id)}
                  onChange={() => toggleSelectUser(user._id)}
                  className="rounded border-gray-600 bg-gray-700"
                />
              </div>

              {/* User Info */}
              <div className="col-span-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {user.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="font-medium text-sm truncate max-w-xs">{user.email || 'No email'}</p>
                    <p className="text-xs text-gray-400">
                      ID: {user.userId || user._id?.substring(18, 26)?.toUpperCase() || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="col-span-1 flex justify-center">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-lg ${
                    user.isBlocked
                      ? "bg-red-600/20 text-red-400 border border-red-600/30"
                      : "bg-green-600/20 text-green-400 border border-green-600/30"
                  }`}
                >
                  {user.isBlocked ? "BLOCKED" : "ACTIVE"}
                </span>
              </div>

              {/* Balance */}
              <div className="col-span-2 text-center">
                {showBalanceEdit === user._id ? (
                  <div className="flex items-center gap-2 justify-center">
                    <input
                      type="number"
                      value={newBalance}
                      onChange={(e) => setNewBalance(e.target.value)}
                      className="w-20 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                      step="0.000001"
                    />
                    <button
                      onClick={() => saveBalance(user._id)}
                      disabled={actionLoading[user._id]}
                      className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading[user._id] ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        'save'
                      )}
                    </button>
                  </div>
                ) : (
                  <div 
                    className="font-semibold text-blue-400 cursor-pointer hover:text-blue-300 transition flex items-center justify-center gap-1"
                    onClick={() => handleBalanceEdit(user._id, user.balances?.[balanceCurrency] || 0)}
                  >
                    {getCurrencyIcon(balanceCurrency)}
                    {formatBalance(user.balances?.[balanceCurrency] || 0, balanceCurrency)}
                  </div>
                )}
              </div>

              {/* Date */}
              <div className="col-span-2 text-center text-sm text-gray-400">
                {user.createdAt ? user.createdAt : 'N/A'}
              </div>

              {/* Win/Loss Switch */}
              <div className="col-span-2 flex items-center justify-center gap-2">
                <span className="text-gray-300 text-sm">Loss</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={user.forceWin || false}
                    onChange={() => toggleForceWin(user._id)}
                    disabled={actionLoading[user._id]}
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:bg-blue-600 transition"></div>
                  <span className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full peer-checked:translate-x-5 transition"></span>
                </label>
                <span className="text-gray-300 text-sm">Win</span>
              </div>

              {/* Actions */}
              <div className="col-span-1 flex items-center justify-center gap-1">
                <button
                  onClick={() => toggleBlockUser(user._id)}
                  disabled={actionLoading[user._id]}
                  className={`p-2 rounded-lg transition ${
                    user.isBlocked
                      ? "bg-blue-600/20 text-blue-400 hover:bg-blue-600/30"
                      : "bg-red-600/20 text-red-400 hover:bg-red-600/30"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  title={user.isBlocked ? "Unblock User" : "Block User"}
                >
                  {actionLoading[user._id] ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : user.isBlocked ? (
                    <Unlock size={14} />
                  ) : (
                    <Lock size={14} />
                  )}
                </button>

                <button
                  onClick={() => handleBalanceEdit(user._id, user.balances?.[balanceCurrency] || 0)}
                  disabled={actionLoading[user._id]}
                  className="p-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Edit Balance"
                >
                  <Pencil size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {users.map((user) => (
          <div
            key={user._id}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:bg-gray-850 transition"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(user._id)}
                  onChange={() => toggleSelectUser(user._id)}
                  className="rounded border-gray-600 bg-gray-700"
                />
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {user.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="font-medium text-sm truncate max-w-xs">{user.email || 'No email'}</p>
                  <p className="text-xs text-gray-400">
                    ID: {user.userId || user._id?.substring(18, 26)?.toUpperCase() || 'N/A'}
                  </p>
                </div>
              </div>
              
              {/* Mobile Menu */}
              <div className="relative">
                <button
                  onClick={() => setMobileMenuOpen(mobileMenuOpen === user._id ? null : user._id)}
                  className="p-1 rounded-lg hover:bg-gray-800 transition"
                  disabled={actionLoading[user._id]}
                >
                  <MoreVertical size={16} />
                </button>
                
                {mobileMenuOpen === user._id && (
                  <div className="absolute right-0 top-8 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 min-w-32">
                    <button
                      onClick={() => toggleBlockUser(user._id)}
                      disabled={actionLoading[user._id]}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading[user._id] ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : user.isBlocked ? (
                        <Unlock size={14} />
                      ) : (
                        <Lock size={14} />
                      )}
                      {user.isBlocked ? "Unblock" : "Block"}
                    </button>
                    <button
                      onClick={() => {
                        handleBalanceEdit(user._id, user.balances?.[balanceCurrency] || 0);
                        setMobileMenuOpen(null);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-700 transition"
                    >
                      <Pencil size={14} />
                      Edit Balance
                    </button>
                    <button
                      onClick={() => deleteUser(user._id)}
                      disabled={actionLoading[user._id]}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading[user._id] ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* User Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              {/* Status */}
              <div>
                <p className="text-gray-400 text-xs mb-1">Status</p>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-lg ${
                    user.isBlocked
                      ? "bg-red-600/20 text-red-400 border border-red-600/30"
                      : "bg-green-600/20 text-green-400 border border-green-600/30"
                  }`}
                >
                  {user.isBlocked ? "BLOCKED" : "ACTIVE"}
                </span>
              </div>

              {/* Balance */}
              <div>
                <p className="text-gray-400 text-xs mb-1">Balance</p>
                {showBalanceEdit === user._id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={newBalance}
                      onChange={(e) => setNewBalance(e.target.value)}
                      className="flex-1 px-2 py-1 w-20 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                      step="0.000001"
                    />
                    <button
                      onClick={() => saveBalance(user._id)}
                      disabled={actionLoading[user._id]}
                      className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading[user._id] ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        'Save'
                      )}
                    </button>
                  </div>
                ) : (
                  <div 
                    className="font-semibold text-blue-400 cursor-pointer hover:text-blue-300 transition flex items-center gap-1"
                    onClick={() => handleBalanceEdit(user._id, user.balances?.[balanceCurrency] || 0)}
                  >
                    {getCurrencyIcon(balanceCurrency)}
                    {formatBalance(user.balances?.[balanceCurrency] || 0, balanceCurrency)}
                  </div>
                )}
              </div>

              {/* Date */}
              <div>
                <p className="text-gray-400 text-xs mb-1">Join Date</p>
                <p className="text-sm">{user.createdAt || 'N/A'}</p>
              </div>

              {/* Win/Loss */}
              <div>
                <p className="text-gray-400 text-xs mb-1">Force Win</p>
                <div className="flex items-center gap-2">
                  <span className="text-gray-300 text-sm">Loss</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={user.forceWin || false}
                      onChange={() => toggleForceWin(user._id)}
                      disabled={actionLoading[user._id]}
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:bg-blue-600 transition"></div>
                    <span className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full peer-checked:translate-x-5 transition"></span>
                  </label>
                  <span className="text-gray-300 text-sm">Win</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      {users.length > 0 && currentPage < totalPages && (
        <div className="flex justify-center mt-6">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 transition font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </button>
        </div>
      )}

      {/* Empty State */}
      {users.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-2">No users found</p>
          <p className="text-sm">Try adjusting your search criteria</p>
        </div>
      )}

      {/* Error State */}
      {error && users.length > 0 && (
        <div className="mt-4 p-3 bg-red-600/20 border border-red-600/30 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
          <button
            onClick={fetchUsers}
            className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}