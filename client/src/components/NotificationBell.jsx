// components/NotificationBell.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Bell,
    Check,
    Trash2,
    X,
    ChevronRight,
    Settings,
    ExternalLink,
    Sparkles,
    Clock,
    AlertCircle,
    CheckCircle,
    Info,
    TrendingUp,
    CreditCard,
    Shield,
    Award,
    Zap,
    Filter,
    Loader2,
    RefreshCw,
    MessageSquare,
    DollarSign,
    TrendingDown,
    UserCheck,
    AlertTriangle,
    Circle,
    Mail,
    Lock,
    User
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from "react-toastify";


const NotificationBell = () => {
    const navigate = useNavigate();
    const { token, userData, isLogin,backendUrl } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [activeFilter, setActiveFilter] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const [notificationCounts, setNotificationCounts] = useState({
        all: 0,
        unread: 0,
        deposit: 0,
        withdrawal: 0,
        trade: 0,
        loan: 0,
        kyc: 0,
        system: 0,
        security: 0,
        account: 0,
        promotion: 0
    });
    const [isPolling, setIsPolling] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);
    const dropdownRef = useRef(null);
    const pollingRef = useRef(null);

    // For dark mode - you can integrate with your theme
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Check system dark mode preference
    useEffect(() => {
        const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        setIsDarkMode(darkModeMediaQuery.matches);

        const handleChange = (e) => setIsDarkMode(e.matches);
        darkModeMediaQuery.addEventListener('change', handleChange);

        return () => darkModeMediaQuery.removeEventListener('change', handleChange);
    }, []);

    // Fetch notifications
    const fetchNotifications = useCallback(async () => {
        if (!token || !isLogin) {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        try {
            setIsLoading(true);
            const response = await axios.get(`${backendUrl}api/notifications`, {
                params: {
                    limit: 15,
                    type: activeFilter === 'all' ? undefined : activeFilter,
                    status: activeFilter === 'unread' ? 'unread' : undefined
                },
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.success) {
                setNotifications(response.data.data || []);
                setUnreadCount(response.data.unreadCount || 0);
                if (response.data.counts) {
                    setNotificationCounts(response.data.counts);
                }
                setLastUpdated(new Date());
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
            // Show error toast
            if (error.response?.status !== 401) {
                toast.error('Failed to load notifications');
            }
            // Fallback to empty state
            setNotifications([]);
            setUnreadCount(0);
        } finally {
            setIsLoading(false);
            setIsPolling(false);
        }
    }, [token, isLogin, activeFilter]);

    // Initial fetch and setup polling
    useEffect(() => {
        if (!token || !isLogin) {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
            }
            return;
        }

        fetchNotifications();

        // Set up polling every 30 seconds
        if (!pollingRef.current) {
            pollingRef.current = setInterval(() => {
                if (document.visibilityState === 'visible') {
                    setIsPolling(true);
                    fetchNotifications();
                }
            }, 30000); // 30 seconds
        }

        // Listen to visibility change
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && token) {
                fetchNotifications();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
            }
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [token, isLogin, fetchNotifications]);

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
                setShowFilters(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle mark as read
    const handleMarkAsRead = async (id, e) => {
        e?.stopPropagation();
        try {
            const response = await axios.patch(`${backendUrl}api/notifications/${id}/read`, {}, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.success) {
                setNotifications(prev =>
                    prev.map(notif =>
                        notif._id === id ? { ...notif, status: 'read', readAt: new Date() } : notif
                    )
                );
                setUnreadCount(response.data.unreadCount || Math.max(0, unreadCount - 1));
                setNotificationCounts(prev => ({
                    ...prev,
                    unread: Math.max(0, prev.unread - 1)
                }));
            }
        } catch (error) {
            console.error('Error marking as read:', error);
            toast.error('Failed to mark as read');
        }
    };

    // Handle mark all as read
    const handleMarkAllAsRead = async () => {
        try {
            const response = await axios.patch(`${backendUrl}api/notifications/read-all`, {}, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.success) {
                setNotifications(prev =>
                    prev.map(notif => ({ ...notif, status: 'read', readAt: new Date() }))
                );
                setUnreadCount(0);
                setNotificationCounts(prev => ({
                    ...prev,
                    unread: 0
                }));
                toast.success('All notifications marked as read');
            }
        } catch (error) {
            console.error('Error marking all as read:', error);
            toast.error('Failed to mark all as read');
        }
    };

    // Handle delete notification
    const handleDelete = async (id, e) => {
        e?.stopPropagation();
        try {
            const response = await axios.delete(`${backendUrl}api/notifications/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log({response})

            if (response.data.success) {
                const deletedNotif = notifications.find(n => n._id === id);
                setNotifications(prev => prev.filter(notif => notif._id !== id));
                
                // Update counts
                if (deletedNotif?.status === 'unread') {
                    setUnreadCount(prev => Math.max(0, prev - 1));
                    setNotificationCounts(prev => ({
                        ...prev,
                        unread: Math.max(0, prev.unread - 1)
                    }));
                }
                toast.success('Notification deleted');
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
            toast.error('Failed to delete notification');
        }
    };

    // Handle notification click
    const handleNotificationClick = (notification) => {
        // Mark as read if unread
        if (notification.status === 'unread') {
            handleMarkAsRead(notification._id);
        }

        // Navigate based on notification type
        if (notification.actions?.[0]?.url) {
            navigate(notification.actions[0].url);
        } else {
            // Default navigation based on type
            const defaultRoutes = {
                deposit: '/dashboard/deposits',
                withdrawal: '/dashboard/withdrawals',
                loan: '/dashboard/loans',
                kyc: '/dashboard/kyc',
                trade: '/dashboard/trades',
                system: '/dashboard/notifications',
                promotion: '/dashboard/promotions',
                security: '/dashboard/security',
                account: '/dashboard/settings'
            };

            if (defaultRoutes[notification.type]) {
                navigate(defaultRoutes[notification.type]);
            }
        }
        
        setIsOpen(false);
    };

    // Get notification icon
    const getNotificationIcon = (type) => {
        const iconProps = { size: 20, className: "flex-shrink-0" };

        switch (type) {
            case 'deposit':
                return <DollarSign {...iconProps} className={`${iconProps.className} text-green-500`} />;
            case 'withdrawal':
                return <CreditCard {...iconProps} className={`${iconProps.className} text-blue-500`} />;
            case 'loan':
                return <TrendingUp {...iconProps} className={`${iconProps.className} text-purple-500`} />;
            case 'kyc':
                return <UserCheck {...iconProps} className={`${iconProps.className} text-yellow-500`} />;
            case 'trade':
                return <TrendingUp {...iconProps} className={`${iconProps.className} text-orange-500`} />;
            case 'system':
                return <Info {...iconProps} className={`${iconProps.className} text-gray-500`} />;
            case 'promotion':
                return <Award {...iconProps} className={`${iconProps.className} text-pink-500`} />;
            case 'security':
                return <Shield {...iconProps} className={`${iconProps.className} text-red-500`} />;
            case 'account':
                return <User {...iconProps} className={`${iconProps.className} text-teal-500`} />;
            default:
                return <Bell {...iconProps} className={`${iconProps.className} text-blue-500`} />;
        }
    };

    // Get color class based on notification color
    const getColorClass = (color) => {
        const colorClasses = {
            success: {
                bg: 'bg-green-100 dark:bg-green-900/20',
                text: 'text-green-800 dark:text-green-300',
                border: 'border-green-200 dark:border-green-800',
                icon: 'text-green-600 dark:text-green-400'
            },
            danger: {
                bg: 'bg-red-100 dark:bg-red-900/20',
                text: 'text-red-800 dark:text-red-300',
                border: 'border-red-200 dark:border-red-800',
                icon: 'text-red-600 dark:text-red-400'
            },
            warning: {
                bg: 'bg-yellow-100 dark:bg-yellow-900/20',
                text: 'text-yellow-800 dark:text-yellow-300',
                border: 'border-yellow-200 dark:border-yellow-800',
                icon: 'text-yellow-600 dark:text-yellow-400'
            },
            info: {
                bg: 'bg-blue-100 dark:bg-blue-900/20',
                text: 'text-blue-800 dark:text-blue-300',
                border: 'border-blue-200 dark:border-blue-800',
                icon: 'text-blue-600 dark:text-blue-400'
            }
        };

        return colorClasses[color] || colorClasses.info;
    };

    // Get time ago
    const getTimeAgo = (date) => {
        if (!date) return 'just now';
        
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);

        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
        if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d`;
        if (seconds < 31536000) return `${Math.floor(seconds / 2592000)}mo`;
        return `${Math.floor(seconds / 31536000)}y`;
    };

    // Get status indicator
    const getStatusIndicator = (status) => {
        if (status === 'unread') {
            return (
                <span className="absolute left-0 top-1/2 transform -translate-y-1/2 w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            );
        }
        return null;
    };

    // Filter notifications
    const filteredNotifications = notifications.filter(notif => {
        if (activeFilter === 'all') return true;
        if (activeFilter === 'unread') return notif.status === 'unread';
        return notif.type === activeFilter;
    });

    // Handle refresh
    const handleRefresh = () => {
        setIsPolling(true);
        fetchNotifications();
    };

    // Handle notification center click
    const handleNotificationCenterClick = () => {
        navigate('/dashboard/notifications');
        setIsOpen(false);
    };

    // Empty state component
    const renderEmptyState = () => (
        <div className={`p-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <Bell className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p className="font-medium mb-1">No notifications</p>
            <p className="text-sm">You're all caught up!</p>
            {lastUpdated && (
                <p className="text-xs mt-4 opacity-75">
                    Last updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
            )}
        </div>
    );

    // Loading state
    const renderLoadingState = () => (
        <div className="p-8 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-500" />
            <p className="mt-2 text-sm text-gray-500">Loading notifications...</p>
        </div>
    );

    // Not logged in state
    const renderNotLoggedIn = () => (
        <div className={`p-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <Lock className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p className="font-medium mb-1">Please log in</p>
            <p className="text-sm">Sign in to view notifications</p>
        </div>
    );

    // Filter types for dropdown
    const filterTypes = [
        { value: 'all', label: 'All', icon: Bell },
        { value: 'unread', label: 'Unread', icon: Circle },
        { value: 'deposit', label: 'Deposits', icon: DollarSign },
        { value: 'withdrawal', label: 'Withdrawals', icon: CreditCard },
        { value: 'trade', label: 'Trades', icon: TrendingUp },
        { value: 'loan', label: 'Loans', icon: TrendingUp },
        { value: 'kyc', label: 'KYC', icon: UserCheck }
    ];

    if (!isLogin) {
        return (
            <div className="relative">
                <button
                    onClick={() => toast('Please log in to view notifications')}
                    className={`
                        relative p-2 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
                        ${isDarkMode
                            ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }
                    `}
                    aria-label="Notifications"
                >
                    <Bell size={24} />
                </button>
            </div>
        );
    }

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Icon */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    relative p-2 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
                    ${isDarkMode
                        ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }
                `}
                aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
            >
                <div className="relative">
                    <Bell size={24} className={`transition-transform duration-200 ${isPolling ? 'animate-pulse' : ''}`} />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1">
                            <span className="relative flex h-5 w-5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                                <span className="relative inline-flex items-center justify-center rounded-full h-5 w-5 bg-red-600 text-white text-xs font-semibold shadow-lg">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            </span>
                        </span>
                    )}
                </div>
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className={`
                    fixed sm:absolute right-0 mt-2 w-screen sm:w-96 h-screen sm:h-auto sm:max-h-[600px]
                    bg-white dark:bg-gray-900 rounded-none sm:rounded-2xl shadow-2xl border dark:border-gray-800 z-50
                    top-0 sm:top-auto bottom-0 sm:bottom-auto
                    ${isDarkMode ? 'shadow-gray-900/50' : 'shadow-gray-200/50'}
                `}>
                    {/* Header */}
                    <div className={`
                        sticky top-0 p-4 border-b dark:border-gray-800
                        bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-900 dark:to-blue-800
                        z-10
                    `}>
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-xl text-white flex items-center gap-2">
                                    <Bell size={20} />
                                    Notifications
                                </h3>
                                <p className="text-blue-100 text-sm mt-1">
                                    {unreadCount} unread • {notifications.length} total
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleRefresh}
                                    disabled={isLoading}
                                    className={`
                                        p-2 rounded-lg transition-all disabled:opacity-50
                                        ${isDarkMode
                                            ? 'hover:bg-blue-800 text-blue-200'
                                            : 'hover:bg-blue-500 text-blue-100'
                                        }
                                    `}
                                    title="Refresh notifications"
                                >
                                    <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                                </button>
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`
                                        p-2 rounded-lg transition-all
                                        ${isDarkMode
                                            ? 'hover:bg-blue-800 text-blue-200'
                                            : 'hover:bg-blue-500 text-blue-100'
                                        }
                                    `}
                                    title="Filter notifications"
                                >
                                    <Filter size={18} />
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className={`
                                        p-2 rounded-lg transition-all
                                        ${isDarkMode
                                            ? 'hover:bg-blue-800 text-blue-200'
                                            : 'hover:bg-blue-500 text-blue-100'
                                        }
                                    `}
                                    title="Close"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        {unreadCount > 0 && (
                            <div className="flex items-center gap-3 mt-4">
                                <button
                                    onClick={handleMarkAllAsRead}
                                    disabled={isLoading}
                                    className={`
                                        flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all disabled:opacity-50
                                        bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white
                                        border border-white/30 flex items-center justify-center gap-2
                                    `}
                                >
                                    <Check size={16} />
                                    Mark all as read
                                </button>
                                <button
                                    onClick={handleNotificationCenterClick}
                                    className={`
                                        flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all
                                        bg-transparent hover:bg-white/10 text-white text-center
                                        border border-white/30
                                    `}
                                >
                                    View all
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Filters */}
                    {showFilters && (
                        <div className={`
                            px-4 py-3 border-b dark:border-gray-800
                            ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}
                        `}>
                            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                                {filterTypes.map(filter => (
                                    <button
                                        key={filter.value}
                                        onClick={() => setActiveFilter(filter.value)}
                                        className={`
                                            flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1
                                            ${activeFilter === filter.value
                                                ? 'bg-blue-600 text-white shadow-md'
                                                : isDarkMode
                                                    ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                                            }
                                        `}
                                    >
                                        <filter.icon size={14} />
                                        {filter.label}
                                        {notificationCounts[filter.value] > 0 && (
                                            <span className={`
                                                ml-1 px-1.5 py-0.5 rounded-full text-xs
                                                ${activeFilter === filter.value
                                                    ? 'bg-blue-700 text-blue-100'
                                                    : isDarkMode
                                                        ? 'bg-gray-700 text-gray-300'
                                                        : 'bg-gray-200 text-gray-600'
                                                }
                                            `}>
                                                {notificationCounts[filter.value]}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Notifications List */}
                    <div className="h-[calc(100vh-180px)] sm:h-[400px] overflow-y-auto notification-scrollbar">
                        {isLoading ? (
                            renderLoadingState()
                        ) : filteredNotifications.length === 0 ? (
                            renderEmptyState()
                        ) : (
                            <div className="divide-y dark:divide-gray-800">
                                {filteredNotifications.map((notification) => {
                                    const colorClass = getColorClass(notification.color || 'info');
                                    
                                    return (
                                        <div
                                            key={notification._id}
                                         //   onClick={() => handleNotificationClick(notification)}
                                            className={`
                                                group p-4 transition-all duration-200 cursor-pointer relative
                                                ${notification.status === 'unread'
                                                    ? isDarkMode
                                                        ? 'bg-blue-900/10 hover:bg-blue-900/20'
                                                        : 'bg-blue-50 hover:bg-blue-100'
                                                    : isDarkMode
                                                        ? 'hover:bg-gray-800/50'
                                                        : 'hover:bg-gray-50'
                                                }
                                            `}
                                        >
                                            {/* Status Indicator */}
                                            {getStatusIndicator(notification.status)}

                                            <div className="flex gap-3">
                                                {/* Icon */}
                                                <div className="relative pt-1">
                                                    {getNotificationIcon(notification.type)}
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start gap-2">
                                                        <h4 className={`
                                                            font-semibold truncate
                                                            ${notification.status === 'unread'
                                                                ? 'text-gray-900 dark:text-white'
                                                                : 'text-gray-700 dark:text-gray-300'
                                                            }
                                                        `}>
                                                            {notification.title}
                                                        </h4>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`
                                                                text-xs whitespace-nowrap flex items-center gap-1
                                                                ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}
                                                            `}>
                                                                <Clock size={12} />
                                                                {getTimeAgo(notification.createdAt)}
                                                            </span>
                                                            {notification.status === 'unread' && (
                                                                <button
                                                                    onClick={(e) => handleMarkAsRead(notification._id, e)}
                                                                    className={`
                                                                        opacity-0 group-hover:opacity-100 transition-opacity
                                                                        p-1 rounded hover:bg-white/10 dark:hover:bg-gray-700
                                                                        ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}
                                                                    `}
                                                                    title="Mark as read"
                                                                >
                                                                    <Check size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <p className={`
                                                        text-sm mt-1 line-clamp-2
                                                        ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}
                                                    `}>
                                                        {notification.message}
                                                    </p>

                                                    {/* Badge */}
                                                    {notification.badge && (
                                                        <span className={`
                                                            inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mt-2
                                                            ${colorClass.bg} ${colorClass.text} ${colorClass.border} border
                                                        `}>
                                                            {notification.color === 'success' && <TrendingUp size={12} />}
                                                            {notification.color === 'danger' && <AlertTriangle size={12} />}
                                                            {notification.color === 'warning' && <Info size={12} />}
                                                            {notification.badge}
                                                        </span>
                                                    )}

                                                    {/* Actions */}
                                                    {/* {notification.actions && notification.actions.length > 0 && (
                                                        <div className="flex items-center gap-2 mt-3">
                                                            {notification.actions.slice(0, 2).map((action, index) => (
                                                                <button
                                                                    key={index}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (action.url) {
                                                                            navigate(action.url);
                                                                            setIsOpen(false);
                                                                        }
                                                                    }}
                                                                    className={`
                                                                        inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg transition-all
                                                                        ${action.style === 'danger'
                                                                            ? 'bg-red-600 hover:bg-red-700 text-white'
                                                                            : action.style === 'success'
                                                                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                                                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                                                                        }
                                                                    `}
                                                                >
                                                                    {action.label}
                                                                    <ExternalLink size={12} />
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )} */}
                                                </div>

                                                {/* Delete Button */}
                                                <button
                                                    onClick={(e) => handleDelete(notification._id, e)}
                                                    className={`
                                                        opacity-0 group-hover:opacity-100 transition-opacity self-start
                                                        p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30
                                                        ${isDarkMode ? 'text-gray-500 hover:text-red-400' : 'text-gray-400 hover:text-red-600'}
                                                    `}
                                                    title="Delete notification"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className={`
                        sticky bottom-0 p-4 border-t dark:border-gray-800
                        ${isDarkMode ? 'bg-gray-800/90 backdrop-blur-sm' : 'bg-white/90 backdrop-blur-sm'}
                    `}>
                        <div className="flex items-center justify-between">
                            <button
                                onClick={handleNotificationCenterClick}
                                className={`
                                    inline-flex items-center gap-2 text-sm font-medium transition-all
                                    ${isDarkMode
                                        ? 'text-blue-400 hover:text-blue-300'
                                        : 'text-blue-600 hover:text-blue-800'
                                    }
                                `}
                            >
                                View notification center
                                <ChevronRight size={16} />
                            </button>
                            <div className="flex items-center gap-2">
                                {isPolling && (
                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                        <Loader2 size={12} className="animate-spin" />
                                        Updating...
                                    </span>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className={`
                                        text-sm px-3 py-1.5 rounded-lg font-medium transition-all
                                        ${isDarkMode
                                            ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                                        }
                                    `}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Overlay */}
            {isOpen && (
                <div className="sm:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" />
            )}
        </div>
    );
};

// Add custom scrollbar styles
const styles = `
    .notification-scrollbar::-webkit-scrollbar {
        width: 6px;
    }
    
    .notification-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }
    
    .notification-scrollbar::-webkit-scrollbar-thumb {
        background: #cbd5e0;
        border-radius: 3px;
    }
    
    .notification-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #a0aec0;
    }
    
    .dark .notification-scrollbar::-webkit-scrollbar-thumb {
        background: #4a5568;
    }
    
    .dark .notification-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #718096;
    }
    
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .animate-in {
        animation: fadeIn 0.2s ease-out;
    }
    
    .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
`;

// Add styles to document head
if (typeof document !== 'undefined') {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = styles;
    document.head.appendChild(styleElement);
}

export default NotificationBell;