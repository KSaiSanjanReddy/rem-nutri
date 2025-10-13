const { DataTypes, Op } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  full_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      len: [2, 50]
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  mobile: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    validate: {
      is: /^\+?[1-9]\d{1,14}$/
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [6, 255]
    }
  },
  user_type: {
    type: DataTypes.STRING(20),
    defaultValue: 'user',
    validate: {
      isIn: [['user', 'doctor', 'admin']]
    }
  },
  is_email_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  is_mobile_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  profile_picture: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  date_of_birth: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  gender: {
    type: DataTypes.STRING(10),
    allowNull: false,
    validate: {
      isIn: [['male', 'female', 'other']]
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  // Doctor specific fields
  specialization: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      len: [2, 100]
    }
  },
  license_number: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true,
    validate: {
      len: [1, 50]
    }
  },
  experience: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
      max: 50
    }
  },
  consultation_fee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  refresh_tokens: {
    type: DataTypes.JSONB,
    defaultValue: [],
    allowNull: true,
  }
}, {
  tableName: 'users',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Instance methods
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Class methods
User.findByEmailOrMobile = function(identifier) {
  return this.findOne({
    where: {
      [Op.or]: [
        { email: identifier },
        { mobile: identifier }
      ]
    }
  });
};

module.exports = User;