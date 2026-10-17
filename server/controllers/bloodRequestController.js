const BloodRequest = require("../models/BloodRequest");
const Donor = require("../models/Donor");
const User = require("../models/User");

const validBloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const validUrgencies = ["Low", "Medium", "High", "Emergency"];
const validStatuses = ["Pending", "Matched", "Fulfilled", "Cancelled", "Expired"];

// Helper: auto-expire requests past their deadline
const checkAndExpireRequests = async () => {
  try {
    const now = new Date();
    await BloodRequest.updateMany(
      {
        status: { $in: ["Pending", "Matched"] },
        neededBy: { $ne: null, $lt: now },
      },
      {
        $set: { status: "Expired" },
      }
    );
  } catch (err) {
    console.error("Auto-expire blood requests check failed:", err.message);
  }
};

// CREATE
const createBloodRequest = async (req, res) => {
  try {
    const {
      patientName,
      bloodGroup,
      location,
      hospital,
      contactNumber,
      requiredUnits,
      urgency,
      neededBy,
      notes,
    } = req.body;

    const trimmedPatientName = String(patientName || "").trim();
    const trimmedLocation = String(location || "").trim();
    const trimmedContact = String(contactNumber || "").trim();
    const trimmedHospital = String(hospital || "").trim();
    const trimmedNotes = String(notes || "").trim();

    if (!trimmedPatientName || trimmedPatientName.length < 2) {
      return res.status(400).json({
        message: "Patient name is required (at least 2 characters)",
      });
    }

    if (!validBloodGroups.includes(bloodGroup)) {
      return res.status(400).json({
        message: `Blood group must be one of: ${validBloodGroups.join(", ")}`,
      });
    }

    if (!trimmedLocation || trimmedLocation.length < 2) {
      return res.status(400).json({
        message: "Location/district is required (at least 2 characters)",
      });
    }

    if (!trimmedContact) {
      return res.status(400).json({
        message: "Contact number is required",
      });
    }

    if (!/^01\d{9}$/.test(trimmedContact)) {
      return res.status(400).json({
        message: "Contact number must be a valid 11-digit mobile number (01XXXXXXXXX)",
      });
    }

    const units = Number(requiredUnits);
    if (!units || Number.isNaN(units) || units < 1) {
      return res.status(400).json({
        message: "Required units must be an integer greater than or equal to 1",
      });
    }

    const requestUrgency = urgency || "Medium";
    if (!validUrgencies.includes(requestUrgency)) {
      return res.status(400).json({
        message: `Urgency must be one of: ${validUrgencies.join(", ")}`,
      });
    }

    let parsedNeededBy = null;
    if (neededBy) {
      parsedNeededBy = new Date(neededBy);
      if (Number.isNaN(parsedNeededBy.getTime())) {
        return res.status(400).json({
          message: "Invalid neededBy date format",
        });
      }
    }

    const bloodRequest = await BloodRequest.create({
      requester: req.user.userId,
      patientName: trimmedPatientName,
      bloodGroup,
      location: trimmedLocation,
      hospital: trimmedHospital,
      contactNumber: trimmedContact,
      requiredUnits: Math.floor(units),
      urgency: requestUrgency,
      neededBy: parsedNeededBy,
      notes: trimmedNotes,
      status: "Pending",
    });

    const populated = await BloodRequest.findById(bloodRequest._id)
      .populate("requester", "name email")
      .populate("matchedDonor", "name phone bloodGroup district");

    res.status(201).json(populated);
  } catch (error) {
    console.error("Create blood request error:", error.message);
    res.status(400).json({ message: error.message });
  }
};

