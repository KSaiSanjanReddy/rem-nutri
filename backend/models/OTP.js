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
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      isIn: [['email', 'mobile', 'password-reset']]
    }
  },
  purpose: {
    type: DataTypes.STRING(30),
    allowNull: false,
    validate: {
      isIn: [['registration', 'login', 'password-reset', 'email-verification', 'mobile-verification']]
    }
  },
  is_used: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      max: 3
    }
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
  }
}, {
  tableName: 'otps',
  underscored: true,
  indexes: [
    { fields: ['identifier', 'type', 'purpose'] },
    { fields: ['expires_at'] }
  ]
});

// Instance methods
OTP.prototype.isValid = function() {
  return !this.is_used && 
         this.attempts < 3 && 
         this.expires_at > new Date();
};

OTP.prototype.markAsUsed = async function() {
  this.is_used = true;
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
  await this.destroy({
    where: { identifier, type, purpose }
  });

  const otp = this.generateOTP();
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

  return await this.create({
    identifier,
    otp,
    type,
    purpose,
    expires_at: expiresAt
  });
};

OTP.verifyOTP = async function(identifier, otp, type, purpose) {
  const otpRecord = await this.findOne({
    where: { identifier, type, purpose, is_used: false },
    order: [['created_at', 'DESC']]
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
