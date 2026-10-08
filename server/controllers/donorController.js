const Donor = require("../models/Donor");
const User = require("../models/User");

const isCompleteDonorProfile = (donor) =>
    Donor.schema.path("bloodGroup").enumValues.includes(donor.bloodGroup) &&
    /^01\d{9}$/.test((donor.phone || "").trim()) &&
    (donor.district || "").trim().length >= 2;

const donorResponse = (donor) => {
    const response = donor.toObject();
    response.available = response.available === true && isCompleteDonorProfile(response);
    return response;
};

// CREATE
const createDonor = async (req, res) => {
    try {
        const {
            phone,
            bloodGroup,
            district,
            available,
        } = req.body;

        const normalizedPhone = String(phone || "").trim();
        const normalizedDistrict = String(district || "").trim();

        if (!normalizedPhone || !bloodGroup || normalizedDistrict.length < 2) {
            return res.status(400).json({
                message: "Phone, blood group and district are required",
            });
        }

        if (!/^01\d{9}$/.test(normalizedPhone)) {
            return res.status(400).json({
                message: "Please provide a valid Bangladesh mobile number",
            });
        }

        if (!Donor.schema.path("bloodGroup").enumValues.includes(bloodGroup)) {
            return res.status(400).json({
                message: "Please select a valid blood group",
            });
        }

        if (available !== undefined && typeof available !== "boolean") {
            return res.status(400).json({
                message: "Availability must be true or false",
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
            phone: normalizedPhone,
            bloodGroup,
            district: normalizedDistrict,
            available:
                typeof available === "boolean"
                    ? available
                    : false,
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

        res.status(200).json(donorResponse(donor));
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

        const normalizedPhone = String(phone || "").trim();
        const normalizedDistrict = String(district || "").trim();

        if (!normalizedPhone || !bloodGroup || normalizedDistrict.length < 2) {
            return res.status(400).json({
                message: "Phone, blood group and district are required",
            });
        }

        if (!/^01\d{9}$/.test(normalizedPhone)) {
            return res.status(400).json({
                message: "Please provide a valid Bangladesh mobile number",
            });
        }

        if (!Donor.schema.path("bloodGroup").enumValues.includes(bloodGroup)) {
            return res.status(400).json({
                message: "Please select a valid blood group",
            });
        }

        if (available !== undefined && typeof available !== "boolean") {
            return res.status(400).json({
                message: "Availability must be true or false",
            });
        }

        const donor = await Donor.findOneAndUpdate(
            { user: req.user.userId },
            {
                phone: normalizedPhone,
                bloodGroup,
                district: normalizedDistrict,
                available:
                    typeof available === "boolean"
                        ? available
                        : false,
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
        res.status(200).json(donors.map(donorResponse));
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

        res.status(200).json(donorResponse(donor));
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
