const mongoose = require("mongoose");
const { nanoid } = require("nanoid");

// Zone-level roles that are NOT tied to any specific club — each admin
// (zonal head) has at most one person filling each role at a time.
const ZONE_ROLES = ["ImmediatePastZoneChairperson", "FirstViceDistrictGovernor"];

const ZONE_ROLE_LABELS = {
  ImmediatePastZoneChairperson: "Immediate Past Zone Chairperson",
  FirstViceDistrictGovernor: "First Vice District Governor / District Governor Elect",
};

const ZoneOfficialSchema = new mongoose.Schema(
  {
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true, index: true },
    role: { type: String, enum: ZONE_ROLES, required: true },
    name: { type: String, required: true, trim: true },
    mobileNo: { type: String, default: "", trim: true },
    email: { type: String, default: "", lowercase: true, trim: true },
    dobMonth: { type: Number, min: 1, max: 12, required: true },
    dobDay: { type: Number, min: 1, max: 31, required: true },
    photoUrl: { type: String, default: "" },
    photoPublicId: { type: String, default: "" },

    publicToken: { type: String, unique: true, sparse: true, default: () => nanoid(12) },

    hasResponded: { type: Boolean, default: false },
    respondedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// One person per role per admin at a time.
ZoneOfficialSchema.index({ admin: 1, role: 1 }, { unique: true });

module.exports = mongoose.model("ZoneOfficial", ZoneOfficialSchema);
module.exports.ZONE_ROLES = ZONE_ROLES;
module.exports.ZONE_ROLE_LABELS = ZONE_ROLE_LABELS;
