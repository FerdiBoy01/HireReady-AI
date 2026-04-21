const app = require('./src/app');
// 1. Ubah cara import untuk mengambil fungsi connectDB juga
const { sequelize, connectDB } = require('./src/config/database'); 
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        // 2. Panggil fungsi untuk mengetes koneksi
        await connectDB();

        // 3. Wajib dijalankan agar Sequelize membuat tabel di Supabase!
        await sequelize.sync({ alter: true }); 
        console.log("✅ Database PostgreSQL tersinkronisasi. Tabel siap digunakan!");

        // 4. Jalankan server
        app.listen(PORT, () => {
            console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("🔥 Gagal terhubung ke database:", error);
    }
};

startServer();