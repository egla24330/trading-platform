import React, { useState, useEffect } from "react";
import { Megaphone, ArrowRight, Clock, TrendingUp, Shield, Globe, ChevronLeft, Loader } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import MobileNav from "../components/MobileNav";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { toast } from "react-toastify";
export default function NewsPage() {
  const { backendUrl, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [expandedArticle, setExpandedArticle] = useState(null);
  const [news, setNews] = useState([])

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const api = axios.create({
    baseURL: backendUrl,
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
  });
  const fetchArticles = async (currentPage=1) => {
    setLoading(true);
    try {
      const response = await api.get(`/api/news?page=${currentPage}&limit=9`);
      setNews(response.data.data || response.data);
      console.log({ 'test': response })
    //  toast.success("Articles loaded successfully");
      setPage(response.data.page);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error("Error fetching articles:", error);
      toast.error(error.response?.data?.message || "Failed to fetch articles", "error");
    } finally {
      setLoading(false);
    }
  };

   useEffect(() => {
    fetchArticles(page);
  }, [page]);

  const categories = {
    "Market Analysis": { icon: <TrendingUp size={14} />, color: "text-green-400" },
    "Regulation": { icon: <Shield size={14} />, color: "text-blue-400" },
    "Market Update": { icon: <Globe size={14} />, color: "text-purple-400" },
    "DeFi": { icon: <TrendingUp size={14} />, color: "text-orange-400" },
    "CBDC": { icon: <Shield size={14} />, color: "text-cyan-400" },
    "Technology": { icon: <Globe size={14} />, color: "text-pink-400" }
  };





  const handleReadMore = (article) => {
    setExpandedArticle(expandedArticle?.id === article.id ? null : article);
  };

  const handleOpenDetail = (article) => {
    setSelectedArticle(article);
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white mb-[90px]">
      <MobileNav />
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur-lg border-b border-gray-800"
      >

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Back Button - Hidden on small screens */}
            <div className="hidden sm:flex items-center gap-6">
              <button
                onClick={handleBackToHome}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
              >
                <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                Back to Home
              </button>
            </div>

            {/* Title - Centered on mobile, left on larger screens */}
            <div className="flex items-center gap-3 mx-auto sm:mx-0">
              <div className="p-2 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                <Megaphone size={24} className="text-blue-400" />
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-xl sm:text-2xl font-bold">Financial News</h1>
                {/* <p className="text-gray-400 text-xs sm:text-sm hidden sm:block">Stay updated with latest market insights</p> */}
              </div>
            </div>

            {/* Last Updated - Hidden on small screens */}
            <div className="hidden sm:block text-right">
              <div className="text-sm text-gray-400">Last updated</div>
              <div className="text-sm font-medium text-green-400">Just now</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-8 animate-pulse">
            <Loader className="h-8 w-8 text-blue-400 animate-spin" />
            <span className="ml-2 text-gray-400">Loading...</span>
          </div>
        )}
        {/* News Grid */}
        <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 ${loading ? 'hidden' : ''}`}>

          {news.map((item, index) => (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden hover:border-gray-600 transition-all duration-300 group cursor-pointer flex flex-col h-full"
            >
              {/* Image Container */}
              <div className="relative overflow-hidden flex-shrink-0">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-40 sm:h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <div className="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 bg-gray-900/90 rounded-full text-xs text-white backdrop-blur-sm border border-gray-700">

                    {
                      categories[item.category].icon
                    }




                    <span className="hidden sm:inline">{item.category}</span>
                  </div>
                  {item.trending && (
                    <div className="px-2 py-1 bg-green-500/20 rounded-full text-xs text-green-300 border border-green-500/30">
                      Trending
                    </div>
                  )}
                </div>
                <div className="absolute top-3 right-3">
                  <div className="px-2 py-1 bg-gray-900/90 rounded-full text-xs text-gray-300 backdrop-blur-sm border border-gray-700">
                    {item.readTime}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-6 flex flex-col flex-grow">
                <h2 className="font-bold text-lg sm:text-xl mb-2 sm:mb-3 line-clamp-2 group-hover:text-blue-300 transition-colors">
                  {item.title}
                </h2>

                <div className="flex-grow">
                  <p className="text-gray-300 text-sm leading-relaxed mb-3 sm:mb-4">
                    {expandedArticle?.id === item.id ? item.fullContent : item.summary}
                  </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-gray-700 mt-auto">
                  <div className="flex items-center gap-2 text-gray-400 text-xs sm:text-sm">
                    <Clock size={12} className="sm:w-4 sm:h-4" />
                    <span>{item.time}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReadMore(item)}
                      className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs sm:text-sm font-medium transition-colors"
                    >
                      {expandedArticle?.id === item.id ? "Read Less" : "Read More"}
                      <ArrowRight
                        size={12}
                        className={`sm:w-4 sm:h-4 transition-transform ${expandedArticle?.id === item.id ? "rotate-90" : "group-hover:translate-x-1"
                          }`}
                      />
                    </button>
                    <button
                      onClick={() => handleOpenDetail(item)}
                      className="px-2 py-1 sm:px-3 sm:py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors hidden sm:block"
                    >
                      Details
                    </button>
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        {/* Load More Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className={`flex justify-center mt-8 sm:mt-12 ${loading?'hidden':''}`}
        >
              {totalPages > 1 && (
            <div className="flex justify-center mt-10 items-center space-x-2">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-700 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 shadow-sm"
              >
                Previous
              </button>

              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  className={`px-3 py-2 text-sm rounded-lg border ${
                    page === i + 1
                      ? 'bg-blue-500 text-white border-blue-500 shadow'
                      : 'bg-gray-900 text-white border-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
                className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-700 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 shadow-sm"
              >
                Next
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Article Detail Modal */}
      <AnimatePresence>
        {selectedArticle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-lg z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedArticle(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-2xl sm:rounded-3xl border border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="relative">
                <img
                  src={selectedArticle.image}
                  alt={selectedArticle.title}
                  className="w-full h-48 sm:h-64 object-cover"
                />
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 bg-gray-900/80 hover:bg-gray-800 rounded-xl backdrop-blur-sm border border-gray-700 transition-colors"
                >
                  <ChevronLeft size={20} className="rotate-90" />
                </button>
                <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 flex items-center gap-2">
                  <div className="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 bg-gray-900/90 rounded-full text-xs sm:text-sm text-white backdrop-blur-sm border border-gray-700">
                    {
                      // selectedArticle.icon
                    }
                    <span>{selectedArticle.category}</span>
                  </div>
                  {selectedArticle.trending && (
                    <div className="px-2 py-1 sm:px-3 sm:py-1.5 bg-green-500/20 rounded-full text-xs sm:text-sm text-green-300 border border-green-500/30">
                      Trending
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-4 sm:p-6 lg:p-8 overflow-y-auto max-h-[calc(90vh-12rem)]">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4">{selectedArticle.title}</h1>
                <div className="flex items-center gap-3 sm:gap-4 text-gray-400 text-sm mb-4 sm:mb-6">
                  <div className="flex items-center gap-1">
                    <Clock size={14} className="sm:w-4 sm:h-4" />
                    <span>{selectedArticle.time}</span>
                  </div>
                  <span>•</span>
                  <span>{selectedArticle.readTime}</span>
                </div>
                <div className="prose prose-invert max-w-none">
                  {selectedArticle.fullContent.split('\n').map((paragraph, index) => (
                    <p key={index} className="text-gray-300 leading-relaxed mb-3 sm:mb-4 text-sm sm:text-base">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

     

      {/* Mobile Back Button */}
      {/* <div className="fixed bottom-20 left-4 sm:hidden z-30">
        <button
          onClick={handleBackToHome}
          className="p-3 bg-gray-800/90 backdrop-blur-lg border border-gray-700 rounded-2xl text-white shadow-lg hover:bg-gray-700 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
      </div> */}
    </div>
  );
}