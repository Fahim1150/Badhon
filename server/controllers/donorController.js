const Donor = require("../models/Donor");
const User = require("../models/User");

// CREATE
const createDonor = async (req, res) => {
    try {
        const {
            phone,
            bloodGroup,
            district,
            available,
        } = req.body;

        if (!phone || !bloodGroup || !district) {
            return res.status(400).json({
                message: "Phone, blood group and district are required",
            });
        }

        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        const existingDonor = await Donor.findOne({
            user: req.user.userId,
        });

        if (existingDonor) {
            return res.status(409).json({
                message: "Donor profile already exists",
            });
        }

        const donor = await Donor.create({
            user: user._id,
            name: user.name,
            email: user.email,
            phone,
            bloodGroup,
            district,
            available:
                typeof available === "boolean"
                    ? available
                    : true,
        });

        res.status(201).json(donor);
    } catch (error) {
        console.error("Create donor error:", error.message);

        res.status(400).json({
            message: error.message,
        });
    }
};

// GET MY DONOR PROFILE
const getMyDonorProfile = async (req, res) => {
    try {
        const donor = await Donor.findOne({
            user: req.user.userId,
        });

        if (!donor) {
            return res.status(404).json({
                message: "Donor profile not found",
            });
        }

        res.status(200).json(donor);
    } catch (error) {
        console.error("Get donor profile error:", error.message);

        res.status(500).json({
            message: "Server error",
        });
    }
};

// UPDATE MY DONOR PROFILE
const updateMyDonorProfile = async (req, res) => {
    try {
        const {
            phone,
            bloodGroup,
            district,
            available,
        } = req.body;

        if (!phone || !bloodGroup || !district) {
            return res.status(400).json({
                message: "Phone, blood group and district are required",
            });
        }

        const donor = await Donor.findOneAndUpdate(
            { user: req.user.userId },
            {
                phone,
                bloodGroup,
                district,
                available:
                    typeof available === "boolean"
                        ? available
                        : true,
            },
            { new: true, runValidators: true }
        );

        if (!donor) {
            return res.status(404).json({
                message: "Donor profile not found",
            });
        }

        res.status(200).json(donor);
    } catch (error) {
        console.error("Update donor profile error:", error.message);

        res.status(400).json({
            message: error.message,
        });
    }
};

// READ ALL
const getDonors = async (req, res) => {
    try {
        const donors = await Donor.find().sort({ createdAt: -1 });
        res.status(200).json(donors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// READ BY ID
const getDonorById = async (req, res) => {
    try {
        const donor = await Donor.findById(req.params.id);

        if (!donor) {
            return res.status(404).json({ message: "Donor not found" });
        }

        res.status(200).json(donor);
    } catch (error) {
        res.status(400).json({ message: "Invalid donor ID" });
    }
};

// UPDATE BY ID
const updateDonor = async (req, res) => {
    try {
        const donor = await Donor.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!donor) {
            return res.status(404).json({ message: "Donor not found" });
        }

        res.status(200).json(donor);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// DELETE
const deleteDonor = async (req, res) => {
    try {
        const donor = await Donor.findByIdAndDelete(req.params.id);

        if (!donor) {
            return res.status(404).json({ message: "Donor not found" });
        }

        res.status(200).json({
            message: "Donor deleted successfully"
        });
    } catch (error) {
        res.status(400).json({ message: "Invalid donor ID" });
    }
};

module.exports = {
    createDonor,
    getMyDonorProfile,
    updateMyDonorProfile,
    getDonors,
    getDonorById,
    updateDonor,
    deleteDonor,
};
