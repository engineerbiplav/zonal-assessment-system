const express = require("express");
const router = express.Router();
const {
  getForm,
  submitForm,
  getPublicClubs,
  lookupContact,
  verifyIdentity,
  getZoneRoles,
  lookupZoneOfficial,
  verifyZoneIdentity,
} = require("../controllers/publicController");

// Club president track: club -> president auto-shown -> DOB verification.
router.get("/clubs", getPublicClubs);
router.get("/lookup", lookupContact);
router.post("/verify", verifyIdentity);

// Zone-level roles (Immediate Past Zone Chairperson, 1st VDG/DGE):
// role -> name auto-shown (or picked if more than one zone) -> DOB verification.
router.get("/zone-roles", getZoneRoles);
router.get("/zone-lookup", lookupZoneOfficial);
router.post("/zone-verify", verifyZoneIdentity);

// Shared form endpoints — token can belong to either a club president
// (ContactPerson) or a zone-level official (ZoneOfficial).
router.get("/form/:token", getForm);
router.post("/form/:token", submitForm);

module.exports = router;
