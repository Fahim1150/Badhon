const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getJwtSecret } = require("../config/security");

const getMyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json(user);
    } catch (error) {
        console.error("Get user profile error:", error.message);
        return res.status(500).json({ message: "Unable to load user profile" });
    }
};

const updateMyProfile = async (req, res) => {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const email = typeof req.body.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    if (name.length < 2 || name.length > 100) {
        return res.status(400).json({
            message: "Name must be between 2 and 100 characters",
        });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ message: "Please provide a valid email" });
    }

    try {
        const user = await User.findByIdAndUpdate(
            req.user.userId,
            { name, email },
            { new: true, runValidators: true, select: "-password" }
        );

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json(user);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: "Email is already in use" });
        }

        console.error("Update user profile error:", error.message);
        return res.status(400).json({ message: error.message });
    }
};

// Create User
const createUser = async (req, res) => {
    try {
        const { Password } = req.body;

        const hashedPassword = await bcrypt.hash(Password, 10);

        const user = await User.create({
            ...req.body,
            Password: hashedPassword,
        });

        res.status(201).json(user);
    } catch (error) {
        res.status(400).json({
            message: error.message,
        });
    }
};

// Get All Users
const getUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password");

        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

// Get User By ID
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-password");

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

// Update User
const updateUser = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(400).json({
            message: error.message,
        });
    }
};

// Delete User
const deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        res.status(200).json({
            message: "User deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

// Login User
const loginUser = async (req, res) => {
    try {
        const { Email, Password } = req.body;

        const user = await User.findOne({ Email });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        const isMatch = await bcrypt.compare(
            Password,
            user.Password
        );

        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        const token = jwt.sign(
            {
                User_ID: user.User_ID,
                Role: user.Role,
            },
            getJwtSecret(),
            {
                expiresIn: "1d",
            }
        );

        res.status(200).json({
            message: "Login successful",
            token: token,
        });

    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};
module.exports = {
    getMyProfile,
    updateMyProfile,
    createUser,
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    loginUser,
};
