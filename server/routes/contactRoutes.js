const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { contactPhotoUpload } = require("../middleware/upload");
const {
  updateContact, deleteContact, regenerateLink,
} = require("../controllers/contactController");

router.use(protect);

router.put("/:id", contactPhotoUpload.single("photo"), updateContact);
router.delete("/:id", deleteContact);
router.post("/:id/regenerate-link", regenerateLink);

module.exports = router;
