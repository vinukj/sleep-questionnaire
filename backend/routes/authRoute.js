import express from 'express';
import { signup, login, getProfile, googleLogin } from '../controllers/authController.js';
import { verifyTokens,verifyTokenBasic } from '../middleware/authMiddleware.js';
import { invalidateAllUserSessions } from '../models/userModel.js';


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
  res.json({ user:{id: req.user.id , name : req.user.name, email: req.user.email} });
});

router.post('/google', googleLogin);


/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Log out the current user and clear the auth cookie
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: Successfully logged out
 */
router.post('/logout', verifyTokens, async (req, res) => {
  try {
    await invalidateAllUserSessions(req.user.id);
    
    // Clear both cookies
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      path: '/'
    });
    
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      path: '/'
    });

    return res.status(200).json({
      message: 'Successfully logged out',
      clearCache: true,
      broadcastLogout: true
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ error: 'Error during logout' });
  }
});


export default router;
