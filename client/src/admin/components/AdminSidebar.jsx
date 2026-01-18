import React, { useState } from 'react';
import {
  Home,
  Users,
  ShieldCheck,
  Repeat,
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart3,
  LineChart,
  Settings,
  LogOut,
  X,
  Bookmark,
  UserCog,
  ChevronLeft,
  ChevronRight,
  PiggyBank,
  CircleDollarSign,
  Newspaper

} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminSidebar({ activeTab, setActiveTab, mobileMenuOpen, setMobileMenuOpen }) {
  const { AuserData, Alogout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const adminNavItems = [
    { tab: 'dashboard', icon: Home, label: 'Dashboard' },
    { tab: 'news', icon: Newspaper, label: 'News Management' },
    { tab: 'users', icon: Users, label: 'Users Management' },
    { tab: 'kyc', icon: ShieldCheck, label: 'KYC Verification' },
    { tab: 'transactions', icon: Repeat, label: 'Transactions' },
    { tab: 'deposits', icon: ArrowDownCircle, label: 'Deposits' },
    { tab: 'withdrawals', icon: ArrowUpCircle, label: 'Withdrawals' },
   // { tab: 'analytics', icon: BarChart3, label: 'Analytics' },
    //{ tab: 'predictions', icon: LineChart, label: 'Predictions' },
    { tab: 'loans', icon: PiggyBank, label: 'Loans' },
    {tab:'AdminLoanPaymentReview', icon:CircleDollarSign , label: 'Loan Payment Reviews' },
    { tab: 'settings', icon: Settings, label: 'System Settings' },
    
  ];

  const adminToolsItems = [
    //{ icon: UserCog, label: 'Admin Profile', tab: 'admin-profile' },
    //{ icon: Bookmark, label: 'Audit Logs', tab: 'audit-logs' },
  ];

  const handleLogout = () => {
    Alogout();
  };

  const handleNavigation = (tab) => {
    setActiveTab(tab);
    // Close mobile menu only on mobile screens
    if (window.innerWidth < 768) {
      setMobileMenuOpen(false);
    }
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Close sidebar when clicking outside on mobile
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };

    const handleClickOutside = (event) => {
      if (mobileMenuOpen && window.innerWidth < 768 && !isCollapsed) {
        const sidebar = document.querySelector('.admin-sidebar');
        if (sidebar && !sidebar.contains(event.target)) {
          setMobileMenuOpen(false);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileMenuOpen, isCollapsed]);

  return (
    <div
      className={`admin-sidebar max-h-[100vh] overflow-scroll hide-scrollbar fixed md:static inset-y-0 left-0 z-30 bg-gradient-to-b from-gray-900 to-gray-900 border-r border-gray-800 p-4 flex flex-col transform transition-all duration-300 ease-in-out ${mobileMenuOpen ? 'translate-x-0 shadow-2xl w-64' : '-translate-x-full md:translate-x-0'
        } ${isCollapsed ? 'w-20' : 'w-64'
        }`}
    >
      {/* Mobile close button - only show on mobile */}
      <button
        onClick={() => setMobileMenuOpen(false)}
        className="md:hidden absolute top-4 right-4 p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition"
        aria-label="Close menu"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Header with toggle button */}
      <div className={`flex items-center justify-between mb-6 px-2 ${isCollapsed ? 'flex-col gap-2' : ''}`}>
        {!isCollapsed && (
          <div>
            <div className="text-lg font-bold text-white">Admin Panel</div>
            <div className="text-xs text-blue-400 font-medium bg-blue-500/10 px-2 py-1 rounded-full inline-block mt-1">
              System Admin
            </div>
          </div>
        )}

        {/* Toggle button - visible on desktop */}
        <button
          onClick={toggleSidebar}
          className="hidden md:flex p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="space-y-1 flex flex-col flex-1">
        {adminNavItems.map(({ tab, icon: Icon, label }) => (
          <button
            key={tab}
            onClick={() => handleNavigation(tab)}
            className={`flex items-center gap-3 w-full text-left rounded-lg transition-all group relative ${isCollapsed ? 'px-2 py-3 justify-center' : 'px-3 py-2.5'
              } ${activeTab === tab
                ? 'bg-gradient-to-r from-blue-600/30 to-blue-600/30 text-white '
                : 'text-gray-300 hover:bg-gray-800/60 hover:text-white'
              }`}
          >
            <div
              className={`transition-all ${activeTab === tab
                  ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white'
                  : 'bg-gray-800 text-gray-400 group-hover:bg-gray-700 group-hover:text-white'
                } ${isCollapsed ? 'p-2 rounded-lg' : 'p-1.5 rounded-lg'
                }`}
            >
              <Icon className="h-4 w-4" />
            </div>

            {!isCollapsed && (
              <>
                <span className="font-medium text-sm flex-1 text-left">{label}</span>
                {/* Active indicator */}
                {activeTab === tab && (
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                )}
              </>
            )}

            {/* Tooltip for collapsed state */}
            {isCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap pointer-events-none">
                {label}
              </div>
            )}
          </button>
        ))}
      </nav>

      {/* Admin Tools Section */}
      {!isCollapsed && (
        <div className="mt-4 pt-4 border-t border-gray-800">
          {/* <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
            Admin Tools
          </h3> */}
          <div className="space-y-1">
            {adminToolsItems.map(({ icon: Icon, label, tab }) => (
              <button
                key={tab}
                onClick={() => handleNavigation(tab)}
                className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg transition-all text-xs ${activeTab === tab
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'text-gray-400 hover:text-blue-400 hover:bg-gray-800/40'
                  }`}
              >
                <div className={`p-1 rounded-lg ${activeTab === tab
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-800 text-gray-500'
                  }`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Admin Tools Section - Collapsed */}
       {isCollapsed && (
        <div className="mt-4 pt-4 border-t border-gray-800">
          <div className="space-y-1">
            {adminToolsItems.map(({ icon: Icon, label, tab }) => (
              <button
                key={tab}
                onClick={() => handleNavigation(tab)}
                className={`flex items-center justify-center w-full p-2 rounded-lg transition-all group relative ${activeTab === tab
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'text-gray-400 hover:text-blue-400 hover:bg-gray-800/40'
                  }`}
              >
                <div className={`p-1 rounded-lg ${activeTab === tab
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-800 text-gray-500'
                  }`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>

                {/* Tooltip for collapsed state */}
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap pointer-events-none">
                  {label}
                </div>
              </button>
            ))}
          </div>
        </div>
      )} 

      {/* Logout Section */}
      {/* <div className="mt-auto pt-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition w-full rounded-lg group ${isCollapsed ? 'px-2 py-3 justify-center' : 'px-3 py-2.5'
            }`}
        >
          <div className="p-1.5 rounded-lg bg-gray-800 text-gray-500 group-hover:bg-red-500/20 group-hover:text-red-400 transition">
            <LogOut className="h-4 w-4" />
          </div>
          {!isCollapsed && <span className="font-medium">Log Out</span>}

          {
          // Tooltip for collapsed state
           }
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap pointer-events-none">
              Log Out
            </div>
          )}
        </button>
      </div> */}
    </div>
  );
}