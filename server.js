require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.DATABASE_URL || !process.env.JWT_SECRET) {
  console.warn("⚠️  Missing DATABASE_URL or JWT_SECRET. Copy .env.example to .env and update it.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

pool.connect()
  .then(client => {
    console.log("✅ Connected to PostgreSQL");
    client.release();
  })
  .catch(err => {
    console.error("❌ PostgreSQL connection failed:", err.message);
  });

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/auth", require("./routes/auth")(pool));
app.use("/api/posts", require("./routes/posts")(pool));
app.use("/api/comments", require("./routes/comments")(pool));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 Aditya Blog is running at http://localhost:${PORT}`);
});
