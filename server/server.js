require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

connectDB();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "*", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/admins", require("./routes/adminRoutes"));
app.use("/api/clubs", require("./routes/clubRoutes"));
app.use("/api/contacts", require("./routes/contactRoutes"));
app.use("/api/responses", require("./routes/responseRoutes"));
app.use("/api/analytics", require("./routes/analyticsRoutes"));
app.use("/api/zone-officials", require("./routes/zoneOfficialRoutes"));
app.use("/api/questions", require("./routes/questionRoutes"));
app.use("/api/public", require("./routes/publicRoutes"));

// Fallback error handler (e.g. multer file-type/size errors)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
