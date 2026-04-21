const { Sequelize } = require('sequelize');
require('dotenv').config();

// Menggunakan DATABASE_URL dari Supabase
const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false // Wajib untuk layanan cloud seperti Supabase
        }
    },
    logging: false // Ubah ke console.log jika ingin melihat query SQL yang berjalan
});

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ PostgreSQL (Supabase) berhasil terhubung!');
    } catch (error) {
        console.error('🔥 Error koneksi PostgreSQL:', error);
    }
};

module.exports = { sequelize, connectDB };