const Response = require("../models/Response");
const Club = require("../models/Club");
const {
  Document, Packer, Paragraph, HeadingLevel, TextRun, Spacing,
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

const buildResponseDoc = (response) => {
  const children = [
    new Paragraph({
      text: `Zone Assessment Response`,
      heading: HeadingLevel.TITLE,
    }),
    new Paragraph({ text: `Club: ${response.club.name} (#${response.club.clubNumber})`, spacing: { after: 100 } }),
    new Paragraph({ text: `Respondent: ${response.respondentName} — ${response.position}`, spacing: { after: 100 } }),
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

  return new Document({ sections: [{ children }] });
};

// GET /api/responses/:id/export
const exportResponse = async (req, res) => {
  const response = await Response.findOne({ _id: req.params.id, admin: req.admin._id }).populate("club", "name clubNumber");
  if (!response) return res.status(404).json({ message: "Response not found" });

  const doc = buildResponseDoc(response);
  const buffer = await Packer.toBuffer(doc);

  const filename = `${response.club.name}-${response.position}-response.docx`.replace(/[^a-z0-9.-]/gi, "_");
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(buffer);
};

// GET /api/clubs/:clubId/export  (all responses for a club combined into one docx)
const exportClubResponses = async (req, res) => {
  const club = await Club.findOne({ _id: req.params.clubId, admin: req.admin._id });
  if (!club) return res.status(404).json({ message: "Club not found" });

  const responses = await Response.find({ club: club._id }).sort({ position: 1 });
  if (responses.length === 0) {
    return res.status(404).json({ message: "No responses have been submitted for this club yet" });
  }

  const children = [
    new Paragraph({ text: `${club.name} — Zone Assessment Responses`, heading: HeadingLevel.TITLE }),
    new Paragraph({ text: `Club Number: ${club.clubNumber}`, spacing: { after: 300 } }),
  ];

  responses.forEach((response, idx) => {
    if (idx > 0) children.push(new Paragraph({ text: "", pageBreakBefore: true }));
    children.push(new Paragraph({ text: `${response.respondentName} — ${response.position}`, heading: HeadingLevel.HEADING_1, spacing: { after: 100 } }));
    children.push(new Paragraph({ text: `Submitted: ${new Date(response.submittedAt).toLocaleString()}`, spacing: { after: 200 } }));

    let currentCategory = null;
    response.answers.forEach((a) => {
      if (a.category !== currentCategory) {
        currentCategory = a.category;
        children.push(new Paragraph({ text: currentCategory, heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 80 } }));
      }
      children.push(new Paragraph({ children: [new TextRun({ text: a.question, bold: true })], spacing: { before: 120 } }));
      children.push(new Paragraph({ text: a.answer || "(no answer provided)", spacing: { after: 40 } }));
    });
  });

  const doc = new Document({ sections: [{ children }] });
  const buffer = await Packer.toBuffer(doc);

  const filename = `${club.name}-all-responses.docx`.replace(/[^a-z0-9.-]/gi, "_");
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(buffer);
};

module.exports = { getResponses, getResponse, exportResponse, exportClubResponses };
