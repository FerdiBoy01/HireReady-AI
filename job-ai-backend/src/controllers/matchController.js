const UserProfile = require('../models/UserProfile');
const { analyzeJobMatch } = require('../services/aiService');

const checkMatch = async (req, res) => {
    try {
        const { userId, jobDescription } = req.body;

        if (!userId || !jobDescription) {
            return res.status(400).json({ error: "userId dan jobDescription wajib diisi." });
        }

        // 1. Ambil data user dari Database MySQL
        const user = await UserProfile.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: "User tidak ditemukan." });
        }

        // 2. Siapkan data profile (fokus pada skills)
        const profileData = {
            name: user.full_name,
            skills: user.skills // Diambil langsung dari kolom JSON
        };

        // 3. Kirim ke Gemini API
        const analysisResult = await analyzeJobMatch(profileData, jobDescription);

        // 4. Kembalikan hasil ke Frontend
        res.status(200).json({
            success: true,
            data: analysisResult
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = { checkMatch };