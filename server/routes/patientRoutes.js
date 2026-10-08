const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const express = require("express");

const {
  getMyPatient,
  saveMyPatient,
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
  deletePatient,
} = require("../controllers/patientController");

const router = express.Router();

router.get("/me", authMiddleware, getMyPatient);
router.put("/me", authMiddleware, saveMyPatient);

router.post("/", authMiddleware, authorizeRoles("ADMIN"), createPatient);
router.get("/", authMiddleware, authorizeRoles("ADMIN"), getPatients);

router.get("/:id", authMiddleware, authorizeRoles("ADMIN"), getPatientById);

router.put("/:id", authMiddleware, authorizeRoles("ADMIN"), updatePatient);

// Delete a patient - ADMIN only
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("ADMIN"),
  deletePatient
);

module.exports = router;