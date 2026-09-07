const mongoose = require("mongoose");

// Each admin (zonal head) owns their own editable set of guiding questions,
// split into three assessment types:
//  - "club"      : Guiding Questions for Club Presidents
//  - "zoneChair" : Immediate Past Zone Chairperson handover questions
//  - "dge"       : 1st Vice District Governor / District Governor Elect questions
const QUESTION_TYPES = ["club", "zoneChair", "dge"];

const QuestionSchema = new mongoose.Schema(
  {
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true, index: true },
    type: { type: String, enum: QUESTION_TYPES, required: true },
    category: { type: String, required: true, trim: true },
    categoryDescription: { type: String, default: "" },
    text: { type: String, required: true, trim: true },
    // Controls ordering within a category; categories themselves are
    // ordered by the lowest order value of their questions, then by name.
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

QuestionSchema.index({ admin: 1, type: 1, order: 1 });

module.exports = mongoose.model("Question", QuestionSchema);
module.exports.QUESTION_TYPES = QUESTION_TYPES;
