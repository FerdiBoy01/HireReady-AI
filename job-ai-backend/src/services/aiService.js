require('dotenv').config();

const rawKeys = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "";

if (!rawKeys) {
    console.error("🔥 ERROR KRITIKAL: API Key Gemini tidak ditemukan di file .env!");
}

const apiKeys = rawKeys.split(',').map(key => key.trim());
let currentKeyIndex = 0; 

// --- FITUR BARU: Fungsi untuk menghentikan kode (delay) sementara waktu ---
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fungsi Manajer Rotasi API dengan Exponential Backoff
 */
const fetchWithRotation = async (payload, contextName) => {
    let attempts = 0;
    const totalKeys = apiKeys.length;
    // Kita biarkan mencoba hingga 2x putaran penuh seluruh key
    const maxRetries = totalKeys * 2; 

    while (attempts < maxRetries) {
        const currentKey = apiKeys[currentKeyIndex];
        // Tetap menggunakan gemini-2.5-flash sesuai permintaanmu
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${currentKey}`;

        try {
            console.log(`[${contextName}] 🧠 Request via Key Index: ${currentKeyIndex + 1}/${totalKeys} | Percobaan: ${attempts + 1}`);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                // Deteksi jika Limit (429) atau Server Overload (503)
                if (response.status === 429 || response.status === 503) {
                    console.warn(`⚠️ [WARNING] API Key ke-${currentKeyIndex + 1} Limit/Sibuk (Status: ${response.status}).`);
                    
                    // --- FITUR BARU: EXPONENTIAL BACKOFF DELAY ---
                    // Hitung delay: 2 detik, lalu 4 detik, dst. (Maksimal 10 detik)
                    const delayMs = Math.min(2000 * Math.pow(2, Math.floor(attempts / totalKeys)), 10000);
                    console.log(`⏳ Menahan spam loop... Tidur selama ${delayMs / 1000} detik sebelum lanjut...`);
                    await sleep(delayMs); // Hentikan eksekusi sementara

                    // Pindah key
                    currentKeyIndex = (currentKeyIndex + 1) % totalKeys;
                    attempts++;
                    continue; 
                }
                
                throw new Error(`API Error: ${data.error?.message || response.statusText}`);
            }

            return data.candidates[0].content.parts[0].text;

        } catch (error) {
            if (attempts >= maxRetries - 1) {
                throw new Error(`Gagal total setelah ${maxRetries} percobaan. Server Google sedang down atau semua kuota key habis. Error: ${error.message}`);
            }
            console.warn(`⚠️ [WARNING] Kendala jaringan/teknis: ${error.message}`);
            
            // Beri jeda 2 detik sebelum ganti key kalau ada error jaringan
            console.log(`⏳ Delay 2 detik sebelum mencoba key lain...`);
            await sleep(2000);
            currentKeyIndex = (currentKeyIndex + 1) % totalKeys;
            attempts++;
        }
    }
};

/**
 * Fungsi 1: Menganalisis kecocokan profil user dengan Job Description
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
        const aiTextResponse = await fetchWithRotation(payload, "Job Match");
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
        const aiTextResponse = await fetchWithRotation(payload, "Parse CV");
        return JSON.parse(aiTextResponse);
    } catch (error) {
        console.error("🔥 Error Direct API (Parse CV):", error.message);
        throw new Error(`AI gagal memproses file CV: ${error.message}`);
    }
};


/**
 * Fungsi 3: Merapikan teks lowongan kerja mentah (dari teks/OCR gambar) menjadi JSON
 */
const parseJobWithAI = async (rawText) => {
    const prompt = `
Tugasmu adalah mengekstrak informasi lowongan kerja dari teks mentah berikut. 
Teks ini mungkin berasal dari hasil scan gambar (OCR) yang berantakan, typo, atau teks acak.
Rapikan dan kembalikan HANYA dalam format JSON.

FORMAT OUTPUT JSON:
{
  "company": "Nama Perusahaan (isi null jika tidak ada)",
  "title": "Posisi Pekerjaan",
  "description": "Deskripsi pekerjaan yang sudah dirapikan",
  "requirements": ["syarat 1", "syarat 2", "syarat 3"]
}

TEKS MENTAH:
"""${rawText}"""
`;

    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
    };

    try {
        // Kita panggil fungsi fetchWithRotation yang sudah kamu buat
        const aiTextResponse = await fetchWithRotation(payload, "Parse Loker Manual");
        return JSON.parse(aiTextResponse);
    } catch (error) {
        console.error("🔥 Error Direct API (Parse Loker):", error.message);
        throw new Error(`AI gagal memproses teks loker: ${error.message}`);
    }
};

// JANGAN LUPA UPDATE MODULE.EXPORTS DI PALING BAWAH FILE INI!
module.exports = { analyzeJobMatch, parseCVWithAI, parseJobWithAI };