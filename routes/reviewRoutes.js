const express = require("express");
const db = require("../db"); // PostgreSQL connection
const router = express.Router();

// Get all reviews
router.get("/", async (req, res) => {
  try {
    const { rows: reviews } = await db.query(
      `SELECT people.name AS user_name, reviews.rating, reviews.comment
       FROM reviews
       JOIN people ON reviews.user_id = people.id
       ORDER BY reviews.created_at DESC`
    );

    if (reviews.length === 0)
      return res.status(404).json({ message: "No reviews found" });

    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: "Error fetching reviews", error: err.message });
  }
});

// Submit a new review
router.post("/submit", async (req, res) => {
  const { userId, rating, comment } = req.body;
  try {
    await db.query(
      `INSERT INTO reviews (user_id, rating, comment)
       VALUES ($1, $2, $3)`,
      [userId, rating, comment]
    );
    res.status(201).json({ message: "Review submitted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error submitting review", error: err.message });
  }
});

module.exports = router;
