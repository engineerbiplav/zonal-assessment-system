const mongoose = require("mongoose");

const ClubSchema = new mongoose.Schema(
  {
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true, index: true },
    name: { type: String, required: true, trim: true }, // e.g. "Lions Club of Kathmandu Balaju Height"
    clubNumber: { type: String, required: true, trim: true },
    logoUrl: { type: String, default: "" },
    logoPublicId: { type: String, default: "" }, // cloudinary public_id, for deletion/replacement
  },
  { timestamps: true }
);

ClubSchema.index({ admin: 1, clubNumber: 1 }, { unique: true });

module.exports = mongoose.model("Club", ClubSchema);
