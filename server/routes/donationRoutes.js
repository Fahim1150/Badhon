
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
    createDonation,
    getMyDonations,
    getPendingDonations,
    reviewDonation,
} = require("../controllers/donationController");

const router = express.Router();

router.post("/", authMiddleware, createDonation);
router.get("/my", authMiddleware, getMyDonations);

router.get(
    "/pending",
    authMiddleware,
    authorizeRoles("ADMIN"),
    getPendingDonations
);

router.patch(
    "/:id/review",
    authMiddleware,
    authorizeRoles("ADMIN"),
    reviewDonation
);

module.exports = router;
