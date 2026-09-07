const express = require("express");
const router = express.Router();
const { protect, requireZonalHead } = require("../middleware/auth");
const { overview } = require("../controllers/analyticsController");

router.use(protect, requireZonalHead);
router.get("/overview", overview);

module.exports = router;
