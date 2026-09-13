const express = require("express");
const auth = require("../middleware/auth");

module.exports = function(pool) {
  const router = express.Router();

  router.get("/", async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT p.id,p.user_id,p.title,p.excerpt,p.content,p.category,p.cover_emoji,p.likes,
               p.created_at,p.updated_at,u.name AS author,
               COUNT(c.id)::int AS comment_count
        FROM posts p
        JOIN users u ON u.id=p.user_id
        LEFT JOIN comments c ON c.post_id=p.id
        GROUP BY p.id,u.name
        ORDER BY p.created_at DESC
      `);
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Could not load posts." });
    }
  });

  router.get("/:id", async (req, res) => {
    try {
      const postResult = await pool.query(`
        SELECT p.*,u.name AS author
        FROM posts p
        JOIN users u ON u.id=p.user_id
        WHERE p.id=$1
      `, [req.params.id]);

      if (!postResult.rowCount) return res.status(404).json({ message: "Post not found." });

      const comments = await pool.query(`
        SELECT c.id,c.comment,c.created_at,c.user_id,u.name AS author
        FROM comments c
        JOIN users u ON u.id=c.user_id
        WHERE c.post_id=$1
        ORDER BY c.created_at ASC
      `, [req.params.id]);

      res.json({ ...postResult.rows[0], comments: comments.rows });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Could not load post." });
    }
  });

  router.post("/", auth, async (req, res) => {
    try {
      const { title, excerpt, content, category, cover_emoji } = req.body;
      if (!title || !content) {
        return res.status(400).json({ message: "Title and content are required." });
      }

      const result = await pool.query(`
        INSERT INTO posts(user_id,title,excerpt,content,category,cover_emoji)
        VALUES($1,$2,$3,$4,$5,$6)
        RETURNING *
      `, [
        req.user.id,
        title.trim(),
        (excerpt || "").trim(),
        content.trim(),
        (category || "General").trim(),
        (cover_emoji || "✍️").trim()
      ]);

      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Could not publish post." });
    }
  });

  router.put("/:id", auth, async (req, res) => {
    try {
      const owner = await pool.query("SELECT user_id FROM posts WHERE id=$1", [req.params.id]);
      if (!owner.rowCount) return res.status(404).json({ message: "Post not found." });
      if (owner.rows[0].user_id !== req.user.id) {
        return res.status(403).json({ message: "You can edit only your own posts." });
      }

      const { title, excerpt, content, category, cover_emoji } = req.body;
      const result = await pool.query(`
        UPDATE posts
        SET title=$1, excerpt=$2, content=$3, category=$4, cover_emoji=$5, updated_at=CURRENT_TIMESTAMP
        WHERE id=$6
        RETURNING *
      `, [title, excerpt || "", content, category || "General", cover_emoji || "✍️", req.params.id]);

      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Could not update post." });
    }
  });

  router.delete("/:id", auth, async (req, res) => {
    try {
      const result = await pool.query(
        "DELETE FROM posts WHERE id=$1 AND user_id=$2 RETURNING id",
        [req.params.id, req.user.id]
      );
      if (!result.rowCount) {
        return res.status(403).json({ message: "Post not found or you do not own it." });
      }
      res.json({ message: "Post deleted." });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Could not delete post." });
    }
  });

  router.post("/:id/like", async (req, res) => {
    try {
      const result = await pool.query(
        "UPDATE posts SET likes=likes+1 WHERE id=$1 RETURNING likes",
        [req.params.id]
      );
      if (!result.rowCount) return res.status(404).json({ message: "Post not found." });
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Could not like post." });
    }
  });

  return router;
};
