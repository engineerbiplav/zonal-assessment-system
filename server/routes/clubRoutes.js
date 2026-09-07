const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { clubLogoUpload, contactPhotoUpload } = require("../middleware/upload");

const {
  getClubs, getClub, createClub, updateClub, deleteClub,
} = require("../controllers/clubController");
const {
  getContacts, createContact,
} = require("../controllers/contactController");
const { exportClubResponses } = require("../controllers/responseController");

router.use(protect);

router.get("/", getClubs);
router.post("/", clubLogoUpload.single("logo"), createClub);
router.get("/:id", getClub);
router.put("/:id", clubLogoUpload.single("logo"), updateClub);
router.delete("/:id", deleteClub);

router.get("/:clubId/contacts", getContacts);
router.post("/:clubId/contacts", contactPhotoUpload.single("photo"), createContact);

router.get("/:clubId/export", exportClubResponses);

module.exports = router;
