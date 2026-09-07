const express = require("express");
const router = express.Router();
const { protect, requireSuperAdmin } = require("../middleware/auth");
const {
  getAdmins, createAdmin, updateAdmin, deleteAdmin,
} = require("../controllers/adminController");

router.use(protect, requireSuperAdmin);

router.get("/", getAdmins);
router.post("/", createAdmin);
router.put("/:id", updateAdmin);
router.delete("/:id", deleteAdmin);

module.exports = router;
