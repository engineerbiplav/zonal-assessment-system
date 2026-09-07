const Club = require("../models/Club");
const ContactPerson = require("../models/ContactPerson");
const Response = require("../models/Response");
const { cloudinary } = require("../config/cloudinary");

// GET /api/clubs
const getClubs = async (req, res) => {
  const clubs = await Club.find({ admin: req.admin._id }).sort({ createdAt: 1 });
  res.json(clubs);
};

// GET /api/clubs/:id
const getClub = async (req, res) => {
  const club = await Club.findOne({ _id: req.params.id, admin: req.admin._id });
  if (!club) return res.status(404).json({ message: "Club not found" });
  const contacts = await ContactPerson.find({ club: club._id }).sort({ position: 1 });
  res.json({ club, contacts });
};

// POST /api/clubs
const createClub = async (req, res) => {
  try {
    const { name, clubNumber } = req.body;
    if (!name || !clubNumber) {
      return res.status(400).json({ message: "name and clubNumber are required" });
    }
    const club = await Club.create({
      admin: req.admin._id,
      name,
      clubNumber,
      logoUrl: req.file ? req.file.path : "",
      logoPublicId: req.file ? req.file.filename : "",
    });
    res.status(201).json(club);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "A club with this club number already exists" });
    }
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/clubs/:id
const updateClub = async (req, res) => {
  const club = await Club.findOne({ _id: req.params.id, admin: req.admin._id });
  if (!club) return res.status(404).json({ message: "Club not found" });

  if (req.body.name) club.name = req.body.name;
  if (req.body.clubNumber) club.clubNumber = req.body.clubNumber;

  if (req.file) {
    if (club.logoPublicId) {
      cloudinary.uploader.destroy(club.logoPublicId).catch(() => {});
    }
    club.logoUrl = req.file.path;
    club.logoPublicId = req.file.filename;
  }

  await club.save();
  res.json(club);
};

// DELETE /api/clubs/:id
const deleteClub = async (req, res) => {
  const club = await Club.findOne({ _id: req.params.id, admin: req.admin._id });
  if (!club) return res.status(404).json({ message: "Club not found" });

  const contacts = await ContactPerson.find({ club: club._id });
  const contactIds = contacts.map((c) => c._id);

  await Response.deleteMany({ contactPerson: { $in: contactIds } });
  await ContactPerson.deleteMany({ club: club._id });
  if (club.logoPublicId) cloudinary.uploader.destroy(club.logoPublicId).catch(() => {});
  await club.deleteOne();

  res.json({ message: "Club and related data deleted" });
};

module.exports = { getClubs, getClub, createClub, updateClub, deleteClub };
