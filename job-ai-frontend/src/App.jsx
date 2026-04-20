import { useState } from 'react';
import axios from 'axios';

function App() {
  // State untuk Profil/Upload
  const [file, setFile] = useState(null);
  const [userData, setUserData] = useState({ fullName: '', email: '' });
  const [userId, setUserId] = useState(null); // Disimpan setelah upload sukses
  const [isUploading, setIsUploading] = useState(false);

  // State untuk Matching AI
  const [jobDesc, setJobDesc] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [matchResult, setMatchResult] = useState(null);

  // Fungsi 1: Handle Upload CV
  const handleUpload = async () => {
    if (!file || !userData.email || !userData.fullName) {
      return alert("Silakan lengkapi nama, email, dan pilih file CV (PDF).");
    }

    const formData = new FormData();
    formData.append('cv', file);
    formData.append('fullName', userData.fullName);
    formData.append('email', userData.email);

    setIsUploading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/upload-cv', formData);
      setUserId(res.data.user.id); // Simpan ID user dari database
      alert("Profil berhasil dibuat! AI telah mengekstrak skill dari CV-mu.");
    } catch (err) {
      alert("Gagal mengunggah CV. Pastikan file adalah PDF.");
    } finally {
      setIsUploading(false);
    }
  };

  // Fungsi 2: Handle Cek Kecocokan
  const handleAnalyze = async () => {
    if (!userId) return alert("Silakan upload CV kamu terlebih dahulu!");
    if (!jobDesc.trim()) return alert("Masukkan deskripsi lowongan kerja!");

    setIsAnalyzing(true);
    try {
      const res = await axios.post('http://localhost:5000/api/analyze-match', {
        userId: userId,
        jobDescription: jobDesc
      });
      setMatchResult(res.data.data);
    } catch (err) {
      alert("Terjadi kesalahan saat menganalisis kecocokan.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12 font-sans text-gray-800">
      <header className="max-w-6xl mx-auto mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-blue-700">JobFit AI Analyst</h1>
        <p className="text-gray-500 mt-2">Ukur kecocokan karirmu menggunakan kekuatan Artificial Intelligence.</p>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* BAGIAN KIRI: PROFIL & UPLOAD */}
        <section className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center mr-2 text-sm">1</span>
              Lengkapi Profil Kamu
            </h2>
            <div className="space-y-4">
              <input 
                type="text" placeholder="Nama Lengkap" 
                className="w-full p-3 border rounded-lg outline-none focus:border-blue-500"
                onChange={(e) => setUserData({...userData, fullName: e.target.value})}
              />
              <input 
                type="email" placeholder="Email Aktif" 
                className="w-full p-3 border rounded-lg outline-none focus:border-blue-500"
                onChange={(e) => setUserData({...userData, email: e.target.value})}
              />
              <div className="border-2 border-dashed border-gray-200 p-4 rounded-lg text-center bg-gray-50">
                <input 
                  type="file" accept=".pdf" 
                  className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                  onChange={(e) => setFile(e.target.files[0])}
                />
                <p className="text-xs text-gray-400 mt-2">Hanya menerima file format .PDF</p>
              </div>
              <button 
                onClick={handleUpload}
                disabled={isUploading || !!userId}
                className={`w-full py-3 rounded-xl font-bold transition-all ${userId ? 'bg-green-100 text-green-600' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'}`}
              >
                {isUploading ? "AI Sedang Membaca CV..." : userId ? "✓ Profil Tersimpan" : "Upload & Proses CV"}
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center mr-2 text-sm">2</span>
              Detail Lowongan
            </h2>
            <textarea
              className="w-full h-48 p-4 border rounded-xl outline-none focus:border-blue-500 resize-none"
              placeholder="Tempel (paste) deskripsi pekerjaan atau syarat lowongan di sini..."
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
            ></textarea>
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full mt-4 bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
            >
              {isAnalyzing ? "Menganalisis Kecocokan..." : "Cek Skor Kecocokan"}
            </button>
          </div>
        </section>

        {/* BAGIAN KANAN: HASIL ANALISIS */}
        <section className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 min-h-[400px]">
          <h2 className="text-2xl font-bold mb-6">Hasil Analisis AI</h2>
          
          {!matchResult && !isAnalyzing && (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
               <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-3xl">🤖</div>
               <p>Belum ada data untuk dianalisis.<br/>Silakan upload CV dan masukkan lowongan.</p>
            </div>
          )}

          {isAnalyzing && (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-blue-600 font-medium">AI sedang membandingkan skill kamu...</p>
            </div>
          )}

          {matchResult && !isAnalyzing && (
            <div className="animate-in fade-in duration-500">
              <div className="flex items-center justify-between mb-8 pb-6 border-b">
                <div>
                  <p className="text-sm uppercase tracking-wider text-gray-500 font-semibold">Match Score</p>
                  <p className="text-5xl font-black text-blue-600">{matchResult.match_score}%</p>
                </div>
                <div className="text-right">
                  <p className="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-1">Risk Level</p>
                  <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest
                    ${matchResult.risk_level === 'low' ? 'bg-green-100 text-green-700' : 
                      matchResult.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-700' : 
                      'bg-red-100 text-red-700'}`}>
                    {matchResult.risk_level}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-bold text-gray-800 mb-2">Kesimpulan Analisis:</h3>
                <p className="text-gray-600 leading-relaxed text-sm italic">"{matchResult.analysis_summary}"</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-green-50 p-4 rounded-xl">
                  <h4 className="text-xs font-bold text-green-700 uppercase mb-3">Matched Skills ✓</h4>
                  <div className="flex flex-wrap gap-2">
                    {matchResult.matched_skills.map((s, i) => (
                      <span key={i} className="bg-white px-2 py-1 rounded-md text-xs border border-green-200">{s}</span>
                    ))}
                  </div>
                </div>
                <div className="bg-red-50 p-4 rounded-xl">
                  <h4 className="text-xs font-bold text-red-700 uppercase mb-3">Missing Skills ✕</h4>
                  <div className="flex flex-wrap gap-2">
                    {matchResult.missing_skills.map((s, i) => (
                      <span key={i} className="bg-white px-2 py-1 rounded-md text-xs border border-red-200">{s}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 p-5 rounded-xl text-white">
                <h4 className="text-sm font-bold text-blue-400 mb-3">Rekomendasi Karir:</h4>
                <ul className="space-y-3 text-sm">
                  {matchResult.recommendations.map((r, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-blue-500 mr-2">•</span> {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;