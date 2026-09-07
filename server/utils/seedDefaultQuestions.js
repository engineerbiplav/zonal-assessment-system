const Question = require("../models/Question");
const {
  GUIDING_QUESTIONS,
  ZONE_CHAIR_QUESTIONS,
  DGE_QUESTIONS,
} = require("../data/questions");

const TEMPLATES = {
  club: GUIDING_QUESTIONS,
  zoneChair: ZONE_CHAIR_QUESTIONS,
  dge: DGE_QUESTIONS,
};

// Copies the built-in starter question templates into a new admin's own
// editable Question documents, for all three assessment types. Safe to call
// more than once — it only inserts a type if the admin has no questions of
// that type yet, so it won't duplicate or clobber edits.
const seedDefaultQuestions = async (adminId) => {
  for (const type of Object.keys(TEMPLATES)) {
    const existing = await Question.countDocuments({ admin: adminId, type });
    if (existing > 0) continue;

    const docs = [];
    let order = 0;
    TEMPLATES[type].forEach((section) => {
      section.questions.forEach((q) => {
        docs.push({
          admin: adminId,
          type,
          category: section.category,
          categoryDescription: section.description || "",
          text: q.text,
          order: order++,
        });
      });
    });
    if (docs.length) await Question.insertMany(docs);
  }
};

module.exports = seedDefaultQuestions;
