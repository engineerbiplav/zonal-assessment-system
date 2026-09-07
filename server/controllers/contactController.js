const ContactPerson = require("../models/ContactPerson");
const Club = require("../models/Club");
const Response = require("../models/Response");
const { cloudinary } = require("../config/cloudinary");
const { nanoid } = require("nanoid");

const ensureClubOwnership = async (clubId, adminId) => {
  const club = await Club.findOne({ _id: clubId, admin: adminId });
  return club;
};

// GET /api/clubs/:clubId/contacts
const getContacts = async (req, res) => {
  const club = await ensureClubOwnership(req.params.clubId, req.admin._id);
  if (!club) return res.status(404).json({ message: "Club not found" });
  const contacts = await ContactPerson.find({ club: club._id }).sort({ position: 1 });
  res.json(contacts);
};

// POST /api/clubs/:clubId/contacts
const createContact = async (req, res) => {
  try {
    const club = await ensureClubOwnership(req.params.clubId, req.admin._id);
    if (!club) return res.status(404).json({ message: "Club not found" });

    const {
      position, name, membershipNo, address, mobileNo, email,
      dobMonth, dobDay, bloodGroup, requiresResponse,
    } = req.body;

    if (!position || !name || !membershipNo || !address || !mobileNo || !email || !dobMonth || !dobDay) {
      return res.status(400).json({ message: "Missing required contact fields" });
    }

    const contact = await ContactPerson.create({
      club: club._id,
      admin: req.admin._id,
      position,
      name,
      membershipNo,
      address,
      mobileNo,
      email,
      dobMonth,
      dobDay,
      bloodGroup: bloodGroup || "",
      // Only the club president role has an online guiding-question
      // assessment; other officer positions are roster-only contacts.
      requiresResponse: position === "President"
        ? (requiresResponse === undefined ? true : requiresResponse === "true" || requiresResponse === true)
        : false,
      publicToken: nanoid(12),
      photoUrl: req.file ? req.file.path : "",
      photoPublicId: req.file ? req.file.filename : "",
    });

    res.status(201).json(contact);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "This club already has a contact person for that position" });
    }
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/contacts/:id
const updateContact = async (req, res) => {
  const contact = await ContactPerson.findOne({ _id: req.params.id, admin: req.admin._id });
  if (!contact) return res.status(404).json({ message: "Contact not found" });

  const fields = ["position", "name", "membershipNo", "address", "mobileNo", "email", "dobMonth", "dobDay", "bloodGroup"];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) contact[f] = req.body[f];
  });
  // Only the club president role has an online guiding-question assessment.
  if (contact.position !== "President") {
    contact.requiresResponse = false;
  } else if (req.body.requiresResponse !== undefined) {
    contact.requiresResponse = req.body.requiresResponse === "true" || req.body.requiresResponse === true;
  }

  if (req.file) {
    if (contact.photoPublicId) cloudinary.uploader.destroy(contact.photoPublicId).catch(() => {});
    contact.photoUrl = req.file.path;
    contact.photoPublicId = req.file.filename;
  }

  await contact.save();
  res.json(contact);
};

// DELETE /api/contacts/:id
const deleteContact = async (req, res) => {
  const contact = await ContactPerson.findOne({ _id: req.params.id, admin: req.admin._id });
  if (!contact) return res.status(404).json({ message: "Contact not found" });

  await Response.deleteMany({ contactPerson: contact._id });
  if (contact.photoPublicId) cloudinary.uploader.destroy(contact.photoPublicId).catch(() => {});
  await contact.deleteOne();

  res.json({ message: "Contact deleted" });
};

// POST /api/contacts/:id/regenerate-link
const regenerateLink = async (req, res) => {
  const contact = await ContactPerson.findOne({ _id: req.params.id, admin: req.admin._id });
  if (!contact) return res.status(404).json({ message: "Contact not found" });
  contact.publicToken = nanoid(12);
  await contact.save();
  res.json({ publicToken: contact.publicToken });
};

module.exports = { getContacts, createContact, updateContact, deleteContact, regenerateLink };
