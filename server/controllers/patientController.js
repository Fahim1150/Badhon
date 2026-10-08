const Patient = require("../models/Patient");
const User = require("../models/User");

const getPatientFields = (body) => ({
  name: body.name,
  age: body.age,
  gender: body.gender,
  bloodGroup: body.bloodGroup,
  phone: body.phone,
  address: body.address,
  disease: body.disease,
  emergencyContact: body.emergencyContact,
});

const getMyPatient = async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.user.userId });

    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" });
    }

    return res.status(200).json(patient);
  } catch (error) {
    console.error("Get patient profile error:", error.message);
    return res.status(500).json({ message: "Unable to load patient profile" });
  }
};

const saveMyPatient = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("name");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const patient = await Patient.findOneAndUpdate(
      { user: user._id },
      { ...getPatientFields(req.body), user: user._id },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.status(200).json({
      message: "Patient profile saved successfully",
      data: patient,
    });
  } catch (error) {
    console.error("Save patient profile error:", error.message);
    return res.status(400).json({ message: error.message });
  }
};

// Create a new patient
const createPatient = async (req, res) => {
  try {
    const patient = await Patient.create(req.body);

    res.status(201).json({
      success: true,
      message: "Patient created successfully",
      data: patient,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all patients
const getPatients = async (req, res) => {
  try {
    const patients = await Patient.find();

    res.status(200).json({
      success: true,
      count: patients.length,
      data: patients,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get a single patient by ID
const getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    res.status(200).json({
      success: true,
      data: patient,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Invalid patient ID",
    });
  }
};

// Update a patient
const updatePatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Patient updated successfully",
      data: patient,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete a patient
const deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Patient deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Invalid patient ID",
    });
  }
};

module.exports = {
  getMyPatient,
  saveMyPatient,
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
  deletePatient,
};