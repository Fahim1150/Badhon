
const Donation = require("../models/Donation");
const Donor = require("../models/Donor");

const getEligibility = (lastDonationDate) => {
    if (!lastDonationDate) {
        return {
            eligible: true,
            eligibleOn: null,
            daysRemaining: 0,
        };
    }

    const eligibleOnDate = new Date(lastDonationDate);
    eligibleOnDate.setUTCHours(0, 0, 0, 0);
    eligibleOnDate.setUTCDate(eligibleOnDate.getUTCDate() + 90);

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const daysRemaining = Math.max(
        0,
        Math.ceil(
            (eligibleOnDate.getTime() - today.getTime()) /
            (1000 * 60 * 60 * 24)
        )
    );

    return {
        eligible: daysRemaining === 0,
        eligibleOn: eligibleOnDate.toISOString().slice(0, 10),
        daysRemaining,
    };
};

const parseDonationDate = (value) => {
    if (
        typeof value !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
        return null;
    }

    const date = new Date(`${value}T00:00:00.000Z`);

    if (
        Number.isNaN(date.getTime()) ||
        date.toISOString().slice(0, 10) !== value
    ) {
        return null;
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (date > today) {
        return null;
    }

    return date;
};

// Recalculate cooldown using verified donations only.
const syncDonorEligibility = async (donor) => {
    const latestVerifiedDonation = await Donation.findOne({
        donor: donor._id,
        status: "verified",
    }).sort({ date: -1, createdAt: -1 });

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

// POST /api/donations
// A submitted donation stays pending until an admin reviews it.
const createDonation = async (req, res) => {
    try {
        const {
            date,
            hospital,
            units,
            recipientReference,
            notes,
        } = req.body;

        if (!date || !hospital || units === undefined) {
            return res.status(400).json({
                message: "Date, hospital and units are required",
            });
        }

        if (
            typeof hospital !== "string" ||
            hospital.trim().length < 2
        ) {
            return res.status(400).json({
                message: "Please provide a valid hospital name",
            });
        }

        if (
            typeof units !== "number" ||
            !Number.isInteger(units) ||
            units < 1 ||
            units > 10
        ) {
            return res.status(400).json({
                message: "Units must be a whole number between 1 and 10",
            });
        }

        const parsedDate = parseDonationDate(date);

        if (!parsedDate) {
            return res.status(400).json({
                message:
                    "Please provide a valid donation date that is not in the future",
            });
        }

        if (
            recipientReference !== undefined &&
            (
                typeof recipientReference !== "string" ||
                recipientReference.trim().length > 100
            )
        ) {
            return res.status(400).json({
                message:
                    "Recipient reference must be a string of at most 100 characters",
            });
        }

        if (
            notes !== undefined &&
            (
                typeof notes !== "string" ||
                notes.trim().length > 500
            )
        ) {
            return res.status(400).json({
                message:
                    "Notes must be a string of at most 500 characters",
            });
        }

        const donor = await Donor.findOne({
            user: req.user.userId,
        });

        if (!donor) {
            return res.status(404).json({
                message:
                    "Create your donor profile before recording a donation",
            });
        }

        const donation = await Donation.create({
            donor: donor._id,
            date: parsedDate,
            hospital: hospital.trim(),
            units,
            recipientReference: recipientReference?.trim() || "",
            notes: notes?.trim() || "",
            status: "pending",
        });

        return res.status(201).json({
            message:
                "Donation submitted successfully and is awaiting admin verification",
            donation,
            eligibility: getEligibility(donor.lastDonationDate),
        });
    } catch (error) {
        console.error("Create donation error:", error.message);

        return res.status(500).json({
            message: "Unable to record donation",
        });
    }
};

// GET /api/donations/my
const getMyDonations = async (req, res) => {
    try {
        const donor = await Donor.findOne({
            user: req.user.userId,
        });

        if (!donor) {
            return res.status(404).json({
                message: "Donor profile not found",
            });
        }

        const donations = await Donation.find({
            donor: donor._id,
        }).sort({ date: -1, createdAt: -1 });

        // Synchronize legacy dates and calculate eligibility
        // from verified records only.
        const eligibility = await syncDonorEligibility(donor);

        const donationHistory = donations.map((donation) => {
            const item = donation.toObject();

            // Older records without a status need admin review.
            if (!item.status) {
                item.status = "pending";
            }

            return item;
        });

        const verifiedDonations = donationHistory.filter(
            (donation) => donation.status === "verified"
        ).length;

        return res.status(200).json({
            donations: donationHistory,
            totalDonations: donationHistory.length,
            verifiedDonations,
            eligibility,
        });
    } catch (error) {
        console.error("Get donation history error:", error.message);

        return res.status(500).json({
            message: "Unable to retrieve donation history",
        });
    }
};

// GET /api/donations/pending
const getPendingDonations = async (req, res) => {
    try {
        const donations = await Donation.find({
            $or: [
                { status: "pending" },
                { status: { $exists: false } },
            ],
        })
            .populate("donor", "name email bloodGroup district")
            .sort({ createdAt: 1 });

        return res.status(200).json({
            count: donations.length,
            donations,
        });
    } catch (error) {
        console.error("Get pending donations error:", error.message);

        return res.status(500).json({
            message: "Unable to retrieve pending donations",
        });
    }
};

// PATCH /api/donations/:id/review
// Request body: { "status": "verified" }
// or { "status": "rejected", "rejectionReason": "..." }
const reviewDonation = async (req, res) => {
    try {
        const { status, rejectionReason } = req.body;

        if (!["verified", "rejected"].includes(status)) {
            return res.status(400).json({
                message:
                    'Status must be either "verified" or "rejected"',
            });
        }

        if (
            rejectionReason !== undefined &&
            (
                typeof rejectionReason !== "string" ||
                rejectionReason.trim().length > 500
            )
        ) {
            return res.status(400).json({
                message:
                    "Rejection reason must be a string of at most 500 characters",
            });
        }

        const donation = await Donation.findById(req.params.id);

        if (!donation) {
            return res.status(404).json({
                message: "Donation not found",
            });
        }

        if (
            donation.status &&
            donation.status !== "pending"
        ) {
            return res.status(409).json({
                message: "This donation has already been reviewed",
            });
        }

        const donor = await Donor.findById(donation.donor);

        if (!donor) {
            return res.status(404).json({
                message: "Donor associated with this donation was not found",
            });
        }

        // An admin must not review their own donation.
        if (
            donor.user &&
            String(donor.user) === String(req.user.userId)
        ) {
            return res.status(403).json({
                message: "You cannot review your own donation",
            });
        }

        donation.status = status;
        donation.reviewedBy = req.user.userId;
        donation.reviewedAt = new Date();
        donation.rejectionReason =
            status === "rejected"
                ? rejectionReason?.trim() || ""
                : "";

        await donation.save();

        // Only verified records count toward the cooldown.
        const eligibility = await syncDonorEligibility(donor);

        return res.status(200).json({
            message:
                status === "verified"
                    ? "Donation verified successfully"
                    : "Donation rejected successfully",
            donation,
            eligibility,
        });
    } catch (error) {
        console.error("Review donation error:", error.message);

        if (error.name === "CastError") {
            return res.status(400).json({
                message: "Invalid donation ID",
            });
        }

        return res.status(500).json({
            message: "Unable to review donation",
        });
    }
};

module.exports = {
    createDonation,
    getMyDonations,
    getPendingDonations,
    reviewDonation,
};
