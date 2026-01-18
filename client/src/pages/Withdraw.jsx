import { useState, useRef, useEffect } from "react";
import { FaPaste, FaUpload, FaQrcode, FaCheck, FaBitcoin, FaEthereum, FaDollarSign, FaDownload, FaExternalLinkAlt } from "react-icons/fa";
import QRCode from "qrcode";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import ConfirmationModal from "../components/ConfirmationModal.jsx";
import MobileNav from "../components/MobileNav.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import axios from "axios";

import { toast } from "react-toastify";

const WITHDRAW_DATA = {
    BTC: {
        icon: assets.bitcoin,
        color: "text-orange-500",
        bgColor: "bg-orange-500/10",
        borderColor: "border-orange-500/30",
        networks: {
            Bitcoin: "Bitcoin",
            // Lightning: "Lightning",
        },
        fees: {
            Bitcoin: "0.0005 BTC",
            //Lightning: "0.0001 BTC"
        }
    },
    ETH: {
        icon: assets.ethereum,
        color: "text-purple-500",
        bgColor: "bg-purple-500/10",
        borderColor: "border-purple-500/30",
        networks: {
            Ethereum: "Ethereum",
            Arbitrum: "Arbitrum",
        },
        fees: {
            Ethereum: "0.003 ETH",
            Arbitrum: "0.0005 ETH"
        }
    },
    USDT: {
        icon: assets.tether,
        color: "text-green-500",
        bgColor: "bg-green-500/10",
        borderColor: "border-green-500/30",
        networks: {
            TRC20: "TRC20",
            ERC20: "ERC20",
            BEP20: "BEP20"
        },
        fees: {
            TRC20: "2 USDT",
            ERC20: "12 USDT",
            BEP20: "2.8 USDT"
        }
    },

};

