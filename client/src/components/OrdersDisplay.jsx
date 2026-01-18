// src/components/OrdersDisplay.jsx
import React, { useState, useEffect } from 'react';
import { useOrders } from '../context/OrdersContext';
import { usePriceFeed } from '../context/PriceFeedContext';
import OrderTimer from './OrderTimer';
import { 
  Clock, 
  CheckCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Timer,
  ChevronRight,
  AlertCircle,
  Package,
  Filter,
  BarChart3,
  Target,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  RefreshCw
} from 'lucide-react';
import { assets } from '../assets/assets';
import { motion, AnimatePresence } from 'framer-motion';

const OrdersDisplay = () => {
  const { activeOrders, completedOrders, handleOrderComplete, stats, refreshOrders, isLoading } = useOrders();
  const { prices } = usePriceFeed();
  const [activeTab, setActiveTab] = useState('active');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getCurrentPrice = (coinId) => {
    return prices[coinId]?.usd || 0;
  };

  const formatNumber = (num) => {
    if (num === undefined || num === null) return '0.00';
    const number = typeof num === 'string' ? parseFloat(num) : num;
    return number.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const calculateLivePnl = (order) => {
    const currentPrice = getCurrentPrice(order.coinId);
    if (!currentPrice || !order.entryPrice) return { pnl: 0, percentage: 0 };
    
    let pnl = 0;
    let percentage = 0;
    
    // If user has force win, show positive P&L
    if (false) {
      percentage = Math.abs(order.expectedReturn / order.amount) * 100;
      pnl = order.expectedReturn;
    } else {
      // Normal calculation
      if (order.direction === 'buy') {
        const priceChange = ((currentPrice - order.entryPrice) / order.entryPrice) * 100;
        percentage = priceChange;
        pnl = (order.amount * percentage) / 100;
      } else {
        const priceChange = ((order.entryPrice - currentPrice) / order.entryPrice) * 100;
        percentage = priceChange;
        pnl = (order.amount * percentage) / 100;
      }
    }
    
    return { 
      pnl: parseFloat(pnl.toFixed(2)), 
      percentage: parseFloat(percentage.toFixed(2)) 
    };
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshOrders();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Format date for display
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="w-full">
      {/* Header with Stats and Refresh */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              Trading Dashboard
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
              {activeTab === 'active' 
                ? `Active trades: ${activeOrders.length}` 
                : `Completed trades: ${completedOrders.length}`}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-gray-600 dark:text-gray-400">Active:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{activeOrders.length}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-gray-600 dark:text-gray-400">Completed:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{completedOrders.length}</span>
              </div>
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Stats Cards - Mobile */}
        <div className="sm:hidden grid grid-cols-3 gap-2 mb-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-2 border border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">Active</div>
            <div className="text-sm font-bold text-gray-900 dark:text-white">{activeOrders.length}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-2 border border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">Completed</div>
            <div className="text-sm font-bold text-gray-900 dark:text-white">{completedOrders.length}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-2 border border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">Win Rate</div>
            {/* <div className="text-sm font-bold text-green-500">{stats.winRate?.toFixed(1) || '0'}%</div> */}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="relative mb-4 sm:mb-6">
        <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex items-center gap-2 px-4 py-3 font-medium whitespace-nowrap transition-all relative flex-shrink-0 ${
              activeTab === 'active'
                ? 'text-green-600 dark:text-green-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">Active</span>
            {activeOrders.length > 0 && (
              <span className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-medium px-2 py-0.5 rounded-full">
                {activeOrders.length}
              </span>
            )}
            {activeTab === 'active' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500"></div>
            )}
          </button>

          <button
            onClick={() => setActiveTab('completed')}
            className={`flex items-center gap-2 px-4 py-3 font-medium whitespace-nowrap transition-all relative flex-shrink-0 ${
              activeTab === 'completed'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Completed</span>
            {completedOrders.length > 0 && (
              <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium px-2 py-0.5 rounded-full">
                {completedOrders.length}
              </span>
            )}
            {activeTab === 'completed' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
            )}
          </button>
        </div>
      </div>

      {/* Orders Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          {activeTab === 'active' ? (
            activeOrders.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700"
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Package className="w-7 h-7 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  No Active Orders
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto px-4">
                  Place a trade to start your trading journey
                </p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {activeOrders.map((order) => {
                  const livePnl = calculateLivePnl(order);
                  const currentPrice = getCurrentPrice(order.coinId);
                  const isProfitable = livePnl.pnl > 0;
                  
                  return (
                    <motion.div
                      key={order._id || order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow duration-300"
                    >
                      {/* Mobile Layout */}
                      <div className="sm:hidden p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <img 
                              src={assets[order.coinId] || assets.bitcoin} 
                              alt={order.coinId}
                              className="w-10 h-10 rounded-lg"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-900 dark:text-white">{order.symbolName}</span>
                                <span className={`text-xs px-2 py-1 rounded ${order.direction === 'buy' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                                  {order.direction === 'buy' ? 'LONG' : 'SHORT'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                                <span>Entry: ${formatNumber(order.entryPrice)}</span>
                                <ChevronRight className="w-3 h-3" />
                                <span>Live: ${formatNumber(currentPrice)}</span>
                              </div>
                            </div>
                          </div>
                          <div className={`font-bold text-sm ${isProfitable ? 'text-green-500' : 'text-red-500'}`}>
                            {livePnl.pnl >= 0 ? '+' : ''}${formatNumber(livePnl.pnl)}
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">Amount</div>
                              <div className="font-bold text-gray-900 dark:text-white">${formatNumber(order.amount)}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">Duration</div>
                              <div className="font-bold text-blue-500 dark:text-blue-400">{order.duration}s</div>
                            </div>
                          </div>
                          
                          <div>
                            <OrderTimer
                              startTime={new Date(order.startTime)}
                              duration={order.duration}
                              orderId={order._id || order.id}
                              onComplete={handleOrderComplete}
                            />
                          </div>
                          
                          <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Expected Payout</div>
                                <div className="font-bold text-gray-900 dark:text-white">${formatNumber(order.totalPayout)}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-gray-500 dark:text-gray-400">Live P&L</div>
                                <div className={`font-bold ${isProfitable ? 'text-green-500' : 'text-red-500'}`}>
                                  {livePnl.percentage >= 0 ? '+' : ''}{formatNumber(livePnl.percentage)}%
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Desktop Layout */}
                      <div className="hidden sm:block p-4">
                        <div className="grid grid-cols-12 gap-4 items-center">
                          {/* Coin Info */}
                          <div className="col-span-4">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <img 
                                  src={assets[order.coinId] || assets.bitcoin} 
                                  alt={order.coinId}
                                  className="w-10 h-10 rounded-lg"
                                />
                                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center ${
                                  order.direction === 'buy' ? 'bg-green-500' : 'bg-red-500'
                                }`}>
                                  {order.direction === 'buy' ? 
                                    <TrendingUp className="w-2 h-2 text-white" /> : 
                                    <TrendingDown className="w-2 h-2 text-white" />
                                  }
                                </div>
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-bold text-gray-900 dark:text-white">{order.symbolName}</span>
                                  <span className={`text-xs px-2 py-1 rounded font-medium ${
                                    order.direction === 'buy' 
                                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                                      : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                  }`}>
                                    {order.direction === 'buy' ? 'LONG' : 'SHORT'}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  Entry: ${formatNumber(order.entryPrice)} • Live: ${formatNumber(currentPrice)}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Timer & Details */}
                          <div className="col-span-5">
                            <div className="mb-2">
                              <OrderTimer
                                startTime={new Date(order.startTime)}
                                duration={order.duration}
                                orderId={order._id || order.id}
                                onComplete={handleOrderComplete}
                              />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Amount</div>
                                <div className="font-bold text-sm text-gray-900 dark:text-white">${formatNumber(order.amount)}</div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Duration</div>
                                <div className="font-bold text-sm text-blue-500 dark:text-blue-400">{order.duration}s</div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Payout</div>
                                <div className="font-bold text-sm text-gray-900 dark:text-white">${formatNumber(order.totalPayout)}</div>
                              </div>
                            </div>
                          </div>

                          {/* P&L */}
                          <div className="col-span-3 text-right">
                            <div className={`text-lg font-bold ${isProfitable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {livePnl.pnl >= 0 ? '+' : ''}${formatNumber(livePnl.pnl)}
                            </div>
                            <div className={`text-sm ${isProfitable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {livePnl.percentage >= 0 ? '+' : ''}{formatNumber(livePnl.percentage)}%
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {order.leverage}x leverage
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )
          ) : (
            // Completed Orders
            completedOrders.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700"
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  No Completed Orders
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto px-4">
                  Completed trades will appear here
                </p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {completedOrders.slice(0, 10).map((order) => {
                  const isProfitable = order.profit > 0;
                  
                  return (
                    <motion.div
                      key={order._id || order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow duration-300"
                    >
                      {/* Mobile Layout */}
                      <div className="sm:hidden p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <img 
                              src={assets[order.coinId] || assets.bitcoin} 
                              alt={order.coinId}
                              className="w-10 h-10 rounded-lg"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-900 dark:text-white">{order.symbolName}</span>
                                <span className={`text-xs px-2 py-1 rounded ${order.direction === 'buy' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                                  {order.direction === 'buy' ? 'LONG' : 'SHORT'}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                ${formatNumber(order.entryPrice)} → ${formatNumber(order.finalPrice)}
                              </div>
                            </div>
                          </div>
                          <div className={`font-bold text-sm ${isProfitable ? 'text-green-500' : 'text-red-500'}`}>
                            {order.profit >= 0 ? '+' : ''}${formatNumber(order.profit)}
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">Amount</div>
                              <div className="font-bold text-gray-900 dark:text-white">${formatNumber(order.amount)}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">Duration</div>
                              <div className="font-bold text-blue-500 dark:text-blue-400">{order.duration}s</div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">Final Payout</div>
                              <div className="font-bold text-gray-900 dark:text-white">
                                ${formatNumber(order.actualPayout || order.totalPayout)}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">Completed</div>
                              <div className="font-bold text-gray-900 dark:text-white">
                                {formatTime(order.completedAt || order.updatedAt)}
                              </div>
                            </div>
                          </div>
                          
                          <div className={`p-3 rounded-lg ${isProfitable ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Result</div>
                            <div className="flex items-center justify-between">
                              <div className={`font-bold ${isProfitable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {isProfitable ? 'Profit' : 'Loss'}
                              </div>
                              <div className={`font-bold ${isProfitable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {order.profitPercentage >= 0 ? '+' : ''}{formatNumber(order.profitPercentage)}%
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Desktop Layout */}
                      <div className="hidden sm:block p-4">
                        <div className="grid grid-cols-12 gap-4 items-center">
                          {/* Coin Info */}
                          <div className="col-span-3">
                            <div className="flex items-center gap-3">
                              <img 
                                src={assets[order.coinId] || assets.bitcoin} 
                                alt={order.coinId}
                                className="w-10 h-10 rounded-lg"
                              />
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-bold text-gray-900 dark:text-white">{order.symbolName}</span>
                                  <span className={`text-xs px-2 py-1 rounded font-medium ${
                                    order.direction === 'buy' 
                                      ? isProfitable ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                      : isProfitable ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                  }`}>
                                    {order.direction === 'buy' ? 'LONG' : 'SHORT'}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  ${formatNumber(order.entryPrice)} → ${formatNumber(order.finalPrice)}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Trade Details */}
                          <div className="col-span-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Amount</div>
                                <div className="font-bold text-sm text-gray-900 dark:text-white">${formatNumber(order.amount)}</div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Duration</div>
                                <div className="font-bold text-sm text-blue-500 dark:text-blue-400">{order.duration}s</div>
                              </div>
                            </div>
                          </div>

                          {/* Result */}
                          <div className="col-span-4">
                            <div className={`p-3 rounded-lg ${isProfitable ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-xs font-medium text-gray-900 dark:text-white">Trade Result</div>
                                <div className={`text-xs px-2 py-1 rounded font-medium ${
                                  isProfitable ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                }`}>
                                  {isProfitable ? 'PROFIT' : 'LOSS'}
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">Amount</div>
                                  <div className={`text-sm font-bold ${isProfitable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {order.profit >= 0 ? '+' : ''}${formatNumber(order.profit)}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">Percentage</div>
                                  <div className={`text-sm font-bold ${isProfitable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {order.profitPercentage >= 0 ? '+' : ''}{formatNumber(order.profitPercentage)}%
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Payout & Time */}
                          <div className="col-span-2">
                            <div className="text-right">
                              <div className="text-xs text-gray-500 dark:text-gray-400">Final Payout</div>
                              <div className="font-bold text-lg text-gray-900 dark:text-white">
                                ${formatNumber(order.actualPayout || order.totalPayout)}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {formatTime(order.completedAt || order.updatedAt)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default OrdersDisplay;