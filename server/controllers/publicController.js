const ContactPerson = require("../models/ContactPerson");
const Club = require("../models/Club");
const Admin = require("../models/Admin");
const Response = require("../models/Response");
const ZoneOfficial = require("../models/ZoneOfficial");
const ZoneResponse = require("../models/ZoneResponse");
const { ZONE_ROLES, ZONE_ROLE_LABELS } = require("../models/ZoneOfficial");
const getQuestionSections = require("../utils/getQuestionSections");

// Maps a zone-level official role to its assessment "type" used to look up
// that admin's editable Question documents.
const ZONE_ROLE_TYPE = {
  ImmediatePastZoneChairperson: "zoneChair",
  FirstViceDistrictGovernor: "dge",
};

// Only the club president role has an online guiding-question assessment.
// Secretary / Treasurer / Membership Chairperson remain roster-only contacts.
const CLUB_ASSESSMENT_POSITION = "President";

// Every route below is scoped to one zonal head via their unique
// `publicSlug` (e.g. /assessment/:zoneSlug), so a zonal head's link only
// ever surfaces their own clubs and zone officials — never another zone's.
const findAdminBySlug = async (zoneSlug) => Admin.findOne({ publicSlug: zoneSlug, role: "zonalhead" });

// GET /api/public/:zoneSlug
// Basic, non-sensitive info to render the gateway page header and to
// confirm the link itself is valid before showing any form fields.
const getZoneInfo = async (req, res) => {
  const admin = await findAdminBySlug(req.params.zoneSlug);
  if (!admin) return res.status(404).json({ message: "This assessment link is invalid or has been removed." });
  res.json({ zoneName: admin.zoneName || admin.name, adminName: admin.name });
};

// GET /api/public/:zoneSlug/clubs
// Minimal club list (no internal fields), limited to this zonal head's own
// clubs, for the assessment link's club dropdown.
const getPublicClubs = async (req, res) => {
  const admin = await findAdminBySlug(req.params.zoneSlug);
  if (!admin) return res.status(404).json({ message: "This assessment link is invalid or has been removed." });

  const clubs = await Club.find({ admin: admin._id }).select("name clubNumber logoUrl").sort({ name: 1 });
  res.json({
    clubs: clubs.map((c) => ({ id: c._id, name: c.name, clubNumber: c.clubNumber, logoUrl: c.logoUrl })),
  });
};

// GET /api/public/:zoneSlug/lookup?club=<clubId>
// Club uniquely identifies the president contact (only the president role
// has an online assessment), so once a club is picked we can look up and
// show their name automatically — no position or name dropdown needed.
const lookupContact = async (req, res) => {
  const admin = await findAdminBySlug(req.params.zoneSlug);
  if (!admin) return res.status(404).json({ message: "This assessment link is invalid or has been removed." });

  const { club } = req.query;
  if (!club) {
    return res.status(400).json({ message: "A club is required" });
  }

  // Confirm the club actually belongs to this zonal head before looking up
  // its president, so one zone's link can never resolve another zone's club.
  const clubDoc = await Club.findOne({ _id: club, admin: admin._id });
  if (!clubDoc) {
    return res.status(404).json({ message: "That club isn't part of this assessment link." });
  }

  const contact = await ContactPerson.findOne({ club: clubDoc._id, position: CLUB_ASSESSMENT_POSITION });
  if (!contact) {
    return res.status(404).json({ message: "No club president has been added for this club yet." });
  }
  if (!contact.requiresResponse) {
    return res.status(403).json({ message: "This club's president assessment is not currently active." });
  }

  res.json({ id: contact._id, name: contact.name, position: contact.position, photoUrl: contact.photoUrl || "" });
};

// POST /api/public/:zoneSlug/verify
// body: { contactId, dobMonth, dobDay }
// Confirms the selected club president's date of birth matches our
// records, then hands back their token so the shared form flow
// (GET/POST /api/public/form/:token) can take over.
const verifyIdentity = async (req, res) => {
  const admin = await findAdminBySlug(req.params.zoneSlug);
  if (!admin) return res.status(404).json({ message: "This assessment link is invalid or has been removed." });

  const { contactId, dobMonth, dobDay } = req.body;
  if (!contactId || !dobMonth || !dobDay) {
    return res.status(400).json({ message: "Club and date of birth are required" });
  }

  const contact = await ContactPerson.findById(contactId);
  if (
    !contact
    || String(contact.admin) !== String(admin._id)
    || !contact.requiresResponse
    || contact.position !== CLUB_ASSESSMENT_POSITION
  ) {
    return res.status(404).json({ message: "We couldn't find that record. Please check your selections." });
  }

  if (Number(contact.dobMonth) !== Number(dobMonth) || Number(contact.dobDay) !== Number(dobDay)) {
    return res.status(401).json({ message: "That date of birth doesn't match our records. Please try again." });
  }

  res.json({ token: contact.publicToken });
};

