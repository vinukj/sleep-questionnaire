import express from "express";
const router = express.Router();

/**
 * @swagger
 * /api/user:
 *   get:
 *     summary: Get user info
 *     responses:
 *       200:
 *         description: Returns user info
 */
router.get("/user", (req, res) => {
  res.json({ id: 1, name: "Zaid" });
});

export default router;
