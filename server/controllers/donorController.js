const Donor = require("../models/Donor");
const User = require("../models/User");
const Donation = require("../models/Donation");

const isCompleteDonorProfile = (donor) =>
    Donor.schema.path("bloodGroup").enumValues.includes(donor.bloodGroup) &&
    /^01\d{9}$/.test((donor.phone || "").trim()) &&
    (donor.district || "").trim().length >= 2;

const getEligibility = (lastDonationDate) => {
    if (!lastDonationDate) {
        return { eligible: true, eligibleOn: null };
    }

    const donationDate = new Date(lastDonationDate);
    const eligibleOnDate = new Date(donationDate);
    eligibleOnDate.setUTCDate(eligibleOnDate.getUTCDate() + 90);

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    return {
        eligible: eligibleOnDate <= today,
        eligibleOn: eligibleOnDate.toISOString().slice(0, 10),
    };
};

const syncDonorEligibility = async (donor) => {
    const latestVerifiedDonation = await Donation.findOne({
        donor: donor._id,
        status: "verified",
    }).sort({
        date: -1,
        createdAt: -1,
    });

    donor.lastDonationDate = latestVerifiedDonation
        ? latestVerifiedDonation.date
        : null;

    const eligibility = getEligibility(donor.lastDonationDate);

    if (!eligibility.eligible) {
        donor.available = false;
    }

    await donor.save();

    return eligibility;
};


const donorResponse = (donor) => {
    const response = donor.toObject();
    const eligibility = getEligibility(response.lastDonationDate);
    response.eligible = eligibility.eligible;
    response.eligibleOn = eligibility.eligibleOn;
    response.available =
        response.available === true &&
        isCompleteDonorProfile(response) &&
        eligibility.eligible;
    return response;
};

// CREATE
const createDonor = async (req, res) => {
    try {
        const {
            phone,
            bloodGroup,
            district,
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
            lastDonationDate: null,
            available: false,
        });

        res.status(201).json(donorResponse(donor));
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

        await syncDonorEligibility(donor);

        return res.status(200).json(donorResponse(donor));
    } catch (error) {
        console.error("Get donor profile error:", error.message);

        res.status(500).json({
            message: "Server error",
        });
    }
};


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

        const currentDonor = await Donor.findOne({
            user: req.user.userId,
        });

        if (!currentDonor) {
            return res.status(404).json({
                message: "Donor profile not found",
            });
        }

        const eligibility = await syncDonorEligibility(currentDonor);

        if (available === true && !eligibility.eligible) {
            return res.status(400).json({
                message: "You cannot enable availability during the 90-day recovery period",
                eligibleOn: eligibility.eligibleOn,
            });
        }

        currentDonor.phone = normalizedPhone;
        currentDonor.bloodGroup = bloodGroup;
        currentDonor.district = normalizedDistrict;

        if (available !== undefined) {
            currentDonor.available = available;
        }

        await currentDonor.save();

        const donor = currentDonor;


        return res.status(200).json(donorResponse(donor));
    } catch (error) {
        console.error("Update donor profile error:", error.message);

        return res.status(400).json({
            message: error.message,
        });
    }
};



const searchDonors = async (req, res) => {
    try {
        const { bloodGroup, district, location, available } = req.query;
        const filter = {};

        const validBloodGroups =
            Donor.schema.path("bloodGroup").enumValues;

        if (bloodGroup && !validBloodGroups.includes(bloodGroup)) {
            return res.status(400).json({
                message: "Please select a valid blood group",
            });
        }

        if (bloodGroup) {
            filter.bloodGroup = bloodGroup;
        }

        const area = (district || location || "").trim();

        if (area) {
            const escapedArea = area.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );

            filter.district = {
                $regex: escapedArea,
                $options: "i",
            };
        }

        if (
            available !== undefined &&
            available !== "true" &&
            available !== "false"
        ) {
            return res.status(400).json({
                message: "Available must be true or false",
            });
        }

        const donors = await Donor.find(filter).sort({ createdAt: -1 });

        let results = donors.map((donor) => {
            const response = donorResponse(donor);

            // Never expose contact details for unavailable donors.
            if (!response.available) {
                delete response.phone;
                delete response.email;
            }

            return response;
        });

        // Filter by effective availability, including cooldown eligibility.
        if (available !== undefined) {
            const expected = available === "true";
            results = results.filter((donor) => donor.available === expected);
        }

        return res.status(200).json(results);
    } catch (error) {
        console.error("Search donors error:", error.message);

        return res.status(500).json({
            message: "Unable to search donors",
        });
    }
};


