const mongoose = require("mongoose");

const donorResponseSchema = new mongoose.Schema(
  {
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Donor",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    donorName: {
      type: String,
      required: true,
      trim: true,
    },
    donorPhone: {
      type: String,
      required: true,
      trim: true,
    },
    donorBloodGroup: {
      type: String,
      required: true,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },
    status: {
      type: String,
      enum: ["Accepted", "Declined"],
      required: true,
    },
    message: {
      type: String,
      trim: true,
      default: "",
    },
    respondedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const bloodRequestSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    patientName: {
      type: String,
      required: true,
      trim: true,
    },
    bloodGroup: {
      type: String,
      required: true,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    hospital: {
      type: String,
      trim: true,
      default: "",
    },
    contactNumber: {
      type: String,
      required: true,
      trim: true,
    },
    requiredUnits: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    urgency: {
      type: String,
      enum: ["Low", "Medium", "High", "Emergency"],
      default: "Medium",
    },
    neededBy: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["Pending", "Matched", "Fulfilled", "Cancelled", "Expired"],
      default: "Pending",
    },
    matchedDonor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Donor",
      default: null,
    },
    matchedDonorUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    responses: {
      type: [donorResponseSchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BloodRequest", bloodRequestSchema);
