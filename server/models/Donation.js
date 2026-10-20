
const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema(
    {
        donor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Donor",
            required: true,
            index: true,
        },

        status: {
            type: String,
            enum: ["pending", "verified", "rejected"],
            default: "pending",
            required: true,
        },

        date: {
            type: Date,
            required: true,
            validate: {
                validator: function (value) {
                    return value <= new Date();
                },
                message: "Donation date cannot be in the future.",
            },
        },

        hospital: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
        },

        units: {
            type: Number,
            required: true,
            min: 1,
            max: 10,
            validate: {
                validator: Number.isInteger,
                message: "Units must be a whole number.",
            },
        },

        recipientReference: {
            type: String,
            trim: true,
            maxlength: 100,
            default: "",
        },

        notes: {
            type: String,
            trim: true,
            maxlength: 500,
            default: "",
        },

    

        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        reviewedAt: {
            type: Date,
            default: null,
        },

        rejectionReason: {
            type: String,
            trim: true,
            maxlength: 500,
            default: "",
        },
    },
    { timestamps: true }
);

donationSchema.index({ donor: 1, date: -1 });

module.exports = mongoose.model("Donation", donationSchema);
