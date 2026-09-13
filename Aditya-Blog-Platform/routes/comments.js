const express = require("express");
const auth = require("../middleware/auth");

module.exports = function(pool) {
  const router = express.Router();

  router.post("/post/:postId", auth, async (req, res) => {
    try {
      const { comment } = req.body;
      if (!comment || !comment.trim()) {
        return res.status(400).json({ message: "Comment cannot be empty." });
      }

      const result = await pool.query(`
        INSERT INTO comments(post_id,user_id,comment)
        VALUES($1,$2,$3)
        RETURNING *
      `, [req.params.postId, req.user.id, comment.trim()]);

      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Could not add comment." });
    }
  });

  router.delete("/:id", auth, async (req, res) => {
    try {
      const result = await pool.query(
        "DELETE FROM comments WHERE id=$1 AND user_id=$2 RETURNING id",
        [req.params.id, req.user.id]
      );
      if (!result.rowCount) {
        return res.status(403).json({ message: "You can delete only your own comments." });
      }
      res.json({ message: "Comment deleted." });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Could not delete comment." });
    }
  });

  return router;
};
