// components/OrderModal.jsx
import React, { useState, useEffect } from "react";
import { X, TrendingUp, TrendingDown, Clock, Zap, Shield, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";
import ConvertModal from "./ConvertModal";
import { assets } from "../assets/assets"
import { conversionAPI } from "../services/api";
export default function OrderModal({
    open,
    onClose,
    symbol,
    price = 0,
    onConfirm,
    direction,
    availableAmount,
    isCheckingEligibility = false,
    userBalance,
    marketPrices

}) {

    // console.log({  userBalance});
    const [selected, setSelected] = useState(30);
    const [amount, setAmount] = useState("");
    const [leverage, setLeverage] = useState(1);
    const [error, setError] = useState("");
    const [calculating, setCalculating] = useState(false);
    // Add state for convert modal
    const [openConvert, setOpenConvert] = useState(false);
    const [convertAmount, setConvertAmount] = useState("");
    const [convertFrom, setConvertFrom] = useState("BTC");

    const durations = [
        { id: 30, rate: 12, min: 100, max: 5000 },
        { id: 60, rate: 15, min: 500, max: 10000 },
        { id: 120, rate: 20, min: 1000, max: 20000 }
    ];

    useEffect(() => {
        if (open) {
            setAmount("");
            setError("");
            setLeverage(1);
            setSelected(30);
        }
    }, [open]);

    const selectedItem = durations.find((d) => d.id === selected);

    const calculateReturn = () => {
        if (!amount || parseFloat(amount) === 0) return 0;
        const base = parseFloat(amount) * (selectedItem.rate / 100);
        return (base * leverage).toFixed(2);
    };

    const calculateFee = () => {
        if (!amount || parseFloat(amount) === 0) return "0.00";
        return (parseFloat(amount) * 0.02).toFixed(2);
    };

    const calculateTotalPayout = () => {
        if (!amount || parseFloat(amount) === 0) return "0.00";
        const returnAmount = parseFloat(calculateReturn());
        return (parseFloat(amount) + returnAmount - calculateFee()).toFixed(2);
    };

    const handleAmountChange = (value) => {
        setAmount(value);
        setError("");
        setCalculating(true);

        if (value && selectedItem) {
            const numValue = parseFloat(value);

            if (numValue < selectedItem.min) {
                setError(`Minimum amount is $${selectedItem.min}`);
            } else if (numValue > selectedItem.max) {
                setError(`Maximum amount is $${selectedItem.max}`);
            } else if (numValue > availableAmount * leverage) {
                setError(`Insufficient available balance for ${leverage}x leverage`);
            }
        }

        // Simulate calculation delay
        setTimeout(() => setCalculating(false), 300);
    };

    const handleLeverageChange = (value) => {
        const newLeverage = parseInt(value);
        setLeverage(newLeverage);
        setError("");

        if (amount) {
            const numAmount = parseFloat(amount);
            if (numAmount > availableAmount * newLeverage) {
                setError(`Insufficient available balance for ${newLeverage}x leverage`);
            }
        }
    };

    const handleConfirm = () => {
        if (!amount || parseFloat(amount) === 0) {
            setError("Please enter an amount");
            return;
        }

        if (error) {
            return;
        }

        if (onConfirm) {
            const orderData = {
                symbol,
                price,
                duration: selected,
                amount: parseFloat(amount),
                leverage,
                expectedReturn: parseFloat(calculateReturn()),
                fee: parseFloat(calculateFee()),
                totalPayout: parseFloat(calculateTotalPayout()),
                direction
            };
            onConfirm(orderData);
        }
    };

    // Handle convert confirmation
    const handleConvert = () => {
        if (!convertAmount || parseFloat(convertAmount) <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        // Here you would typically call an API to convert crypto to USDT
        toast.success(`Converting ${convertAmount} ${convertFrom} to USDT...`);

        // Simulate conversion
        setTimeout(() => {
            toast.success(`Successfully converted ${convertAmount} ${convertFrom} to USDT`);
            setOpenConvert(false);
            setConvertAmount("");
            // You might want to refresh the availableAmount here
        }, 1500);
    };

    const formatCurrency = (value) => {
        return parseFloat(value).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    if (!open) return null;
    

    const cryptoAssets = {
        BTC: {
            icon: assets.bitcoin, // Your Bitcoin icon component
            color: "text-orange-500",
            bgColor: "bg-orange-500/10",
            borderColor: "border-orange-500/30",
            price: marketPrices?.BTC?.price || 0,
            change: marketPrices?.BTC?.change24h || 0,
            name: "Bitcoin"
        },
        ETH: {
            icon: assets.ethereum, // Your Ethereum icon component
            color: "text-purple-500",
            bgColor: "bg-purple-500/10",
            borderColor: "border-purple-500/30",
            price: marketPrices?.ETH?.price || 0,
            change: marketPrices?.ETH?.change24h || 0,
            name: "Ethereum"
        }
    };

    return (
        <>
            {/* Main Order Modal */}
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-2 sm:p-4 mb-25  z-50 backdrop-blur-sm  sm:mb-0">
                <div
                    className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto  [scrollbar-width:none] [-ms-overflow-style:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="sticky top-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center ${direction === 'buy' ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'
                                    }`}>
                                    {direction === 'buy' ?
                                        <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" /> :
                                        <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 dark:text-red-400" />
                                    }
                                </div>
                                <div>
                                    <h2 className="font-bold text-lg sm:text-xl">
                                        {direction === 'buy' ? 'Buy' : 'Sell'} {symbol}
                                    </h2>
                                    <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
                                        ${formatCurrency(price)}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                            >
                                <X className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>
                        </div>
                    </div>

                    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                        {/* Available Balance - Updated with Convert Button */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-blue-700 dark:text-blue-300">
                                    Available USDT Balance
                                </span>
                                <span className="font-bold text-blue-700 dark:text-blue-300">
                                    {formatCurrency(availableAmount)} USDT
                                </span>
                            </div>

                            {availableAmount <= 0 && (
                                <div className="flex items-center justify-between mt-2">
                                    <div className="text-xs text-blue-600 dark:text-blue-400">
                                        Deposit or convert crypto to start trading
                                    </div>
                                    <button
                                        onClick={() => setOpenConvert(true)}
                                        className="flex items-center gap-1 text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                                    >
                                        <RefreshCw className="w-3 h-3" />
                                        Convert
                                    </button>
                                </div>
                            )}

                            {availableAmount > 0 && (
                                <div className="flex items-center justify-between mt-2">
                                    {/* availableAmount < selectedItem.min &&
                                    <div className="text-xs text-amber-600 dark:text-amber-400">
                                        Minimum investment is ${selectedItem.min}
                                    </div> */}

                                    {/* {availableAmount < selectedItem.min ? `Minimum investment is ${selectedItem.min}`:'add funds to trade'} */}

                                    {availableAmount < selectedItem.min ?
                                        <div className="text-xs text-amber-600 dark:text-amber-400">
                                            Minimum investment is ${selectedItem.min}
                                        </div>
                                        :
                                        <div className="text-xs text-white-600 dark:text-white-400">
                                            You can add fund to increase <br/>your trading capacity.
                                        </div>

                                    }


                                    <button
                                        onClick={() => setOpenConvert(true)}
                                        className="flex items-center gap-1 text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                                    >
                                        <RefreshCw className="w-3 h-3" />
                                        Add Funds
                                    </button>
                                </div>
                            )}



                        </div>


                        {/* Duration Selection */}
                        <div>
                            <label className="block text-sm sm:text-base font-medium mb-3">Select Duration</label>
                            <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                {durations.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            setError('')
                                            setAmount('')
                                            setSelected(item.id)
                                        }}
                                        className={`p-3 sm:p-4 rounded-lg border transition-colors ${selected === item.id
                                            ? "border-green-500 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                                            : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                                            }`}
                                    >
                                        <div className="text-center">
                                            <div className="font-bold text-base sm:text-lg">{item.id}s</div>
                                            <div className="text-xs sm:text-sm mt-1 sm:mt-2">+{item.rate}%</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2 sm:mt-3 text-center">
                                Min: ${selectedItem.min} • Max: ${selectedItem.max}
                            </p>
                        </div>

                        {/* Leverage Selection */}
                        <div>
                            <label className="block text-sm sm:text-base font-medium mb-2">Leverage</label>
                            <div className="space-y-3">
                                <input
                                    disabled={true}
                                    type="range"
                                    min="1"
                                    max="20"
                                    value={leverage}
                                    onChange={(e) => handleLeverageChange(e.target.value)}
                                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-green-500"
                                />
                                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
                                    {[1, 5, 10, 15, 20].map((value) => (
                                        <button

                                            key={value}
                                            onClick={() => {
                                                // handleLeverageChange(value)
                                                if (value > 1) {
                                                    toast.warn("Leverage trading is currently disabled");
                                                }
                                            }}
                                            //  disabled={true}
                                            className={`px-2 py-1 rounded ${leverage === value ? 'bg-green-500 text-white' : 'hover:text-green-400'}`}
                                        >
                                            {value}x
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {leverage > 1 && (
                                <div className="mt-2 text-sm text-amber-600 dark:text-amber-400">
                                    <AlertCircle className="w-4 h-4 inline mr-1" />
                                    Higher leverage increases both potential profit and risk
                                </div>
                            )}
                        </div>

                        {/* Amount Input */}
                        <div>
                            <label className="block text-sm sm:text-base font-medium mb-2">
                                Investment Amount (USDT)
                            </label>
                            <div className="relative">
                                <input
                                    value={amount}
                                    onChange={(e) => handleAmountChange(e.target.value)}
                                    placeholder="Enter amount"
                                    type="number"
                                    min={selectedItem.min}
                                    max={selectedItem.max}
                                    className="w-full p-3 sm:p-4 pl-10 text-base sm:text-lg rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">
                                    $
                                </div>
                            </div>
                            {error && (
                                <p className="text-red-500 text-sm sm:text-base mt-2">{error}</p>
                            )}
                        </div>

                        {/* Effective Position */}
                        {leverage > 1 && amount && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-blue-700 dark:text-blue-300">Effective Position</span>
                                    <span className="font-bold text-blue-700 dark:text-blue-300">
                                        ${formatCurrency(amount * leverage)}
                                    </span>
                                </div>
                                <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                    {amount} × {leverage} leverage
                                </div>
                            </div>
                        )}

                        {/* Order Summary */}
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 sm:p-5 space-y-3 sm:space-y-4">
                            <h3 className="font-medium text-gray-900 dark:text-white">Order Summary</h3>

                            {calculating ? (
                                <div className="text-center py-4">
                                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                                    <p className="text-sm text-gray-500 mt-2">Calculating...</p>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Expected Return</span>
                                        <span className="font-medium text-base sm:text-lg text-green-600 dark:text-green-400">
                                            +${calculateReturn()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Trading Fee (2%)</span>
                                        <span className="font-medium text-base sm:text-lg text-red-500 dark:text-red-40">
                                            -${calculateFee()}
                                        </span>
                                    </div>
                                    <div className="pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-600">
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium text-base sm:text-lg">Total Payout</span>
                                            <span className="font-bold text-lg sm:text-xl text-gray-900 dark:text-white">
                                                ${calculateTotalPayout()}
                                            </span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Features */}
                        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4" />
                                <span>Fast Execution</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                <span>Secure</span>
                            </div>
                        </div>

                        {/* Confirm Button */}
                        <button
                            onClick={handleConfirm}
                            disabled={!!error || !amount || parseFloat(amount) === 0 || isCheckingEligibility}
                            className={`w-full py-3 sm:py-4 rounded-lg font-medium text-base sm:text-lg text-white transition-colors flex items-center justify-center gap-2 ${direction === 'buy'
                                ? 'bg-green-500 hover:bg-green-600'
                                : 'bg-red-500 hover:bg-red-600'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {isCheckingEligibility ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Checking Eligibility...
                                </>
                            ) : (
                                `Confirm ${direction === 'buy' ? 'Buy' : 'Sell'} Order`
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Convert Modal */}
            {openConvert && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <ConvertModal
                        open={openConvert}
                        onClose={() => setOpenConvert(false)}
                        onConvertSuccess={(conversionData) => {
                            // Handle successful conversion
                            toast.success(`Converted ${conversionData.amount} ${conversionData.from} to USDT`);
                            // You might want to refresh user balance here
                        }}
                        cryptoAssets={cryptoAssets} // Pass the configuration
                        userBalance={userBalance}
                    />
                </div>
            )}
        </>
    );
}