const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const User = require('../models/User');
const OTP = require('../models/OTP');
const { generateTokens, authenticateToken } = require('../middleware/auth');
const { sendOTPEmail, sendOTPSMS } = require('../utils/otpService');
const router = express.Router();

// Validation rules
const registerValidation = [
  body('full_name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Full name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('mobile')
    .isLength({ min: 10, max: 15 })
    .withMessage('Please provide a valid mobile number'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('date_of_birth')
    .isISO8601()
    .withMessage('Please provide a valid date of birth'),
  body('gender')
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),
  body('user_type')
    .optional()
    .isIn(['user', 'doctor'])
    .withMessage('User type must be user or doctor')
];

const loginValidation = [
  body('identifier')
    .notEmpty()
    .withMessage('Email or mobile number is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const otpValidation = [
  body('identifier')
    .notEmpty()
    .withMessage('Email or mobile number is required'),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('OTP must be 6 digits'),
  body('type')
    .isIn(['email', 'mobile'])
    .withMessage('Type must be email or mobile')
];

// Helper function to check validation results
const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', registerValidation, checkValidation, async (req, res) => {
  try {
    const {
      full_name,
      email,
      mobile,
      password,
      date_of_birth,
      gender,
      user_type = 'user',
      specialization,
      license_number,
      experience,
      consultation_fee
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { mobile }]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: existingUser.email === email 
          ? 'Email already registered' 
          : 'Mobile number already registered'
      });
    }

    // Create user
    const userData = {
      full_name,
      email,
      mobile,
      password,
      date_of_birth,
      gender,
      user_type
    };

    // Add doctor-specific fields if user is a doctor
    if (user_type === 'doctor') {
      userData.specialization = specialization;
      userData.license_number = license_number;
      userData.experience = experience;
      userData.consultation_fee = consultation_fee;
    }

    const user = await User.create(userData);

    // Mark email and mobile as verified for immediate login
    user.is_email_verified = true;
    user.is_mobile_verified = true;
    await user.save();

    // Generate tokens for immediate login
    const tokens = generateTokens(user.id);
    
    // Save refresh token to database
    user.refresh_tokens.push({ token: tokens.refreshToken });
    user.last_login = new Date();
    await user.save();

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password;

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully. You are now logged in.',
      data: {
        user: userResponse,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Registration failed',
      error: error.message
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', loginValidation, checkValidation, async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // Find user by email or mobile
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: identifier },
          { mobile: identifier }
        ]
      }
    });

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Check if account is active
    if (!user.is_active) {
      return res.status(401).json({
        status: 'error',
        message: 'Account is deactivated'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Generate tokens
    const tokens = generateTokens(user.id);

    // Save refresh token to database
    user.refresh_tokens.push({ token: tokens.refreshToken });
    user.last_login = new Date();
    await user.save();

    // Remove password from response
    const userResponse = user.toJSON();

    res.json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: userResponse,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Login failed',
      error: error.message
    });
  }
});

// @route   POST /api/auth/send-otp
// @desc    Send OTP for verification
// @access  Public
router.post('/send-otp', [
  body('identifier').notEmpty().withMessage('Email or mobile number is required'),
  body('type').isIn(['email', 'mobile']).withMessage('Type must be email or mobile'),
  body('purpose').isIn(['registration', 'login', 'password-reset', 'email-verification', 'mobile-verification'])
    .withMessage('Invalid purpose')
], checkValidation, async (req, res) => {
  try {
    const { identifier, type, purpose } = req.body;

    // Create OTP
    const otpRecord = await OTP.createOTP(identifier, type, purpose);

    // Send OTP
    if (type === 'email') {
      await sendOTPEmail(identifier, otpRecord.otp);
    } else {
      await sendOTPSMS(identifier, otpRecord.otp);
    }

    res.json({
      status: 'success',
      message: `OTP sent to ${type}`,
      data: {
        identifier,
        type,
        expiresIn: 5 // minutes
      }
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to send OTP',
      error: error.message
    });
  }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP
// @access  Public
router.post('/verify-otp', otpValidation, checkValidation, async (req, res) => {
  try {
    const { identifier, otp, type, purpose } = req.body;

    // Verify OTP
    let verification;
    
    // Development mode - accept dummy OTPs
    if (process.env.NODE_ENV === 'development' && otp === '123456') {
      verification = { valid: true, message: 'OTP verified successfully' };
    } else {
      verification = await OTP.verifyOTP(identifier, otp, type, purpose);
    }

    if (!verification.valid) {
      return res.status(400).json({
        status: 'error',
        message: verification.message
      });
    }

    // Update user verification status if needed
    if (purpose === 'email-verification' || purpose === 'mobile-verification') {
      const user = await User.findOne({
        where: {
          [Op.or]: [{ email: identifier }, { mobile: identifier }]
        }
      });

      if (user) {
        if (type === 'email') {
          user.is_email_verified = true;
        } else {
          user.is_mobile_verified = true;
        }
        await user.save();

        // Check if both email and mobile are verified for auto-login
        if (user.is_email_verified && user.is_mobile_verified) {
          // Generate tokens for auto-login
          const tokens = generateTokens(user.id);
          
          // Save refresh token to database
          user.refresh_tokens.push({ token: tokens.refreshToken });
          user.last_login = new Date();
          await user.save();

          // Remove password from response
          const userResponse = user.toJSON();
          delete userResponse.password;

          return res.json({
            status: 'success',
            message: 'Account verified successfully. You are now logged in.',
            data: {
              user: userResponse,
              accessToken: tokens.accessToken,
              refreshToken: tokens.refreshToken
            }
          });
        }
      }
    }

    res.json({
      status: 'success',
      message: verification.message
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      status: 'error',
      message: 'OTP verification failed',
      error: error.message
    });
  }
});

// @route   POST /api/auth/refresh-token
// @desc    Refresh access token
// @access  Public
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        status: 'error',
        message: 'Refresh token required'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Check if refresh token exists in user's refresh tokens
    const tokenExists = user.refresh_tokens.some(
      token => token.token === refreshToken
    );

    if (!tokenExists) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid refresh token'
      });
    }

    // Generate new tokens
    const tokens = generateTokens(user.id);

    // Remove old refresh token and add new one
    user.refresh_tokens = user.refresh_tokens.filter(token => token.token !== refreshToken);
    user.refresh_tokens.push({ token: tokens.refreshToken });
    await user.save();

    res.json({
      status: 'success',
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({
      status: 'error',
      message: 'Invalid refresh token'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Remove refresh token from database
      const user = await User.findByPk(req.user.id);
      if (user) {
        user.refresh_tokens = user.refresh_tokens.filter(token => token.token !== refreshToken);
        await user.save();
      }
    }

    res.json({
      status: 'success',
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Logout failed'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      status: 'success',
      data: {
        user: req.user
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get user data'
    });
  }
});

module.exports = router;
