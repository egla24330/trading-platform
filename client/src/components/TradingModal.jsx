import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Zap, 
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Play,
  Square,
  Crown,
  Sparkles
} from 'lucide-react';

const TradingModal = ({ 
  isOpen, 
  onClose, 
  currentPrice = 95688.23,
  mode = 'fixed' // 'fixed' or 'timed'
}) => {
  const [selectedPlan, setSelectedPlan] = useState(mode === 'fixed' ? '305' : '60s');
  const [amount, setAmount] = useState('999');
  const [status, setStatus] = useState('idle'); // 'idle', 'inProgress', 'ended'
  const [timeLeft, setTimeLeft] = useState(60);
  const [profit, setProfit] = useState(119.88);

  // Fixed plans (first image)
  const fixedPlans = [
    {
      id: '305',
      returnRate: '12.00%',
      capital: '500 - 5000',
      leverage: false,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: '505', 
      returnRate: '13.00%',
      capital: '5000 - 10000',
      leverage: false,
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: '605',
      returnRate: '14.00%',
      capital: '5000 - 10000', 
      leverage: true,
      color: 'from-orange-500 to-red-500'
    }
  ];

  // Timed plans (second image)
  const timedPlans = [
    {
      id: '60s',
      duration: '60s',
      returnRate: '14.00%',
      capital: '10000 - 20000',
      leverage: false,
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: '70s',
      duration: '70s', 
      returnRate: '15.00%',
      capital: '20000 - 30000',
      leverage: false,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: '80s',
      duration: '80s',
      capital: '20000 - 30000',
      leverage: true,
      color: 'from-purple-500 to-pink-500'
    }
  ];

  const plans = mode === 'fixed' ? fixedPlans : timedPlans;
  const selectedPlanData = plans.find(plan => plan.id === selectedPlan);

  // Timer effect for timed mode
  useEffect(() => {
    let interval;
    if (status === 'inProgress' && mode === 'timed') {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setStatus('ended');
            // Calculate random profit between 80% and 120% of expected
            const randomProfit = (119.88 * (0.8 + Math.random() * 0.4)).toFixed(2);
            setProfit(parseFloat(randomProfit));
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status, mode]);

  const handleConfirm = () => {
    if (mode === 'timed') {
      setStatus('inProgress');
      setTimeLeft(selectedPlanData.duration ? parseInt(selectedPlanData.duration) : 60);
    } else {
      // Simulate fixed plan result after 2 seconds
      setStatus('inProgress');
      setTimeout(() => {
        setStatus('ended');
        const randomProfit = (119.88 * (0.8 + Math.random() * 0.4)).toFixed(2);
        setProfit(parseFloat(randomProfit));
      }, 2000);
    }
  };

  const resetTrade = () => {
    setStatus('idle');
    setTimeLeft(selectedPlanData.duration ? parseInt(selectedPlanData.duration) : 60);
    setProfit(119.88);
  };

  const endTradeEarly = () => {
    setStatus('ended');
    const earlyProfit = (profit * (0.3 + Math.random() * 0.5)).toFixed(2);
    setProfit(parseFloat(earlyProfit));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 30, stiffness: 400 }}
          className="w-full max-w-md bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative p-6 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-900/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25"
                >
                  <TrendingUp className="w-5 h-5 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-2xl font-bold text-white">BTCUSDT</h1>
                  <p className="text-3xl font-bold text-green-400">
                    {currentPrice.toLocaleString()}
                  </p>
                </div>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="w-8 h-8 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg flex items-center justify-center border border-gray-600/50 transition-all group"
              >
                <X className="w-4 h-4 text-gray-400 group-hover:text-white" />
              </motion.button>
            </div>

            {/* Status Indicator */}
            {status !== 'idle' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-2 mb-2"
              >
                <div className={`w-2 h-2 rounded-full ${
                  status === 'inProgress' ? 'bg-green-400 animate-pulse' : 
                  status === 'ended' ? 'bg-gray-400' : 'bg-cyan-400'
                }`} />
                <span className={`text-sm font-medium ${
                  status === 'inProgress' ? 'text-green-400' : 
                  status === 'ended' ? 'text-gray-400' : 'text-cyan-400'
                }`}>
                  {status === 'inProgress' ? 'In Progress' : 'Has Ended'}
                </span>
              </motion.div>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Plan Selection */}
            <div className="mb-6">
              <div className="grid gap-3">
                {plans.map((plan) => (
                  <motion.button
                    key={plan.id}
                    whileHover={{ scale: 1.01, y: -1 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all relative overflow-hidden ${
                      selectedPlan === plan.id
                        ? `border-cyan-500 bg-gradient-to-r ${plan.color} bg-opacity-10 shadow-lg`
                        : 'border-gray-600 bg-gray-800/30 hover:border-gray-500'
                    }`}
                  >
                    {/* Selection Indicator */}
                    {selectedPlan === plan.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-6 h-6 bg-cyan-500 rounded-bl-xl rounded-tr-xl flex items-center justify-center"
                      >
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </motion.div>
                    )}

                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xl font-bold text-white">{plan.id}</span>
                          {plan.leverage && (
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 rounded-full border border-yellow-500/30"
                            >
                              <Zap className="w-3 h-3 text-yellow-400" />
                              <span className="text-yellow-400 text-xs font-medium">Leverage</span>
                            </motion.div>
                          )}
                          {plan.duration && (
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              className="flex items-center gap-1 px-2 py-1 bg-cyan-500/20 rounded-full border border-cyan-500/30"
                            >
                              <Clock className="w-3 h-3 text-cyan-400" />
                              <span className="text-cyan-400 text-xs font-medium">{plan.duration}</span>
                            </motion.div>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          {plan.returnRate && (
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400 text-sm">Return Rate</span>
                              <span className="text-cyan-400 font-semibold">{plan.returnRate}</span>
                            </div>
                          )}
                          {plan.capital && (
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400 text-sm">Capital</span>
                              <span className="text-white font-medium">{plan.capital}</span>
                            </div>
                          )}
                          {!plan.returnRate && !plan.capital && plan.leverage && (
                            <div className="text-center py-2">
                              <span className="text-yellow-400 font-semibold flex items-center justify-center gap-2">
                                <Zap className="w-4 h-4" />
                                Is Leverage
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Trade Summary */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-800/30 rounded-xl p-4 border border-gray-600/30 mb-6"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Available Amount</span>
                  <span className="text-red-400 font-semibold">$-10,411,844.00</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Expected Return</span>
                  <span className="text-green-400 font-semibold">$119.88</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Transaction Fee</span>
                  <span className="text-gray-300 font-semibold">$19.98</span>
                </div>
              </div>
            </motion.div>

            {/* Timer Display for In Progress */}
            {mode === 'timed' && status === 'inProgress' && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center mb-6"
              >
                <div className="text-4xl font-bold text-cyan-400 mb-2">
                  {timeLeft}s
                </div>
                <div className="text-gray-400 text-sm">Time Remaining</div>
              </motion.div>
            )}

            {/* Fixed Plan Progress */}
            {mode === 'fixed' && status === 'inProgress' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center mb-6"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-2"
                />
                <div className="text-cyan-400 font-semibold">Processing Trade...</div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Confirm/Start Button */}
              {status === 'idle' && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfirm}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white py-4 rounded-xl font-semibold text-lg transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2"
                >
                  <Crown className="w-5 h-5" />
                  {mode === 'timed' ? 'Start Trading' : 'Confirm Investment'}
                  <Sparkles className="w-5 h-5" />
                </motion.button>
              )}

              {/* In Progress Controls */}
              {status === 'inProgress' && (
                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={endTradeEarly}
                    className="bg-red-500 hover:bg-red-600 text-white py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <Square className="w-5 h-5" />
                    End Early
                  </motion.button>
                  {mode === 'timed' && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setStatus('ended')}
                      className="bg-green-500 hover:bg-green-600 text-white py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                    >
                      <Play className="w-5 h-5" />
                      Continue
                    </motion.button>
                  )}
                </div>
              )}

              {/* Ended State */}
              {status === 'ended' && (
                <div className="space-y-3">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/20"
                  >
                    <div className="flex items-center justify-center gap-2 text-green-400 mb-2">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-semibold">Trade Completed</span>
                    </div>
                    <div className="text-white font-bold text-2xl">+${profit.toFixed(2)}</div>
                    <div className="text-gray-400 text-sm">Profit Earned</div>
                  </motion.div>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={resetTrade}
                    className="w-full bg-cyan-500 hover:bg-cyan-600 text-white py-4 rounded-xl font-semibold transition-all"
                  >
                    Start New Trade
                  </motion.button>
                </div>
              )}
            </div>

            {/* Risk Warning */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-start gap-3 p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20 mt-4"
            >
              <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
              <p className="text-yellow-300 text-xs">
                Trading involves significant risk. Your investment may decrease in value. 
                Only trade with funds you can afford to lose.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TradingModal;