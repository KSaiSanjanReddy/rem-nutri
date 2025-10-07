const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OTP = sequelize.define('OTP', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  identifier: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Email or mobile number'
  },
  otp: {
    type: DataTypes.STRING(6),
    allowNull: false,
    validate: {
      len: [6, 6],
      isNumeric: true
    }
  },
  type: {
    type: DataTypes.ENUM('email', 'mobile', 'password-reset'),
    allowNull: false
  },
  purpose: {
    type: DataTypes.ENUM('registration', 'login', 'password-reset', 'email-verification', 'mobile-verification'),
    allowNull: false
  },
  isUsed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      max: 3
    }
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: 'otps',
  indexes: [
    {
      fields: ['identifier', 'type', 'purpose']
    },
    {
      fields: ['expiresAt']
    }
  ]
});

// Instance methods
OTP.prototype.isValid = function() {
  return !this.isUsed && 
         this.attempts < 3 && 
         this.expiresAt > new Date();
};

OTP.prototype.markAsUsed = async function() {
  this.isUsed = true;
  return await this.save();
};

OTP.prototype.incrementAttempts = async function() {
  this.attempts += 1;
  return await this.save();
};

// Class methods
OTP.generateOTP = function(length = 6) {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};

OTP.createOTP = async function(identifier, type, purpose, expiryMinutes = 5) {
  // Delete any existing OTPs for this identifier and purpose
  await this.destroy({
    where: {
      identifier,
      type,
      purpose
    }
  });

  const otp = this.generateOTP();
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

  return await this.create({
    identifier,
    otp,
    type,
    purpose,
    expiresAt
  });
};

OTP.verifyOTP = async function(identifier, otp, type, purpose) {
  const otpRecord = await this.findOne({
    where: {
      identifier,
      type,
      purpose,
      isUsed: false
    },
    order: [['createdAt', 'DESC']]
  });

  if (!otpRecord) {
    return { valid: false, message: 'OTP not found' };
  }

  if (!otpRecord.isValid()) {
    return { valid: false, message: 'OTP expired or exceeded attempts' };
  }

  if (otpRecord.otp !== otp) {
    await otpRecord.incrementAttempts();
    return { valid: false, message: 'Invalid OTP' };
  }

  await otpRecord.markAsUsed();
  return { valid: true, message: 'OTP verified successfully' };
};

module.exports = OTP;