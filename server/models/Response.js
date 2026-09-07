const mongoose = require("mongoose");

const AnswerSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    category: { type: String, required: true },
    question: { type: String, required: true },
    answer: { type: String, default: "" },
  },
  { _id: false }
);

const ResponseSchema = new mongoose.Schema(
  {
    contactPerson: { type: mongoose.Schema.Types.ObjectId, ref: "ContactPerson", required: true, unique: true },
    club: { type: mongoose.Schema.Types.ObjectId, ref: "Club", required: true, index: true },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true, index: true },
    position: { type: String, required: true },
    respondentName: { type: String, required: true },
    answers: [AnswerSchema],
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Response", ResponseSchema);
