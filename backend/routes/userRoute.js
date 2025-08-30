import express from "express";
import { verifyTokenBasic } from "../middleware/authMiddleware.js";

import pool from "../config/db.js";

const router = express.Router();

// Create or Update About User profile
router.post("/", verifyTokenBasic, async (req, res) => {
  const { name, age, weight } = req.body;
  const userId = req.user.id; // from JWT authMiddleware

  try {
    // Check if profile exists
    const existing = await pool.query(
      "SELECT * FROM about_user WHERE user_id=$1",
      [userId]
    );

    let result;
    if (existing.rows.length > 0) {
      // Update profile
      result = await pool.query(
        "UPDATE about_user SET name=$1, age=$2, weight=$3, updated_at=NOW() WHERE user_id=$4 RETURNING *",
        [name, age, weight, userId]
      );
    } else {
      // Insert new profile
      result = await pool.query(
        "INSERT INTO about_user (user_id, name, age, weight) VALUES ($1,$2,$3,$4) RETURNING *",
        [userId, name, age, weight]
      );
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});


// GET /about-user/me
router.get("/me", verifyTokenBasic, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      "SELECT name, age, weight FROM about_user WHERE user_id=$1",
      [userId]
    );
    if (result.rows.length === 0) return res.json(null);
    res.json({userId:req.user.id, profile:result.rows[0]});
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});


export default router;
