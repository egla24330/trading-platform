import { motion } from "framer-motion";

export default function Hero() {
  
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gray-900 px-4 sm:px-6 md:px-8 overflow-hidden">
      
      {/* Subtle animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900 to-blue-900/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent"></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto text-center py-16 md:py-24">
        
        {/* Creative tagline */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-blue-900/20 border border-blue-500/20 text-blue-300 text-xs font-mono tracking-wider">
            REAL-TIME DATA STREAM
          </span>
        </motion.div>

        {/* Main heading with creative layout */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="font-semibold text-gray-100 mb-6 leading-snug"
        >
          <div className="text-2xl sm:text-3xl md:text-4xl mb-4">
            Track & Trade the{" "}
            <span className="relative inline-block">
              <span className="text-blue-400">Future</span>
              <svg className="absolute -bottom-1 left-0 w-full h-0.5" viewBox="0 0 100 2">
                <path d="M0,1 Q50,3 100,1" stroke="currentColor" strokeWidth="1" fill="none" className="text-blue-400/50"/>
              </svg>
            </span>{" "}
            of
          </div>
          
          <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-blue-300 via-cyan-200 to-blue-400 bg-clip-text text-transparent">
              Digital Assets
            </span>
          </div>
        </motion.h1>

        {/* Creative subtitle with smaller font */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="mb-10 md:mb-12"
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 text-gray-400 mb-4">
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent sm:w-20"></div>
            <span className="text-xs tracking-widest font-mono">REAL-TIME ANALYTICS</span>
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent sm:w-20"></div>
          </div>
          
          <p className="text-sm sm:text-base md:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed font-light tracking-wide px-2">
            Advanced market intelligence and lightning-fast tracking for global cryptocurrency markets.
            Professional-grade tools for modern traders.
          </p>
        </motion.div>

        {/* Creative CTA buttons with icons */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-16"
        >
          <a 
            href="#pd"
            className="group relative px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm sm:text-base transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Explore Markets
            <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
          
         
        </motion.div>

        {/* Creative stats grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 max-w-2xl mx-auto"
        >
          {[
          
            { value: "24/7", label: "Live Tracking", color: "text-green-400" },
            { value: "150ms", label: "Avg Latency", color: "text-purple-400" },
            { value: "99.9%", label: "Reliability", color: "text-cyan-400" },
          ].map((stat, index) => (
            <div 
              key={index}
              className="bg-gray-800/30 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50 hover:border-gray-600/50 transition-colors"
            >
              <div className={`text-xl sm:text-2xl font-bold ${stat.color} mb-1`}>
                {stat.value}
              </div>
              <div className="text-xs text-gray-400 font-medium tracking-wider">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>

      </div>

      {/* Minimal floating elements */}
      <div className="absolute top-20 left-5 w-6 h-6 opacity-10 md:opacity-15">
        <img src="https://cryptologos.cc/logos/bitcoin-btc-logo.png" alt="BTC" className="w-full h-full" />
      </div>
      <div className="absolute bottom-20 right-5 w-6 h-6 opacity-10 md:opacity-15">
        <img src="https://cryptologos.cc/logos/ethereum-eth-logo.png" alt="ETH" className="w-full h-full" />
      </div>

    </section>
  );
}