// GET /api/public/:zoneSlug/zone-roles
// Static list of the two zone-level (non-club) assessment roles.
const getZoneRoles = async (req, res) => {
  const admin = await findAdminBySlug(req.params.zoneSlug);
  if (!admin) return res.status(404).json({ message: "This assessment link is invalid or has been removed." });
  res.json({ roles: ZONE_ROLES.map((role) => ({ role, label: ZONE_ROLE_LABELS[role] })) });
};

// GET /api/public/:zoneSlug/zone-lookup?role=ImmediatePastZoneChairperson
// Each admin (zone) has at most one person per role, and this is scoped to
// one zonal head, so there's at most one match.
const lookupZoneOfficial = async (req, res) => {
  const admin = await findAdminBySlug(req.params.zoneSlug);
  if (!admin) return res.status(404).json({ message: "This assessment link is invalid or has been removed." });

  const { role } = req.query;
  if (!role || !ZONE_ROLES.includes(role)) {
    return res.status(400).json({ message: "A valid role is required" });
  }

  const official = await ZoneOfficial.findOne({ role, admin: admin._id });
  res.json({
    officials: official
      ? [{ id: official._id, name: official.name, zoneName: admin.zoneName || admin.name, photoUrl: official.photoUrl || "" }]
      : [],
  });
};

// POST /api/public/:zoneSlug/zone-verify
// body: { officialId, dobMonth, dobDay }
const verifyZoneIdentity = async (req, res) => {
  const admin = await findAdminBySlug(req.params.zoneSlug);
  if (!admin) return res.status(404).json({ message: "This assessment link is invalid or has been removed." });

  const { officialId, dobMonth, dobDay } = req.body;
  if (!officialId || !dobMonth || !dobDay) {
    return res.status(400).json({ message: "Role, name, and date of birth are all required" });
  }

  const official = await ZoneOfficial.findById(officialId);
  if (!official || String(official.admin) !== String(admin._id)) {
    return res.status(404).json({ message: "We couldn't find that record. Please check your selections." });
  }

  if (Number(official.dobMonth) !== Number(dobMonth) || Number(official.dobDay) !== Number(dobDay)) {
    return res.status(401).json({ message: "That date of birth doesn't match our records. Please try again." });
  }

  res.json({ token: official.publicToken });
};

// GET /api/public/form/:token
// Serves the question form for either a club president (ContactPerson) or
// a zone-level official (ZoneOfficial) — whichever the token belongs to.
// Always returns previously-saved answers pre-filled so the form can be
// edited on a later visit rather than blocking a second submission.
const getForm = async (req, res) => {
  const { token } = req.params;

  const contact = await ContactPerson.findOne({ publicToken: token });
  if (contact) {
    if (contact.position !== CLUB_ASSESSMENT_POSITION || !contact.requiresResponse) {
      return res.status(403).json({ message: "This position does not have an online assessment" });
    }

    const club = await Club.findById(contact.club);
    const admin = await Admin.findById(contact.admin).select("name title");
    const existingResponse = await Response.findOne({ contactPerson: contact._id });
    const questionSections = await getQuestionSections(contact.admin, "club");

    const previousAnswers = {};
    if (existingResponse) {
      existingResponse.answers.forEach((a) => { previousAnswers[a.questionId] = a.answer; });
    }

    return res.json({
      club: { name: club.name, logoUrl: club.logoUrl, clubNumber: club.clubNumber },
      admin: { name: admin?.name || "", title: admin?.title || "Zonal Head" },
      contact: { name: contact.name, position: contact.position, photoUrl: contact.photoUrl || "" },
      questionSections,
      hasResponded: contact.hasResponded,
      respondedAt: contact.respondedAt,
      previousAnswers,
    });
  }

  const official = await ZoneOfficial.findOne({ publicToken: token });
  if (official) {
    const admin = await Admin.findById(official.admin).select("name title");
    const existingResponse = await ZoneResponse.findOne({ zoneOfficial: official._id });
    const questionSections = await getQuestionSections(official.admin, ZONE_ROLE_TYPE[official.role]);

    const previousAnswers = {};
    if (existingResponse) {
      existingResponse.answers.forEach((a) => { previousAnswers[a.questionId] = a.answer; });
    }

    return res.json({
      club: null,
      admin: { name: admin?.name || "", title: admin?.title || "Zonal Head" },
      contact: { name: official.name, position: ZONE_ROLE_LABELS[official.role], photoUrl: official.photoUrl || "" },
      questionSections,
      hasResponded: official.hasResponded,
      respondedAt: official.respondedAt,
      previousAnswers,
    });
  }

  return res.status(404).json({ message: "Invalid or expired link" });
};

