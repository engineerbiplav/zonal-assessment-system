const express = require("express");
const router = express.Router();
const { protect, requireZonalHead } = require("../middleware/auth");
const {
  getQuestions, createQuestion, updateQuestion, deleteQuestion,
} = require("../controllers/questionController");

router.use(protect, requireZonalHead);

router.get("/", getQuestions);
router.post("/", createQuestion);
router.put("/:id", updateQuestion);
router.delete("/:id", deleteQuestion);

module.exports = router;
