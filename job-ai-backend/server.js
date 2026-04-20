const app = require('./src/app');
const sequelize = require('./src/config/database');
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        // Otomatis membuat tabel jika belum ada
        // await sequelize.sync({ alter: true }); 
        console.log("Database MySQL terhubung dan tersinkronisasi.");

        app.listen(PORT, () => {
            console.log(`Server berjalan di http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Gagal terhubung ke database:", error);
    }
};

startServer();