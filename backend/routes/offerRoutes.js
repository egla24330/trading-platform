import express from "express";
import { getKycStatus, submitKYC } from "../controllers/kycController.js";
import { kycProtect, protect } from "../middlewares/authMiddleware.js";
import { createOffer, deleteOffer, getOfferById, getOffers } from "../controllers/offerController.js";
const offerRouter = express.Router();

offerRouter.get("/get", getOffers);
offerRouter.post("/create",kycProtect, createOffer)
//offerRouter.get('/get-by-id',getOfferById)
offerRouter.post('/get-by-id', getOfferById);
offerRouter.post('/delete', deleteOffer);


export default offerRouter;
