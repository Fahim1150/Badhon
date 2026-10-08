const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const express = require("express");

const {
    getMyProfile,
    updateMyProfile,
    createUser,
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    loginUser,
} = require("../controllers/userController");

const router = express.Router();

router.get("/me", authMiddleware, getMyProfile);
router.put("/me", authMiddleware, updateMyProfile);
router.post("/", authMiddleware, authorizeRoles("ADMIN"), createUser);
router.post("/login", loginUser);

router.get("/", authMiddleware, authorizeRoles("ADMIN"), getUsers);
router.get("/:id", authMiddleware, authorizeRoles("ADMIN"), getUserById);
router.put("/:id", authMiddleware, authorizeRoles("ADMIN"), updateUser);

router.delete(
    "/:id",
    authMiddleware,
    authorizeRoles("ADMIN"),
    deleteUser
);

module.exports = router;