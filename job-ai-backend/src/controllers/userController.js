const UserProfile = require('../models/UserProfile');
const { parseCVWithAI } = require('../services/aiService');
const { uploadToAzure } = require('../services/azureService');

const uploadCV = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "File tidak ditemukan." });

        const { fullName, email } = req.body;

        // TAHAP 1: Unggah ke Azure Cloud
        const azureUrl = await uploadToAzure(req.file);

        // TAHAP 2: Proses AI (Tetap menggunakan buffer dari memori)
        const base64PDF = req.file.buffer.toString('base64');
        const structuredSkills = await parseCVWithAI(base64PDF);

        // TAHAP 3: Simpan URL Azure ke Database
        const [user, created] = await UserProfile.findOrCreate({
            where: { email },
            defaults: {
                full_name: fullName,
                skills: structuredSkills,
                cv_file_url: azureUrl // Simpan URL Azure, bukan path lokal
            }
        });

        if (!created) {
            user.skills = structuredSkills;
            user.cv_file_url = azureUrl;
            await user.save();
        }

        res.status(200).json({ success: true, user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { uploadCV };