import KYC from "../models/Kyc.js";
import mongoose from "mongoose";
import userModel from "../models/usermodel.js";
import NotificationService from "../services/notificationService.js";


export const getUserKYCStatus = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await userModel.findById(userId);




    if (!user) {
      res.json({
        success: false,
        message: 'user not found'
      })
    }

    let rejectionReason
    if (user.kycStatus === 'rejected') {
      const kyc = await KYC.findOne({ userId });
      rejectionReason = kyc.rejectionReason

    }

    res.json({
      success: true,
      status: user.kycStatus,
      rejectionReason,


    });
  } catch (error) {
    console.error("Error fetching KYC applications:", error);
    res.json({
      success: false,
      message: "Error fetching KYC applications",
      //error: error.message
    });
  }
};

// @desc    Submit KYC application
// @route   POST /api/kyc/submit
// @access  Private
export const submitKYC = async (req, res) => {
  try {
    //  const userId = req.user.id;
    const userId = req.userId;

    // Check if user already has pending or approved KYC
    const existingKYC = await KYC.findOne({
      userId,
      status: { $in: ["pending", "under_review", "approved"] }
    });

    if (existingKYC) {
      return res.json({
        success: false,
        message: existingKYC.status === "approved"
          ? "You already have an approved KYC"
          : "You already have a KYC application in progress"
      });
    }

    const {
      name,
      documentType,
      documentNumber
    } = req.body;

    // Get user from database
    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({
        success: false,
        message: "user not found"
      });
    }

    // Basic validation
    if (!name || !documentType) {
      return res.json({
        success: false,
        message: "Please provide name and document type"
      });
    }

    // Check if required file is present
    if (!req.body.documentFrontImage) {
      return res.json({
        success: false,
        message: "Document front image is required"
      });
    }

    // Check if document number is already used
    /*const existingDocument = await KYC.findOne({ 
      documentNumber,
      status: { $in: ["approved", "pending", "under_review"] }
    });
    
    if (existingDocument && existingDocument.userId.toString() !== userId) {
      return res.json({
        success: false,
        message: "This document number is already registered with another account"
      });
    }
*/
    // Calculate basic risk score
    let riskScore = 50;

    const kycData = {
      userId,
      name,
      email: user.email,
      documentType,
      documentNumber,
      documentFrontImage: req.body.documentFrontImage,
      documentBackImage: req.body.documentBackImage,
      documentFrontPublicId: req.body.documentFrontPublicId,
      documentBackPublicId: req.body.documentBackPublicId,
      riskScore,
    };

    const kyc = await KYC.create(kycData);

    // Update user's KYC status
    user.kycStatus = "pending";
    await user.save();
    await NotificationService.createKYCNotification(userId, kycData, "pending");

    res.json({
      success: true,
      message: "KYC application submitted successfully",
      kyc
    });
  } catch (error) {
    console.error("Error submitting KYC:", error);
    res.json({
      success: false,
      message: "Error submitting KYC application",
      error: error.message
    });
  }
};

// @desc    Get all KYC applications (for admin)
// @route   GET /api/kyc
// @access  Private/Admin
export const getAllKYC = async (req, res) => {
  try {
    const {
      status,
      documentType,
      search,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    const query = {};

    // Status filter
    if (status && status !== "all") {
      query.status = status;
    }

    // Document type filter
    if (documentType && documentType !== "all") {
      query.documentType = documentType;
    }

    // Search filter
    if (search) {
      query.$or = [
        { kycId: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
        { documentNumber: { $regex: search, $options: "i" } }
      ];
    }

    // Sort options
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query with pagination
    const kycs = await KYC.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await KYC.countDocuments(query);

    res.json({
      success: true,
      count: kycs.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      kycs
    });
  } catch (error) {
    console.error("Error fetching KYC applications:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching KYC applications",
      error: error.message
    });
  }
};

// @desc    Get KYC by ID
// @route   GET /api/kyc/:id
// @access  Private
export const getKYCById = async (req, res) => {
  try {
    const kyc = await KYC.findById(req.params.id)

    if (kyc) {
      return res.status(404).json({
        success: false,
        message: "KYC application not found"
      });
    }

    // Check authorization
    if (req.user.role !== "admin" && kyc.userId._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this KYC"
      });
    }

    res.json({
      success: true,

    });
  } catch (error) {
    console.error("Error fetching KYC:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching KYC application",
      error: error.message
    });
  }
};

