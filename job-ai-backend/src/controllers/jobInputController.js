const Tesseract = require('tesseract.js');
const sharp = require('sharp'); // <-- IMPORT SHARP DI SINI
const { parseJobWithAI } = require('../services/aiService');

const processManualJob = async (req, res) => {
    try {
        const { type, manualText } = req.body;
        let extractedText = "";

        if (type === 'image') {
            if (!req.file) return res.status(400).json({ error: "Gambar poster tidak ditemukan!" });
            
            console.log("🛠️ Mencuci gambar (Preprocessing) agar mudah dibaca...");
            
            // SIHIR SHARP: Bikin Hitam Putih, Naikkan Kontras, dan Perjelas Teks
            const processedImageBuffer = await sharp(req.file.buffer)
                .resize({ width: 1500, withoutEnlargement: true }) // Perbesar gambar agar teks tidak pecah
                .grayscale() // Ubah jadi abu-abu/hitam-putih
                .normalize() // Tarik kontras sejauh mungkin (teks makin hitam, background makin putih)
                .sharpen() // Pertajam tepi huruf
                .toBuffer();

            console.log("🔍 Mengekstrak teks dengan Tesseract...");
            
            // Berikan gambar yang SUDAH DICUCI ke Tesseract
            const { data: { text } } = await Tesseract.recognize(
                processedImageBuffer, 
                'eng+ind',
                { logger: m => console.log(`⏳ OCR Progress: ${Math.round(m.progress * 100)}%`) }
            );
            
            extractedText = text;
            console.log("✅ Ekstrak teks gambar selesai. Hasil mentah:\n", extractedText.substring(0, 50) + "...");

        } else if (type === 'text') {
            if (!manualText) return res.status(400).json({ error: "Teks loker tidak boleh kosong!" });
            extractedText = manualText;
        } else {
            return res.status(400).json({ error: "Tipe input tidak valid." });
        }

        console.log("🧠 Mengirim teks ke Gemini untuk dirapikan...");
        const structuredJob = await parseJobWithAI(extractedText);

        res.status(200).json({ 
            success: true, 
            data: structuredJob 
        });

    } catch (error) {
        console.error("🔥 Error proses loker manual:", error);
        res.status(500).json({ success: false, error: "Gagal memproses lowongan kerja." });
    }
};

module.exports = { processManualJob };