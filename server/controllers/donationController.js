
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
        Math.ceil((eligibleOnDate - today) / (1000 * 60 * 60 * 24))
    );

    return {
        eligible: daysRemaining === 0,
        eligibleOn: eligibleOnDate.toISOString().slice(0, 10),
        daysRemaining,
    };
};

const parseDonationDate = (value) => {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
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

// POST /api/donations
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

        if (typeof hospital !== "string" || hospital.trim().length < 2) {
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
                message: "Please provide a valid donation date that is not in the future",
            });
        }

        if (
            recipientReference !== undefined &&
            (typeof recipientReference !== "string" ||
                recipientReference.trim().length > 100)
        ) {
            return res.status(400).json({
                message: "Recipient reference must be a string of at most 100 characters",
            });
        }

        if (
            notes !== undefined &&
            (typeof notes !== "string" || notes.trim().length > 500)
        ) {
            return res.status(400).json({
                message: "Notes must be a string of at most 500 characters",
            });
        }

        const donor = await Donor.findOne({
            user: req.user.userId,
        });

        if (!donor) {
            return res.status(404).json({
                message: "Create your donor profile before recording a donation",
            });
        }

        const donation = await Donation.create({
            donor: donor._id,
            date: parsedDate,
            hospital: hospital.trim(),
            units,
            recipientReference: recipientReference?.trim() || "",
            notes: notes?.trim() || "",
        });

        // Keep the most recent donation date.
        const currentLastDate = donor.lastDonationDate
            ? new Date(donor.lastDonationDate)
            : null;

        const latestDonationDate =
            !currentLastDate || parsedDate > currentLastDate
                ? parsedDate
                : currentLastDate;

        donor.lastDonationDate = latestDonationDate;

        const eligibility = getEligibility(latestDonationDate);

        // A donor cannot remain available during the recovery period.
        if (!eligibility.eligible) {
            donor.available = false;
        }

        await donor.save();

        return res.status(201).json({
            message: "Donation recorded successfully",
            donation,
            eligibility,
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

        const eligibility = getEligibility(donor.lastDonationDate);

        return res.status(200).json({
            donations,
            totalDonations: donations.length,
            eligibility,
        });
    } catch (error) {
        console.error("Get donation history error:", error.message);

        return res.status(500).json({
            message: "Unable to retrieve donation history",
        });
    }
};

module.exports = {
    createDonation,
    getMyDonations,
};
