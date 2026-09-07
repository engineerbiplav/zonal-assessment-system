const express = require("express");
const router = express.Router();
const {
  getZoneInfo,
  getForm,
  submitForm,
  getPublicClubs,
  lookupContact,
  verifyIdentity,
  getZoneRoles,
  lookupZoneOfficial,
  verifyZoneIdentity,
} = require("../controllers/publicController");

// Shared form endpoints — token can belong to either a club president
// (ContactPerson) or a zone-level official (ZoneOfficial). Registered first
// since ":zoneSlug" below would otherwise also match "/form".
router.get("/form/:token", getForm);
router.post("/form/:token", submitForm);

// Everything else is scoped to one zonal head's own assessment link via
// their unique :zoneSlug, so each zonal head only ever sees/assesses their
// own clubs and zone officials.
router.get("/:zoneSlug", getZoneInfo);

// Club president track: club -> president auto-shown -> DOB verification.
router.get("/:zoneSlug/clubs", getPublicClubs);
router.get("/:zoneSlug/lookup", lookupContact);
router.post("/:zoneSlug/verify", verifyIdentity);

// Zone-level roles (Immediate Past Zone Chairperson, 1st VDG/DGE):
// role -> name auto-shown -> DOB verification.
router.get("/:zoneSlug/zone-roles", getZoneRoles);
router.get("/:zoneSlug/zone-lookup", lookupZoneOfficial);
router.post("/:zoneSlug/zone-verify", verifyZoneIdentity);

module.exports = router;
