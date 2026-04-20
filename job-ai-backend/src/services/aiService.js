require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;
// Gunakan 1.5-flash karena ini yang kuota gratis (Free Tier)-nya paling aman
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

/**
 * Fungsi 1: Menganalisis kecocokan profil user dengan Job Description via REST API
 */
const analyzeJobMatch = async (userProfile, jobDescription) => {
    const systemPrompt = `
Kamu adalah seorang AI HR Tech Analyst.
Tugas utamamu adalah menganalisis kecocokan (fit) antara Profil User dan Deskripsi Lowongan Kerja.

[PROFIL USER]:
${JSON.stringify(userProfile)}

[JOB DESCRIPTION]:
${jobDescription}

INSTRUKSI ANALISIS:
1. Identifikasi semua skill penting dari JOB DESCRIPTION.
2. Kategorikan requirement menjadi "must_have_skills" dan "nice_to_have_skills".
3. Bandingkan dengan PROFIL USER. Anggap skill yang mirip sebagai match.
4. Hitung match_score (0-100) dengan logika: 70% kecocokan must_have, 30% nice_to_have.
5. Jangan terlalu positif jika banyak kekurangan.
6. Berikan rekomendasi yang konkret (maks 3).

ATURAN OUTPUT HARUS JSON:
{
  "match_score": 0,
  "risk_level": "<low|medium|high>",
  "matched_skills": ["..."],
  "missing_skills": ["..."],
  "analysis_summary": "...",
  "recommendations": ["...", "..."]
}`;

    const payload = {
        contents: [{ parts: [{ text: systemPrompt }] }],
        generationConfig: { responseMimeType: "application/json" }
    };

    try {
        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(`API Error: ${data.error?.message || response.statusText}`);
        }

        // Mengambil teks balasan dari struktur JSON API Google
        const aiTextResponse = data.candidates[0].content.parts[0].text;
        return JSON.parse(aiTextResponse);

    } catch (error) {
        console.error("🔥 Error Direct API (Job Match):", error.message);
        throw new Error("Gagal menganalisis kecocokan pekerjaan.");
    }
};

/**
 * Fungsi 2: Mengekstrak CV (PDF) via REST API murni
 */
const parseCVWithAI = async (base64PDF) => {
    const prompt = `
Tugasmu adalah membaca file CV terlampir dan mengekstrak informasi keahlian kandidat ke dalam format JSON terstruktur.
Abaikan informasi pribadi. Fokus HANYA pada keahlian (skills dan tools).

FORMAT OUTPUT JSON:
{
  "hard_skills": ["skill_teknis_1", "skill_teknis_2"],
  "soft_skills": ["komunikasi", "kepemimpinan"],
  "tools": ["git", "vscode", "docker"]
}`;

    // Struktur payload khusus untuk mengirim File Base64 + Teks ke API Google
    const payload = {
        contents: [
            {
                parts: [
                    { text: prompt },
                    {
                        inline_data: {
                            mime_type: "application/pdf",
                            data: base64PDF
                        }
                    }
                ]
            }
        ],
        generationConfig: { responseMimeType: "application/json" }
    };

    try {
        console.log("🧠 Mengirim Request HTTP Direct ke Gemini API...");
        
        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        // Cek jika Google menolak request kita
        if (!response.ok) {
            console.error("🔥 GOOGLE API REJECTED:", data);
            throw new Error(data.error?.message || "Google API menolak request.");
        }

        const aiTextResponse = data.candidates[0].content.parts[0].text;
        return JSON.parse(aiTextResponse);

    } catch (error) {
        console.error("🔥 Error Direct API (Parse CV):", error.message);
        throw new Error(`AI gagal memproses file CV: ${error.message}`);
    }
};

module.exports = { analyzeJobMatch, parseCVWithAI };