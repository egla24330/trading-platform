import { motion } from "framer-motion";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { assets } from "../assets/assets";
import { usePriceFeed } from "../context/PriceFeedContext";
import { useOrders } from "../context/OrdersContext";
import OrderModal from "../components/OrderModal";
import OrdersDisplay from "../components/OrdersDisplay";
import MobileNav from '../components/MobileNav';
import { toast } from "react-toastify";
import { ClipLoader } from "react-spinners";
//import { conversionAPI } from "../services/api";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Smartphone,
  Monitor
} from "lucide-react";
import { tradeAPI } from "../services/api";
import { conversionAPI } from "../services/api";

const symbol = {
  bitcoin: "BTC",
  ethereum: "ETH",
  tether: "USDT",
  ripple: "XRP",
  binancecoin: "BNB",
  solana: "SOL",
  usdc: "USDC",
  dogecoin: "DOGE",
  cardano: "ADA",
  polkadot: "DOT",
};

const CoinDetail = () => {
  const { id } = useParams();
  const { prices } = usePriceFeed();
  const { activeOrders, placeOrder } = useOrders();
  const navigate = useNavigate();

  const [showOrderModal, setShowOrderModal] = useState(false);
  const [direction, setDirection] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const coinData = prices[id];
  const [loading, setLoading] = useState(false);
  const [marketPrices, setMarketPrices] = useState({});

  const [balance, setBalance] = useState({ btc: 0, eth: 0, usdt: 0 });

  useEffect(() => {
    fetchUserBalance();
    getMarketPrices();
    
  }, [showOrderModal]);

  const fetchUserBalance = async () => {
    try {
      setLoading(true);
      const result = await tradeAPI.getUserBalance();
      console.log({ result: result.data.wallet.btc });
      setLoading(false);

      if (result.success) {
        setBalance({
          btc: result.data.wallet.btc,
          eth: result.data.wallet.eth,
          usdt: result.data.wallet.usdt,
          //total: result.totalValue
        });
      }

    } catch (error) {
      toast.error('Failed to fetch balance');

    }
  };

   const getMarketPrices = async () => {
          try {
              const response = await conversionAPI.getPrices();
              setMarketPrices(response.data);
          } catch (error) {
              console.error('Error getting prices:', error);
          }
      };
  
    

  //new
  const isAuthenticated = localStorage.getItem('token') ? true : false;


  // Detect screen size
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleOrderConfirm = async (orderData) => {
    console.log({ orderData });


    //direction
    try {
      const enhancedData = {
        ...orderData,
        coinId: id,
        symbol: `${symbol[id]}USDT`,
        symbolName: symbol[id],
        entryPrice: coinData?.usd || 0
      };

      // Check eligibility first
      // setCheckingEligibility(true);
      //  const eligibility = await tradeAPI.checkTradeEligibility(orderData.amount);

      //  if (!eligibility.eligible) {
      //  toast.error(eligibility.reason || "Not eligible to trade");
      //  return;
      //}

      // Place order
      const response = await tradeAPI.placeOrder(enhancedData);
      console.log('Order placed response:', response);

      toast(
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${direction === 'buy' ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
            {direction === 'buy' ?
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" /> :
              <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
            }
          </div>
          <div>
            <div className="font-medium text-gray-900">Order </div>
            <div className="text-sm text-gray-900">
              {direction === 'buy' ? 'Buy' : 'Sell'} {orderData.duration}s • ${orderData.amount}
            </div>
          </div>
        </div>,
        {
          position: isMobile ? "bottom-center" : "top-right",
          autoClose: 3000,
        }
      );

      // Update balance
      //setBalance(response.data.balance);

      // Refresh orders
      //refreshOrders();

    } catch (error) {
      console.error('Error placing order:', error);
      toast.error(error.message || 'Failed to place order');
    } finally {
      // setCheckingEligibility(false);
      setShowOrderModal(false);
    }
  };

  /*
    const handleOrderConfirm = (orderData) => {
      console.log({orderData})
  toast.error('error')
      const enhancedData = {
        ...orderData,
        coinId: id,
        direction: direction
      };
      
      placeOrder(enhancedData);
      
      toast.success(
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${direction === 'buy' ? 'bg-green-100' : 'bg-red-100'}`}>
            {direction === 'buy' ? 
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" /> : 
              <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
            }
          </div>
          <div className="text-sm sm:text-base">
            <div className="font-medium">Order Placed</div>
            <div className="text-gray-600 text-xs sm:text-sm">{direction === 'buy' ? 'Buy' : 'Sell'} {orderData.duration}s</div>
          </div>
        </div>,
        {
          position: isMobile ? "bottom-center" : "top-right",
          autoClose: 2000,
        }
      );
    };
  */
  const activeCoinOrders = activeOrders.filter(order => order.coinId === id);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Order Modal */}
      <OrderModal
        open={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        symbol={`${symbol[id]}USDT`}
        price={coinData?.usd}
        direction={direction}
        onConfirm={handleOrderConfirm}
        isMobile={isMobile}
        userBalance={balance}
        availableAmount={balance.usdt}
        isAuthenticated={isAuthenticated}
        marketPrices={marketPrices}
      />

      {/* {console.log({
        balance:balance.usdt

      })} */}

      {/* Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm sm:text-base font-medium hidden sm:inline">Back</span>
            </button>

            <div className="flex items-center gap-3">

              <img
                src={assets[id]}
                alt={symbol[id]}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg"
              />
              <div className="text-right">
                <div className="font-bold text-base sm:text-lg">{symbol[id]}/USDT</div>
                <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  {activeCoinOrders.length} active
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - Price & Actions */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            {/* Price Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div>
                  <div className="text-sm sm:text-base text-gray-500 dark:text-gray-400">Current Price</div>
                  <div className="text-xl sm:text-xl lg:text-2xl font-bold mt-1">
                    ${coinData?.usd?.toLocaleString()}
                  </div>
                </div>
                <div className={`flex items-center gap-1 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full ${coinData?.usd_24h_change >= 0 ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"}`}>
                  {coinData?.usd_24h_change >= 0 ?
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" /> :
                    <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />
                  }
                  <span className="text-sm sm:text-base font-medium">
                    {coinData?.usd_24h_change >= 0 ? "+" : ""}
                    {coinData?.usd_24h_change?.toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <button
                  onClick={() => {
                    setDirection('buy');
                    setShowOrderModal(true);
                  }}
                  className="bg-green-500 hover:bg-green-600 text-white py-3 sm:py-4 rounded-lg font-medium text-base sm:text-lg transition-colors flex items-center justify-center gap-2"
                >
                  <TrendingUp className="w-5 h-5" />
                  <span>Buy</span>
                </button>
                <button
                  onClick={() => {
                    setDirection('sell');
                    setShowOrderModal(true);
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white py-3 sm:py-4 rounded-lg font-medium text-base sm:text-lg transition-colors flex items-center justify-center gap-2"
                >
                  <TrendingDown className="w-5 h-5" />
                  <span>Sell</span>
                </button>
              </div>

              {/* Quick Stats */}
              {/* <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="text-center">
                    <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">Active Trades</div>
                    <div className="text-xl sm:text-2xl font-bold">{activeCoinOrders.length}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">24h Change</div>
                    <div className={`text-xl sm:text-2xl font-bold ${coinData?.usd_24h_change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {coinData?.usd_24h_change >= 0 ? '+' : ''}{coinData?.usd_24h_change?.toFixed(2)}%
                    </div>
                  </div>
                </div>
              </div> */}
            </motion.div>

            {/* Device Indicator */}
            <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                {isMobile ? (
                  <>
                    {/* <Smartphone className="w-4 h-4" />
                    <span>Mobile View</span> */}
                  </>
                ) : (
                  <>
                    {/* <Monitor className="w-4 h-4" /> 
                     <span>Desktop View</span> */}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Chart */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm h-full overflow-hidden"
            >
              {/* <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
                  <div>
                    <h3 className="font-bold text-base sm:text-lg">{symbol[id]}/USDT Chart</h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Live price movement</p>
                  </div>
                </div>
              </div> */}

              {/* Chart Container */}
              <div className="h-90 sm:h-80 lg:h-96 rounded-lg overflow-hidden">
                <iframe
                  src={`https://s.tradingview.com/widgetembed/?symbol=BINANCE:${symbol[id]}USDT&interval=1&theme=dark&style=1&locale=en&hidesidetoolbar=1&hide_top_toolbar=1&hide_legend=1&hide_volume=1&allow_symbol_change=0&save_image=0&withdateranges=0&details=0&calendar=0`}
                  width="100%"
                  height="100%"
                  className="border-0"
                  title={`${symbol[id]} Chart`}
                />

              </div>
            </motion.div>
          </div>
        </div>

        {/* Orders Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 sm:mt-8 mb-20 sm:mb-8"
        >
          {/* <div className="mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold">Trading Dashboard</h2>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">Monitor your active and completed trades</p>
          </div>
           */}
          <OrdersDisplay isMobile={isMobile} />
        </motion.div>
      </main>

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
};

export default CoinDetail;