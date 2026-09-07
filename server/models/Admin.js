const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { nanoid } = require("nanoid");

const AdminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // e.g. a zonal head's name
    title: { type: String, default: "Zonal Head" }, // e.g. "Zone Chairperson"
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    zoneName: { type: String, default: "" },
    // "superadmin" can create/manage other zonal head accounts but does not
    // own clubs itself. "zonalhead" is the normal admin role that manages
    // clubs, contacts, responses, and questions for their own zone only.
    role: { type: String, enum: ["superadmin", "zonalhead"], default: "zonalhead" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    // Unique public identifier used to build this zonal head's own
    // assessment link (e.g. /assessment/:publicSlug) so their clubs and
    // zone officials never appear on another zonal head's link.
    publicSlug: { type: String, unique: true, sparse: true, index: true },
  },
  { timestamps: true }
);

const slugify = (str) =>
  (str || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Generates a short, human-readable, unique slug like "kathmandu-a1b2c3".
AdminSchema.statics.generateUniqueSlug = async function (seed) {
  const base = slugify(seed) || "zone";
  let slug;
  let exists = true;
  while (exists) {
    slug = `${base}-${nanoid(6).toLowerCase()}`;
    exists = await this.exists({ publicSlug: slug });
  }
  return slug;
};

AdminSchema.pre("save", async function (next) {
  if (!this.publicSlug) {
    this.publicSlug = await this.constructor.generateUniqueSlug(this.zoneName || this.name);
  }
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

AdminSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model("Admin", AdminSchema);
