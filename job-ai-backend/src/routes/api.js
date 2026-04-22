const express = require('express');
const router = express.Router();
const multer = require('multer');

// Import Controllers
const { checkMatch } = require('../controllers/matchController');
const { uploadCV } = require('../controllers/userController');
const { processManualJob } = require('../controllers/jobInputController'); // <-- IMPORT BARU

// Import Services
const { fetchJobs } = require('../services/jobService');

const storage = multer.memoryStorage(); 

// --- UPDATE MULTER: SEKARANG TERIMA PDF DAN GAMBAR ---
const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Daftar ekstensi yang diizinkan
        const allowedMimes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
        
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Hanya file PDF, JPG, dan PNG yang diperbolehkan!"), false);
        }
    }
});

// ==========================================
// DAFTAR ROUTE / ENDPOINT API
// ==========================================

// 1. Endpoint untuk Analisis Kecocokan Pekerjaan
router.post('/analyze-match', checkMatch);

// 2. Endpoint untuk Upload CV 
router.post('/upload-cv', upload.single('cv'), uploadCV);

// 3. Endpoint untuk Mencari Lowongan via Adzuna API
router.get('/search-jobs', async (req, res) => {
    // (Kode Adzuna kamu yang sudah ada dibiarkan sama saja)
    try {
        const { query } = req.query;
        const keyword = query ? query : 'developer';
        const jobs = await fetchJobs(keyword);
        res.status(200).json({ success: true, jobs });
    } catch (error) {
        res.status(500).json({ success: false, error: "Gagal mengambil data." });
    }
});

// 4. (FITUR BARU) Endpoint untuk Input Loker Manual (Teks & Gambar)
// Kita pakai nama field 'file' untuk gambarnya
router.post('/process-manual-job', upload.single('file'), processManualJob);

module.exports = router;