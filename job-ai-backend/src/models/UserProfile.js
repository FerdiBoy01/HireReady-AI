const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserProfile = sequelize.define('UserProfile', {
    full_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    // Karena Gemini mengembalikan Array/Objek, gunakan tipe JSONB (Khusus Postgres)
    skills: {
        type: DataTypes.JSONB, 
        allowNull: true,
    },
    cv_file_url: {
        type: DataTypes.STRING,
        allowNull: true,
    }
}, {
    tableName: 'user_profiles',
    timestamps: true,
});

module.exports = UserProfile;