// routes/conversionRoutes.js
import express from 'express';
import { 
  getMarketPrices,
  calculateConversion,
  executeConversion,
  getConversionHistory,
  getUserBalance
} from '../controllers/conversionController.js';
import {protect} from '../middlewares/authMiddleware.js';

const conversionRouter = express.Router();
conversionRouter.use(protect);
conversionRouter.get('/prices', getMarketPrices);
conversionRouter.post('/calculate', calculateConversion);
conversionRouter.get('/balance', getUserBalance);
conversionRouter.post('/execute', executeConversion);
conversionRouter.get('/history', getConversionHistory);

export default conversionRouter;