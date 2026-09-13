const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

module.exports = function(pool) {
  const router = express.Router();

  router.post("/register", async (req, res) => {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ message: "Name, email and password are required." });
      }
      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters." });
      }

      const exists = await pool.query("SELECT id FROM users WHERE LOWER(email)=LOWER($1)", [email]);
      if (exists.rowCount) {
        return res.status(409).json({ message: "An account with this email already exists." });
      }

      const hash = await bcrypt.hash(password, 10);
      const result = await pool.query(
        `INSERT INTO users(name,email,password_hash)
         VALUES($1,$2,$3)
         RETURNING id,name,email,bio,created_at`,
        [name.trim(), email.trim().toLowerCase(), hash]
      );

      const user = result.rows[0];
      const token = jwt.sign(
        { id: user.id, name: user.name, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.status(201).json({ token, user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Could not create account." });
    }
  });

  router.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const result = await pool.query(
        "SELECT * FROM users WHERE LOWER(email)=LOWER($1)",
        [email || ""]
      );

      if (!result.rowCount) {
        return res.status(401).json({ message: "Invalid email or password." });
      }

      const user = result.rows[0];
      const ok = await bcrypt.compare(password || "", user.password_hash);

      if (!ok) {
        return res.status(401).json({ message: "Invalid email or password." });
      }

      const token = jwt.sign(
        { id: user.id, name: user.name, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          bio: user.bio,
          created_at: user.created_at
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Could not login." });
    }
  });

  return router;
};
