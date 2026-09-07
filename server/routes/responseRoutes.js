const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  getResponses, getResponse, exportResponse,
} = require("../controllers/responseController");

router.use(protect);

router.get("/", getResponses);
router.get("/:id", getResponse);
router.get("/:id/export", exportResponse);

module.exports = router;
