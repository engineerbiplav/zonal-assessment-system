const Question = require("../models/Question");
const { QUESTION_TYPES } = require("../models/Question");
const seedDefaultQuestions = require("../utils/seedDefaultQuestions");

const isValidType = (type) => QUESTION_TYPES.includes(type);

// GET /api/questions?type=club|zoneChair|dge
// Returns this admin's questions for the given type, grouped by category in
// display order. If the admin somehow has none yet (e.g. very old account),
// seeds the defaults first so the page is never empty.
const getQuestions = async (req, res) => {
  const { type } = req.query;
  if (!isValidType(type)) {
    return res.status(400).json({ message: "A valid question type is required" });
  }

  let questions = await Question.find({ admin: req.admin._id, type }).sort({ order: 1, createdAt: 1 });
  if (questions.length === 0) {
    await seedDefaultQuestions(req.admin._id);
    questions = await Question.find({ admin: req.admin._id, type }).sort({ order: 1, createdAt: 1 });
  }

  const sections = [];
  const byCategory = new Map();
  questions.forEach((q) => {
    if (!byCategory.has(q.category)) {
      const section = { category: q.category, description: q.categoryDescription || "", questions: [] };
      byCategory.set(q.category, section);
      sections.push(section);
    }
    byCategory.get(q.category).questions.push({ id: q._id, text: q.text, order: q.order });
  });

  res.json({ sections });
};

// POST /api/questions
const createQuestion = async (req, res) => {
  const { type, category, categoryDescription, text, order } = req.body;
  if (!isValidType(type) || !category || !text) {
    return res.status(400).json({ message: "type, category, and text are required" });
  }

  const maxOrder = await Question.findOne({ admin: req.admin._id, type, category }).sort({ order: -1 });
  const question = await Question.create({
    admin: req.admin._id,
    type,
    category,
    categoryDescription: categoryDescription || "",
    text,
    order: order !== undefined ? Number(order) : maxOrder ? maxOrder.order + 1 : 0,
  });
  res.status(201).json(question);
};

// PUT /api/questions/:id
const updateQuestion = async (req, res) => {
  const question = await Question.findOne({ _id: req.params.id, admin: req.admin._id });
  if (!question) return res.status(404).json({ message: "Question not found" });

  const fields = ["category", "categoryDescription", "text", "order"];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) question[f] = req.body[f];
  });

  await question.save();
  res.json(question);
};

// DELETE /api/questions/:id
const deleteQuestion = async (req, res) => {
  const question = await Question.findOne({ _id: req.params.id, admin: req.admin._id });
  if (!question) return res.status(404).json({ message: "Question not found" });
  await question.deleteOne();
  res.json({ message: "Question deleted" });
};

module.exports = { getQuestions, createQuestion, updateQuestion, deleteQuestion };
