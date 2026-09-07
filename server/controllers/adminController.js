const Admin = require("../models/Admin");
const Club = require("../models/Club");
const ContactPerson = require("../models/ContactPerson");
const Response = require("../models/Response");
const ZoneOfficial = require("../models/ZoneOfficial");
const ZoneResponse = require("../models/ZoneResponse");
const Question = require("../models/Question");
const seedDefaultQuestions = require("../utils/seedDefaultQuestions");

// GET /api/admins  (super admin only) — list all zonal heads
const getAdmins = async (req, res) => {
  const admins = await Admin.find({ role: "zonalhead" }).sort({ createdAt: -1 });

  // Self-heal any accounts created before publicSlug existed.
  await Promise.all(
    admins
      .filter((a) => !a.publicSlug)
      .map(async (a) => {
        a.publicSlug = await Admin.generateUniqueSlug(a.zoneName || a.name);
        await a.save();
      })
  );

  const clubCounts = await Club.aggregate([{ $group: { _id: "$admin", count: { $sum: 1 } } }]);
  const countByAdmin = {};
  clubCounts.forEach((c) => { countByAdmin[String(c._id)] = c.count; });

  res.json(
    admins.map((a) => ({
      id: a._id,
      name: a.name,
      title: a.title,
      email: a.email,
      zoneName: a.zoneName,
      createdAt: a.createdAt,
      clubCount: countByAdmin[String(a._id)] || 0,
      publicSlug: a.publicSlug,
    }))
  );
};

// POST /api/admins  (super admin only) — create a new zonal head
const createAdmin = async (req, res) => {
  try {
    const { name, email, password, title, zoneName } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email, and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const admin = await Admin.create({
      name,
      email: email.toLowerCase(),
      password,
      title: title || "Zonal Head",
      zoneName: zoneName || "",
      role: "zonalhead",
      createdBy: req.admin._id,
    });

    // Give the new zonal head a starter set of editable guiding questions
    // for all three assessment types right away.
    await seedDefaultQuestions(admin._id);

    res.status(201).json({
      id: admin._id,
      name: admin.name,
      title: admin.title,
      email: admin.email,
      zoneName: admin.zoneName,
      createdAt: admin.createdAt,
      clubCount: 0,
      publicSlug: admin.publicSlug,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/admins/:id  (super admin only) — edit a zonal head's basic info, optionally reset password
const updateAdmin = async (req, res) => {
  const admin = await Admin.findOne({ _id: req.params.id, role: "zonalhead" });
  if (!admin) return res.status(404).json({ message: "Zonal head not found" });

  const { name, title, zoneName, password } = req.body;
  if (name !== undefined) admin.name = name;
  if (title !== undefined) admin.title = title;
  if (zoneName !== undefined) admin.zoneName = zoneName;
  if (password) {
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    admin.password = password; // re-hashed by the pre-save hook
  }

  await admin.save();
  res.json({
    id: admin._id, name: admin.name, title: admin.title, email: admin.email, zoneName: admin.zoneName,
    publicSlug: admin.publicSlug,
  });
};

// DELETE /api/admins/:id  (super admin only) — remove a zonal head and everything they own
const deleteAdmin = async (req, res) => {
  const admin = await Admin.findOne({ _id: req.params.id, role: "zonalhead" });
  if (!admin) return res.status(404).json({ message: "Zonal head not found" });

  const clubs = await Club.find({ admin: admin._id });
  const clubIds = clubs.map((c) => c._id);
  const contacts = await ContactPerson.find({ admin: admin._id });
  const contactIds = contacts.map((c) => c._id);

  await Response.deleteMany({ contactPerson: { $in: contactIds } });
  await ContactPerson.deleteMany({ admin: admin._id });
  await Club.deleteMany({ admin: admin._id });

  const zoneOfficials = await ZoneOfficial.find({ admin: admin._id });
  const zoneOfficialIds = zoneOfficials.map((o) => o._id);
  await ZoneResponse.deleteMany({ zoneOfficial: { $in: zoneOfficialIds } });
  await ZoneOfficial.deleteMany({ admin: admin._id });

  await Question.deleteMany({ admin: admin._id });
  await admin.deleteOne();

  res.json({ message: "Zonal head and all related data deleted" });
};

module.exports = { getAdmins, createAdmin, updateAdmin, deleteAdmin };
