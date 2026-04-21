const express = require('express');
const router = express.Router();
const multer = require('multer');

// Import Controllers
const { checkMatch } = require('../controllers/matchController');
const { uploadCV } = require('../controllers/userController');

// Import Services
const { fetchJobs } = require('../services/jobService');

// --- KONFIGURASI MULTER (CLOUD / MEMORY STORAGE) ---
// Kita simpan file di RAM (memory) sementara sebelum dilempar ke Azure
const storage = multer.memoryStorage(); 

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

// ==========================================
// DAFTAR ROUTE / ENDPOINT API
// ==========================================

// 1. Endpoint untuk Analisis Kecocokan Pekerjaan
router.post('/analyze-match', checkMatch);

// 2. Endpoint untuk Upload CV (Memory -> Azure -> AI)
router.post('/upload-cv', upload.single('cv'), uploadCV);

// 3. Endpoint untuk Mencari Lowongan via Adzuna API
router.get('/search-jobs', async (req, res) => {
    try {
        const { query } = req.query;
        // Jika parameter pencarian kosong, default mencari 'developer'
        const keyword = query ? query : 'developer';
        
        console.log(`🔍 Mengambil data lowongan kerja dengan keyword: ${keyword}`);
        const jobs = await fetchJobs(keyword);
        
        res.status(200).json({ success: true, jobs });
    } catch (error) {
        console.error("Gagal di route /search-jobs:", error.message);
        res.status(500).json({ success: false, error: "Gagal mengambil data lowongan dari server." });
    }
});

module.exports = router;