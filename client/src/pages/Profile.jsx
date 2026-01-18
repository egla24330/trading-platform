import { useState } from "react";
import {
  LogOut, Eye, EyeOff, ChevronLeft,
  Bell, CheckCircle2, HelpCircle, ArrowDownCircle,
  ArrowUpCircle,
  BadgeDollarSign,
  Clock4,
  CreditCard,
  Shield,
  User
  
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { assets } from "../assets/assets";
import MobileNav from "../components/MobileNav";
import { useEffect } from "react";
import { toast } from "react-toastify";
import Loading from "../components/Loading";

export default function ProfilePage() {
  
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = useState(false);
  const { backendUrl, token } = useAuth()
  const [userdata, setUserdata] = useState(
    {
      name: "",
      email: "",
      avatar: "",
      wallet: {
        usdt: 0,
        btc: 0,
        eth: 0,
        loanUsdt: 0.00
      }
    }

  )
  const [loading, setLoading] = useState(false)

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`${backendUrl}api/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.data.success) {
        setUserdata(res.data.user)
      } else {
        toast.error('fetch failed')

      }


    } catch (error) {
      toast.error("Profile fetch failed:");
      return null;
    } finally {
      setLoading(false)

    }
  };


  useEffect(() => {
    fetchProfile()

  }, [])





  const quickActions = [
    { icon: <ArrowDownCircle size={20} />, label: "Deposit", color: "text-blue-400" },
    { icon: <ArrowUpCircle size={20} />, label: "Withdraw", color: "text-green-400" },
    { icon: <BadgeDollarSign size={20} />, label: "Loan", color: "text-purple-400" },
    { icon: <Clock4 size={20} />, label: "History", color: "text-gray-400" }
  ];

  return (
    (loading ?
      <Loading text="Fetching your profile..." />
      :
      <div className="min-h-screen bg-gray-900 text-gray-100 mb-20">
        <MobileNav />

        {/* Header */}
        <div className="hidden sm:block bg-gray-900  sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ChevronLeft size={20} />
                <span className="font-medium">Back</span>
              </button>

              {/* <h1 className="text-xl font-semibold text-white">Profile</h1>

            <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
              <Bell size={20} className="text-gray-400" />
            </button> */}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-2 py-6">
          <div className="space-y-6">

            {/* Profile Header */}
            <div className="bg-gray-900 rounded-lg sm:border border-gray-700 p-3 sm:p-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-300 text-2xl font-semibold border-2 border-gray-700">
                    {userdata.name.trim()[0]}
                  </div>
                  {/* {user.verified && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-gray-800 flex items-center justify-center">
                    <CheckCircle2 size={10} className="text-white" />
                  </div>
                )} */}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="sm:text-xl font-semibold text-white">{userdata?.name}</h1>
                  </div>
                  <p className="text-gray-400 text-sm mb-2">{userdata.email}</p>
                  <div className="flex items-center gap-3">
                    {/* <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs font-medium rounded-full border border-blue-500/30">
                    {user.tier} Tier
                  </span> */}
                    {/* <span className="text-gray-500 text-xs">
                    Member since {user.memberSince}
                  </span> */}
                  </div>
                </div>
              </div>
            </div>

            {/* Balance Overview */}
            <div className="bg-gray-900 rounded-lg sm:border border-gray-700 p-3 sm:p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-md font-bold text-white">Balance Overview</h2>
                  {/* <p className="text-gray-400 text-sm">Total portfolio value</p> */}
                </div>
                <button
                  onClick={() => setShowBalance(!showBalance)}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm font-medium text-gray-300"
                >
                  {showBalance ? <EyeOff size={16} /> : <Eye size={16} />}
                  <span>{showBalance ? "Hide" : "Show"}</span>
                </button>
              </div>

              {/* Total Balance */}
              {/* <div className="bg-gray-700/50 rounded-lg p-4 mb-6 border border-gray-600">
              <p className="text-gray-400 text-sm mb-1">Total Balance</p>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold text-white mb-1">
                    {showBalance ? `$${balances.total.toLocaleString()}` : "••••••"}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400 text-sm font-medium">
                      {showBalance ? balances.change : "••••"}
                    </span>
                    <span className="text-gray-500 text-sm">
                      {showBalance ? balances.changeAmount : "••••••"}
                    </span>
                  </div>
                </div>
              </div>
            </div> */}

              {/* Balance Breakdown */}
              {/* <div className="grid grid-cols-3 gap-4 mb-6">
              <BalanceCard
                label="Available"
                value={balances.available}
                showBalance={showBalance}
                color="text-green-400"
              />
              <BalanceCard
                label="Locked"
                value={balances.locked}
                showBalance={showBalance}
                color="text-blue-400"
              />
              <BalanceCard
                label="Loans"
                value={5000}
                showBalance={showBalance}
                color="text-purple-400"
              />
            </div> */}

              {/* Wallet Assets */}
              <div className="pt-6 border-t border-gray-700">
                <h3 className="font-semibold text-white mb-4">Wallet Assets</h3>
                <div className="space-y-3">
                  <AssetRow
                    currency="USDT"
                    balance={userdata.wallet.usdt}
                    showBalance={showBalance}
                    logo={assets.tether}
                    usdValue={userdata.wallet.usdt}
                  />
                  <AssetRow
                    currency="BTC"
                    balance={userdata.wallet.btc}
                    showBalance={showBalance}
                    logo={assets.bitcoin}
                    usdValue={userdata.wallet.btc * 45000}
                  />
                  <AssetRow
                    currency="ETH"
                    balance={userdata.wallet.eth}
                    showBalance={showBalance}
                    logo={assets.ethereum}
                    usdValue={userdata.wallet.eth * 3000}
                  />

                  <h3 className="font-semibold text-white mb-4">Loan Assets</h3>

                  <AssetRow
                    currency="USDT"
                    balance={userdata.wallet.loanUsdt}
                    showBalance={showBalance}
                    logo={assets.tether}
                    usdValue={userdata.wallet.loanUsdt}
                  />


                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-900 rounded-lg sm: border-gray-700 p-3 sm:p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {quickActions.map((action, index) => (
                  <ActionCard
                    onClick={() => {
                      navigate(`/${action.label.toLowerCase()}`);
                    }}
                    key={index}
                    icon={action.icon}
                    label={action.label}
                    color={action.color}
                  />
                ))}
              </div>
            </div>

            {/* Account Management */}
            <div className="bg-gray-00 rounded-lg sm:border border-gray-700 p-3 sm:p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Account</h2>
              <div className="space-y-3">
                <SettingsCard
                  icon={<User size={18} />}
                  label="Personal Information"
                  description="Update your profile details"
                />

                <SettingsCard
                  icon={<HelpCircle size={18} />}
                  label="Help & Support"
                  description="Get help with your account"
                />
                <SettingsCard
                  icon={<LogOut size={18} />}
                  label="Sign Out"
                  description="Logout from your account"
                  danger
                  onClick={() => {
                    localStorage.removeItem('token'),
                      localStorage.removeItem('userData'),
                      toast.info('Logout successfully'),
                      navigate('/')
                      window.location.reload()

                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    )

  );
}

// Component for balance cards
function BalanceCard({ label, value, showBalance, color }) {
  return (
    <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600 text-center">
      <div className="text-gray-400 text-sm mb-2">{label}</div>
      <div className={`font-semibold text-lg ${color}`}>
        {showBalance ? `$${value.toLocaleString()}` : "••••"}
      </div>
    </div>
  );
}

// Component for asset rows
function AssetRow({ currency, balance, showBalance, logo, usdValue }) {
  return (
    <div className="flex items-center justify-between p-3 hover:bg-gray-700/50 rounded-lg transition-colors border border-transparent hover:border-gray-600">
      <div className="flex items-center gap-3">
        <img
          src={logo}
          alt={currency}
          className="w-8 h-8 rounded-full"
        />
        <div>
          <div className="font-medium text-white">{currency}</div>
          <div className="text-gray-400 text-sm">
            {showBalance ? `${balance.toLocaleString()} ${currency}` : "••••"}
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="font-semibold text-white">
          {showBalance ? `$${usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "••••••"}
        </div>
      </div>
    </div>
  );
}

// Component for action cards
function ActionCard({ icon, label, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center p-4  hover:bg-gray-700 rounded-lg border border-gray-700 hover:border-gray-500 transition-colors group"
    >
      <div className={`mb-2 ${color}`}>
        {icon}
      </div>
      <span className="text-sm font-medium text-gray-300">{label}</span>
    </button>
  );
}

// Component for settings cards
function SettingsCard({ icon, label, description, danger = false, onClick = () => {} }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-4 p-4 w-full text-left hover:bg-gray-700/50 rounded-lg border border-transparent hover:border-gray-600 transition-colors ${
        danger ? "text-red-400 hover:text-red-300" : "text-gray-300"
      }`}
    >
      <div className={danger ? "text-red-500" : "text-gray-400"}>
        {icon}
      </div>

      <div className="flex-1">
        <div className="font-medium text-sm">{label}</div>
        <div className="text-gray-500 text-xs">{description}</div>
      </div>
    </button>
  );
}