// @desc    Get user's KYC status
// @route   GET /api/kyc/user/status
// @access  Private
export const getuserModelKYCStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const kyc = await KYC.findOne({ userId })
      .sort({ createdAt: -1 })
      .select("status kycId name documentType submittedAt");

    if (!kyc) {
      return res.json({
        success: true,
        kyc: null,
        message: "No KYC application found"
      });
    }

    res.json({
      success: true,
      kyc
    });
  } catch (error) {
    console.error("Error fetching user KYC status:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching KYC status",
      error: error.message
    });
  }
};

// @desc    Approve KYC application
// @route   PUT /api/kyc/:id/approve
// @access  Private/Admin
export const approveKYC = async (req, res) => {
  try {
    const { id } = req.params;
    const { verificationNotes } = req.body;
    const adminId = req.user.id;

    const kyc = await KYC.findById(id);

    if (!kyc) {
      return res.json({
        success: false,
        message: "KYC application not found"
      });
    }

    if (kyc.status !== "pending" && kyc.status !== "under_review") {
      return res.json({
        success: false,
        message: `KYC cannot be approved. Current status: ${kyc.status}`
      });
    }

    // Update KYC
    kyc.status = "approved";
    kyc.verifiedBy = adminId;
    kyc.verificationDate = new Date();
    kyc.reviewedAt = new Date();
    kyc.verificationNotes = verificationNotes;

    // Update user's KYC status
    const user = await userModel.findById(kyc.userId);
    if (user) {
      user.kycStatus = "approved";
      ///  user.kycVerifiedAt = new Date();
      await user.save();
    }

    await kyc.save();
    await NotificationService.createKYCNotification(kyc.userId, kyc, "approved");

    res.json({
      success: true,
      message: "KYC approved successfully",
      kyc
    });
  } catch (error) {
    console.error("Error approving KYC:", error);
    res.status(500).json({
      success: false,
      message: "Error approving KYC",
      error: error.message
    });
  }
};

// @desc    Reject KYC application
// @route   PUT /api/kyc/:id/reject
// @access  Private/Admin
export const rejectKYC = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const adminId = req.user.id;

    if (!rejectionReason) {
      return res.json({
        success: false,
        message: "Please provide a rejection reason"
      });
    }

    const kyc = await KYC.findById(id);

    if (!kyc) {
      return res.status(404).json({
        success: false,
        message: "KYC application not found"
      });
    }

    if (kyc.status !== "pending" && kyc.status !== "under_review") {
      return res.json({
        success: false,
        message: `KYC cannot be rejected. Current status: ${kyc.status}`
      });
    }

    // Update KYC
    kyc.status = "rejected";
    kyc.verifiedBy = adminId;
    kyc.rejectionReason = rejectionReason;
    kyc.reviewedAt = new Date();

    // Update user's KYC status
    const user = await userModel.findById(kyc.userId);
    if (user) {
      user.kycStatus = "rejected";
      await user.save();
    }

    await kyc.save();
     await NotificationService.createKYCNotification(kyc.userId, kyc, kyc.status);

    res.json({
      success: true,
      message: "KYC rejected successfully",
      kyc
    });
  } catch (error) {
    console.error("Error rejecting KYC:", error);
    res.status(500).json({
      success: false,
      message: "Error rejecting KYC",
      error: error.message
    });
  }
};

// @desc    Mark KYC for manual review
// @route   PUT /api/kyc/:id/review
// @access  Private/Admin
export const markForReview = async (req, res) => {
  try {
    const { id } = req.params;

    const kyc = await KYC.findById(id);

    if (!kyc) {
      return res.status(404).json({
        success: false,
        message: "KYC application not found"
      });
    }

    if (kyc.status !== "pending") {
      return res.json({
        success: false,
        message: `KYC cannot be marked for review. Current status: ${kyc.status}`
      });
    }

    kyc.status = "under_review";
    kyc.reviewedAt = new Date();

    await kyc.save();

    res.json({
      success: true,
      message: "KYC marked for manual review",
      kyc
    });
  } catch (error) {
    console.error("Error marking KYC for review:", error);
    res.status(500).json({
      success: false,
      message: "Error updating KYC status",
      error: error.message
    });
  }
};

