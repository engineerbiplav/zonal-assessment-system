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

const ZoneResponseSchema = new mongoose.Schema(
  {
    zoneOfficial: { type: mongoose.Schema.Types.ObjectId, ref: "ZoneOfficial", required: true, unique: true },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true, index: true },
    role: { type: String, required: true },
    respondentName: { type: String, required: true },
    answers: [AnswerSchema],
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ZoneResponse", ZoneResponseSchema);
