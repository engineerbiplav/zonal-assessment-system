const mongoose = require("mongoose");
const { nanoid } = require("nanoid");

// The 4 standard officer positions per club. Exactly one (President, by
// default) is excluded from the public online response requirement; the
// other three respond to the guiding questions. This is configurable per
// contact via `requiresResponse`.
const POSITIONS = ["President", "Secretary", "Treasurer", "Membership Chairperson"];

const ContactPersonSchema = new mongoose.Schema(
  {
    club: { type: mongoose.Schema.Types.ObjectId, ref: "Club", required: true, index: true },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true, index: true },
    position: { type: String, enum: POSITIONS, required: true },
    name: { type: String, required: true, trim: true },
    membershipNo: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    mobileNo: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    dobMonth: { type: Number, min: 1, max: 12, required: true },
    dobDay: { type: Number, min: 1, max: 31, required: true },
    bloodGroup: { type: String, default: "" }, // not mandatory
    photoUrl: { type: String, default: "" },
    photoPublicId: { type: String, default: "" },

    requiresResponse: { type: Boolean, default: true },
    publicToken: { type: String, unique: true, sparse: true, default: () => nanoid(12) },

    hasResponded: { type: Boolean, default: false },
    respondedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

ContactPersonSchema.index({ club: 1, position: 1 }, { unique: true });

module.exports = mongoose.model("ContactPerson", ContactPersonSchema);
module.exports.POSITIONS = POSITIONS;