// @desc    Get KYC dashboard statistics
// @route   GET /api/kyc/dashboard/stats
// @access  Private/Admin
export const getKYCStats = async (req, res) => {
  try {
    const stats = await KYC.getDashboardStats();

    const pendingReview = await KYC.countDocuments({
      status: { $in: ["pending", "under_review"] }
    });

    const result = stats[0] || {
      total: 0,
      pending: 0,
      underReview: 0,
      approved: 0,
      rejected: 0
    };

    result.pendingReview = pendingReview;

    res.json({
      success: true,
      stats: result
    });
  } catch (error) {
    console.error("Error fetching KYC stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching KYC statistics",
      error: error.message
    });
  }
};

// @desc    Update KYC application
// @route   PUT /api/kyc/:id
// @access  Private
export const updateKYC = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { name, documentType, documentNumber } = req.body;

    const kyc = await KYC.findById(id);

    if (!kyc) {
      return res.status(404).json({
        success: false,
        message: "KYC application not found"
      });
    }

    // Check ownership
    if (kyc.userId.toString() !== userId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this KYC"
      });
    }

    // Can only update if pending or under review
    if (kyc.status !== "pending" && kyc.status !== "under_review") {
      return res.json({
        success: false,
        message: "Cannot update approved or rejected KYC"
      });
    }

    // Update fields
    if (name) kyc.name = name;
    if (documentType) kyc.documentType = documentType;
    if (documentNumber) {
      // Check if new document number is already used
      if (documentNumber !== kyc.documentNumber) {
        const existing = await KYC.findOne({
          documentNumber,
          status: { $in: ["approved", "pending", "under_review"] },
          _id: { $ne: id }
        });

        if (existing) {
          return res.json({
            success: false,
            message: "This document number is already registered"
          });
        }
        kyc.documentNumber = documentNumber;
      }
    }

    // Update images if provided
    if (req.body.documentFrontImage) {
      kyc.documentFrontImage = req.body.documentFrontImage;
      kyc.documentFrontPublicId = req.body.documentFrontPublicId;
    }
    if (req.body.documentBackImage) {
      kyc.documentBackImage = req.body.documentBackImage;
      kyc.documentBackPublicId = req.body.documentBackPublicId;
    }

    // Reset status if it was under review
    if (kyc.status === "under_review") {
      kyc.status = "pending";
    }

    await kyc.save();

    res.json({
      success: true,
      message: "KYC updated successfully",
      kyc
    });
  } catch (error) {
    console.error("Error updating KYC:", error);
    res.status(500).json({
      success: false,
      message: "Error updating KYC application",
      error: error.message
    });
  }
};

// @desc    Delete KYC application
// @route   DELETE /api/kyc/:id
// @access  Private/Admin
export const deleteKYC = async (req, res) => {
  try {
    const { id } = req.params;

    const kyc = await KYC.findById(id);

    if (!kyc) {
      return res.status(404).json({
        success: false,
        message: "KYC application not found"
      });
    }

    // Update user's KYC status
    if (kyc.status === "approved" || kyc.status === "pending") {
      const user = await userModel.findById(kyc.userId);
      if (user) {
        user.kycStatus = "not_verified";
        await user.save();
      }
    }

    // Delete from database (this will trigger the pre-remove hook)
    await kyc.deleteOne();

    res.json({
      success: true,
      message: "KYC application deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting KYC:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting KYC application",
      error: error.message
    });
  }
};

// @desc    Check if KYC is required
// @route   GET /api/kyc/check-requirement
// @access  Private
export const checkKYCRequirement = async (req, res) => {
  try {
    const userId = req.user.id;

    const kyc = await KYC.findOne({
      userId,
      status: "approved"
    });

    if (!kyc) {
      return res.json({
        success: true,
        kycRequired: true,
        message: "KYC verification required"
      });
    }

    res.json({
      success: true,
      kycRequired: false,
      kyc
    });
  } catch (error) {
    console.error("Error checking KYC requirement:", error);
    res.status(500).json({
      success: false,
      message: "Error checking KYC requirement",
      error: error.message
    });
  }
};