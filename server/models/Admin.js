const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const AdminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // e.g. "Dibakar Paudel"
    title: { type: String, default: "Zonal Head" }, // e.g. "Zone Chairperson"
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    zoneName: { type: String, default: "" },
    // "superadmin" can create/manage other zonal head accounts but does not
    // own clubs itself. "zonalhead" is the normal admin role (e.g. Dibakar
    // Paudel) that manages clubs, contacts, responses, and questions.
    role: { type: String, enum: ["superadmin", "zonalhead"], default: "zonalhead" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true }
);

AdminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

AdminSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model("Admin", AdminSchema);
