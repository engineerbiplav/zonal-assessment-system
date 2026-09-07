const express = require("express");
const router = express.Router();
const { protect, requireZonalHead } = require("../middleware/auth");
const { contactPhotoUpload } = require("../middleware/upload");
const {
  updateContact, deleteContact, regenerateLink,
} = require("../controllers/contactController");

router.use(protect, requireZonalHead);

router.put("/:id", contactPhotoUpload.single("photo"), updateContact);
router.delete("/:id", deleteContact);
router.post("/:id/regenerate-link", regenerateLink);

module.exports = router;
