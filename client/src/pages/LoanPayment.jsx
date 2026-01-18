import { useState, useRef, useEffect, useCallback } from "react";
import {
    FaCopy,
    FaUpload,
    FaQrcode,
    FaCheck,
    FaDownload,
    FaSpinner,
    FaWallet,
    FaSync,
    FaExclamationTriangle
} from "react-icons/fa";
import QRCode from "qrcode";
import { ArrowLeft, AlertCircle, CheckCircle, Wallet, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import MobileNav from "../components/MobileNav";
import axios from "axios";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// API configuration
const API_URL = 'http://localhost:3000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.code === 'ECONNABORTED') {
            toast.error('Request timeout. Please check your connection.');
        } else if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('userData');
            window.location.href = '/login';
        } else if (error.response?.status >= 500) {
            toast.error('Server error. Please try again later.');
        }
        return Promise.reject(error);
    }
);

// Payment methods
const PAYMENT_METHODS = {
    EXTERNAL_WALLET: 'external_wallet',
    DEPOSIT_ACCOUNT: 'deposit_account'
};

// Supported deposit currencies
const DEPOSIT_CURRENCIES = [
    { currency: 'USDT', name: 'Tether', icon: assets.tether },
    { currency: 'BTC', name: 'Bitcoin', icon: assets.bitcoin },
    { currency: 'ETH', name: 'Ethereum', icon: assets.ethereum }
];

// Validation patterns
const VALIDATION = {
    TRANSACTION_HASH: /^[a-fA-F0-9]{64}$/,
    AMOUNT: /^\d+(\.\d{1,8})?$/,
};

