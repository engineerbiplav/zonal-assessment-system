const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    if (!header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id);
    if (!admin) return res.status(401).json({ message: "Admin not found" });
    req.admin = admin;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Not authorized, token invalid" });
  }
};

// Only allows admins with role "superadmin" through (must run after `protect`).
const requireSuperAdmin = (req, res, next) => {
  if (!req.admin || req.admin.role !== "superadmin") {
    return res.status(403).json({ message: "Only a super admin can do that" });
  }
  next();
};

// Only allows admins with role "zonalhead" through (must run after `protect`).
// Super admins don't own clubs/contacts/responses/questions themselves, so
// club-facing routes are restricted to actual zonal heads.
const requireZonalHead = (req, res, next) => {
  if (!req.admin || req.admin.role === "superadmin") {
    return res.status(403).json({ message: "This action is only available to zonal heads" });
  }
  next();
};

module.exports = { protect, requireSuperAdmin, requireZonalHead };
