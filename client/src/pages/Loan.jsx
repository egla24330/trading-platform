import { useState, useEffect } from "react";
import MobileNav from "../components/MobileNav";
import { Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";


const LOAN_PACKAGES = [
  {
    id: "starter",
    title: "Starter Boost",
    interest: 4,
    maxAmount: 1000,
    duration: 7,
    desc: "A small liquidity push for new users who want to test short-term crypto predictions.",
    features: [
      "Instant Auto-Approval",
      "Perfect for 60-sec betting rounds",
      "Low Interest Rate"
    ]
  },
  {
    id: "growth",
    title: "Trader Growth Loan",
    interest: 7,
    maxAmount: 3000,
    duration: 14,
    desc: "Designed for active traders who want more capital during high volatility sessions.",
    features: [
      "Higher Limits For Active Users",
      "Fast Release Into Wallet",
      "Better Rates After Win Streak"
    ]
  },
  {
    id: "pro",
    title: "Pro Leverage Loan",
    interest: 10,
    maxAmount: 6000,
    duration: 21,
    desc: "Ideal for users with consistent trading patterns, perfect for mid-term strategies.",
    features: [
      "Reduced Fees For Verified Users",
      "Optimized For High-Frequency Trading",
      "Risk-Based Credit Expansion"
    ]
  },
  {
    id: "premium",
    title: "Elite Trader Loan",
    interest: 12,
    maxAmount: 10000,
    duration: 30,
    desc: "For serious traders who need stable liquidity for multiple coin bets and market swings.",
    features: [
      "Lower Interest After Good Repayment History",
      "Suitable For Multi-Coin Strategies",
      "24/7 Priority Chat Support"
    ]
  },
  {
    id: "vip",
    title: "VIP Liquidity Boost",
    interest: 15,
    maxAmount: 20000,
    duration: 45,
    desc: "High-limit capital for VIPs who trade across multiple pairs and timeframes.",
    features: [
      "Personal Support Manager",
      "Custom Duration",
      "Daily Limit Upgrades Based On Volume"
    ]
  },
  {
    id: "enterprise",
    title: "Institutional Battle Loan",
    interest: 18,
    maxAmount: 50000,
    duration: 60,
    desc: "For elite traders and operators who need large liquidity for P2P swaps, hedging, and arbitrage.",
    features: [
      "Advanced Risk Tools",
      "Custom API Access",
      "Institution-Level Support"
    ]
  }
];


export default function LoanPackages() {
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { backendUrl, token } = useAuth()

  const navigate = useNavigate()

  function handleSelect(pack) {
    setSelected(pack);
    setAmount("");
  }

  function handleBack() {
    setSelected(null);
    setAmount("");
  }

  function handleBackToHome() {
    // Navigate to home page - you can replace this with your routing logic
    console.log("Navigating to home page");
    // window.location.href = "/"; // or use your router
    navigate('/')
  }

  function calculateRepayment() {
    if (!amount || !selected) return null;
    const principal = parseFloat(amount);
    const interestAmount = (principal * selected.interest) / 100;
    return (principal + interestAmount).toFixed(2);
  }

  async function requestLoan() {
    if (!amount || amount <= 0) {
      return alert("Please enter a valid amount");
    }

    const numAmount = parseFloat(amount);
    if (numAmount > selected.maxAmount) {
      return alert(`Amount cannot exceed ${selected.maxAmount.toLocaleString()} USDT for this package`);
    }

    if (numAmount < 1) {
      return alert("Minimum loan amount is 1 USDT");
    }

    setIsLoading(true);

    try {
      const response = await axios.post(`${backendUrl}api/loans`, {
        packageId: selected.id,
        packageTitle: selected.title,
        amountRequested: numAmount,
        interestRate: selected.interest,
        repaymentPeriod: selected.duration,

      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log(response)
      if (response.data.success) {
        toast.success('Loan request submitted successfully!')
        handleBack();
      } else {
        toast.error(response?.data?.message || "Failed loan req", {
          duration: 9000,
        });
      }

    } catch (err) {
      toast.error(err.message || "Failed to submit loan request");
    } finally {
      setIsLoading(false);
    }
  }

  const filteredPackages = LOAN_PACKAGES.filter(pack =>
    pack.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pack.desc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const repaymentAmount = calculateRepayment();

  return (
    <div className="min-h-screen bg-gray-900 sm:py-8 px-3 sm:px-4 mb-25">
      <MobileNav />
      <div className="max-w-6xl mx-auto">
        {/* Back to Home Button */}
        <div className="hidden sm:block md:mb-8">
          <button
            onClick={handleBackToHome}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
          >
            <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </button>
        </div>

        {/* Professional Header - Dark Mode */}
        <div className="text-center mb-7">

          {/* <h1 className=" text-xl sm:text-3xl font-bold text-white mb-4">
             Loan Packages
          </h1> */}

        </div>

        {/* Package Selection View */}
        {!selected && (
          <div className="space-y-8">
            {/* Centered Search Bar - Dark */}
            <div className="flex justify-center">
              <div className="w-full max-w-2xl">
                <div className="0">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-full">
                      <div className="relative">
                        <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                          type="text"
                          placeholder="Search loan packages by name or description..."
                          className="w-full pl-12 pr-4 py-4 bg-gray-900 border border-gray-600 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 transition-all duration-200"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>

            {/* Loan Packages Grid - Dark */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPackages.map((pack) => (
                <div
                  key={pack.id}
                  onClick={() => handleSelect(pack)}
                  className="bg-gray-900 rounded-2xl border border-gray-700 hover:border-blue-600 hover:shadow-xl transition-all duration-300 cursor-pointer group transform hover:scale-101"
                >
                  <div className="p-6">
                    {/* Package Header */}
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-semibold text-white group-hover:text-blue-300 transition-colors">
                        {pack.title}
                      </h3>
                      <div className="text-xl font-bold text-blue-400 bg-blue-900/30 px-3 py-1 rounded-2xl border border-blue-800/50">
                        {pack.interest}%
                      </div>
                    </div>

                    <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                      {pack.desc}
                    </p>

                    {/* Key Metrics */}
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between items-center py-3 border-b border-gray-700">
                        <span className="text-gray-400 text-sm">Maximum Amount</span>
                        <span className="font-semibold text-white">{pack.maxAmount.toLocaleString()} USDT</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-gray-700">
                        <span className="text-gray-400 text-sm">Duration</span>
                        <span className="font-semibold text-white">{pack.duration} days</span>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="mb-6">
                      <div className="flex flex-wrap gap-2">
                        {pack.features.map((feature, index) => (
                          <span key={index} className="px-3 py-1 bg-blue-900/30 text-blue-300 text-xs rounded-2xl border border-blue-800/50">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* CTA */}
                    <button className="w-full py-3 px-4 bg-gray-700 hover:bg-blue-600 hover:text-white text-gray-200 rounded-2xl font-medium transition-all duration-300 group-hover:shadow-lg border border-gray-600 hover:border-blue-500 transform group-hover:scale-105">
                      Select Package
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State - Dark */}
            {filteredPackages.length === 0 && (
              <div className="text-center ">
                <div className="w-30 h-20 mx-auto mb-4 text-6xl rounded-2xl flex items-center justify-center">
                  😠
                </div>
                <div className="text-gray-400 text-sm mb-6">No loan packages found</div>
                <button
                  onClick={() => setSearchTerm("")}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-medium transition-colors border border-blue-500 hover:border-blue-400 transform hover:scale-105"
                >
                  View All Packages
                </button>
              </div>
            )}
          </div>
        )}

        {/* Loan Application View - Dark */}
        {selected && (
          <div className="max-w-4xl mx-auto bg">
            <div className="sm:bg-gray-800 rounded-2xl sm:border border-gray-700 shadow-2xl p-2">
              {/* Header */}
              <div className=" border-b border-gray-700">
                <div className="flex gap-4 mb-6">
                  <button
                    onClick={handleBack}
                    className="flex gap-2 text-gray-400 hover:text-white transition-colors group"
                  >
                    <div className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:bg-blue-500/20 border border-gray-600">
                      <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                    </div>
                  </button>
                  <div>
                    <h2 className="text-xl font-bold text-white">{selected.title}</h2>
                    <p className="text-sm sm:text-lg text-gray-300 mt-1">{selected.desc}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-sm sm:text-xl font-bold text-blue-400 bg-blue-900/30 px-4 py-2 rounded-2xl border border-blue-800/50">
                    {selected.interest}% Interest
                  </div>
                </div>
              </div>

              <div className="sm:p-4">
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Package Details */}
                  <div className="space-y-5">
                    <div className="p-3 sm:p-6">
                      <h3 className="font-semibold text-white mb-4 text-lg">Package Details</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center py-3 border-b border-gray-600">
                          <span className="text-gray-300">Maximum Amount</span>
                          <span className="font-semibold text-white">{selected.maxAmount.toLocaleString()} USDT</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-gray-600">
                          <span className="text-gray-300">Loan Duration</span>
                          <span className="font-semibold text-white">{selected.duration} days</span>
                        </div>
                        <div className="flex justify-between items-center py-3">
                          <span className="text-gray-300">Interest Rate</span>
                          <span className="font-semibold text-white">{selected.interest}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-500/10 rounded-2xl p-6 ">
                      <h3 className="font-semibold text-white mb-4 text-lg">Features</h3>
                      <div className="space-y-3">
                        {selected.features.map((feature, index) => (
                          <div key={index} className="flex items-center gap-3 text-gray-300">
                            <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Loan Application Form */}
                  <div className="space-y-6">
                    <div className="p-1">
                      <h3 className="font-semibold text-white mb-6 text-lg">Loan Application</h3>

                      {/* Amount Input */}
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-3">
                            Loan Amount (USDT)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="1"
                              max={selected.maxAmount}
                              //  step="0.01"
                              className="w-full p-4 bg-gray-700 border border-gray-600 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 text-lg font-semibold pr-20 transition-all duration-200"
                              value={amount}
                              onChange={e => setAmount(e.target.value)}
                              placeholder="0.00"
                            />
                            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 font-semibold">
                              USDT
                            </div>
                          </div>
                          <div className="flex justify-between text-sm text-gray-400 mt-3">
                            <span>Minimum: 1 USDT</span>
                            <span>Maximum: {selected.maxAmount.toLocaleString()} USDT</span>
                          </div>
                        </div>

                        {/* Amount Slider */}
                        <div className="pt-2">
                          <input
                            type="range"
                            min="1"
                            max={selected.maxAmount}
                            //  step="100"
                            value={amount || 0}
                            onChange={e => setAmount(e.target.value)}
                            className="w-full h-2 bg-gray-600 rounded-2xl appearance-none cursor-pointer accent-blue-500"
                          />
                          <div className="flex justify-between text-xs text-gray-400 mt-2">
                            <span>1 USDT</span>
                            <span>{selected.maxAmount.toLocaleString()} USDT</span>
                          </div>
                        </div>

                        {/* Repayment Summary */}
                        {repaymentAmount && (
                          <div className=" p-1">
                            <h4 className="font-semibold text-white mb-4 text-lg flex items-center gap-2">
                              {/* <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg> */}
                              Repayment Summary
                            </h4>
                            <div className="space-y-3 text-sm">
                              <div className="flex justify-between items-center py-2">
                                <span className="text-gray-300">Principal Amount</span>
                                <span className="font-medium text-white">{parseFloat(amount).toLocaleString()} USDT</span>
                              </div>
                              <div className="flex justify-between items-center py-2">
                                <span className="text-gray-300">Interest ({selected.interest}%)</span>
                                <span className="font-medium text-white">
                                  {((parseFloat(amount) * selected.interest) / 100).toLocaleString()} USDT
                                </span>
                              </div>
                              <div className="border-t border-white pt-3 mt-2">
                                <div className="flex justify-between items-center font-semibold">
                                  <span className="text-gray-300 text-lg">Total Repayment</span>
                                  <span className="text-white text-xl">{repaymentAmount} USDT</span>
                                </div>
                              </div>
                            </div>
                            <div className="mt-4 text-sm text-blue-300 text-center bg-blue-900/30 py-3 rounded-2xl border border-blue-800/30">
                              Due in {selected.duration} days • {(parseFloat(repaymentAmount) / selected.duration).toFixed(2)} USDT per day
                            </div>
                          </div>
                        )}

                        {/* Submit Button */}
                        <button
                          onClick={requestLoan}
                          disabled={isLoading || !amount || amount <= 0}
                          className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-2xl transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 border border-blue-500 disabled:border-gray-500 shadow-lg"
                        >
                          {isLoading ? (
                            <div className="flex items-center justify-center gap-3">
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Processing Application...
                            </div>
                          ) : (
                            "Submit Loan Application"
                          )}
                        </button>

                        {/* Security Note */}
                        <div className="text-center">
                          {/* <div className="flex items-center justify-center gap-2 text-xs text-gray-400 bg-gray-700/50 py-3 px-4 rounded-2xl border border-gray-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            
                          </div> */}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}