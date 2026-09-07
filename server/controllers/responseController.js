const Response = require("../models/Response");
const Club = require("../models/Club");
const ContactPerson = require("../models/ContactPerson");
const ZoneOfficial = require("../models/ZoneOfficial");
const ZoneResponse = require("../models/ZoneResponse");
const { ZONE_ROLES, ZONE_ROLE_LABELS } = require("../models/ZoneOfficial");
const {
  Document, Packer, Paragraph, HeadingLevel, TextRun,
} = require("docx");

// GET /api/responses  (all responses for this admin, optional ?club=)
const getResponses = async (req, res) => {
  const filter = { admin: req.admin._id };
  if (req.query.club) filter.club = req.query.club;
  const responses = await Response.find(filter)
    .populate("club", "name clubNumber")
    .sort({ submittedAt: -1 });
  res.json(responses);
};

// GET /api/responses/:id
const getResponse = async (req, res) => {
  const response = await Response.findOne({ _id: req.params.id, admin: req.admin._id }).populate("club", "name clubNumber");
  if (!response) return res.status(404).json({ message: "Response not found" });
  res.json(response);
};

// DELETE /api/responses/:id
// Lets the zonal head delete a submitted response outright. The related
// contact's status is reset so the president can be re-invited to respond.
const deleteResponse = async (req, res) => {
  const response = await Response.findOne({ _id: req.params.id, admin: req.admin._id });
  if (!response) return res.status(404).json({ message: "Response not found" });

  await response.deleteOne();
  await ContactPerson.findByIdAndUpdate(response.contactPerson, {
    hasResponded: false,
    respondedAt: null,
  });

  res.json({ message: "Response deleted" });
};

const addAnswerParagraphs = (children, answers) => {
  let currentCategory = null;
  answers.forEach((a) => {
    if (a.category !== currentCategory) {
      currentCategory = a.category;
      children.push(new Paragraph({ text: currentCategory, heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 80 } }));
    }
    children.push(new Paragraph({ children: [new TextRun({ text: a.question, bold: true })], spacing: { before: 120 } }));
    children.push(new Paragraph({ text: a.answer || "(no answer provided)", spacing: { after: 40 } }));
  });
};

// GET /api/responses/export-all
// A single, comprehensive .docx export covering everything this zonal head
// is responsible for: every club's president response, plus the zone-level
// Immediate Past Zone Chairperson and 1st Vice District Governor/DGE
// responses — all in one document, in one download.
const exportAllResponses = async (req, res) => {
  const adminId = req.admin._id;

  const clubs = await Club.find({ admin: adminId }).sort({ name: 1 });
  const responses = await Response.find({ admin: adminId });
  const responseByClub = {};
  responses.forEach((r) => { responseByClub[String(r.club)] = r; });

  const zoneOfficials = await ZoneOfficial.find({ admin: adminId });
  const zoneResponses = await ZoneResponse.find({ admin: adminId });
  const zoneResponseByOfficial = {};
  zoneResponses.forEach((r) => { zoneResponseByOfficial[String(r.zoneOfficial)] = r; });

  const children = [
    new Paragraph({ text: `${req.admin.zoneName || req.admin.name} — Zone Assessment Report`, heading: HeadingLevel.TITLE }),
    new Paragraph({ text: `Generated: ${new Date().toLocaleString()}`, spacing: { after: 300 } }),
    new Paragraph({ text: "Club President Responses", heading: HeadingLevel.HEADING_1, spacing: { after: 150 } }),
  ];

  if (clubs.length === 0) {
    children.push(new Paragraph({ text: "No clubs have been added yet.", spacing: { after: 200 } }));
  }

  clubs.forEach((club, idx) => {
    if (idx > 0) children.push(new Paragraph({ text: "", pageBreakBefore: true }));
    children.push(new Paragraph({ text: `${club.name} (#${club.clubNumber})`, heading: HeadingLevel.HEADING_2, spacing: { before: 100, after: 100 } }));

    const response = responseByClub[String(club._id)];
    if (!response) {
      children.push(new Paragraph({ text: "No response submitted yet.", spacing: { after: 100 } }));
      return;
    }
    children.push(new Paragraph({ text: `Respondent: ${response.respondentName} — ${response.position}`, spacing: { after: 60 } }));
    children.push(new Paragraph({ text: `Submitted: ${new Date(response.submittedAt).toLocaleString()}`, spacing: { after: 150 } }));
    addAnswerParagraphs(children, response.answers);
  });

  children.push(new Paragraph({ text: "", pageBreakBefore: true }));
  children.push(new Paragraph({ text: "Zone Leadership Responses", heading: HeadingLevel.HEADING_1, spacing: { after: 150 } }));

  ZONE_ROLES.forEach((role, idx) => {
    if (idx > 0) children.push(new Paragraph({ text: "", spacing: { before: 200 } }));
    children.push(new Paragraph({ text: ZONE_ROLE_LABELS[role], heading: HeadingLevel.HEADING_2, spacing: { before: 100, after: 100 } }));

    const official = zoneOfficials.find((o) => o.role === role);
    if (!official) {
      children.push(new Paragraph({ text: "No one has been set up for this role yet.", spacing: { after: 100 } }));
      return;
    }
    const response = zoneResponseByOfficial[String(official._id)];
    if (!response) {
      children.push(new Paragraph({ text: `${official.name} has not submitted a response yet.`, spacing: { after: 100 } }));
      return;
    }
    children.push(new Paragraph({ text: `Respondent: ${response.respondentName}`, spacing: { after: 60 } }));
    children.push(new Paragraph({ text: `Submitted: ${new Date(response.submittedAt).toLocaleString()}`, spacing: { after: 150 } }));
    addAnswerParagraphs(children, response.answers);
  });

  const doc = new Document({ sections: [{ children }] });
  const buffer = await Packer.toBuffer(doc);

  const filename = `${req.admin.zoneName || req.admin.name}-zone-assessment-report.docx`.replace(/[^a-z0-9.-]/gi, "_");
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(buffer);
};

module.exports = { getResponses, getResponse, deleteResponse, exportAllResponses };
