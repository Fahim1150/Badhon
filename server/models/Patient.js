const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      sparse: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    age: {
      type: Number,
      required: true,
      min: 0,
      max: 150,
    },

    gender: {
      type: String,
      required: true,
      enum: ["Male", "Female", "Other"],
    },

    bloodGroup: {
      type: String,
      required: true,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },

    phone: {
      type: String,
      required: true,
      trim: true,
      match: /^01\d{9}$/,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    disease: {
      type: String,
      required: true,
      trim: true,
    },

    emergencyContact: {
      type: String,
      required: true,
      trim: true,
      match: /^01\d{9}$/,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Patient", patientSchema);