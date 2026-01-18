import { motion } from "framer-motion";

export default function Hero() {
  
  return (
    <section className="flex flex-col items-center justify-center text-center px-6 md:px-12 py-16 md:py-24 overflow-hidden bg-gray-900 h-screen">


      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-2xl md:text-4xl font-extrabold mb-4 text-white"
      >
        Track & Trade the Future of{" "}
        <span className="text-blue-400">Digital Assets</span>
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="text-base text-sm md:text-md text-gray-300 max-w-2xl mb-8"
      >
        Get real-time market data, charts, and insights across the world’s top
        cryptocurrencies. Stay ahead in the game with lightning-fast updates.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="flex gap-4 flex-wrap justify-center"
      >
        <button className="px-6 py-3 bg-blue-500 hover:bg-blue-500 text-white rounded-xl font-semibold shadow-lg transition-colors text-sm md:text-md">
          <a href='#pd'>
            Explore Markets
          </a>
        </button>
        <button className="px-6 py-3 border border-blue-500 text-blue-500 hover:bg-blue-500/20 rounded-xl font-semibold transition-colors text-sm md:text-md">
          Learn More
        </button>
      </motion.div>

      {/* Floating crypto icons */}
      {/* <div className="absolute top-12 left-10 w-10 h-10 opacity-30 animate-bounce">
        <img src="https://cryptologos.cc/logos/bitcoin-btc-logo.png" alt="BTC" />
      </div>
      <div className="absolute bottom-10 right-12 w-10 h-10 opacity-30 animate-bounce delay-200">
        <img src="https://cryptologos.cc/logos/ethereum-eth-logo.png" alt="ETH" />
      </div>
      <div className="absolute bottom-16 left-1/4 w-10 h-10 opacity-30 animate-bounce delay-500">
        <img src="https://cryptologos.cc/logos/binance-coin-bnb-logo.png" alt="BNB" />
      </div> */}
    </section>
  );
}
