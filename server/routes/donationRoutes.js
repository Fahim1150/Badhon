
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

const {
    createDonation,
    getMyDonations,
} = require("../controllers/donationController");

const router = express.Router();

router.post("/", authMiddleware, createDonation);
router.get("/my", authMiddleware, getMyDonations);

module.exports = router;
