const express = require("express");

const authenticateToken = require("../middleware/authMiddleware");

const {
  createBloodRequest,
  getBloodRequests,
  getMyBloodRequests,
  getBloodRequestById,
  updateBloodRequest,
  updateBloodRequestStatus,
  respondToBloodRequest,
  deleteBloodRequest,
} = require("../controllers/bloodRequestController");

const router = express.Router();

router.post("/", authenticateToken, createBloodRequest);
router.get("/", authenticateToken.optional, getBloodRequests);
router.get("/my", authenticateToken, getMyBloodRequests);
router.get("/:id", authenticateToken.optional, getBloodRequestById);
router.put("/:id", authenticateToken, updateBloodRequest);
router.patch("/:id/status", authenticateToken, updateBloodRequestStatus);
router.post("/:id/respond", authenticateToken, respondToBloodRequest);
router.delete("/:id", authenticateToken, deleteBloodRequest);

module.exports = router;
