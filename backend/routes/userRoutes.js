import express from 'express';
import {
  getAllUsers,
  getUser,
  updateUser,
  updateUserBalance,
  toggleBlockUser,
  toggleForceWin,
  deleteUser,
  deleteManyUsers,
  updateKYCStatus,
  getUserStats
} from '../controllers/userController.js';

const userRouter = express.Router();

// Get user statistics
userRouter.get('/stats', getUserStats);

// Get all users with pagination and filters
userRouter.get('/', getAllUsers);

// Get single user
userRouter.get('/:id', getUser);

// Update user
userRouter.put('/:id', updateUser);

// Update user balance
userRouter.put('/:id/balance', updateUserBalance);

// Toggle block status
userRouter.put('/:id/toggle-block', toggleBlockUser);

// Toggle force win
userRouter.put('/:id/toggle-force-win', toggleForceWin);

// Update KYC status
userRouter.put('/:id/kyc-status', updateKYCStatus);

// Delete single user
userRouter.delete('/:id', deleteUser);

// Delete multiple users
userRouter.delete('/', deleteManyUsers);

export default userRouter;