// Loan payment service
const loanPaymentService = {
    getActiveLoan: async () => {
        try {
            const response = await api.get('/loans/active');
            console.log('Active loan response:', response);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch loan' };
        }
    },

    getPaymentAddresses: async () => {
        try {
            const response = await api.get('/deposits/addresses');
            
            if (response.data?.success && response.data?.data) {
                return {
                    success: true,
                    data: response.data.data
                };
            }
            
            // Fallback to default structure
            return {
                success: true,
                data: {
                    USDT: {
                        TronTRC20: "",
                        ERC20: ""
                    },
                    BTC: {
                        Bitcoin: ""
                    },
                    ETH: {
                        Ethereum: ""
                    }
                }
            };
        } catch (error) {
            console.error('Payment addresses error:', error);
            
            return {
                success: false,
                data: {
                    USDT: { TronTRC20: "Address not available", ERC20: "Address not available" },
                    BTC: { Bitcoin: "Address not available" },
                    ETH: { Ethereum: "Address not available" }
                }
            };
        }
    },

    submitLoanPayment: async (paymentData, file) => {
        try {
            console.log(paymentData)
            console.log({file});
            const formData = new FormData();
            Object.keys(paymentData).forEach(key => {
                formData.append(key, paymentData[key]);
            });

            if (file) {
                formData.append('paymentProof', file);
            }

            const response = await api.post('/loans/payments/submit', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Payment submission failed' };
        }
    },

    submitDepositPayment: async (paymentData) => {
        try {
            console.log('Deposit payment data:', paymentData);
           
             const response = await api.post('/loans/payments/deposit', paymentData);
             console.log('Deposit payment response:', response);
             return response.data;
            
            // Simulate success for now
            return { success: true, message: 'Payment processed successfully' };
        } catch (error) {
            throw error.response?.data || { message: 'Deposit payment failed' };
        }
    },

    getWalletBalance: async () => {
        try {
            const response = await api.get('/trades/balance');
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch wallet balance' };
        }
    },

    convertCurrency: async (fromCurrency, toCurrency, amount) => {
        try {
            const response = await api.post('/wallet/convert', {
                fromCurrency,
                toCurrency,
                amount
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Currency conversion failed' };
        }
    }
};

// Format payment addresses from API response
const formatPaymentAddresses = (apiData = {}) => {
    const iconMap = {
        USDT: assets.tether,
        BTC: assets.bitcoin,
        ETH: assets.ethereum,
    };
    
    const colorMap = {
        USDT: { color: "text-green-500", bgColor: "bg-green-500/10", borderColor: "border-green-500/30" },
        BTC: { color: "text-orange-500", bgColor: "bg-orange-500/10", borderColor: "border-orange-500/30" },
        ETH: { color: "text-purple-500", bgColor: "bg-purple-500/10", borderColor: "border-purple-500/30" },
    };
    
    const formatted = {};
    
    Object.keys(apiData).forEach(currency => {
        formatted[currency] = {
            icon: iconMap[currency] || assets.tether,
            ...(colorMap[currency] || colorMap.USDT),
            networks: apiData[currency]
        };
    });
    
    return formatted;
};

export default function LoanPayment() {
    const [loan, setLoan] = useState(null);
    const [coin, setCoin] = useState("USDT");
    const [network, setNetwork] = useState("TronTRC20");
    const [amount, setAmount] = useState("");
    const [transactionHash, setTransactionHash] = useState("");
    const [fromAddress, setFromAddress] = useState("");
    const [file, setFile] = useState(null);
    const [copied, setCopied] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [generatingQR, setGeneratingQR] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(true);
    const [paymentAddresses, setPaymentAddresses] = useState({});
    const [loanDetails, setLoanDetails] = useState(null);
    
    // Deposit payment states
    const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS.EXTERNAL_WALLET);
    const [walletBalance, setWalletBalance] = useState({
        USDT: 0,
        BTC: 0,
        ETH: 0
    });
    const [selectedDepositCurrency, setSelectedDepositCurrency] = useState("USDT");
    const [isCheckingBalance, setIsCheckingBalance] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [convertedAmount, setConvertedAmount] = useState(null);
    const [isConverting, setIsConverting] = useState(false);
    
    const qrCanvasRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (loan) {
            if (paymentMethod === PAYMENT_METHODS.EXTERNAL_WALLET) {
                fetchPaymentAddresses();
            }
        }
    }, [loan, paymentMethod]);

    useEffect(() => {
        if (paymentMethod === PAYMENT_METHODS.DEPOSIT_ACCOUNT && amount && selectedDepositCurrency && loanDetails?.currency) {
            checkCurrencyConversion();
        }
    }, [amount, selectedDepositCurrency, loanDetails?.currency, paymentMethod]);

    useEffect(() => {
        if (paymentAddresses[coin]?.networks) {
            const networks = Object.keys(paymentAddresses[coin].networks);
            if (networks.length > 0 && !networks.includes(network)) {
                setNetwork(networks[0]);
            }
        }
    }, [coin, paymentAddresses]);

    const fetchInitialData = async () => {
        try {
            setFetchingData(true);
            await Promise.all([fetchLoan(), fetchPaymentAddresses(), fetchWalletBalance()]);
        } catch (error) {
            console.error('Initial data fetch error:', error);
            toast.error('Failed to load data');
        } finally {
            setFetchingData(false);
        }
    };

    const fetchLoan = async () => {
        try {
            const response = await loanPaymentService.getActiveLoan();
            if (response.success && response.data) {
                // Handle both single loan and array response
                const loanData = Array.isArray(response.data) ? response.data[0] : response.data;

                
                if (loanData) {
                    setLoan(loanData);
                    setLoanDetails({
                        id: loanData['_id'],
                        amount: loanData.amount || 0,
                        currency: loanData.currency || 'USDT',
                        remainingBalance: loanData.remainingBalance || loanData.amount || 0,
                        dueAmount: loanData.dueAmount || loanData.nextPayment || 0,
                        nextDueDate: loanData.nextDueDate,
                        loanReference: loanData.loanReference || `LOAN-${loanData.id}`
                    });
                    
                    const dueAmount = loanData.dueAmount || loanData.nextPayment;
                    if (dueAmount && !amount) {
                        setAmount(dueAmount.toString());
                    }
                } else {
                    toast.info('No active loan found');
                    setTimeout(() => navigate('/'), 2000);
                    

                }
            } else {
                toast.info('No active loan found');
                setTimeout(() => navigate('/'), 2000);
            }
        } catch (error) {
            toast.error(error.message || 'Failed to load loan');
        }
    };

    const fetchPaymentAddresses = async () => {
        try {
            const response = await loanPaymentService.getPaymentAddresses();
            
            if (response.success && response.data) {
                const formattedAddresses = formatPaymentAddresses(response.data);
                setPaymentAddresses(formattedAddresses);
                
                if (formattedAddresses[coin]?.networks) {
                    const firstNetwork = Object.keys(formattedAddresses[coin].networks)[0];
                    if (firstNetwork) {
                        setNetwork(firstNetwork);
                    }
                }
            }
        } catch (error) {
            console.error('Payment addresses error:', error);
        }
    };

    const fetchWalletBalance = async () => {
        try {
            setIsCheckingBalance(true);
            const response = await loanPaymentService.getWalletBalance();
            if (response.success && response.data?.wallet) {
                const wallet = response.data.wallet;
                const balances = {
                    USDT: wallet.usdt || 0,
                    BTC: wallet.btc || 0,
                    ETH: wallet.eth || 0
                };
                setWalletBalance(balances);
                setLastUpdated(response.data.lastUpdated || new Date().toISOString());
                
                const highestCurrency = Object.entries(balances).reduce((a, b) => 
                    a[1] > b[1] ? a : b
                )[0];
                
                if (balances[highestCurrency] > 0) {
                    setSelectedDepositCurrency(highestCurrency);
                }
            }
        } catch (error) {
            console.error('Wallet balance error:', error);
        } finally {
            setIsCheckingBalance(false);
        }
    };

    const checkCurrencyConversion = useCallback(async () => {
        if (!amount || parseFloat(amount) <= 0 || !loanDetails?.currency) {
            setConvertedAmount(null);
            return;
        }

        if (selectedDepositCurrency === loanDetails.currency) {
            setConvertedAmount(null);
            return;
        }

        try {
            setIsConverting(true);
            const response = await loanPaymentService.convertCurrency(
                selectedDepositCurrency,
                loanDetails.currency,
                parseFloat(amount)
            );
            
            if (response.success && response.data?.convertedAmount) {
                setConvertedAmount(response.data.convertedAmount);
            } else {
                setConvertedAmount(null);
            }
        } catch (error) {
            console.error('Currency conversion error:', error);
            setConvertedAmount(null);
        } finally {
            setIsConverting(false);
        }
    }, [amount, selectedDepositCurrency, loanDetails?.currency]);

    const handlePaymentMethodChange = (method) => {
        setPaymentMethod(method);
        setShowQR(false);
        
        if (method === PAYMENT_METHODS.DEPOSIT_ACCOUNT) {
            fetchWalletBalance();
        }
    };

    const generateQRCode = async () => {
        const address = paymentAddresses[coin]?.networks?.[network];
        
        if (!showQR && address && address !== "Address not available" && address !== "Loading...") {
            setShowQR(true);
            setTimeout(() => {
                generateQR();
            }, 100);
        } else {
            setShowQR(false);
        }
    };

    const generateQR = async () => {
        const address = paymentAddresses[coin]?.networks?.[network];
        
        if (!qrCanvasRef.current || !address || 
            address === "Address not available" || 
            address === "Loading...") return;

        setGeneratingQR(true);
        try {
            await QRCode.toCanvas(qrCanvasRef.current, address, {
                width: 180,
                height: 180,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });
        } catch (err) {
            console.error('QR generation error:', err);
        } finally {
            setGeneratingQR(false);
        }
    };

    const downloadQRCode = async () => {
        try {
            const canvas = qrCanvasRef.current;
            const pngUrl = canvas.toDataURL("image/png");
            const downloadLink = document.createElement("a");
            downloadLink.href = pngUrl;
            downloadLink.download = `${coin}-${network}-payment-address.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            toast.success('QR code downloaded');
        } catch (err) {
            console.error('QR download error:', err);
            toast.error('Failed to download QR code');
        }
    };

    const handleCopyAddress = async () => {
        const address = paymentAddresses[coin]?.networks?.[network];
        
        if (!address || address === "Address not available" || address === "Loading...") {
            toast.error('Address not available');
            return;
        }

        try {
            await navigator.clipboard.writeText(address);
            setCopied(true);
            toast.success('Address copied!');
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Copy error:', err);
            toast.error('Failed to copy address');
        }
    };

    const handleFileUpload = (e) => {
        const uploadedFile = e.target.files[0];
        if (uploadedFile) {
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
            if (!validTypes.includes(uploadedFile.type)) {
                toast.error('Invalid file type. Please upload JPEG, PNG, WebP, or PDF.');
                return;
            }
            if (uploadedFile.size > 10 * 1024 * 1024) {
                toast.error('File size must be less than 10MB');
                return;
            }
            setFile(uploadedFile);
            toast.success('File uploaded');
        }
    };

    const validateForm = () => {
        const errors = [];

        if (!loan) {
            errors.push('No active loan found');
        }

        if (!amount || parseFloat(amount) <= 0) {
            errors.push('Please enter a valid amount');
        }

        if (paymentMethod === PAYMENT_METHODS.EXTERNAL_WALLET) {
            if (!transactionHash.trim()) {
                errors.push('Please enter transaction hash');
            } /*else if (!VALIDATION.TRANSACTION_HASH.test(transactionHash.trim())) {
                errors.push('Invalid transaction hash (64-character hex)');
            }*/
          




            if (!file) {
                errors.push('Please upload payment proof');
            }
        }

        if (paymentMethod === PAYMENT_METHODS.DEPOSIT_ACCOUNT) {
            const selectedBalance = walletBalance[selectedDepositCurrency] || 0;
            if (parseFloat(amount) > selectedBalance) {
                errors.push(`Insufficient ${selectedDepositCurrency}. Available: ${selectedBalance}`);
            }
        }

        return errors;
    };

    const handleSubmit = async () => {
        const errors = validateForm();
        if (errors.length > 0) {
            errors.forEach(error => toast.error(error));
            return;
        }

        try {
            setLoading(true);

            if (paymentMethod === PAYMENT_METHODS.EXTERNAL_WALLET) {
                const address = paymentAddresses[coin]?.networks?.[network];
                
                const paymentData = {
                    loanId: loan['_id'],
                    currency: coin || 'USDT',
                    network: network,
                    amount: parseFloat(amount),
                    txHash: transactionHash.trim(),
                    toAddress: address || '',
                    fromAddress: fromAddress.trim() || '',
                    note: `Payment for loan ${loan.id}`,
                    loanReference: loanDetails?.loanReference || `LOAN-${loan.id}`,
                    paymentMethod: PAYMENT_METHODS.EXTERNAL_WALLET
                };

                console.log('Submitting loan payment data:', paymentData);

                const response = await loanPaymentService.submitLoanPayment(paymentData, file);

                console.log('Loan payment submission response:', response);

                if (response.success) {
                    toast.success('Payment submitted successfully!');
                    resetForm();
                  //  setTimeout(() => navigate('/loans/history'), 2000);
                } else {
                    //throw new Error(response.message || 'Submission failed');
                    toast.error(response.message || 'Submission failed');
                }
            } else {
                const paymentData = {
                    loanId: loan['_id'],
                    fromCurrency: selectedDepositCurrency,
                    toCurrency: loanDetails?.currency || 'USDT',
                    amount: parseFloat(amount),
                    convertedAmount: convertedAmount,
                    note: `Wallet payment for loan ${loan.id}`,
                    loanReference: loanDetails?.loanReference || `LOAN-${loan.id}`,
                    paymentMethod: PAYMENT_METHODS.DEPOSIT_ACCOUNT
                };

                const response = await loanPaymentService.submitDepositPayment(paymentData);

                if (response.success) {
                    toast.success(`Payment of ${amount} ${selectedDepositCurrency} successful!`);
                    resetForm();
                    fetchWalletBalance();
                    fetchLoan()
                  //  setTimeout(() => navigate('/loans/history'), 2000);
                } else {
                   toast.error(response.message || 'Payment failed');
                }
            }

        } catch (error) {
            console.error('Submit error:', error);
            toast.error(error.message || 'Payment failed');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setAmount("");
        setTransactionHash("");
        setFromAddress("");
        setFile(null);
        setConvertedAmount(null);
        setShowQR(false);
    };

    const handleCoinChange = (newCoin) => {
        if (newCoin === 'BTC' || newCoin === 'ETH') {
            toast.warn(`${newCoin} payments are currently disabled. Try using USDT instead.`);
        } else {
            setCoin(newCoin);
            setShowQR(false);
        }
    };

    const removeFile = () => {
        setFile(null);
        toast.info('File removed');
    };

    const getCurrentBalance = () => {
        return walletBalance[selectedDepositCurrency] || 0;
    };

    const formatBalance = (balance) => {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 8,
        }).format(balance);
    };

    const getBalanceColor = (balance) => {
        if (balance <= 0) return "text-red-400";
        if (balance < parseFloat(amount || 0)) return "text-yellow-400";
        return "text-green-400";
    };

    const address = paymentAddresses[coin]?.networks?.[network] || "Loading...";

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black py-4 px-4 mb-20">
            <MobileNav />
            
            <div className="max-w-md mx-auto">
                {/* Header */}
                <div onClick={() => navigate('/loan')} className="flex items-center gap-1 cursor-pointer mb-4">
                    <button className="hover:bg-gray-800/50 rounded-xl p-2">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <p className="text-gray-300">Back to Loans</p>
                </div>

                {/* Loading Overlay */}
                {loading && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                        <div className="bg-gray-800 p-6 rounded-xl flex flex-col items-center">
                            <FaSpinner className="animate-spin text-3xl text-blue-500 mb-3" />
                            <p className="text-white">Processing...</p>
                        </div>
                    </div>
                )}

                {/* Main Card */}
                <div className="sm:bg-gray-800/50 sm:backdrop-blur-lg rounded-2xl sm:border sm:border-gray-700/50 p-4 shadow-2xl">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <Shield className="w-5 h-5 text-green-400" />
                        <h1 className="text-xl font-bold text-white">Loan Payment</h1>
                    </div>

                    {/* Payment Method Selection */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-300 mb-3">
                            Payment Method
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => handlePaymentMethodChange(PAYMENT_METHODS.EXTERNAL_WALLET)}
                                disabled={loading}
                                className={`p-3 rounded-xl border-2 transition-all ${paymentMethod === PAYMENT_METHODS.EXTERNAL_WALLET
                                        ? "bg-blue-500/10 border-blue-500"
                                        : "border-gray-600/50 hover:border-gray-500"
                                    }`}
                            >
                                <div className="flex flex-col items-center">
                                    <Wallet className={`w-5 h-5 mb-2 ${paymentMethod === PAYMENT_METHODS.EXTERNAL_WALLET ? "text-blue-400" : "text-gray-400"}`} />
                                    <span className={`font-medium text-sm ${paymentMethod === PAYMENT_METHODS.EXTERNAL_WALLET ? "text-white" : "text-gray-400"}`}>
                                        External
                                    </span>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => handlePaymentMethodChange(PAYMENT_METHODS.DEPOSIT_ACCOUNT)}
                                disabled={loading}
                                className={`p-3 rounded-xl border-2 transition-all ${paymentMethod === PAYMENT_METHODS.DEPOSIT_ACCOUNT
                                        ? "bg-green-500/10 border-green-500"
                                        : "border-gray-600/50 hover:border-gray-500"
                                    }`}
                            >
                                <div className="flex flex-col items-center">
                                    <FaWallet className={`w-5 h-5 mb-2 ${paymentMethod === PAYMENT_METHODS.DEPOSIT_ACCOUNT ? "text-green-400" : "text-gray-400"}`} />
                                    <span className={`font-medium text-sm ${paymentMethod === PAYMENT_METHODS.DEPOSIT_ACCOUNT ? "text-white" : "text-gray-400"}`}>
                                        Wallet
                                    </span>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Loan Info Display */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-300 mb-3">
                            Loan Details
                        </label>
                        {fetchingData ? (
                            <div className="bg-gray-800/50 rounded-xl p-4 text-center">
                                <FaSpinner className="animate-spin h-6 w-6 text-blue-400 mx-auto" />
                            </div>
                        ) : !loan ? (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
                                <AlertCircle className="h-6 w-6 text-red-400 mx-auto mb-2" />
                                <p className="text-red-300 text-sm">No active loan</p>
                                <button
                                    onClick={() => navigate('/loan')}
                                    className="mt-2 text-blue-400 hover:text-blue-300 underline text-xs"
                                >
                                    Apply for loan
                                </button>
                            </div>
                        ) : (
                            <div className="bg-gray-900/50 rounded-xl p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-gray-400 text-sm">Loan Amount:</span>
                                    <span className="text-white font-medium">{loan.remainingBalance || loan.amount} {loan.currency}</span>
                                </div>
                                {loan.dueAmount && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400 text-sm">Due Amount:</span>
                                        <span className="text-yellow-400 font-medium">{loan.dueAmount} {loan.currency}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Deposit Currency Selection */}
                    {paymentMethod === PAYMENT_METHODS.DEPOSIT_ACCOUNT && (
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-3">
                                <label className="block text-sm font-medium text-gray-300">
                                    Select Currency
                                </label>
                                <button
                                    onClick={fetchWalletBalance}
                                    disabled={isCheckingBalance || loading}
                                    className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                                >
                                    <FaSync className={`w-3 h-3 ${isCheckingBalance ? 'animate-spin' : ''}`} />
                                    Refresh
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-3 mb-3">
                                {DEPOSIT_CURRENCIES.map((currency) => {
                                    const balance = walletBalance[currency.currency] || 0;
                                    const isSelected = selectedDepositCurrency === currency.currency;
                                    
                                    return (
                                        <button
                                            key={currency.currency}
                                            onClick={() => setSelectedDepositCurrency(currency.currency)}
                                            disabled={loading || currency.currency==='BTC' || currency.currency==='ETH'}
                                            className={`p-3 rounded-xl border-2 ${isSelected
                                                    ? "bg-green-500/10 border-green-500"
                                                    : "border-gray-600/50 hover:border-gray-500"
                                                }`}
                                        >
                                            <img
                                                src={currency.icon}
                                                alt={currency.currency}
                                                className={`w-7 h-7 mx-auto mb-2 ${isSelected ? "" : "grayscale brightness-75"}`}
                                            />
                                            <span className={`font-medium text-xs block ${isSelected ? "text-white" : "text-gray-400"}`}>
                                                {currency.currency}
                                            </span>
                                            <span className={`text-xs ${getBalanceColor(balance)}`}>
                                                {formatBalance(balance)}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Currency Selection (External Wallet) */}
                    {paymentMethod === PAYMENT_METHODS.EXTERNAL_WALLET && (
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-300 mb-3">
                                Select Currency
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                {Object.keys(paymentAddresses).length > 0 ? (
                                    Object.entries(paymentAddresses).map(([key, data]) => (
                                        <button
                                            key={key}
                                            onClick={() => handleCoinChange(key)}
                                            disabled={loading}
                                            className={`p-3 rounded-xl border-2 ${coin === key
                                                    ? `${data.bgColor} ${data.borderColor} border-2`
                                                    : "border-gray-600/50 hover:border-gray-500"
                                                }`}
                                        >
                                            <img
                                                src={data.icon}
                                                alt={key}
                                                className={`w-7 h-7 mx-auto mb-2 ${coin === key ? "" : "grayscale brightness-75"}`}
                                            />
                                            <span className={`font-medium text-sm ${coin === key ? "text-white" : "text-gray-400"}`}>
                                                {key}
                                            </span>
                                        </button>
                                    ))
                                ) : (
                                    <div className="col-span-3 text-center py-4 text-gray-400">
                                        <FaSpinner className="animate-spin inline mr-2" />
                                        Loading currencies...
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Network Selection (External Wallet) */}
                    {paymentMethod === PAYMENT_METHODS.EXTERNAL_WALLET && paymentAddresses[coin] && (
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Network
                            </label>
                            <select
                                value={network}
                                onChange={(e) => setNetwork(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-600/50 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled={loading}
                            >
                                {Object.keys(paymentAddresses[coin]?.networks || {}).map((net) => (
                                    <option key={net} value={net} className="bg-gray-800">
                                        {net}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Amount Input */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Amount
                            {paymentMethod === PAYMENT_METHODS.DEPOSIT_ACCOUNT && (
                                <span className={`text-sm ml-2 ${getBalanceColor(getCurrentBalance())}`}>
                                    (Max: {formatBalance(getCurrentBalance())})
                                </span>
                            )}
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                placeholder="0.00"
                                className="w-full bg-gray-900 border border-gray-600/50 rounded-xl p-3 pr-20 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                disabled={loading || !loan}
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <span className="text-gray-300 font-medium text-sm">
                                    {paymentMethod === PAYMENT_METHODS.DEPOSIT_ACCOUNT ? selectedDepositCurrency : coin}
                                </span>
                            </div>
                        </div>
                        
                        {paymentMethod === PAYMENT_METHODS.DEPOSIT_ACCOUNT && 
                         amount && 
                         loanDetails?.currency && 
                         selectedDepositCurrency !== loanDetails.currency && (
                            <div className="mt-2">
                                {isConverting ? (
                                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                                        <FaSpinner className="animate-spin" />
                                        Converting...
                                    </div>
                                ) : convertedAmount ? (
                                    <div className="text-green-400 text-sm">
                                        ≈ {convertedAmount} {loanDetails.currency}
                                    </div>
                                ) : null}
                            </div>
                        )}
                        
                        {/* {loanDetails?.dueAmount && (
                            <p className="text-gray-500 text-xs mt-1">
                                Minimum due: {loanDetails.dueAmount} {loanDetails.currency}
                            </p>
                        )} */}
                    </div>

                    {/* Transaction Hash Input (External Wallet) */}
                    {paymentMethod === PAYMENT_METHODS.EXTERNAL_WALLET && (
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Transaction Hash
                            </label>
                            <input
                                type="text"
                                placeholder="Enter 64-character hash"
                                className="w-full bg-gray-900 border border-gray-600/50 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={transactionHash}
                                onChange={(e) => setTransactionHash(e.target.value)}
                                disabled={loading || !loan}
                            />
                        </div>
                    )}

                    {/* Payment Address Section (External Wallet) */}
                    {paymentMethod === PAYMENT_METHODS.EXTERNAL_WALLET && paymentAddresses[coin] && (
                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-gray-300">
                                    Payment Address
                                </label>
                                <button
                                    onClick={generateQRCode}
                                    disabled={!address || address === "Address not available" || address === "Loading..." || loading || !loan}
                                    className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                                >
                                    <FaQrcode />
                                    {showQR ? 'Hide QR' : 'Show QR'}
                                </button>
                            </div>

                            {showQR ? (
                                <div className="bg-gray-950 p-4 rounded-xl flex flex-col items-center">
                                    {generatingQR ? (
                                        <div className="w-40 h-40 flex items-center justify-center">
                                            <FaSpinner className="animate-spin text-xl text-blue-500" />
                                        </div>
                                    ) : (
                                        <>
                                            <canvas
                                                ref={qrCanvasRef}
                                                className="w-40 h-40 rounded-lg"
                                            />
                                            <p className="text-white mt-3 text-center font-mono text-xs break-all max-w-xs">
                                                {address}
                                            </p>
                                            <div className="flex gap-2 mt-3">
                                                <button
                                                    onClick={downloadQRCode}
                                                    className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs"
                                                >
                                                    <FaDownload />
                                                    Download
                                                </button>
                                                <button
                                                    onClick={handleCopyAddress}
                                                    className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-xs"
                                                >
                                                    {copied ? <FaCheck /> : <FaCopy />}
                                                    {copied ? 'Copied' : 'Copy'}
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center bg-gray-950 border border-gray-600/50 rounded-xl p-3">
                                    <p className="flex-1 text-sm font-mono text-gray-300 truncate">
                                        {address}
                                    </p>
                                    <button
                                        onClick={handleCopyAddress}
                                        disabled={!address || address === "Address not available" || address === "Loading..." || loading || !loan}
                                        className="ml-3 p-2 rounded-lg bg-gray-600/50 hover:bg-gray-600"
                                    >
                                        {copied ? (
                                            <FaCheck className="text-green-400 text-sm" />
                                        ) : (
                                            <FaCopy className="text-gray-400 text-sm" />
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* File Upload (External Wallet) */}
                    {paymentMethod === PAYMENT_METHODS.EXTERNAL_WALLET && (
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Payment Proof
                            </label>
                            <div className="border-2 border-dashed border-gray-600/50 rounded-xl p-4 text-center hover:border-blue-500/50">
                                <input
                                    type="file"
                                    className="hidden"
                                    id="fileInput"
                                    onChange={handleFileUpload}
                                    accept=".jpg,.jpeg,.png,.webp,.pdf"
                                    disabled={loading || !loan}
                                />
                                <label htmlFor="fileInput" className="cursor-pointer">
                                    <div className="flex flex-col items-center">
                                        <FaUpload className="text-gray-400 text-xl mx-auto mb-2" />
                                        {file ? (
                                            <div className="w-full">
                                                <div className="flex items-center justify-between bg-green-500/10 p-2 rounded-lg mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle className="h-3 w-3 text-green-400" />
                                                        <span className="text-green-400 font-medium text-xs truncate">
                                                            {file.name}
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            removeFile();
                                                        }}
                                                        className="text-red-400 hover:text-red-300 p-1 text-xs"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <p className="text-gray-400 text-sm mb-1">
                                                    Upload proof
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    PNG, JPG, WebP, PDF (Max 10MB)
                                                </p>
                                            </>
                                        )}
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="mb-6">
                        <button
                            onClick={handleSubmit}
                            disabled={loading || !amount || !loan}
                            className={`w-full py-3 rounded-xl font-semibold text-sm ${!loading && amount && loan
                                    ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                                    : "bg-gray-600 text-gray-400 cursor-not-allowed"
                                }`}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <FaSpinner className="animate-spin" />
                                    Processing...
                                </span>
                            ) : !loan ? (
                                "No Active Loan"
                            ) : paymentMethod === PAYMENT_METHODS.DEPOSIT_ACCOUNT ? (
                                `Pay ${amount} ${selectedDepositCurrency}`
                            ) : (
                                "Submit Payment"
                            )}
                        </button>
                    </div>

                    {/* Important Notice */}
                    <div className="bg-yellow-500/10 rounded-xl p-3 border border-yellow-500/90">
                        <div className="flex items-start gap-2">
                            <FaExclamationTriangle className="text-yellow-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <h3 className="font-semibold text-white text-sm mb-2">Important</h3>
                                <ul className="text-xs text-gray-300 space-y-1">
                                    {paymentMethod === PAYMENT_METHODS.EXTERNAL_WALLET && (
                                        <>
                                            <li className="flex items-start">
                                                <span className="text-yellow-400 mr-1">•</span>
                                                Only send {coin} on {network}
                                            </li>
                                            <li className="flex items-start">
                                                <span className="text-yellow-400 mr-1">•</span>
                                                10-30 minute confirmation time
                                            </li>
                                        </>
                                    )}
                                    <li className="flex items-start">
                                        <span className="text-yellow-400 mr-1">•</span>
                                        Late payments may incur fees
                                    </li>
                                    {paymentMethod === PAYMENT_METHODS.DEPOSIT_ACCOUNT && (
                                        <li className="flex items-start">
                                            <span className="text-yellow-400 mr-1">•</span>
                                            Payments from wallet are instant
                                        </li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Security Footer */}
                <div className="text-center mt-6">
                    <p className="text-gray-500 text-xs">
                        🔒 Secure & Encrypted Transactions
                    </p>
                </div>
            </div>
        </div>
    );
}