// pages/AdminPanel.js
import React, { useState } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import AdminDashboard from '../components/AdminDashboard';
import UsersManagement from '../components/UsersManagement';
import KYCVerification from '../components/KYCVerification';
import TransactionsPanel from '../components/TransactionsPanel';
import DepositsPanel from '../components/DepositsPanel';
import WithdrawalsPanel from '../components/WithdrawalsPanel';
import AnalyticsPanel from '../components/AnalyticsPanel';
import PredictionsPanel from '../components/PredictionsPanel';
import SystemSettings from '../components/SystemSettings';
import LoansPanel from '../components/LoanPanel';
import AdminLoanPaymentReview from '../components/AdminLoanPaymentReview';
import NewsAdminPanel from '../components/NewsAdminPanel';

export default function AdminHome() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const renderAdminContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'users':
        return <UsersManagement />;
      case 'kyc':
        return <KYCVerification />;
      case 'transactions':
        return <TransactionsPanel />;
      case 'deposits':
        return <DepositsPanel />;
      case 'withdrawals':
        return <WithdrawalsPanel />;
      case 'analytics':
        return <AnalyticsPanel />;
      case 'predictions':
        return <PredictionsPanel />;
        case 'news':
        return <NewsAdminPanel/>;
        case 'AdminLoanPaymentReview':
        return <AdminLoanPaymentReview/>;
      case 'settings':
        return <SystemSettings />;
      case 'admin-profile':
        return <div className="p-6"><h1 className="text-2xl font-bold text-white">Admin Profile</h1></div>;
      case 'audit-logs':
        return <div className="p-6"><h1 className="text-2xl font-bold text-white">Audit Logs</h1></div>;
      case 'loans':
        return <LoansPanel/>;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-950 ">
    
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onToggleCollapse={setSidebarCollapsed}
      />
      
      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'md:ml-0' : ''} `}>
        {/* Mobile menu toggle button */}
        <div className="md:hidden p-4 border-b border-gray-800 bg-gray-950">
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
     
        
        {/* Content Area */}
        <div className="h-[calc(100vh-64px)] md:h-full overflow-auto hide-scrollbar">
          
          {
          renderAdminContent()
          }
        </div>
      </main>
    </div>
  );
}