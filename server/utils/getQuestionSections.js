const Question = require("../models/Question");
const seedDefaultQuestions = require("./seedDefaultQuestions");

// Loads a given admin's editable questions for an assessment type
// ("club" | "zoneChair" | "dge"), grouped into the {category, description,
// questions:[{id,text}]} section shape the public form and export code use.
// Seeds the built-in defaults on first use so a brand-new admin (or a very
// old one from before this feature existed) never sees an empty form.
const getQuestionSections = async (adminId, type) => {
  let questions = await Question.find({ admin: adminId, type }).sort({ order: 1, createdAt: 1 });
  if (questions.length === 0) {
    await seedDefaultQuestions(adminId);
    questions = await Question.find({ admin: adminId, type }).sort({ order: 1, createdAt: 1 });
  }

  const sections = [];
  const byCategory = new Map();
  questions.forEach((q) => {
    if (!byCategory.has(q.category)) {
      const section = { category: q.category, description: q.categoryDescription || "", questions: [] };
      byCategory.set(q.category, section);
      sections.push(section);
    }
    byCategory.get(q.category).questions.push({ id: String(q._id), text: q.text });
  });

  return sections;
};

module.exports = getQuestionSections;
