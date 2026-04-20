const fs = require('fs');
const UserProfile = require('../models/UserProfile');
const { parseCVWithAI } = require('../services/aiService');

const uploadCV = async (req, res) => {
    try {
        console.log("\n=== 🚀 MULAI PROSES UPLOAD CV (VERSI DIRECT AI) ===");
        
        if (!req.file) {
            return res.status(400).json({ error: "File tidak ditemukan." });
        }
        console.log("✅ TAHAP 1: File masuk ->", req.file.path);

        const { fullName, email } = req.body;

        console.log("⏳ TAHAP 2: Mengubah file PDF menjadi Base64...");
        // Baca file PDF secara langsung dari hardisk
        const fileBuffer = fs.readFileSync(req.file.path);
        // Ubah jadi string Base64 agar bisa dikirim via API
        const base64PDF = fileBuffer.toString('base64');

        console.log("⏳ TAHAP 3: Menyuruh Gemini membaca PDF secara visual...");
        // Lempar PDF ke AI (Tidak perlu pdf-parse lagi!)
        const structuredSkills = await parseCVWithAI(base64PDF);
        console.log("✅ TAHAP 3: Gemini berhasil merangkum CV!");
        console.log(structuredSkills);

        console.log("⏳ TAHAP 4: Menyimpan ke Database...");
        const [user, created] = await UserProfile.findOrCreate({
            where: { email },
            defaults: {
                full_name: fullName,
                skills: structuredSkills,
                cv_file_url: req.file.path
            }
        });

        if (!created) {
            user.skills = structuredSkills;
            user.cv_file_url = req.file.path;
            await user.save();
        }
        
        console.log("✅ TAHAP 4: Sukses tersimpan!");
        console.log("=== 🎉 PROSES SELESAI ===\n");

        res.status(200).json({ success: true, user });

    } catch (error) {
        console.error("\n❌ ERROR DETECTED:", error.message);
        res.status(500).json({ error: error.message });
    }
};

module.exports = { uploadCV };