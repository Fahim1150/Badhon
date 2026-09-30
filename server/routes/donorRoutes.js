const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
    createDonor,
    getMyDonorProfile,
    getDonors,
    getDonorById,
    updateDonor,
    deleteDonor,
} = require("../controllers/donorController");

const router = express.Router();

router.post("/", authMiddleware, createDonor);

router.get("/me", authMiddleware, getMyDonorProfile);

router.get("/", authMiddleware, getDonors);

router.get("/:id", authMiddleware, getDonorById);

router.put("/:id", authMiddleware, updateDonor);

router.delete(
    "/:id",
    authMiddleware,
    authorizeRoles("ADMIN"),
    deleteDonor
);

module.exports = router;
