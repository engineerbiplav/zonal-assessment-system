const express = require("express");
const router = express.Router();
const { protect, requireZonalHead } = require("../middleware/auth");
const { contactPhotoUpload } = require("../middleware/upload");
const {
  getZoneOfficials, upsertZoneOfficial, deleteZoneOfficial, getZoneResponse, deleteZoneResponse,
} = require("../controllers/zoneOfficialController");

router.use(protect, requireZonalHead);

router.get("/", getZoneOfficials);
router.put("/:role", contactPhotoUpload.single("photo"), upsertZoneOfficial);
router.delete("/:role", deleteZoneOfficial);
router.get("/:role/response", getZoneResponse);
router.delete("/:role/response", deleteZoneResponse);

module.exports = router;