export default function WithdrawPage() {

    const { backendUrl, userData, token } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        fetchUserBalances();
    }, []);

    const [coin, setCoin] = useState("USDT");
    const [network, setNetwork] = useState("TRC20");
    const [amount, setAmount] = useState("");
    const [withdrawAddress, setWithdrawAddress] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [userBalances, setUserBalances] = useState({
        USDT: 0,
        BTC: 0,
        ETH: 0
    });

    const currentCoin = WITHDRAW_DATA[coin];
    const networkFee = currentCoin?.fees[network] || "0";

    // Fetch user balances from backend
    const fetchUserBalances = async () => {
        try {
            const response = await axios.get(`${backendUrl}api/auth/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log({ balance: response.data.user.wallet.usdt })

            if (response.data.success) {
                const { wallet } = response.data.user;
                setUserBalances({
                    USDT: wallet?.usdt || 0,
                    BTC: wallet?.btc || 0,
                    ETH: wallet?.eth || 0
                });
            } else {
                toast.error(response.data.message || 'something went wrong')
            }
        } catch (error) {
            console.error("Error fetching user balances:", error);
            toast.error("Failed to load balance data");
        }
    };

    const handleMaxAmount = () => {
        const balance = userBalances[coin];
        if (!balance || balance <= 0) {
            toast.error("Insufficient balance");
            return;
        }

        // Extract numeric fee value (remove currency)
        const feeMatch = networkFee.match(/[\d\.]+/);
        const fee = feeMatch ? parseFloat(feeMatch[0]) : 0;

        const maxAmount = balance - fee;
        setAmount(Math.max(0, maxAmount).toFixed(8));
    };

    const handleWithdraw = async () => {
        setLoading(true);
        setIsSubmitting(true);

        try {
            const response = await axios.post(
                `${backendUrl}api/withdrawals`,
                {
                    amount: parseFloat(amount),
                    currency: coin,
                    network: network,
                    toAddress: withdrawAddress,

                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log(response)

            if (response.data.success) {
                toast.info('Withdrawal request submitted successfully!');
                setModalOpen(false);

                // Reset form
                setAmount("");
                setWithdrawAddress("");

                // Update balances
                await fetchUserBalances();

                // Redirect to withdrawals history or show success message
                /*
              setTimeout(() => {
                      navigate('/');
                  }, 1500);
                
                */
            } else {
                toast.error(response.data.message || 'Withdrawal failed');
            }
        } catch (error) {
            console.error("Withdrawal error:", error);
            toast.error(response.data.message || 'Withdrawal failed');
            /*
            if (error.response) {
                // Server responded with error status
                const errorMessage = error.response.data?.message || 
                                   error.response.data?.error || 
                                   'Withdrawal failed';
                toast.error(errorMessage);
                
                // Handle specific error cases
                if (error.response.status === 403) {
                    toast.error("Please complete KYC verification first");
                } else if (error.response.status === 400 && error.response.data.message?.includes("balance")) {
                    // Update balance if server says insufficient
                    await fetchUserBalances();
                }
            } else if (error.request) {
                // Request made but no response
                toast.error("Network error. Please check your connection.");
            } else {
                // Other errors
                toast.error("An unexpected error occurred");
            }
            */
        } finally {
            setLoading(false);
            setIsSubmitting(false);
        }
    };

    const withdraw = () => {
        // Validation
        if (!withdrawAddress) {
            toast.error('Please enter withdrawal address');
            return;
        }

        if (!amount || parseFloat(amount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        if (parseFloat(amount) > userBalances[coin]) {
            toast.error('Insufficient balance');
            return;
        }

        if (!isValidAddress()) {
            toast.error('Invalid withdrawal address format');
            return;
        }

        // Check minimum withdrawal amount
        const minWithdrawal = getMinimumWithdrawal();
        if (parseFloat(amount) < minWithdrawal) {
            toast.error(`Minimum withdrawal: ${minWithdrawal} ${coin}`);
            return;
        }

        setModalOpen(true);
    };

    const isValidAddress = () => {
        if (!withdrawAddress) return true;

        const address = withdrawAddress.trim();

        switch (coin) {
            case 'USDT':
                switch (network) {
                    case 'TRC20':
                        return address.length === 34 && address.startsWith('T');
                    case 'ERC20':
                    case 'BEP20':
                        return address.length === 42 && address.startsWith('0x');
                    default:
                        return address.length > 10; // Basic validation
                }
            case 'BTC':
                return address.length >= 26 && address.length <= 35;
            case 'ETH':
                return address.length === 42 && address.startsWith('0x');
            default:
                return address.length > 10;
        }
    };

    const getMinimumWithdrawal = () => {
        const minAmounts = {
            USDT: 10,
            BTC: 0.001,
            ETH: 0.01
        };
        return minAmounts[coin] || 0;
    };

    const getNetworkFeeValue = () => {
        const feeMatch = networkFee.match(/[\d\.]+/);
        return feeMatch ? parseFloat(feeMatch[0]) : 0;
    };

    const getReceiveAmount = () => {
        const amountNum = parseFloat(amount) || 0;
        const fee = getNetworkFeeValue();
        return Math.max(0, amountNum - fee).toFixed(8);
    };

    const formatBalance = (balance) => {
        return balance?.toFixed(3) || "0.000";
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black py-4 px-1.5 sm:px-4 mb-20">
            <MobileNav />

            <ConfirmationModal
                isOpen={modalOpen}
                amount={amount}
                coin={coin}
                network={network}
                withdrawAddress={withdrawAddress}
                fee={networkFee}
                receiveAmount={getReceiveAmount()}
                isSubmitting={loading}
                onCancel={() => setModalOpen(false)}
                onConfirm={handleWithdraw}
            />

            <div className="max-w-md mx-auto">
                {/* Header */}
                <div
                    onClick={() => navigate('/')}
                    className="flex items-center gap-1 cursor-pointer mb-4"
                >
                    <button className="hover:bg-gray-800/50 rounded-xl p-2">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2">
                        <p className="text-white">Back</p>
                    </div>
                </div>

                {/* Balance Card */}
                <div className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-2xl border border-blue-500/30 p-4 mb-6">
                    <div className="text-center">
                        <p className="text-gray-300 text-sm mb-1">Available Balance</p>
                        <p className="text-2xl font-bold text-white">
                            {formatBalance(userBalances[coin])} {coin}
                        </p>
                        <div className="flex justify-center gap-4 mt-2">
                            {Object.entries(userBalances).map(([key, value]) => (
                                <div key={key} className="text-center">
                                    <p className="text-xs text-gray-400">{key}</p>
                                    <p className="text-sm text-gray-300">{formatBalance(value)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Card */}
                <div className="sm:bg-gray-800/50 sm:backdrop-blur-lg rounded-2xl sm:border sm:border-gray-700/50 p-2 shadow-2xl">
                    {/* Coin Selection */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-300 mb-3">
                            Select Currency
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {Object.entries(WITHDRAW_DATA).map(([key, data]) => {
                                const balance = userBalances[key] || 0;
                                return (
                                    <button
                                        key={key}
                                        onClick={() => {
                                            setCoin(key);
                                            setNetwork(Object.keys(data.networks)[0]);
                                            setWithdrawAddress("");
                                        }}
                                        disabled={balance <= 0}
                                        className={`p-2 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${coin === key
                                            ? `${data.bgColor} ${data.borderColor} border-2 scale-105`
                                            : "border-gray-600/50 hover:border-gray-500"
                                            } ${balance <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <img
                                            src={data.icon}
                                            alt={key}
                                            className={`w-6 h-6 mx-auto mb-2 ${coin === key ? "" : "grayscale brightness-75"}`}
                                        />


                                        <span className={` ${coin === key ? "text-white" : "text-gray-400"}`}>
                                            {key}
                                        </span>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {formatBalance(balance)}
                                        </p>
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
                            onChange={(e) => {
                                setNetwork(e.target.value);
                                setWithdrawAddress("");
                            }}
                            className="w-full bg-gray-900 border border-gray-600/50 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                            {Object.keys(currentCoin.networks).map((net) => (
                                <option key={net} value={net} className="bg-gray-800">
                                    {net} - Fee: {currentCoin.fees[net]}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-400 mt-1">
                            Network fee: {networkFee}
                        </p>
                    </div>

                    {/* Amount Input */}
                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-gray-300">
                                Amount
                            </label>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleMaxAmount}
                                    disabled={userBalances[coin] <= 0}
                                    className="text-blue-400 hover:text-blue-300 text-xs px-2 py-1 border border-blue-400/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    MAX
                                </button>
                                <button
                                    onClick={() => setAmount(getMinimumWithdrawal().toString())}
                                    className="text-gray-400 hover:text-gray-300 text-xs px-2 py-1 border border-gray-400/50 rounded-lg transition-colors"
                                >
                                    MIN
                                </button>
                            </div>
                        </div>
                        <div className="relative">
                            <input
                                type="number"
                                placeholder="0.00"
                                className="w-full bg-gray-900 border border-gray-600/50 rounded-xl p-3 pr-20 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}

                                min={getMinimumWithdrawal()}
                                max={userBalances[coin]}
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                                <span className="text-gray-300 font-medium">{coin}</span>
                            </div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>Minimum: {getMinimumWithdrawal()} {coin}</span>
                            <span>Available: {formatBalance(userBalances[coin])} {coin}</span>
                        </div>
                        {amount && parseFloat(amount) > 0 && (
                            <p className="text-xs text-blue-400 mt-1">
                                You will receive: {getReceiveAmount()} {coin} (after {networkFee} fee)
                            </p>
                        )}
                    </div>

                    {/* Withdrawal Address */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Withdrawal Address
                        </label>
                        <div className={`flex items-center bg-gray-900 border rounded-xl p-3 group transition-all
                            ${!isValidAddress() && withdrawAddress ? 'border-red-700' : 'border-gray-600/50 hover:border-gray-500'}`}>
                            <input
                                type="text"
                                placeholder={`Enter ${network} address`}
                                className="flex-1 bg-transparent text-sm font-mono text-gray-300 placeholder-gray-500 focus:outline-none"
                                value={withdrawAddress}
                                onChange={(e) => setWithdrawAddress(e.target.value)}
                            />
                            <button
                                onClick={async () => {
                                    try {
                                        const text = await navigator.clipboard.readText();
                                        if (text) setWithdrawAddress(text);
                                    } catch (err) {
                                        console.error("Clipboard paste failed:", err);
                                        toast.error("Unable to access clipboard");
                                    }
                                }}
                                className="ml-3 p-2 rounded-lg bg-gray-700/40 hover:bg-gray-700 transition-all duration-200"
                                title="Paste from clipboard"
                            >
                                <FaPaste className="text-gray-400 group-hover:text-white transition-colors" />
                            </button>
                        </div>

                        {!isValidAddress() && withdrawAddress && (
                            <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                                ⚠️ Invalid {network} address format
                            </p>
                        )}

                        {isValidAddress() && withdrawAddress && (
                            <p className="text-green-400 text-xs mt-2 flex items-center gap-1">
                                ✓ Valid {network} address
                            </p>
                        )}
                    </div>

                    {/* Action Button */}
                    <div className="mt-4 space-y-3">
                        <button
                            onClick={withdraw}
                            disabled={
                                !withdrawAddress ||
                                !amount ||
                                parseFloat(amount) <= 0 ||
                                parseFloat(amount) > userBalances[coin] ||
                                parseFloat(amount) < getMinimumWithdrawal() ||
                                !isValidAddress() ||
                                isSubmitting
                            }
                            className={`w-full py-4 rounded-xl font-semibold transition-all duration-300 ${withdrawAddress &&
                                    amount &&
                                    parseFloat(amount) >= getMinimumWithdrawal() &&
                                    parseFloat(amount) <= userBalances[coin] &&
                                    isValidAddress() &&
                                    !isSubmitting
                                    ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 text-white shadow-lg"
                                    : "bg-gray-600 text-gray-400 cursor-not-allowed"
                                }`}
                        >
                            {isSubmitting ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Processing...
                                </div>
                            ) : (
                                `Withdraw ${coin}`
                            )}
                        </button>

                        {/* <button
                            onClick={() => navigate('/withdrawals/history')}
                            className="w-full py-3 bg-gray-700/50 hover:bg-gray-700 rounded-xl text-gray-300 hover:text-white transition-colors"
                        >
                            View Withdrawal History
                        </button> */}
                    </div>

                    {/* Important Information */}
                    <div className="bg-blue-500/10 rounded-xl p-3 mt-6 border border-blue-500/20">
                        <div className="flex items-start gap-3">
                            <div className="text-blue-400 mt-0.5">
                                ℹ️
                            </div>
                            <div>
                                <h3 className="font-semibold text-blue-400 mb-1">Important Information</h3>
                                <ul className="text-xs text-blue-300 space-y-1">
                                    <li>• Only withdraw {coin} to {network} addresses</li>
                                    <li>• Minimum withdrawal: {getMinimumWithdrawal()} {coin}</li>
                                    <li>• Network fee: {networkFee}</li>
                                    <li>• KYC verification required for withdrawals</li>
                                    <li>• Processing time: 5-30 minutes</li>
                                    <li>• Transactions are irreversible</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Security Footer */}
                <div className="text-center mt-6">
                    <p className="text-gray-500 text-sm flex items-center justify-center gap-2">
                        🔒 Secure & Encrypted Transactions
                    </p>
                    <p className="text-gray-600 text-xs mt-1">
                        Powered by SecureChain Technology
                    </p>
                </div>
            </div>
        </div>
    );
}