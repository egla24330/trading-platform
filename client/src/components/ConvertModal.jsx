// components/ConvertModal.jsx
import React, { use, useState } from "react";
import { Shield, X, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";
import { conversionAPI } from "../services/api";

export default function ConvertModal({
    open,
    onClose,
    onConvertSuccess,
    cryptoAssets, // Receive crypto assets configuration
    userBalance // { btc: 0.5, eth: 2.1, usdt: 5000 }
}) {
    const [convertFrom, setConvertFrom] = useState("BTC");
    const [convertAmount, setConvertAmount] = useState("");
    const [isConverting, setIsConverting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // Use provided cryptoAssets or defaults
    const cryptoConfig = cryptoAssets || defaultCryptoAssets;

    // Format user balance safely
    const formatBalance = (balance) => {
        if (balance === undefined || balance === null) return "0.00";
        return parseFloat(balance).toFixed(2);
    };

    // Get current wallet balance for selected crypto
    const getCurrentBalance = () => {
        if (!userBalance) return 0;
        switch (convertFrom) {
            case "BTC": return userBalance.btc || 0;
            case "ETH": return userBalance.eth || 0;
            default: return 0;
        }
    };

    const conversionFee = 0.001; // 0.1%

    const calculateEstimatedUSDT = () => {
        if (!convertAmount || parseFloat(convertAmount) <= 0) return 0;
        const amount = parseFloat(convertAmount);
        const crypto = cryptoConfig[convertFrom];
        return amount * crypto.price;
    };

    const calculateFee = () => {
        const estimatedUSDT = calculateEstimatedUSDT();
        return estimatedUSDT * conversionFee;
    };

    // Validate input amount
    const validateAmount = (amount) => {
        setErrorMessage("");

        if (!amount || amount.trim() === "") {
            return false;
        }

        const numericAmount = parseFloat(amount);

        // Check if valid number
        if (isNaN(numericAmount)) {
            setErrorMessage("Please enter a valid number");
            return false;
        }

        // Check if positive
        if (numericAmount <= 0) {
            setErrorMessage("Amount must be greater than 0");
            return false;
        }

        // Check if sufficient balance
        const currentBalance = getCurrentBalance();
        if (numericAmount > currentBalance) {
            setErrorMessage(`Insufficient balance. Available: ${formatBalance(currentBalance)} ${convertFrom}`);
            return false;
        }

        return true;
    };

    // Handle input change with validation
    const handleAmountChange = (e) => {
        const value = e.target.value;

        // Allow only numbers and decimal point
        if (/^\d*\.?\d*$/.test(value) || value === "") {
            setConvertAmount(value);

            // Validate only if there's a value
            if (value && value !== "") {
                validateAmount(value);
            } else {
                setErrorMessage("");
            }
        }
    };

    const handleConvert = async () => {
        // Validate before conversion
        if (!validateAmount(convertAmount)) {
            if (!errorMessage) {
                toast.error("Please enter a valid amount");
            }
            return;
        }

        setIsConverting(true);

        try {
            console.log('test1')

            const data = {
                fromCurrency: convertFrom,
                amount: parseFloat(convertAmount)
            }

            const res = await conversionAPI.execute(data)
            if (res.success) {

                toast.success(
                    <div className="space-y-2">
                        <div className="font-medium">{res.data?.message}</div>

                        <div className="text-sm space-y-2">
                            <div className="flex justify-between">
                                <span>{res.data?.details?.from?.amount} {res.data?.details?.from?.currency} →</span>
                                <span className="font-medium">${res.data?.details?.netAmount?.toFixed(2)} USDT</span>
                            </div>

                            <div className="text-xs text-gray-500 space-y-1">
                                <div className="flex justify-between">
                                    <span>New {res.data?.details?.from?.currency} balance:</span>
                                    <span>{res.data?.details?.from?.newBalance}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>New USDT balance:</span>
                                    <span>{res.data?.details?.to?.newBalance}</span>
                                </div>
                            </div>
                        </div> 
                    </div>
                );

            } else {
                toast.error(res.message || 'Conversion failed');
            }

            handleClose();
        } catch (error) {
            toast.error("Conversion failed. Please try again.");
        } finally {
            setIsConverting(false);
        }
    };

    const handleClose = () => {
        setConvertAmount("");
        setConvertFrom("BTC");
        setErrorMessage("");
        onClose();
        window.location.reload();
    };

    const handleQuickAmount = (value) => {
        setConvertAmount(value.toString());
        validateAmount(value.toString());
    };

    const handleMaxAmount = () => {
        const balance = getCurrentBalance();
        if (balance > 0) {
            setConvertAmount(balance.toString());
            validateAmount(balance.toString());
        } else {
            toast.error(`No ${convertFrom} balance available`);
        }
    };

    // Calculate percentage of balance used
    const getBalancePercentage = () => {
        if (!convertAmount || parseFloat(convertAmount) <= 0) return 0;
        const currentBalance = getCurrentBalance();
        if (currentBalance <= 0) return 0;
        return (parseFloat(convertAmount) / currentBalance) * 100;
    };

    if (!open) return null;

    const selectedCrypto = cryptoConfig[convertFrom];
    const estimatedUSDT = calculateEstimatedUSDT();
    const fee = calculateFee();
    const currentBalance = getCurrentBalance();
    const balancePercentage = getBalancePercentage();

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/70 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal Container */}
            <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-800 max-h-[90vh] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden">

                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 py-4 z-10">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                            Convert to USDT
                        </h3>
                        <button
                            onClick={handleClose}
                            className="p-1 sm:p-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">

                    {/* From Section */}
                    <div className="space-y-3">
                        <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300">
                            Convert From
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {Object.entries(cryptoConfig).map(([symbol, config]) => (
                                <button
                                    key={symbol}
                                    type="button"
                                    onClick={() => {
                                        setConvertFrom(symbol);
                                        setConvertAmount(""); // Clear amount when changing crypto
                                        setErrorMessage("");
                                    }}
                                    className={`p-3 sm:p-4 rounded-lg border-1 transition-all duration-200 ${convertFrom === symbol
                                        ? `border-blue-500 ${config.bgColor} ring-2 ring-blue-500/20`
                                        : "border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600"
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1">
                                            <div className={`w-10 h-10 rounded-full  flex items-center justify-start `}>
                                                {typeof config.icon === 'string' ? (
                                                    <img src={config.icon} alt={config.name} className="w-6 h-6" />
                                                ) : (
                                                    <config.icon className={`w-6 h-6 ${config.color}`} />
                                                )}
                                            </div>
                                            <div className="text-left text-sm ">
                                                <div className="font-medium text-gray-900 dark:text-white">
                                                    {symbol}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    {config.name}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm  font-medium text-gray-900 dark:text-white">
                                                ${config.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </div>
                                            <div className={`text-xs ${config.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                {config.change >= 0 ? '+' : ''}{config.change}%
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Amount Input Section */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300">
                                Amount to Convert
                            </label>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                Balance: <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {formatBalance(currentBalance)} {convertFrom}
                                </span>
                            </div>
                        </div>

                        <div className="relative">
                            <input
                                type="text"
                                placeholder="0.00"
                                value={convertAmount}
                                onChange={handleAmountChange}
                                className="w-full p-3 sm:p-4 pl-4 pr-28 text-base sm:text-lg rounded-lg border bg-white dark:bg-gray-800
                                         border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white
                                         focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors
                                         disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={currentBalance <= 0}
                            />
                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                                        {convertFrom}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleMaxAmount}
                                        disabled={currentBalance <= 0}
                                        className="px-2 sm:px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 
                                                 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors
                                                 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        MAX
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Balance percentage bar */}
                        {parseFloat(convertAmount) > 0 && currentBalance > 0 && (
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>Balance usage</span>
                                    <span>{Math.min(balancePercentage, 100).toFixed(1)}%</span>
                                </div>
                                <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 rounded-full transition-all duration-300"
                                        style={{ width: `${Math.min(balancePercentage, 100)}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Error message */}
                        {errorMessage && (
                            <div className="flex items-center gap-2 text-sm text-red-500 mt-1">
                                <AlertCircle className="w-4 h-4" />
                                <span>{errorMessage}</span>
                            </div>
                        )}

                        {/* Quick amount buttons */}
                        <div className="flex flex-wrap gap-2 pt-2">
                            {[25, 50, 75, 100].map((percent) => {
                                const amount = (currentBalance * percent / 100).toFixed(8);
                                return (
                                    <button
                                        key={percent}
                                        type="button"
                                        onClick={() => handleQuickAmount(amount)}
                                        disabled={currentBalance <= 0}
                                        className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 
                                                 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors
                                                 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {percent}%
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Conversion Details */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 sm:p-5 space-y-3 sm:space-y-4">
                        <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
                            Conversion Details
                        </h4>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Current Price</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                    ${selectedCrypto.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Amount in {convertFrom}</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {convertAmount || "0.00"} {convertFrom}
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Conversion Rate</span>
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                    1 {convertFrom} = ${selectedCrypto.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                                </span>
                            </div>

                            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Estimated USDT</span>
                                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                        ${estimatedUSDT.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">Conversion Fee (0.1%)</span>
                                    <span className="text-gray-700 dark:text-gray-300">${fee.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between text-sm font-medium">
                                    <span className="text-gray-700 dark:text-gray-300">You will receive</span>
                                    <span className="text-green-600 dark:text-green-400">
                                        ${(estimatedUSDT - fee).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-4 sm:px-6 py-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={handleClose}
                            disabled={isConverting}
                            className="order-2 sm:order-1 flex-1 py-3 text-sm font-medium border
                                     border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300
                                     hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            onClick={handleConvert}
                            disabled={!convertAmount || parseFloat(convertAmount) <= 0 || isConverting || !!errorMessage || currentBalance <= 0}
                            className="order-1 sm:order-2 flex-1 py-3 text-sm font-semibold
                                     bg-gradient-to-r from-blue-600 to-blue-700 text-white 
                                     hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 
                                     disabled:cursor-not-allowed rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                        >
                            {currentBalance <= 0 ? (
                                `No ${convertFrom} Balance`
                            ) : isConverting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Converting...
                                </>
                            ) : (
                                `Convert to USDT`
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}