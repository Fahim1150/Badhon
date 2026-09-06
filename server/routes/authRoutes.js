const express = require("express");
const rateLimit = require("express-rate-limit");

const {
  register,
  login,
} = require("../controllers/authController");

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Maximum 10 requests
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many authentication attempts. Please try again later."
  }
});

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);

module.exports = router;