// READ ALL (with filtering & search)
const getBloodRequests = async (req, res) => {
  try {
    await checkAndExpireRequests();

    const {
      bloodGroup,
      status,
      urgency,
      district,
      search,
      myRequests,
    } = req.query;

    const filter = {};

    if (bloodGroup && validBloodGroups.includes(bloodGroup)) {
      filter.bloodGroup = bloodGroup;
    }

    if (status && validStatuses.includes(status)) {
      filter.status = status;
    }

    if (urgency && validUrgencies.includes(urgency)) {
      filter.urgency = urgency;
    }

    if (district) {
      filter.location = { $regex: String(district).trim(), $options: "i" };
    }

    if (search) {
      const searchRegex = { $regex: String(search).trim(), $options: "i" };
      filter.$or = [
        { patientName: searchRegex },
        { location: searchRegex },
        { hospital: searchRegex },
      ];
    }

    if (myRequests === "true" && req.user?.userId) {
      filter.requester = req.user.userId;
    }

    const requests = await BloodRequest.find(filter)
      .populate("requester", "name email")
      .populate("matchedDonor", "name phone bloodGroup district")
      .populate("responses.donor", "name phone bloodGroup district")
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    console.error("Get blood requests error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// READ MY REQUESTS
const getMyBloodRequests = async (req, res) => {
  try {
    await checkAndExpireRequests();

    const requests = await BloodRequest.find({ requester: req.user.userId })
      .populate("requester", "name email")
      .populate("matchedDonor", "name phone bloodGroup district")
      .populate("responses.donor", "name phone bloodGroup district")
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    console.error("Get my blood requests error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// READ BY ID
const getBloodRequestById = async (req, res) => {
  try {
    await checkAndExpireRequests();

    const request = await BloodRequest.findById(req.params.id)
      .populate("requester", "name email")
      .populate("matchedDonor", "name phone bloodGroup district")
      .populate("responses.donor", "name phone bloodGroup district");

    if (!request) {
      return res.status(404).json({ message: "Blood request not found" });
    }

    res.status(200).json(request);
  } catch (error) {
    res.status(400).json({ message: "Invalid blood request ID" });
  }
};

// UPDATE (with ownership checks)
const updateBloodRequest = async (req, res) => {
  try {
    const request = await BloodRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "Blood request not found" });
    }

    const isOwner =
      request.requester &&
      request.requester.toString() === req.user.userId;
    const isAdmin = req.user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: "You can only update your own blood requests",
      });
    }

    if (["Fulfilled", "Cancelled"].includes(request.status) && !isAdmin) {
      return res.status(400).json({
        message: `Cannot update a blood request that has already been ${request.status.toLowerCase()}`,
      });
    }

    const {
      patientName,
      bloodGroup,
      location,
      hospital,
      contactNumber,
      requiredUnits,
      urgency,
      neededBy,
      notes,
    } = req.body;

    if (patientName !== undefined) {
      const trimmed = String(patientName).trim();
      if (trimmed.length < 2) {
        return res.status(400).json({ message: "Patient name must be at least 2 characters" });
      }
      request.patientName = trimmed;
    }

    if (bloodGroup !== undefined) {
      if (!validBloodGroups.includes(bloodGroup)) {
        return res.status(400).json({ message: "Invalid blood group" });
      }
      request.bloodGroup = bloodGroup;
    }

    if (location !== undefined) {
      const trimmed = String(location).trim();
      if (trimmed.length < 2) {
        return res.status(400).json({ message: "Location must be at least 2 characters" });
      }
      request.location = trimmed;
    }

    if (hospital !== undefined) {
      request.hospital = String(hospital).trim();
    }

    if (contactNumber !== undefined) {
      const trimmed = String(contactNumber).trim();
      if (!/^01\d{9}$/.test(trimmed)) {
        return res.status(400).json({
          message: "Contact number must be a valid 11-digit mobile number (01XXXXXXXXX)",
        });
      }
      request.contactNumber = trimmed;
    }

    if (requiredUnits !== undefined) {
      const units = Number(requiredUnits);
      if (!units || Number.isNaN(units) || units < 1) {
        return res.status(400).json({
          message: "Required units must be an integer greater than or equal to 1",
        });
      }
      request.requiredUnits = Math.floor(units);
    }

    if (urgency !== undefined) {
      if (!validUrgencies.includes(urgency)) {
        return res.status(400).json({ message: "Invalid urgency value" });
      }
      request.urgency = urgency;
    }

    if (neededBy !== undefined) {
      if (neededBy === null || neededBy === "") {
        request.neededBy = null;
      } else {
        const parsed = new Date(neededBy);
        if (Number.isNaN(parsed.getTime())) {
          return res.status(400).json({ message: "Invalid neededBy date format" });
        }
        request.neededBy = parsed;
      }
    }

    if (notes !== undefined) {
      request.notes = String(notes).trim();
    }

    await request.save();

    const populated = await BloodRequest.findById(request._id)
      .populate("requester", "name email")
      .populate("matchedDonor", "name phone bloodGroup district")
      .populate("responses.donor", "name phone bloodGroup district");

    res.status(200).json(populated);
  } catch (error) {
    console.error("Update blood request error:", error.message);
    res.status(400).json({ message: error.message });
  }
};

