const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserProfile = sequelize.define('UserProfile', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    full_name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    cv_file_url: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    skills: {
        type: DataTypes.JSON, 
        allowNull: true
    }
}, {
    tableName: 'user_profiles',
    timestamps: true
});

module.exports = UserProfile;