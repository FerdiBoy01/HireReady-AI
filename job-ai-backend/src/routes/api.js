const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Import Controllers
const { checkMatch } = require('../controllers/matchController');
const { uploadCV } = require('../controllers/userController');

// --- PERBAIKAN: Otomatis buat folder 'uploads' jika belum ada ---
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
// ---------------------------------------------------------------

// Konfigurasi Multer (Penyimpanan File)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir + '/'); // Simpan ke folder uploads/
    },
    filename: (req, file, cb) => {
        // Beri nama unik menggunakan timestamp agar tidak bentrok
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "application/pdf") {
            cb(null, true);
        } else {
            cb(new Error("Hanya file PDF yang diperbolehkan!"), false);
        }
    }
});

// Endpoint untuk Analisis Kecocokan Pekerjaan
router.post('/analyze-match', checkMatch);

// Endpoint untuk Upload CV & Parsing Profil
router.post('/upload-cv', upload.single('cv'), uploadCV);

module.exports = router;