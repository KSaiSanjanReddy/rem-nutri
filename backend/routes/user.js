const express = require('express');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const User = require('../models/User');
const { authorize } = require('../middleware/auth');
const router = express.Router();

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

// @route   GET /api/user/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', async (req, res) => {
  try {
    res.json({
      status: 'success',
      data: {
        user: req.user
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get profile'
    });
  }
});

// @route   PUT /api/user/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Full name must be between 2 and 50 characters'),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date of birth'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),
  body('specialization')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Specialization must be between 2 and 100 characters'),
  body('experience')
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('Experience must be between 0 and 50 years'),
  body('consultationFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Consultation fee must be a positive number')
], checkValidation, async (req, res) => {
  try {
    const allowedUpdates = [
      'fullName', 'dateOfBirth', 'gender', 'profilePicture',
      'specialization', 'experience', 'consultationFee'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key) && req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    await user.update(updates);

    res.json({
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update profile',
      error: error.message
    });
  }
});

// @route   PUT /api/user/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
], checkValidation, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findByPk(req.user.id);

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        status: 'error',
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      status: 'success',
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to change password',
      error: error.message
    });
  }
});

// @route   GET /api/user/doctors
// @desc    Get list of doctors
// @access  Private
router.get('/doctors', async (req, res) => {
  try {
    const { page = 1, limit = 10, specialization, search } = req.query;
    const skip = (page - 1) * limit;

    let whereClause = { userType: 'doctor', isActive: true };

    if (specialization) {
      whereClause.specialization = {
        [Op.iLike]: `%${specialization}%`
      };
    }

    if (search) {
      whereClause[Op.or] = [
        { fullName: { [Op.iLike]: `%${search}%` } },
        { specialization: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const doctors = await User.findAll({
      where: whereClause,
      attributes: ['fullName', 'specialization', 'experience', 'consultationFee', 'profilePicture'],
      order: [['created_at', 'DESC']],
      offset: skip,
      limit: parseInt(limit)
    });

    const total = await User.count({ where: whereClause });

    res.json({
      status: 'success',
      data: {
        doctors,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalDoctors: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get doctors list',
      error: error.message
    });
  }
});

// @route   GET /api/user/doctors/:id
// @desc    Get doctor details
// @access  Private
router.get('/doctors/:id', async (req, res) => {
  try {
    const doctor = await User.findOne({
      where: {
        id: req.params.id,
        userType: 'doctor',
        isActive: true
      },
      attributes: { exclude: ['password', 'refreshTokens'] }
    });

    if (!doctor) {
      return res.status(404).json({
        status: 'error',
        message: 'Doctor not found'
      });
    }

    res.json({
      status: 'success',
      data: {
        doctor
      }
    });
  } catch (error) {
    console.error('Get doctor error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get doctor details',
      error: error.message
    });
  }
});

// @route   DELETE /api/user/account
// @desc    Deactivate user account
// @access  Private
router.delete('/account', async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (user) {
      await user.update({
        isActive: false
      });
    }

    res.json({
      status: 'success',
      message: 'Account deactivated successfully'
    });
  } catch (error) {
    console.error('Deactivate account error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to deactivate account',
      error: error.message
    });
  }
});

// @route   GET /api/user/stats
// @desc    Get user statistics (for doctors)
// @access  Private
router.get('/stats', authorize('doctor'), async (req, res) => {
  try {
    // This would typically include chat statistics, patient count, etc.
    // For now, returning basic stats
    const stats = {
      totalPatients: 0, // Would be calculated from chat data
      totalConsultations: 0,
      averageRating: 0,
      totalEarnings: 0
    };

    res.json({
      status: 'success',
      data: {
        stats
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get statistics',
      error: error.message
    });
  }
});

// @route   GET /api/user/search-by-phone
// @desc    Find users by phone number (for starting chats)
// @access  Private
router.get('/search-by-phone', async (req, res) => {
  try {
    const { phone } = req.query;
    
    // Basic phone number validation
    if (!phone || phone.trim() === '') {
      return res.status(400).json({
        status: 'error',
        message: 'Phone number is required'
      });
    }

    const currentUserId = req.user.id;

    // Find user by phone number
    const user = await User.findOne({
      where: {
        mobile: phone,
        id: { [Op.ne]: currentUserId }, // Don't include current user
        isActive: true
      },
      attributes: ['id', 'fullName', 'userType', 'profilePicture', 'mobile']
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found with this phone number'
      });
    }

    res.json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Search by phone error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to search user by phone number',
      error: error.message
    });
  }
});

module.exports = router;
