import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { hashPassword, comparePassword, generateToken } from '../utils/auth.js';
import { sendPasswordResetEmail } from '../utils/emailService.js';
import crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
export const register = [
  // Validation
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('username')
    .isLength({ min: 2, max: 30 })
    .withMessage('Username must be between 2-30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be at least 2 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name must contain letters only'),

  // Controller
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { email, username, password, name } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: email.toLowerCase() },
            { username: username.toLowerCase() }
          ]
        }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: existingUser.email === email.toLowerCase()
            ? 'Email already registered'
            : 'Username already taken'
        });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          username: username.toLowerCase(),
          password: hashedPassword,
          name: name || username
        },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          avatar: true,
          verified: true,
          createdAt: true
        }
      });

      // Generate token
      const token = generateToken({ userId: user.id });

      res.status(201).json({
        success: true,
        data: {
          user,
          token
        }
      });
    } catch (error) {
      // Register error
      res.status(500).json({
        success: false,
        error: 'Server error. Please try again later.'
      });
    }
  }
];

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
export const login = [
  // Validation
  body('emailOrUsername').notEmpty().withMessage('Email or username is required'),
  body('password').notEmpty().withMessage('Password is required'),

  // Controller
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { emailOrUsername, password } = req.body;

      // Find user by email or username
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: emailOrUsername.toLowerCase() },
            { username: emailOrUsername.toLowerCase() }
          ]
        }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      // Check password
      const isMatch = await comparePassword(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      // Check if account is active
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          error: 'Account is deactivated. Please contact support.'
        });
      }

      // Generate token
      const token = generateToken({ userId: user.id });

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        success: true,
        data: {
          user: userWithoutPassword,
          token
        }
      });
    } catch (error) {
      // Login error
      res.status(500).json({
        success: false,
        error: 'Server error. Please try again later.'
      });
    }
  }
];

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
export const getMe = async (req, res) => {
  try {
    // User is already attached by auth middleware
    res.json({
      success: true,
      data: req.user
    });
  } catch (error) {
    // GetMe error
    res.status(500).json({
      success: false,
      error: 'Server error. Please try again later.'
    });
  }
};

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset (generate reset token)
 * @access  Public
 */
export const forgotPassword = [
  // Validation
  body('email').isEmail().withMessage('Please provide a valid email'),

  // Controller
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { email } = req.body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      // Always return success even if user not found (security best practice)
      if (!user) {
        return res.json({
          success: true,
          message: 'If an account with that email exists, a password reset token has been generated.'
        });
      }

      // Check if user requested a reset token recently (30 second cooldown)
      if (user.resetTokenRequestedAt) {
        const timeSinceLastRequest = Date.now() - new Date(user.resetTokenRequestedAt).getTime();
        const cooldownPeriod = 30 * 1000; // 30 seconds in milliseconds
        
        if (timeSinceLastRequest < cooldownPeriod) {
          const remainingSeconds = Math.ceil((cooldownPeriod - timeSinceLastRequest) / 1000);
          return res.status(429).json({
            success: false,
            error: `Please wait ${remainingSeconds} seconds before requesting a new code.`
          });
        }
      }

      // Generate reset token (6-digit code)
      const resetToken = crypto.randomInt(100000, 999999).toString();
      const resetTokenExpiry = new Date(Date.now() + 3 * 60 * 1000); // 3 minutes

      // Hash the reset token before storing
      const hashedResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

      // Save reset token to user
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken: hashedResetToken,
          resetTokenExpiry,
          resetTokenRequestedAt: new Date()
        }
      });

      // Send reset code via email
      try {
        await sendPasswordResetEmail(user.email, resetToken, user.name);
        
        res.json({
          success: true,
          message: 'Password reset code has been sent to your email.'
        });
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Don't reveal that email sending failed for security
        res.json({
          success: true,
          message: 'If an account with that email exists, a password reset code has been sent.'
        });
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        error: 'Server error. Please try again later.'
      });
    }
  }
];

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using reset token
 * @access  Public
 */
export const resetPassword = [
  // Validation
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('resetToken')
    .isLength({ min: 6, max: 6 })
    .withMessage('Reset token must be 6 digits'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),

  // Controller
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { email, resetToken, newPassword } = req.body;

      // Hash the provided reset token
      const hashedResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

      // Find user with valid reset token
      const user = await prisma.user.findFirst({
        where: {
          email: email.toLowerCase(),
          resetToken: hashedResetToken,
          resetTokenExpiry: {
            gt: new Date() // Token not expired
          }
        }
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or expired reset token'
        });
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update password and clear reset token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null,
          resetTokenRequestedAt: null
        }
      });

      res.json({
        success: true,
        message: 'Password reset successful. You can now login with your new password.'
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        error: 'Server error. Please try again later.'
      });
    }
  }
];
