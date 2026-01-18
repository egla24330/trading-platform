import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Search, Plus, Edit, Trash2, Eye, Check, X, TrendingUp, Shield, Globe, AlertCircle, Save, Image as ImageIcon, XCircle, Loader, } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";

export default function NewsAdminPanel() {
  const { backendUrl, token } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState(null);
  const [articleToPublish, setArticleToPublish] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  });
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [news, setNews] = useState([]);
  const fileInputRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [newArticle, setNewArticle] = useState({
    title: "",
    summary: "",
    fullContent: "",
    category: "Market Analysis",
    image: "",
    readTime: "3 min read",
    trending: false,
    status: "published"
  });

  const categories = [
    { name: "Market Analysis", icon: <TrendingUp size={14} />, color: "text-green-400" },
    { name: "Regulation", icon: <Shield size={14} />, color: "text-blue-400" },
    { name: "Market Update", icon: <Globe size={14} />, color: "text-purple-400" },
    { name: "DeFi", icon: <TrendingUp size={14} />, color: "text-orange-400" },
    { name: "CBDC", icon: <Shield size={14} />, color: "text-cyan-400" },
    { name: "Technology", icon: <Globe size={14} />, color: "text-pink-400" }
  ];

  // Create axios instance with backend URL from context
  const api = axios.create({
    baseURL: backendUrl,
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
  });

  // Fetch articles on component mount
  useEffect(() => {
    fetchArticles();
  }, []);

  // Fetch articles from API
  const fetchArticles = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/news");
      setNews(response.data.data || response.data);
     // console.log({ 'test': response })
      ///toast.success("Articles loaded successfully");
    } catch (error) {
    //  console.error("Error fetching articles:", error);
      toast.error(error.response?.data?.message || "Failed to fetch articles", "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredNews = news.filter((article) => {
    const matchesSearch =
      article.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.summary?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || article.status === statusFilter;

    return matchesSearch && matchesStatus;
  });



  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a valid image file (JPEG, PNG, GIF, WebP)", "error")
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB", "error");
      return;
    }

    setImageFile(file);
    const imageUrl = URL.createObjectURL(file);
    setImagePreview(imageUrl);

    // For create modal
    if (showCreateModal) {
      setNewArticle({ ...newArticle, image: imageUrl });
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (showCreateModal) {
      setNewArticle({ ...newArticle, image: "" });
    }
    if (showEditModal && editingArticle) {
      setEditingArticle({ ...editingArticle, image: "" });
    }
  };

  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleDeleteClick = (article) => {
    setArticleToDelete(article);
    setShowDeleteModal(true);
  };


  const handleEditClick = (article) => {
    setEditingArticle({ ...article });
    setImagePreview(article.image || null);
    setShowEditModal(true);
  };

  const handleCreateClick = () => {
    setNewArticle({
      title: "",
      summary: "",
      fullContent: "",
      category: "Market Analysis",
      image: "",
      readTime: "3 min read",
      trending: false,
      status: "published"
    });
    setImagePreview(null);
    setImageFile(null);
    setShowCreateModal(true);
  };

  // DELETE ARTICLE
  const confirmDelete = async () => {
    try {
      setLoading(true)
      await api.delete(`/api/news/${articleToDelete._id}`);

      // Update local state
      setNews(news.filter((article) => article._id !== articleToDelete._id));

      toast.success(`Article "${articleToDelete.title}" deleted`, "warning");
      setShowDeleteModal(false);
      setArticleToDelete(null);
    } catch (error) {
      console.error("Error deleting article:", error);
      toast.error(error.response?.data?.message || "Failed to delete article", "error");
    }finally{
      setLoading(false)

    }
  };

 

  // UPDATE ARTICLE (Save Edit)
  const saveEditedArticle = async () => {
    if (!editingArticle.title?.trim() || !editingArticle.summary?.trim()) {
      toast.error("Title and summary are required", "error");
      return;
    }

    try {
      setLoading(true)
      let imageUrl = editingArticle.image;

      // If new image file selected, upload it
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);

        const uploadResponse = await axios.put(`${backendUrl}api/news/${editingArticle._id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        });

        imageUrl = uploadResponse.data.data.image;
      }

      // Prepare update data
      const updateData = {
        title: editingArticle.title,
        summary: editingArticle.summary,
        fullContent: editingArticle.fullContent,
        category: editingArticle.category,
        image: imageUrl,
        readTime: editingArticle.readTime,
        trending: editingArticle.trending,
        status: editingArticle.status
      };

      const response = await api.put(`/api/news/${editingArticle._id}`, updateData);

      // Update local state
      setNews(news.map((article) =>
        article._id === editingArticle._id ? response.data.data : article
      ));

      toast.success(`Article "${editingArticle.title}" updated`, "success");
      setShowEditModal(false);
      setEditingArticle(null);
      setImagePreview(null);
      setImageFile(null);
    } catch (error) {
      console.error("Error updating article:", error);
      toast.error(error.response?.data?.message || "Failed to update article", "error");
    }finally{
      setLoading(false)
    }
  };

  // CREATE NEW ARTICLE
  const saveNewArticle = async () => {
    if (!newArticle.title.trim() || !newArticle.summary.trim()) {
      toast.error("Title and summary are required", "error");
      return;
    }
    setLoading(true)
    try {
      let imageUrl = newArticle.image;
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('title', newArticle.title);
        formData.append('summary', newArticle.summary);
        formData.append('fullContent', newArticle.fullContent);
        formData.append('category', newArticle.category);
        formData.append('readTime', newArticle.readTime);
        formData.append('trending', newArticle.trending);
        formData.append('status', newArticle.status);
        const plainObject = Object.fromEntries(formData);
        console.log({ TEST: plainObject });
        console.log(backendUrl, '/api/news')
        const response = await axios.post(`${backendUrl}api/news`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.data.success) {
         
          toast.success(`Article "${newArticle.title}" created`, "success")
          setShowCreateModal(false);
          setImagePreview(null);
          setImageFile(null);
          // Reset form
          setNewArticle({
            title: "",
            summary: "",
            fullContent: "",
            category: "Market Analysis",
            image: "",
            readTime: "3 min read",
            trending: false,
            status: "pu"
          });

          fetchArticles()
        } else {
          toast.error(error.response?.data?.message || "Failed to create article", "error")
        }
      } else {
        toast.warn('image is required')
        // Create article without image file
        //const response = await api.post("/api/news", newArticle);
        // setNews([response.data.data, ...news]);
      }
    } catch (error) {
      // console.error("Error creating article:", error);
      toast.error(error.response?.data?.message || "Failed to create article", "error")
    } finally {
      setLoading(false)
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "published": return "bg-green-500/20 text-green-400 border border-green-500/30";
      case "draft": return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
      case "scheduled": return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
      case "archived": return "bg-gray-500/20 text-gray-400 border border-gray-500/30";
      default: return "bg-gray-500/20 text-gray-400 border border-gray-500/30";
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "published": return "Published";
      case "draft": return "Draft";
      case "scheduled": return "Scheduled";
      case "archived": return "Archived";
      default: return "Unknown";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Recently";

    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${Math.floor(diffInHours)} hours ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} days ago`;

    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 left-4 sm:left-auto px-4 py-3 rounded-xl shadow-lg z-50 ${notification.type === "error" ? "bg-red-600" :
          notification.type === "warning" ? "bg-yellow-600" :
            "bg-green-600"
          }`}>
          <div className="flex items-center gap-2">
            {notification.type === "error" ? <XCircle className="h-5 w-5" /> :
              notification.type === "warning" ? <AlertCircle className="h-5 w-5" /> :
                <Check className="h-5 w-5" />}
            <span className="text-sm">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="z-40 bg-gray-950/95 backdrop-blur-lg sm:border-b sm:border-gray-800 px-4 sm:py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="hidden sm:block text-lg font-bold">News Management</h1>
            <p className="text-gray-400 text-xs hidden sm:block">Manage and publish news articles</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={handleCreateClick}
                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition text-sm shadow-lg"
              >
                <Plus size={16} />
                <span>New Article</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-6">

        {/* Search and Filters */}
        <div className="space-y-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 min-w-[150px] bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>



        {/* Loading State */}
        {loading && (
         <div className="hidden lg:block bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="p-4 border-t border-gray-800 animate-pulse">
              <div className="flex justify-between">
                <div className="h-4 bg-gray-800 rounded w-1/4"></div>
                <div className="h-4 bg-gray-800 rounded w-1/6"></div>
                <div className="h-4 bg-gray-800 rounded w-1/6"></div>
                <div className="h-4 bg-gray-800 rounded w-1/6"></div>
              </div>
            </div>
          ))}
        </div>
        )}

        {/* Articles List */}
        {!loading && (
          <div className="space-y-3">
            {filteredNews.map((article) => (
              <div key={article._id} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                {/* Desktop Table Row */}
                <div className="hidden md:grid grid-cols-12 gap-3 p-3 items-center hover:bg-gray-850 transition">
                  <div className="col-span-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                        {article.image ? (
                          <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                            <ImageIcon size={20} className="text-gray-500" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-white text-sm mb-1 truncate">
                          {article.title}
                        </div>
                        <div className="text-gray-400 text-xs truncate">
                          {article.summary}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-white text-sm">{article.category}</span>
                  </div>
                  <div className="col-span-2">
                    <span className={`px-2 py-1 text-xs rounded-lg ${getStatusColor(article.status)}`}>
                      {getStatusBadge(article.status)}
                    </span>
                  </div>
                  <div className="col-span-1">
                    <div className="text-white text-sm">{article.views?.toLocaleString() || 0}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-gray-300 text-xs">
                      {formatDate(article.createdAt)}
                    </div>
                  </div>
                  <div className="col-span-1">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditClick(article)}
                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        title="Edit"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(article)}
                        className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 text-xs rounded-lg ${getStatusColor(article.status)}`}>
                          {getStatusBadge(article.status)}
                        </span>
                        <span className="text-gray-400 text-xs">{article.views?.toLocaleString() || 0} views</span>
                      </div>
                      <h3 className="font-medium text-white text-sm mb-1 line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-gray-400 text-xs line-clamp-2 mb-3">
                        {article.summary}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>{article.category}</span>
                        <span>•</span>
                        <span>{formatDate(article.createdAt)}</span>
                      </div>
                    </div>
                    {article.image && (
                      <div className="w-16 h-16 rounded-lg overflow-hidden ml-3 flex-shrink-0">
                        <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-gray-800">
                    <button
                      onClick={() => handleEditClick(article)}
                      className="flex-1 flex items-center justify-center gap-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-xs"
                    >
                      <Edit size={12} />
                      Edit
                    </button>
                  
                    <button
                      onClick={() => handleDeleteClick(article)}
                      className="flex-1 flex items-center justify-center gap-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-xs"
                    >
                      <Trash2 size={12} />
                      Delete
                    </button>

                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredNews.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-3">
              <Search className="h-8 w-8 text-gray-500" />
            </div>
            <p className="text-gray-400">No articles found</p>
            <button
              onClick={handleCreateClick}
              className="mt-3 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition text-sm"
            >
              Create First Article
            </button>
          </div>
        )}

        {/* Mobile Create Button */}
        <div className="fixed bottom-4 right-4 md:hidden z-30">
          <button
            onClick={handleCreateClick}
            className="w-14 h-14 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full shadow-lg flex items-center justify-center hover:from-blue-700 hover:to-blue-800 transition"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/80 flex items-start justify-center p-0 sm:p-4 z-50">

          <div className="bg-gray-900 w-full h-full sm:h-auto sm:rounded-2xl border border-gray-800 sm:max-w-2xl sm:my-8">

            {loading && (
              <div className="absolute inset-0 bg-black/50 flex justify-center items-center z-50">
                <div className="block p-5 bg-gray-900 rounded-lg border border-gray-500">
                  <div className="flex justify-center items-center ">
                    <Loader className="h-8 w-8 text-blue-400 animate-spin" />
                    <span className="ml-2 text-gray-400">{showCreateModal ? "saving..." : "updating..."}</span>
                  </div>
                  <p className="text-xs text-gray-300 mt-2">Please wait while the article is being saved.</p>
                </div>
              </div>
            )}

            {/* Modal Header */}
            <div className="border-b border-gray-800 p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                {showCreateModal ? "Create New Article" : "Edit Article"}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  setImagePreview(null);
                  setImageFile(null);
                }}
                className="p-2 text-gray-400 hover:text-white rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-140px)] sm:max-h-[calc(90vh-140px)]">
              {/* Image Upload Section */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Article Image</label>
                <div className={` ${editingArticle?.image ? '' : 'border-2 border-dashed border-gray-700 hover:border-gray-600 '} rounded-xl p-3 text-center transition`}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />

                  {imagePreview || (showEditModal && editingArticle?.image) ? (
                    <div className="flex justify-center items-center relative">
                      <img
                        src={imagePreview || editingArticle?.image}
                        alt="Preview"
                        className="w-auto max-h-48 object-cover rounded-lg mb-3"
                      />
                      <button
                        onClick={removeImage}
                        className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="py-4" onClick={triggerImageUpload}>
                      {isUploading ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader className="h-8 w-8 text-blue-400 animate-spin" />
                          <span className="text-sm text-gray-400">Uploading...</span>
                        </div>
                      ) : (
                        <>
                          <ImageIcon className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                          <p className="text-gray-400 text-sm mb-2">Tap to upload image</p>
                          <p className="text-gray-500 text-xs">JPEG, PNG, GIF, WebP • Max 5MB</p>
                        </>
                      )}
                    </div>
                  )}

                  {!imagePreview && !isUploading && (
                    <button
                      type="button"
                      onClick={triggerImageUpload}
                      className="mt-3 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition text-sm"
                    >
                      {showEditModal && editingArticle?.image ? "Change Image" : "Upload Image"}
                    </button>
                  )}
                </div>
              </div>

              {/* Form Fields */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Title *</label>
                <input
                  type="text"
                  value={showCreateModal ? newArticle.title : editingArticle?.title || ""}
                  onChange={(e) => showCreateModal
                    ? setNewArticle({ ...newArticle, title: e.target.value })
                    : setEditingArticle({ ...editingArticle, title: e.target.value })
                  }
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition"
                  placeholder="Article title"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Summary *</label>
                <textarea
                  value={showCreateModal ? newArticle.summary : editingArticle?.summary || ""}
                  onChange={(e) => showCreateModal
                    ? setNewArticle({ ...newArticle, summary: e.target.value })
                    : setEditingArticle({ ...editingArticle, summary: e.target.value })
                  }
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition h-24 resize-none"
                  placeholder="Brief summary"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Full Content</label>
                <textarea
                  value={showCreateModal ? newArticle.fullContent : editingArticle?.fullContent || ""}
                  onChange={(e) => showCreateModal
                    ? setNewArticle({ ...newArticle, fullContent: e.target.value })
                    : setEditingArticle({ ...editingArticle, fullContent: e.target.value })
                  }
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition h-40 resize-none"
                  placeholder="Full article content"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Category</label>
                  <select
                    value={showCreateModal ? newArticle.category : editingArticle?.category || ""}
                    onChange={(e) => showCreateModal
                      ? setNewArticle({ ...newArticle, category: e.target.value })
                      : setEditingArticle({ ...editingArticle, category: e.target.value })
                    }
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition"
                  >
                    {categories.map(({ name }) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Read Time</label>
                  <input
                    type="text"
                    value={showCreateModal ? newArticle.readTime : editingArticle?.readTime || ""}
                    onChange={(e) => showCreateModal
                      ? setNewArticle({ ...newArticle, readTime: e.target.value })
                      : setEditingArticle({ ...editingArticle, readTime: e.target.value })
                    }
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition"
                    placeholder="3 min read"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="trending"
                    checked={showCreateModal ? newArticle.trending : editingArticle?.trending || false}
                    onChange={(e) => showCreateModal
                      ? setNewArticle({ ...newArticle, trending: e.target.checked })
                      : setEditingArticle({ ...editingArticle, trending: e.target.checked })
                    }
                    className="rounded"
                  />
                  <label htmlFor="trending" className="text-sm text-gray-300">
                    Mark as trending
                  </label>
                </div>

                {showCreateModal && (
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Status</label>
                    <select
                      value={newArticle.status}
                      onChange={(e) => setNewArticle({ ...newArticle, status: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition"
                    > <option value="published">Published</option>
                      <option disabled='true' value="draft">Draft</option>
                      <option disabled='true' value="scheduled">Scheduled</option>

                    </select>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="bg-gray-900 pt-4 border-t border-gray-800 mt-4">
                <div className="flex gap-3">
                  <button
                    onClick={showCreateModal ? saveNewArticle : saveEditedArticle}
                    className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition font-medium"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Save size={16} />
                      {showCreateModal ? "Create Article" : "Save Changes"}
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                      setImagePreview(null);
                      setImageFile(null);
                    }}
                    className="px-6 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition"
                  >
                    Cancel
                  </button>

                
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && articleToDelete && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-2 z-50">
            {loading && (
              <div className="absolute inset-0 bg-black/50 flex justify-center items-center z-50">
                <div className="block p-5 bg-gray-900 rounded-lg border border-gray-500">
                  <div className="flex justify-center items-center ">
                    <Loader className="h-8 w-8 text-blue-400 animate-spin" />
                    <span className="ml-2 text-gray-400">Deleting...</span>
                  </div>
                  <p className="text-xs text-gray-300 mt-2">please wait this may take a few moments </p>
                </div>
              </div>
            )}
          <div className="bg-gray-950 rounded-2xl border border-gray-800 max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white text-center mb-2">Delete Article</h3>
              <p className="text-gray-400 text-sm text-center mb-6">
                Are you sure you want to delete "<span className="text-white font-medium">{articleToDelete.title}</span>"? This action cannot be undone.
              </p>
              <div className="flex gap-5">
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-medium"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}