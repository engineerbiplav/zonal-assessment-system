const express = require("express");
const router = express.Router();
const { protect, requireZonalHead } = require("../middleware/auth");
const {
  getResponses, getResponse, deleteResponse, exportAllResponses,
} = require("../controllers/responseController");

router.use(protect, requireZonalHead);

// IMPORTANT: /export-all must be registered before the /:id route so it
// isn't swallowed as an :id param.
router.get("/export-all", exportAllResponses);
router.get("/", getResponses);
router.get("/:id", getResponse);
router.delete("/:id", deleteResponse);

module.exports = router;