// UPDATE STATUS (with ownership checks)
const updateBloodRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Status must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const request = await BloodRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "Blood request not found" });
    }

    const isOwner =
      request.requester &&
      request.requester.toString() === req.user.userId;
    const isAdmin = req.user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: "You can only change status for your own blood requests",
      });
    }

    request.status = status;
    if (status === "Pending" && request.matchedDonor) {
      request.matchedDonor = null;
      request.matchedDonorUser = null;
    }

    await request.save();

    const populated = await BloodRequest.findById(request._id)
      .populate("requester", "name email")
      .populate("matchedDonor", "name phone bloodGroup district")
      .populate("responses.donor", "name phone bloodGroup district");

    res.status(200).json(populated);
  } catch (error) {
    console.error("Update blood request status error:", error.message);
    res.status(400).json({ message: error.message });
  }
};

// RESPOND TO BLOOD REQUEST (Accept / Decline by donor)
const respondToBloodRequest = async (req, res) => {
  try {
    const { status, message } = req.body;

    if (!["Accepted", "Declined"].includes(status)) {
      return res.status(400).json({
        message: "Status must be either 'Accepted' or 'Declined'",
      });
    }

    // Verify authenticated user has a donor profile
    const donor = await Donor.findOne({ user: req.user.userId });
    if (!donor) {
      return res.status(400).json({
        message: "You must complete a donor profile before responding to blood requests",
      });
    }

    const request = await BloodRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Blood request not found" });
    }

    // Check ownership: cannot respond to own request
    if (
      request.requester &&
      request.requester.toString() === req.user.userId
    ) {
      return res.status(400).json({
        message: "You cannot respond to your own blood request",
      });
    }

    // Check request activity
    if (["Fulfilled", "Cancelled", "Expired"].includes(request.status)) {
      return res.status(400).json({
        message: `Cannot respond to a ${request.status.toLowerCase()} request`,
      });
    }

    // Check deadline
    if (request.neededBy && new Date(request.neededBy) < new Date()) {
      request.status = "Expired";
      await request.save();
      return res.status(400).json({
        message: "This blood request has expired",
      });
    }

    // Check if donor previously responded
    const existingIndex = request.responses.findIndex(
      (r) => r.user.toString() === req.user.userId
    );

    const responseData = {
      donor: donor._id,
      user: req.user.userId,
      donorName: donor.name,
      donorPhone: donor.phone,
      donorBloodGroup: donor.bloodGroup,
      status,
      message: typeof message === "string" ? message.trim() : "",
      respondedAt: new Date(),
    };

    if (existingIndex >= 0) {
      request.responses[existingIndex] = responseData;
    } else {
      request.responses.push(responseData);
    }

    // Status transition: if Accepted, set to Matched
    if (status === "Accepted") {
      request.status = "Matched";
      request.matchedDonor = donor._id;
      request.matchedDonorUser = req.user.userId;
    } else if (
      status === "Declined" &&
      request.matchedDonor &&
      request.matchedDonor.toString() === donor._id.toString()
    ) {
      // If the matched donor declined, reset matched status
      request.matchedDonor = null;
      request.matchedDonorUser = null;
      const otherAccepted = request.responses.find(
        (r) => r.status === "Accepted" && r.user.toString() !== req.user.userId
      );
      if (otherAccepted) {
        request.matchedDonor = otherAccepted.donor;
        request.matchedDonorUser = otherAccepted.user;
        request.status = "Matched";
      } else {
        request.status = "Pending";
      }
    }

    await request.save();

    const populated = await BloodRequest.findById(request._id)
      .populate("requester", "name email")
      .populate("matchedDonor", "name phone bloodGroup district")
      .populate("responses.donor", "name phone bloodGroup district");

    res.status(200).json({
      message: `You have ${status.toLowerCase()} this blood request`,
      request: populated,
    });
  } catch (error) {
    console.error("Respond to blood request error:", error.message);
    res.status(400).json({ message: error.message });
  }
};

// DELETE (with ownership checks)
const deleteBloodRequest = async (req, res) => {
  try {
    const request = await BloodRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "Blood request not found" });
    }

    const isOwner =
      request.requester &&
      request.requester.toString() === req.user.userId;
    const isAdmin = req.user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: "You can only delete your own blood requests",
      });
    }

    await BloodRequest.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Blood request deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: "Invalid blood request ID" });
  }
};

module.exports = {
  createBloodRequest,
  getBloodRequests,
  getMyBloodRequests,
  getBloodRequestById,
  updateBloodRequest,
  updateBloodRequestStatus,
  respondToBloodRequest,
  deleteBloodRequest,
};
