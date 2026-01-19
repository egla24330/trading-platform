import { useState, useRef, useEffect } from "react";
import {
    FaCopy,
    FaUpload,
    FaQrcode,
    FaCheck,
    FaDownload,
    FaSpinner,
    FaExclamationTriangle
} from "react-icons/fa";
import QRCode from "qrcode";
import { ArrowLeft, AlertCircle, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import MobileNav from "../components/MobileNav";
import axios from "axios";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// API configuration
const API_URL = 'https://trading-platform-qfig.onrender.com/api';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor to add token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('userData');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Deposit service
const depositService = {
    // Get deposit addresses
    getDepositAddresses: async () => {
        try {
            const response = await api.get('/deposits/addresses');
            return response.data;


        } catch (error) {
            throw error.response?.data || { message: 'Network error' };
        }
    },

    // Create deposit
    createDeposit: async (depositData, file) => {
        try {
            const formData = new FormData();

            // Append deposit data
            Object.keys(depositData).forEach(key => {
                formData.append(key, depositData[key]);
            });

            // Append file if exists
            if (file) {
                formData.append('proofImage', file);
            }

            const response = await api.post('/deposits/submit', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            console.log({'data':response.data})

            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Network error' };
        }
    },

    // Check KYC status
    checkKYCStatus: async () => {
        try {
            const response = await api.get('/kyc/user/status');
            console.log({'testrespnese': response })
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Network error' };
        }
    }
};

// Default deposit data
const DEFAULT_DEPOSIT_DATA = {
    BTC: {
        icon: assets.bitcoin,
        color: "text-orange-500",
        bgColor: "bg-orange-500/10",
        borderColor: "border-orange-500/30",
        networks: {
            Bitcoin: "Loading...",
            Lightning: "Loading..."
        },
    },
    ETH: {
        icon: assets.ethereum,
        color: "text-purple-500",
        bgColor: "bg-purple-500/10",
        borderColor: "border-purple-500/30",
        networks: {
            Ethereum: "Loading...",
            Arbitrum: "Loading..."
        },
    },
    USDT: {
        icon: assets.tether,
        color: "text-green-500",
        bgColor: "bg-green-500/10",
        borderColor: "border-green-500/30",
        networks: {
            TronTRC20: "Loading...",
            ERC20: "Loading..."
        },
    },
   /* BNB: {
        icon: assets.binance,
        color: "text-yellow-500",
        bgColor: "bg-yellow-500/10",
        borderColor: "border-yellow-500/30",
        networks: {
            BEP20: "Loading..."
        },
    }*/
};

export default function Deposit() {
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        fetchDepositAddresses();
        checkKYCRequirement();
    }, []);

    const [coin, setCoin] = useState("BTC");
    const [network, setNetwork] = useState("Bitcoin");
    const [amount, setAmount] = useState("");
    const [transactionHash, setTransactionHash] = useState("");
    const [fromAddress, setFromAddress] = useState("");
    const [file, setFile] = useState(null);
    const [copied, setCopied] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [generatingQR, setGeneratingQR] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetchingAddresses, setFetchingAddresses] = useState(true);
    const [kycStatus, setKycStatus] = useState(null);
    const [accountVerified, setAccountVerified] = useState(true);
    const [depositAddresses, setDepositAddresses] = useState(DEFAULT_DEPOSIT_DATA);
    const qrCanvasRef = useRef(null);
    const navigate = useNavigate();

    const currentCoin = depositAddresses[coin];
    const CoinIcon = currentCoin?.icon;
    const address = currentCoin?.networks?.[network] || "Loading...";

    // Fetch deposit addresses from backend
    const fetchDepositAddresses = async () => {
        try {
            setFetchingAddresses(true);
            const response = await depositService.getDepositAddresses();
            if (response.success && response.data) {
                setDepositAddresses(prev => {
                    const updated = { ...prev };
                    Object.keys(response.data).forEach(currency => {
                        if (updated[currency]) {
                            updated[currency].networks = response.data[currency];
                        }
                    });
                    return updated;
                });

                // Set first network for current coin
                if (response.data[coin]) {
                    const firstNetwork = Object.keys(response.data[coin])[0];
                    if (firstNetwork) {
                        setNetwork(firstNetwork);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to fetch deposit addresses:', error);
            toast.error(error.message || 'Failed to load deposit addresses');
        } finally {
            setFetchingAddresses(false);
        }
    };

    // Check KYC requirement
    const checkKYCRequirement = async () => {
        try {
            const response = await depositService.checkKYCStatus();
            if (response.success) {

                console.log({'seykycstatus':response.status})
                setKycStatus(response);
                // Check if user has verified account
                const user = JSON.parse(localStorage.getItem('userData') || '{}');
                console.log({user})
                setAccountVerified(user.isAccountVerified || false);
            }
        } catch (error) {
            console.error('Failed to check KYC status:', error);
        }
    };

    const generateQRCode = async () => {
        if (!showQR && address && address !== "Loading...") {
            setShowQR(true);
            setTimeout(() => {
                generateQR();
            }, 100);
        } else {
            setShowQR(false);
        }
    };

    const generateQR = async () => {
        if (!qrCanvasRef.current || !address || address === "Loading...") return;

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
            console.error('Error generating QR code:', err);
            toast.error('Failed to generate QR code');
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
            downloadLink.download = `${coin}-${network}-address.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            toast.success('QR code downloaded successfully');
        } catch (err) {
            console.error('Error downloading QR code:', err);
            toast.error('Failed to download QR code');
        }
    };

    const handleCopyAddress = async () => {
        if (!address || address === "Loading...") {
            toast.error('Address not available');
            return;
        }

        try {
            await navigator.clipboard.writeText(address);
            setCopied(true);
            toast.success('Address copied to clipboard!');
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy: ', err);
            toast.error('Failed to copy address');
        }
    };

    const handleFileUpload = (e) => {
        const uploadedFile = e.target.files[0];
        if (uploadedFile) {

            
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
            if (!validTypes.includes(uploadedFile.type)) {
                toast.error('Please upload a valid file (JPEG, PNG, WebP, or PDF)');
                return;
            }
            if (uploadedFile.size > 10 * 1024 * 1024) {
                toast.error('File size must be less than 10MB');
                return;
            }
            setFile(uploadedFile);
            toast.success('File uploaded successfully');
        }
    };

    const validateForm = () => {
        const errors = [];

        if (!amount || parseFloat(amount) <= 0) {
            errors.push('Please enter a valid amount');
        }

        if (!transactionHash.trim()) {
            errors.push('Please enter transaction hash');
        }

        if (!file) {
            errors.push('Please upload deposit proof');
        }

        // Minimum amounts
        const minAmounts = {
            'BTC': 0.0001,
            'ETH': 0.001,
            'USDT': 10,
            'BNB': 0.01
        };

        const amountNum = parseFloat(amount);
        const minAmount = minAmounts[coin] || 1;
        if (amountNum < minAmount) {
            errors.push(`Minimum deposit for ${coin} is ${minAmount}`);
        }

        return errors;
    };

    const handleSubmit = async () => {
        // Validate form
        const errors = validateForm();
        if (errors.length > 0) {
            errors.forEach(error => toast.error(error));
            return;
        }

        // Check KYC status
        if (kycStatus?.status !== 'approved') {
            toast.error('KYC verification required. Please complete KYC verification first.');
            navigate('/kyc');
            return;
        }

        // Check account verification
        if (!accountVerified) {
            toast.error('Account verification required. Please verify your email first.');
            navigate('/verify');
            return;
        }

        try {
            setLoading(true);

            const depositData = {
                currency: coin,
                network: network,
                amount: parseFloat(amount),
                txHash: transactionHash.trim(),
                toAddress: address,
                fromAddress: fromAddress.trim() || 'Unknown',
                note: `Deposit ${amount} ${coin} via ${network}`
            };

            const response = await depositService.createDeposit(depositData, file);

            if (response.success) {
                //toast.success('Deposit submitted successfully!');
                // Show success message with transaction ID
                toast.success(
                    <div>
                        <div className="font-bold">Deposit Submitted successfully!</div>
                        {/* <div className="text-sm mt-1">Transaction ID: {}</div> */}
                        <div className="text-xs mt-2 text-gray-400">Please wait for admin approval</div>
                    </div>,
                    { autoClose: 7000 }
                );

                // Reset form
                setAmount("");
                setTransactionHash("");
                setFromAddress("");
                setFile(null);

                // Redirect to deposits history after 2 seconds
              //  setTimeout(() => {
               //     navigate('/deposits/history');
              //  }, 2000);
            }else{
                  toast.error(response ?.message || 'Failed to submit deposit. Please try again.');
                console.log({response})
            }


        } catch (error) {
            console.error('Deposit submission error:', error);
            toast.error(error.message || 'Failed to submit deposit. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleNetworkChange = (newNetwork) => {
        setNetwork(newNetwork);
        setShowQR(false);
    };

    const handleCoinChange = (newCoin) => {
        setCoin(newCoin);
        // Set first network for new coin
        const networks = depositAddresses[newCoin]?.networks;
        if (networks && Object.keys(networks).length > 0) {
            setNetwork(Object.keys(networks)[0]);
        }
        setShowQR(false);
    };

    const removeFile = () => {
        setFile(null);
        toast.info('File removed');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black py-4 px-4 mb-20">
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
            />
            <MobileNav />
            <div className="max-w-md mx-auto">
                {/* Header */}
                <div onClick={() => navigate('/')} className="flex items-center gap-1 cursor-pointer mb-4">
                    <button className="hover:bg-gray-800/50 rounded-xl p-2">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <p className="text-gray-300">Back</p>
                </div>

                {/* KYC Warning */}
                {kycStatus?.status !== 'approved' && (
                    <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        <div className="flex items-start gap-3">
                            {/* <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" /> */}
                            <div>
                                <h3 className="font-medium text-yellow-400 mb-1">KYC Verification Required</h3>
                                <p className="text-yellow-300/80 text-xs sm:text-sm">
                                    Please complete KYC verification before making deposits.
                                    <button
                                        onClick={() => navigate('/kyc')}
                                        className="ml-2 text-yellow-300 underline hover:text-yellow-200"
                                    >
                                        Verify Now
                                    </button>
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Account Verification Warning */}
                {!accountVerified && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <div className="flex items-start gap-3">
                            <FaExclamationTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <h3 className="font-medium text-red-400 mb-1">Account Not Verified</h3>
                                <p className="text-red-300/80 text-sm">
                                    Please verify your email address before making deposits.
                                    <button
                                        onClick={() => navigate('/verify')}
                                        className="ml-2 text-red-300 underline hover:text-red-200"
                                    >
                                        Verify Email
                                    </button>
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Loading Overlay */}
                {loading && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                        <div className="bg-gray-800 p-6 rounded-xl flex flex-col items-center">
                            <FaSpinner className="animate-spin text-3xl text-blue-500 mb-3" />
                            <p className="text-white">Processing your deposit...</p>
                            <p className="text-gray-400 text-sm mt-2">Please don't close this window</p>
                        </div>
                    </div>
                )}

                {/* Main Card */}
                <div className="sm:bg-gray-800/50 sm:backdrop-blur-lg rounded-2xl sm:border sm:border-gray-700/50 p-2 sm:p-4 shadow-2xl">
                    <h1 className="text-xl font-bold text-white mb-2 text-center">Make a Deposit</h1>
                    <p className="text-gray-400 text-sm text-center mb-6">Send cryptocurrency to your wallet</p>

                    {/* Coin Selection */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-300 mb-3">
                            Select Currency
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {Object.entries(depositAddresses).map(([key, data]) => {
                                return (
                                    <button
                                        key={key}
                                        onClick={() => handleCoinChange(key)}
                                        disabled={fetchingAddresses || loading}
                                        className={`p-3 rounded-xl border-2 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${coin === key
                                            ? `${data.bgColor} ${data.borderColor} border-2 scale-105`
                                            : "border-gray-600/50 hover:border-gray-500"
                                            }`}
                                    >
                                        <img
                                            src={data.icon}
                                            alt={key}
                                            className={`w-8 h-8 mx-auto mb-2 ${coin === key ? "" : "grayscale brightness-75"}`}
                                        />
                                        <span className={`font-semibold text-sm ${coin === key ? "text-white" : "text-gray-400"}`}>
                                            {key}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Network Selection */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Network
                        </label>
                        <select
                            value={network}
                            onChange={(e) => handleNetworkChange(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-600/50 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
                            disabled={fetchingAddresses || loading || !currentCoin?.networks}
                        >
                            {currentCoin?.networks && Object.keys(currentCoin.networks).map((net) => (
                                <option key={net} value={net} className="bg-gray-800">
                                    {net}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Amount Input */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Amount
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                placeholder="0.00"
                                className="w-full bg-gray-900 border border-gray-600/50 rounded-xl p-3 pr-20 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                disabled={loading}
                                min="0"
                                step="0.00000001"
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                                <span className="text-gray-300 font-medium">{coin}</span>
                            </div>
                        </div>
                        <p className="text-gray-500 text-xs mt-1">
                            Minimum: {
                                coin === 'BTC' ? '0.0001 BTC' :
                                    coin === 'ETH' ? '0.001 ETH' :
                                        coin === 'USDT' ? '10 USDT' :
                                            coin === 'BNB' ? '0.01 BNB' : '1'
                            }
                        </p>
                    </div>

                    {/* Transaction Hash Input */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Transaction Hash
                            <span className="text-red-400 ml-1">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Enter transaction hash from your wallet"
                            className="w-full bg-gray-900 border border-gray-600/50 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
                            value={transactionHash}
                            onChange={(e) => setTransactionHash(e.target.value)}
                            disabled={loading}
                        />
                        <p className="text-gray-500 text-xs mt-1">
                            Copy the transaction hash from your wallet after sending
                        </p>
                    </div>

                    {/* From Address (Optional) */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Your Wallet Address (Optional)
                        </label>
                        <input
                            type="text"
                            placeholder="Address you sent from (helps verification)"
                            className="w-full bg-gray-900 border border-gray-600/50 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
                            value={fromAddress}
                            onChange={(e) => setFromAddress(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    {/* Address Section */}
                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-gray-300">
                                Deposit Address
                                {fetchingAddresses && (
                                    <span className="ml-2 text-xs text-yellow-400">Loading...</span>
                                )}
                            </label>
                            <button
                                onClick={generateQRCode}
                                disabled={!address || address === "Loading..." || fetchingAddresses || loading}
                                className="text-blue-400 hover:text-blue-300 transition-colors text-sm flex items-center gap-1 disabled:opacity-50"
                            >
                                <FaQrcode />
                                {showQR ? 'Hide QR' : 'Show QR'}
                            </button>
                        </div>

                        {showQR ? (
                            <div className="bg-gray-950 p-4 rounded-xl flex flex-col items-center justify-center">
                                {generatingQR ? (
                                    <div className="w-40 h-40 flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                    </div>
                                ) : (
                                    <>
                                        <canvas
                                            ref={qrCanvasRef}
                                            className="w-48 h-48 rounded-lg"
                                        />
                                        <p className="text-white mt-3 text-center font-mono text-xs break-all max-w-xs">
                                            {address}
                                        </p>
                                        <div className="flex gap-2 mt-3">
                                            <button
                                                onClick={downloadQRCode}
                                                disabled={loading}
                                                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm disabled:opacity-50"
                                            >
                                                <FaDownload className="text-sm" />
                                                Download QR
                                            </button>
                                            <button
                                                onClick={handleCopyAddress}
                                                disabled={loading}
                                                className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm disabled:opacity-50"
                                            >
                                                <FaCopy className="text-sm" />
                                                Copy
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center bg-gray-950 border border-gray-600/50 rounded-xl p-3 group hover:border-gray-500 transition-all">
                                <p className="flex-1 text-sm font-mono text-gray-300 truncate">
                                    {address}
                                </p>
                                <button
                                    onClick={handleCopyAddress}
                                    disabled={!address || address === "Loading..." || fetchingAddresses || loading}
                                    className="ml-3 p-2 rounded-lg bg-gray-600/50 hover:bg-gray-600 transition-all group disabled:opacity-50"
                                >
                                    {copied ? (
                                        <FaCheck className="text-green-400" />
                                    ) : (
                                        <FaCopy className="text-gray-400 group-hover:text-white" />
                                    )}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* File Upload */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Upload Deposit Proof (Screenshot/Receipt)
                            <span className="text-red-400 ml-1">*</span>
                        </label>
                        <div className="border-2 border-dashed border-gray-600/50 rounded-xl p-4 text-center transition-all hover:border-blue-500/50 cursor-pointer group">
                            <input
                                type="file"
                                className="hidden"
                                id="fileInput"
                                onChange={handleFileUpload}
                                accept=".jpg,.jpeg,.png,.webp,.pdf"
                                disabled={loading}
                            />
                            <label htmlFor="fileInput" className="cursor-pointer disabled:opacity-50">
                                <div className="flex flex-col items-center">
                                    <FaUpload className="text-gray-400 group-hover:text-blue-400 text-2xl mx-auto mb-3 transition-colors" />

                                    {file ? (
                                        <div className="w-full">
                                            <div className="flex items-center justify-between bg-green-500/10 p-2 rounded-lg mb-2">
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle className="h-4 w-4 text-green-400" />
                                                    <span className="text-green-400 font-medium text-sm truncate">
                                                        {file.name}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeFile();
                                                    }}
                                                    className="text-red-400 hover:text-red-300 p-1"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                            <p className="text-gray-400 text-xs">
                                                {(file.size / (1024 * 1024)).toFixed(2)} MB • Click to change file
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-gray-400 group-hover:text-gray-300 transition-colors mb-1">
                                                Click to upload or drag & drop
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                PNG, JPG, WebP, PDF (Max 10MB)
                                            </p>
                                        </>
                                    )}
                                </div>
                            </label>
                        </div>
                        <p className="text-gray-500 text-xs mt-1">
                            Upload screenshot of your wallet transaction or bank receipt
                        </p>
                    </div>

                    {/* Submit Button */}
                    <div className="mb-6">
                        <button
                            onClick={handleSubmit}
                            disabled={loading || fetchingAddresses || !file || !amount || !transactionHash || kycStatus?.status !== 'approved' || !accountVerified}
                            className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 ${!loading && !fetchingAddresses && file && amount && transactionHash && kycStatus?.status === 'approved' && accountVerified
                                ? "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 text-white shadow-lg"
                                : "bg-gray-600 text-gray-400 cursor-not-allowed"
                                }`}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <FaSpinner className="animate-spin" />
                                    Processing...
                                </span>
                            ) : fetchingAddresses ? (
                                <span className="flex items-center justify-center gap-2">
                                    <FaSpinner className="animate-spin" />
                                    Loading...
                                </span>
                            ) : kycStatus?.status !== 'approved' ? (
                                "Complete KYC First"
                            ) : !accountVerified ? (
                                "Verify Account First"
                            ) : (
                                "Submit Deposit"
                            )}
                        </button>
                    </div>

                    {/* Important Notice */}
                    <div className="bg-yellow-500/10 rounded-xl p-4 border border-yellow-500/90">
                        <div className="flex items-start gap-3">
                            {/* <div className="p-1 rounded-lg bg-red-500/20 mt-0.5 flex-shrink-0">
                                <span className="text-red-400 font-bold">!</span>
                            </div> */}
                            <div>
                                <h3 className="font-semibold text-white mb-2">Important Notice</h3>
                                <ul className="text-xs text-gray-300 space-y-2">
                                    <li className="flex items-start">
                                        <span className="text-yellow-400 mr-2">•</span>
                                        Only send <span className="font-semibold text-white">{coin}</span> on the <span className="font-semibold text-white">{network}</span> network
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-yellow-400 mr-2">•</span>
                                        Sending other assets or using wrong networks may result in permanent loss
                                    </li>
                                    {/* <li className="flex items-start">
                                        <span className="text-yellow-400 mr-2">•</span>
                                        Transaction may take 10-30 minutes to confirm
                                    </li> */}
                                    <li className="flex items-start">
                                        <span className="text-yellow-400 mr-2">•</span>
                                        Keep your transaction hash for reference
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-yellow-400 mr-2">•</span>
                                        Deposits require admin approval (usually within 24 hours)
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Info Box */}
                    {/* <div className="mt-4 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                        <div className="flex items-start gap-2">
                            <div className="p-1 rounded bg-blue-500/10">
                                <span className="text-blue-400 text-sm">ℹ️</span>
                            </div>
                            <div>
                                <p className="text-blue-300 text-xs">
                                    Need help? Contact support if your deposit doesn't appear within 30 minutes of confirmation.
                                </p>
                            </div>
                        </div>
                    </div> */}
                </div>

                {/* Security Footer */}
                <div className="text-center mt-6">
                    <p className="text-gray-500 text-sm">
                        🔒 Secure & Encrypted Transactions • 256-bit SSL Encryption
                    </p>
                    <p className="text-gray-600 text-xs mt-1">
                        Your funds are protected by enterprise-grade security
                    </p>
                </div>
            </div>
        </div>
    );
}