// READ ALL — with blood group, district and name search
const getDonors = async (req, res) => {
    try {
        const { bloodGroup, district, search } = req.query;
        const filter = {};

        // Validate blood group when supplied
        const validBloodGroups =
            Donor.schema.path("bloodGroup").enumValues;

        if (bloodGroup && !validBloodGroups.includes(bloodGroup)) {
            return res.status(400).json({
                message: "Please select a valid blood group",
            });
        }

        if (bloodGroup) {
            filter.bloodGroup = bloodGroup;
        }

        // Case-insensitive district filter
        if (district && district.trim()) {
            filter.district = {
                $regex: district.trim().replace(
                    /[.*+?^${}()|[\]\\]/g,
                    "\\$&"
                ),
                $options: "i",
            };
        }

        // Optional name search
        if (search && search.trim()) {
            const safeSearch = search.trim().replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );

            filter.name = {
                $regex: safeSearch,
                $options: "i",
            };
        }

        const donors = await Donor.find(filter).sort({
            createdAt: -1,
        });

        const results = donors.map((donor) => {
            const response = donorResponse(donor);

            // Keep contact information private for unavailable donors
            if (!response.available) {
                delete response.phone;
                delete response.email;
            }

            return response;
        });

        return res.status(200).json(results);
    } catch (error) {
        console.error("Get donors error:", error.message);

        return res.status(500).json({
            message: "Unable to retrieve donors",
        });
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
        const { phone, bloodGroup, district, available } = req.body;

        const donor = await Donor.findById(req.params.id);

        if (!donor) {
            return res.status(404).json({
                message: "Donor not found",
            });
        }
        const eligibility = await syncDonorEligibility(donor);
        if (phone !== undefined) {
            if (typeof phone !== "string" || !/^01\d{9}$/.test(phone.trim())) {
                return res.status(400).json({
                    message: "Please provide a valid Bangladesh mobile number",
                });
            }
            donor.phone = phone.trim();
        }

        if (bloodGroup !== undefined) {
            if (!Donor.schema.path("bloodGroup").enumValues.includes(bloodGroup)) {
                return res.status(400).json({
                    message: "Please select a valid blood group",
                });
            }
            donor.bloodGroup = bloodGroup;
        }

        if (district !== undefined) {
            if (typeof district !== "string" || district.trim().length < 2) {
                return res.status(400).json({
                    message: "Please provide a valid district",
                });
            }
            donor.district = district.trim();
        }

        if (available !== undefined && typeof available !== "boolean") {
            return res.status(400).json({
                message: "Availability must be true or false",
            });
        }

        const profileComplete = isCompleteDonorProfile(donor);

        if (available === true && (!eligibility.eligible || !profileComplete)) {
            return res.status(400).json({
                message: !eligibility.eligible
                    ? "Donor is still within the 90-day recovery period"
                    : "Complete the donor profile before enabling availability",
                eligibleOn: eligibility.eligibleOn,
            });
        }

        if (available !== undefined) {
            donor.available = available;
        }

        await donor.save();

        return res.status(200).json(donorResponse(donor));
    } catch (error) {
        console.error("Update donor error:", error.message);

        return res.status(400).json({
            message: error.message,
        });
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
    searchDonors,
    getDonorById,
    updateDonor,
    deleteDonor,
};
