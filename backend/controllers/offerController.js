import Offer from "../models/offerModel.js";
import userModel from "../models/usermodel.js";
import addTime from "../utils/time.js";

// POST new offer
export const createOffer = async (req, res) => {
    try {

        console.log("Offer creation request received");

        const userId = req.user.id;
        const user = await userModel.findById(userId);

        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        // Restrict to 1 active offer (exclude expired ones)
        const now = new Date();
        const activeOffer = await Offer.findOne({
            seller: userId,
            expireAt: { $gt: now },
        });
        console.log(activeOffer)

        if (activeOffer) {
            return res.json({ success: false, message: "You already have an active offer" });
        }

        // Expiration: 2 days for normal, 7 days for VIP
        const expireDays = user.vip ? 7 : 2;
        const expireAt = addTime(new Date(), { hours: 1 });

        // const expireAt = addTime(new Date(), { minutes: expireDays });

        console.log('the req hit the server')
        // Pull data from body
        const { rate, availableUSDT, minLimit, maxLimit, accountNumber, supportedWallets } = req.body;
        console.log({
            rate, availableUSDT, minLimit, maxLimit, accountNumber, supportedWallets
        })

        if (!rate || !availableUSDT || !minLimit || !maxLimit || !accountNumber || !supportedWallets) {
            return res.json({ success: false, message: "Missing required fields" });
        }

        const offer = new Offer({
            seller: userId,
            rate,
            availableUSDT,
            minLimit,
            maxLimit,
            accountNumber,
            supportedWallets,
            createdAt: now,
            expireAt,
        });



        await offer.save();
        res.json({ success: true, message: "Offer created successfully", seller: offer.seller });

    } catch (err) {
        console.error("Create offer error:", err);
        res.json({ success: false, message: "Server error" });
    }
};

// GET all offers with seller details populated
export const getOffers = async (req, res) => {
    try {
        const now = new Date();
        const { page = 1, limit = 10 } = req.query; // Default values for page and limit

        const offers = await Offer.find({ expireAt: { $gt: now } })
            .populate("seller", "userName isVip rating trades orders completion avgSpeed")
            .sort({ rate: 1 })
            .skip((page - 1) * limit) // Skip documents for pagination
            .limit(parseInt(limit)); // Limit the number of documents

        res.json(offers);
    } catch (err) {
        console.error("Get offers error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// GET offer by ID with seller details populated
export const getOfferById = async (req, res) => {''
    try {
        console.log('the hit hit server111')
        const { id } = req.body;
        //const { id } = req.params;

        console.log(id)

        const offer = await Offer.findOne({ seller: id })


        if (!offer) {
            return res.json({ success: false, message: "Offer not found" });
        }

        res.json({ success: true, offer });

    } catch (err) {
        console.error("Get offer by ID error:", err);
        res.json({ success: false, message: "Server error" });
    }
};

export const getOffer = async (req, res) => {
    try {
        const { id } = req.body;

        const offer = await Offer.findById(id)
            .populate("seller", "avgSpeed");

        if (!offer) {
            return res.json({ success: false, message: "Offer not found" });
        }

        res.json({ success: true, offer });
    } catch (err) {
        console.error("Get offer by ID error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};



// DELETE offer by ID
export const deleteOffer = async (req, res) => {
    try {
        console.log('the delete offer hit server')
        const { id } = req.body;

        const offer = await Offer.findOne({ seller: id });
        console.log(id)

        if (!offer) {
            return res.json({ success: false, message: "Offer not found123" });
        }


        // Check if the user is the owner of the offer
        /* if (offer.seller.toString() !== req.user.id) {
             return res.status(403).json({ success: false, message: "Unauthorized" });
         }*/

        await Offer.findByIdAndDelete(offer._id);

        res.json({ success: true, message: "Offer deleted successfully" });
    } catch (err) {
        console.error("Delete offer error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};