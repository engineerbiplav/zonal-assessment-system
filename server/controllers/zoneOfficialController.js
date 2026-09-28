const ZoneOfficial = require("../models/ZoneOfficial");
const ZoneResponse = require("../models/ZoneResponse");
const { ZONE_ROLES, ZONE_ROLE_LABELS } = require("../models/ZoneOfficial");
const { deleteImage } = require("../config/cloudinary");

// GET /api/zone-officials
// Always returns one entry per role for this admin, even if not yet set up
// (official: null in that case), so the UI can render both cards.
const getZoneOfficials = async (req, res) => {
  const officials = await ZoneOfficial.find({ admin: req.admin._id });
  const byRole = {};
  officials.forEach((o) => { byRole[o.role] = o; });

  const responses = await ZoneResponse.find({ admin: req.admin._id });
  const responseByOfficial = {};
  responses.forEach((r) => { responseByOfficial[String(r.zoneOfficial)] = r; });

  res.json(
    ZONE_ROLES.map((role) => ({
      role,
      label: ZONE_ROLE_LABELS[role],
      official: byRole[role] || null,
      hasResponse: byRole[role] ? !!responseByOfficial[String(byRole[role]._id)] : false,
    }))
  );
};

// PUT /api/zone-officials/:role
// Creates or updates the single official for this role, for this admin.
const upsertZoneOfficial = async (req, res) => {
  const { role } = req.params;
  if (!ZONE_ROLES.includes(role)) {
    return res.status(400).json({ message: "Unknown zone role" });
  }

  const { name, mobileNo, email, dobMonth, dobDay } = req.body;
  if (!name || !dobMonth || !dobDay) {
    return res.status(400).json({ message: "Name and date of birth are required" });
  }

  try {
    const existing = await ZoneOfficial.findOne({ admin: req.admin._id, role });

    // If a new photo was uploaded, confirm the old one is removed from
    // Cloudinary (previously it was never deleted and just piled up).
    let oldPhotoDeleted = null; // null = no old photo existed to delete
    if (req.file && existing?.photoPublicId) {
      const result = await deleteImage(existing.photoPublicId, `zone official photo for "${existing.name}"`);
      oldPhotoDeleted = result.deleted;
    }

    const official = await ZoneOfficial.findOneAndUpdate(
      { admin: req.admin._id, role },
      {
        admin: req.admin._id,
        role,
        name,
        mobileNo: mobileNo || "",
        email: email || "",
        dobMonth,
        dobDay,
        ...(req.file ? { photoUrl: req.file.path, photoPublicId: req.file.filename } : {}),
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json({ ...official.toObject(), oldPhotoDeleted });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/zone-officials/:role
const deleteZoneOfficial = async (req, res) => {
  const { role } = req.params;
  const official = await ZoneOfficial.findOne({ admin: req.admin._id, role });
  if (!official) return res.status(404).json({ message: "Not found" });

  await ZoneResponse.deleteMany({ zoneOfficial: official._id });
  if (official.photoPublicId) await deleteImage(official.photoPublicId, `zone official photo for "${official.name}"`);
  await official.deleteOne();
  res.json({ message: "Removed" });
};

// GET /api/zone-officials/:role/response
const getZoneResponse = async (req, res) => {
  const { role } = req.params;
  const official = await ZoneOfficial.findOne({ admin: req.admin._id, role });
  if (!official) return res.status(404).json({ message: "No official set up for this role yet" });

  const response = await ZoneResponse.findOne({ zoneOfficial: official._id });
  if (!response) return res.status(404).json({ message: "No response submitted yet" });

  res.json(response);
};

// DELETE /api/zone-officials/:role/response
// Lets the zonal head delete just the submitted response (keeping the
// official's roster record in place) so they can be re-invited to respond.
const deleteZoneResponse = async (req, res) => {
  const { role } = req.params;
  const official = await ZoneOfficial.findOne({ admin: req.admin._id, role });
  if (!official) return res.status(404).json({ message: "No official set up for this role yet" });

  const response = await ZoneResponse.findOneAndDelete({ zoneOfficial: official._id });
  if (!response) return res.status(404).json({ message: "No response submitted yet" });

  official.hasResponded = false;
  official.respondedAt = null;
  await official.save();

  res.json({ message: "Response deleted" });
};

module.exports = {
  getZoneOfficials, upsertZoneOfficial, deleteZoneOfficial, getZoneResponse, deleteZoneResponse,
};