// POST /api/public/form/:token
// Creates the response on first submission, or updates it in place on any
// later visit — so people can revise their answers using the same
// identity-verification flow instead of a one-time link. A person is only
// marked "responded" once every question in their set has a non-empty
// answer; partial saves are kept but don't flip the completion status.
const submitForm = async (req, res) => {
  const { token } = req.params;
  const { answers } = req.body; // { questionId: answerText, ... }
  if (!answers || typeof answers !== "object") {
    return res.status(400).json({ message: "answers object is required" });
  }

  const contact = await ContactPerson.findOne({ publicToken: token });
  if (contact) {
    if (contact.position !== CLUB_ASSESSMENT_POSITION || !contact.requiresResponse) {
      return res.status(403).json({ message: "This position does not have an online assessment" });
    }

    const sections = await getQuestionSections(contact.admin, "club");
    const flatQuestions = sections.flatMap((s) => s.questions.map((q) => ({ ...q, category: s.category })));
    const answerDocs = flatQuestions.map((q) => ({
      questionId: q.id,
      category: q.category,
      question: q.text,
      answer: (answers[q.id] || "").toString().trim(),
    }));
    const isComplete = answerDocs.length > 0 && answerDocs.every((a) => a.answer.length > 0);

    const now = new Date();
    const response = await Response.findOneAndUpdate(
      { contactPerson: contact._id },
      {
        contactPerson: contact._id,
        club: contact.club,
        admin: contact.admin,
        position: contact.position,
        respondentName: contact.name,
        answers: answerDocs,
        submittedAt: now,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    contact.hasResponded = isComplete;
    contact.respondedAt = isComplete ? now : null;
    await contact.save();

    return res.status(200).json({
      message: isComplete
        ? "Thank you! Your response has been saved."
        : "Your answers were saved, but a few questions are still unanswered.",
      isComplete,
      submittedAt: response.submittedAt,
    });
  }

  const official = await ZoneOfficial.findOne({ publicToken: token });
  if (official) {
    const sections = await getQuestionSections(official.admin, ZONE_ROLE_TYPE[official.role]);
    const flatQuestions = sections.flatMap((s) => s.questions.map((q) => ({ ...q, category: s.category })));
    const answerDocs = flatQuestions.map((q) => ({
      questionId: q.id,
      category: q.category,
      question: q.text,
      answer: (answers[q.id] || "").toString().trim(),
    }));
    const isComplete = answerDocs.length > 0 && answerDocs.every((a) => a.answer.length > 0);

    const now = new Date();
    const response = await ZoneResponse.findOneAndUpdate(
      { zoneOfficial: official._id },
      {
        zoneOfficial: official._id,
        admin: official.admin,
        role: official.role,
        respondentName: official.name,
        answers: answerDocs,
        submittedAt: now,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    official.hasResponded = isComplete;
    official.respondedAt = isComplete ? now : null;
    await official.save();

    return res.status(200).json({
      message: isComplete
        ? "Thank you! Your response has been saved."
        : "Your answers were saved, but a few questions are still unanswered.",
      isComplete,
      submittedAt: response.submittedAt,
    });
  }

  return res.status(404).json({ message: "Invalid or expired link" });
};

module.exports = {
  getZoneInfo,
  getForm,
  submitForm,
  getPublicClubs,
  lookupContact,
  verifyIdentity,
  getZoneRoles,
  lookupZoneOfficial,
  verifyZoneIdentity,
};
