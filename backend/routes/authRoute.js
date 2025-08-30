import express from 'express';
import { signup, login, getProfile } from '../controllers/authController.js';
import { verifyTokens,verifyTokenBasic } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Create a new user account
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: zaid@example.com
 *               password:
 *                 type: string
 *                 example: mypassword123
 *     responses:
 *       200:
 *         description: User created successfully
 */
router.post('/signup', signup);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: zaid@example.com
 *               password:
 *                 type: string
 *                 example: mypassword123
 *     responses:
 *       200:
 *         description: Login successful, returns JWT token
 */
router.post('/login', login);

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get the logged-in user's profile
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []  # Requires JWT token
 *     responses:
 *       200:
 *         description: Returns the user's name and email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: This is a protected route
 *                 user:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: Zaid
 *                     email:
 *                       type: string
 *                       example: zaid@example.com
 *       401:
 *         description: Unauthorized, token missing
 *       403:
 *         description: Forbidden, invalid or expired token
 */


router.get('/verify', verifyTokenBasic, (req, res) => {
  res.status(200).json({
    valid:true,
    user:req.user
  })
});

router.get('/profile', verifyTokens, (req, res) => {
  res.json({ id: req.user.id });
});


export default router;
