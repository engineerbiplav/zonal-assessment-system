const ZoneOfficial = require("../models/ZoneOfficial");
const ZoneResponse = require("../models/ZoneResponse");
const { ZONE_ROLES, ZONE_ROLE_LABELS } = require("../models/ZoneOfficial");
const {
  Document, Packer, Paragraph, HeadingLevel, TextRun,
} = require("docx");

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
    res.json(official);
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

// GET /api/zone-officials/:role/export
const exportZoneResponse = async (req, res) => {
  const { role } = req.params;
  const official = await ZoneOfficial.findOne({ admin: req.admin._id, role });
  if (!official) return res.status(404).json({ message: "No official set up for this role yet" });

  const response = await ZoneResponse.findOne({ zoneOfficial: official._id });
  if (!response) return res.status(404).json({ message: "No response submitted yet" });

  const children = [
    new Paragraph({ text: "Zone Assessment Response", heading: HeadingLevel.TITLE }),
    new Paragraph({ text: `Role: ${ZONE_ROLE_LABELS[role]}`, spacing: { after: 100 } }),
    new Paragraph({ text: `Respondent: ${response.respondentName}`, spacing: { after: 100 } }),
    new Paragraph({ text: `Submitted: ${new Date(response.submittedAt).toLocaleString()}`, spacing: { after: 300 } }),
  ];

  let currentCategory = null;
  response.answers.forEach((a) => {
    if (a.category !== currentCategory) {
      currentCategory = a.category;
      children.push(new Paragraph({ text: currentCategory, heading: HeadingLevel.HEADING_1, spacing: { before: 300, after: 100 } }));
    }
    children.push(new Paragraph({ children: [new TextRun({ text: a.question, bold: true })], spacing: { before: 150 } }));
    children.push(new Paragraph({ text: a.answer || "(no answer provided)", spacing: { after: 50 } }));
  });

  const doc = new Document({ sections: [{ children }] });
  const buffer = await Packer.toBuffer(doc);

  const filename = `${ZONE_ROLE_LABELS[role]}-response.docx`.replace(/[^a-z0-9.-]/gi, "_");
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(buffer);
};

module.exports = {
  getZoneOfficials, upsertZoneOfficial, deleteZoneOfficial, getZoneResponse, exportZoneResponse,
};
