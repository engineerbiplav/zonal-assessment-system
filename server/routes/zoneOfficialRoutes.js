const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { contactPhotoUpload } = require("../middleware/upload");
const {
  getZoneOfficials, upsertZoneOfficial, deleteZoneOfficial, getZoneResponse, exportZoneResponse,
} = require("../controllers/zoneOfficialController");

router.use(protect);

router.get("/", getZoneOfficials);
router.put("/:role", contactPhotoUpload.single("photo"), upsertZoneOfficial);
router.delete("/:role", deleteZoneOfficial);
router.get("/:role/response", getZoneResponse);
router.get("/:role/export", exportZoneResponse);

module.exports = router;
