import express from 'express';
import { signup, login, googleLogin, refreshTokens, updateUserRole, getAllUsers } from '../controllers/authController.js';
import { verifyTokens, verifyTokenBasic, requireSuperAdmin } from '../middleware/authMiddleware.js';
import { invalidateAllUserSessions } from '../models/userModel.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User authentication and profile management
 */

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Create a new user account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
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
 *       400:
 *         description: Invalid input or user already exists
 */
router.post('/signup', signup);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: zaid@example.com
 *               password:
 *                 type: string
 *                 example: mypassword123
 *     responses:
 *       200:
 *         description: Login successful, returns JWT token and sets cookies
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', login);
// Refresh token rotation endpoint
router.post('/refresh', refreshTokens);

/**
 * @swagger
 * /auth/verify:
 *   get:
 *     summary: Verify if the provided token is valid
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: 12345
 *                     email:
 *                       type: string
 *                       example: zaid@example.com
 *       401:
 *         description: Unauthorized, missing or invalid token
 */
router.get('/verify', verifyTokenBasic, (req, res) => {
  res.status(200).json({
    valid: true,
    user: req.user
  });
});

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get the logged-in user's profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns the user's profile information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: 12345
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
router.get('/profile', verifyTokens, (req, res) => {
  console.log('[AUTH] Profile route:', {
    method: req.method,
    path: req.originalUrl,
    user: req.user
  });

  res.json({
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      isAdmin: req.user.role === 'admin'
    }
  });
});

// Admin: Get all users
router.get('/admin/users', verifyTokens, requireSuperAdmin, getAllUsers);

// Admin: Update user role
router.put('/admin/users/role', verifyTokens, requireSuperAdmin, updateUserRole);


/**
 * @swagger
 * /auth/google:
 *   post:
 *     summary: Login using Google authentication
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 example: ya29.a0ARrdaM-ExampleGoogleOAuthToken
 *     responses:
 *       200:
 *         description: Google login successful
 *       400:
 *         description: Invalid Google token
 */
router.post('/google', googleLogin);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Log out the current user and clear authentication cookies
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully logged out
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Successfully logged out
 *                 clearCache:
 *                   type: boolean
 *                   example: true
 *                 broadcastLogout:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Error during logout
 */
router.post('/logout', verifyTokens, async (req, res) => {
  console.log(`[AUTH] Inline logout route:`, { method: req.method, path: req.originalUrl, user: req.user });
  try {
    await invalidateAllUserSessions(req.user.id);

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
