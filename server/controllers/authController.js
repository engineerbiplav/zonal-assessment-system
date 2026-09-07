const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    const admin = await Admin.findOne({ email: email.toLowerCase() }).select("+password");
    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const token = signToken(admin._id);
    res.json({
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        title: admin.title,
        email: admin.email,
        zoneName: admin.zoneName,
        role: admin.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/auth/me
const me = async (req, res) => {
  res.json({ admin: req.admin });
};

module.exports = { login, me };
