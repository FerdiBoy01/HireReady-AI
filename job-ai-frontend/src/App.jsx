import { useState } from 'react';
import Maintenance from './components/Maintenance';
import axios from 'axios';

function App() {

 //maintenance
  const isMaintenanceMode = import.meta.env.VITE_MAINTENANCE_MODE === 'true';

  if (isMaintenanceMode) {
    return <Maintenance />;
  }
  // STATE STEP 1: CV
  const [file, setFile] = useState(null);
  const [userData, setUserData] = useState({ fullName: '', email: '' });
  const [userId, setUserId] = useState(null); 
  const [isUploading, setIsUploading] = useState(false);

  // STATE STEP 2: TABS & INPUT
  const [activeTab, setActiveTab] = useState('search'); // 'search' | 'text' | 'image'
  
  // State Search (Live)
  const [searchKeyword, setSearchKeyword] = useState('');
  const [jobs, setJobs] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // State Manual (Teks & Gambar)
  const [manualText, setManualText] = useState('');
  const [manualImage, setManualImage] = useState(null);
  const [isProcessingManual, setIsProcessingManual] = useState(false);

  // STATE HASIL AI
  const [analyzingJobId, setAnalyzingJobId] = useState(null);
  const [matchResult, setMatchResult] = useState(null);

  const handleUpload = async () => {
    if (!file || !userData.email || !userData.fullName) {
      return alert("Mohon lengkapi nama, email, dan pilih file CV (PDF).");
    }
    const formData = new FormData();
    formData.append('cv', file);
    formData.append('fullName', userData.fullName);
    formData.append('email', userData.email);

    setIsUploading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/upload-cv`, formData);
      setUserId(res.data.user.id); 
    } catch (err) {
      alert("Gagal mengunggah CV. Pastikan server backend menyala.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSearchJobs = async () => {
    if (!searchKeyword.trim()) return;
    setIsSearching(true);
    setMatchResult(null); 
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/search-jobs?query=${searchKeyword}`);
      if (res.data.success) setJobs(res.data.jobs);
    } catch (err) {
      alert("Gagal mengambil data lowongan.");
    } finally {
      setIsSearching(false);
    }
  };

  // FUNGSI BARU: Proses Gambar / Teks Manual
  const handleProcessManual = async (type) => {
    if (!userId) return alert("Silakan unggah Profil CV kamu terlebih dahulu di langkah 1!");
    
    setIsProcessingManual(true);
    setMatchResult(null);
    let extractedData = null;

    if (window.innerWidth < 1024) {
      setTimeout(() => document.getElementById('analysis-area')?.scrollIntoView({ behavior: 'smooth' }), 300);
    }

    try {
      if (type === 'text') {
        if (!manualText.trim()) return alert("Teks lowongan tidak boleh kosong!");
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/process-manual-job`, {
          type: 'text',
          manualText: manualText
        });
        extractedData = res.data.data;
      } else if (type === 'image') {
        if (!manualImage) return alert("Pilih gambar poster lowongan terlebih dahulu!");
        const formData = new FormData();
        formData.append('type', 'image');
        formData.append('file', manualImage); // field 'file' sesuai multer backend
        
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/process-manual-job`, formData);
        extractedData = res.data.data;
      }

      // Jika berhasil diekstrak, kita rakit jadi objek "Job Buatan" untuk dianalisis
      if (extractedData) {
        const mockJob = {
          id: 'manual-' + Date.now(), // ID unik buatan
          title: extractedData.title || 'Posisi Tidak Spesifik',
          company: extractedData.company || 'Perusahaan Input Manual',
          location: 'Data Manual',
          // Gabungkan deskripsi dan syarat untuk dikirim ke Gemini Matcher
          description: `Deskripsi: ${extractedData.description}\n\nPersyaratan: ${extractedData.requirements?.join(', ')}`,
          redirect_url: null // Null karena bukan dari Adzuna
        };

        // Langsung panggil fungsi pencocokan yang sudah ada!
        await handleAnalyzeJob(mockJob);
      }
    } catch (err) {
      console.error(err);
      alert("Gagal mengekstrak data manual. Pastikan server nyala dan file sesuai.");
    } finally {
      setIsProcessingManual(false);
    }
  };

  const handleAnalyzeJob = async (job) => {
    if (!userId) return alert("Silakan unggah Profil CV kamu terlebih dahulu di langkah 1!");

    setAnalyzingJobId(job.id);
    if (job.id.toString().startsWith('manual-')) {
       // Jangan reset setMatchResult kalau ini dipanggil dari handleProcessManual, 
       // karena biar animasinya mulus
    } else {
       setMatchResult(null);
    }

    if (window.innerWidth < 1024 && !job.id.toString().startsWith('manual-')) {
      setTimeout(() => document.getElementById('analysis-area')?.scrollIntoView({ behavior: 'smooth' }), 300);
    }

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/analyze-match`, {
        userId: userId,
        jobDescription: job.description 
      });
      
      setMatchResult({
        jobDetails: job,
        analysis: res.data.data
      });
    } catch (err) {
      alert("Terjadi kesalahan saat AI menganalisis kecocokan.");
    } finally {
      setAnalyzingJobId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-800 selection:bg-indigo-100 selection:text-indigo-900 pb-12">
      
      {/* NAVBAR */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-to-br from-indigo-600 to-blue-500 text-white p-2 rounded-lg shadow-md shadow-indigo-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
            </div>
            <span className="text-xl font-black tracking-tight text-slate-800">HireReady<span className="text-indigo-600">.AI</span></span>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs font-medium">
            {userId ? (
              <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> CV Aktif
              </span>
            ) : (
              <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full border border-slate-200">
                Menunggu CV...
              </span>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-8">
        
        {/* HERO SECTION */}
        <div className="max-w-3xl mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 mb-2">Asisten Karir AI Pribadimu</h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            HireReady.AI menggunakan kecerdasan buatan untuk menganalisis kesesuaian antara <strong className="text-slate-700">Keahlian (CV)</strong> Anda dengan <strong className="text-slate-700">Lowongan Pekerjaan Global</strong> secara *real-time*.
          </p>
        </div>

        {/* GRID LAYOUT UTAMA */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* ================= PANEL KIRI (INPUT & LIST) ================= */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* STEP 1: UPLOAD CV */}
            <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
              <h2 className="text-base font-extrabold mb-4 flex items-center gap-2.5 text-slate-800">
                <span className="bg-indigo-50 text-indigo-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                Data Kandidat
              </h2>
              
              {!userId ? (
                <div className="space-y-3 relative z-10">
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="Nama Lengkap" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm" onChange={(e) => setUserData({...userData, fullName: e.target.value})} />
                    <input type="email" placeholder="Email Aktif" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm" onChange={(e) => setUserData({...userData, email: e.target.value})} />
                  </div>
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-2 bg-slate-50 hover:bg-indigo-50/50 hover:border-indigo-300 transition-all relative">
                    <input type="file" accept=".pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => setFile(e.target.files[0])} />
                    <div className="flex items-center justify-center gap-2 p-1.5 pointer-events-none">
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                      <span className="text-xs font-medium text-slate-500">{file ? file.name : "Pilih file PDF CV"}</span>
                    </div>
                  </div>
                  <button onClick={handleUpload} disabled={isUploading} className="w-full bg-slate-900 text-white p-2.5 rounded-lg text-sm font-bold hover:bg-indigo-600 transition-all disabled:bg-slate-300 flex justify-center items-center gap-2">
                    {isUploading ? "Mengekstrak Skill..." : "Simpan Profil & Ekstrak AI"}
                  </button>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm">✓</div>
                  <div>
                    <h3 className="font-bold text-emerald-800 text-xs">Profil Tersimpan</h3>
                    <p className="text-[11px] text-emerald-600/80">AI siap mencocokkan datamu dengan lowongan.</p>
                  </div>
                </div>
              )}
            </section>

            {/* STEP 2: MULTI-INPUT LOKER */}
            <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
               <h2 className="text-base font-extrabold mb-4 flex items-center gap-2.5 text-slate-800">
                <span className="bg-blue-50 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                Pilih Lowongan
              </h2>

              {/* TABS NAVIGATION */}
              <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
                 <button onClick={() => setActiveTab('search')} className={`flex-1 text-[11px] sm:text-xs font-bold py-2 rounded-md transition-all ${activeTab === 'search' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>🔍 Cari Live</button>
                 <button onClick={() => setActiveTab('text')} className={`flex-1 text-[11px] sm:text-xs font-bold py-2 rounded-md transition-all ${activeTab === 'text' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>📝 Copas Teks</button>
                 <button onClick={() => setActiveTab('image')} className={`flex-1 text-[11px] sm:text-xs font-bold py-2 rounded-md transition-all ${activeTab === 'image' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>📸 Foto Poster</button>
              </div>

              {/* TAB CONTENT: SEARCH */}
              {activeTab === 'search' && (
                <div>
                  <div className="relative mb-4">
                    <input type="text" placeholder="Ketik posisi (ex: Frontend, Data...)" 
                      className="w-full p-2.5 pl-10 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                      value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearchJobs()} />
                    <svg className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    <button onClick={handleSearchJobs} disabled={isSearching} className="absolute right-1.5 top-1.5 bottom-1.5 bg-blue-600 text-white px-4 rounded-md text-xs font-bold hover:bg-blue-700 transition-all">
                      Cari
                    </button>
                  </div>
                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                    {jobs.length === 0 && !isSearching && (
                      <div className="text-center py-6 opacity-60"><p className="text-xs font-medium text-slate-500">Mulai ketik untuk mencari di Adzuna</p></div>
                    )}
                    {jobs.map((job) => (
                      <div key={job.id} onClick={() => !analyzingJobId && handleAnalyzeJob(job)} 
                           className={`group border p-3.5 rounded-xl transition-all cursor-pointer relative overflow-hidden
                           ${analyzingJobId === job.id || matchResult?.jobDetails.id === job.id ? 'border-indigo-400 bg-indigo-50/40 ring-2 ring-indigo-50' : 'border-slate-200 bg-white hover:border-indigo-200 hover:shadow-sm'}`}>
                        {analyzingJobId === job.id && <div className="absolute bottom-0 left-0 h-1 bg-indigo-500 scan-line"></div>}
                        <h3 className="text-sm font-extrabold text-slate-800 leading-tight mb-1 group-hover:text-indigo-600">{job.title}</h3>
                        <p className="text-[11px] font-bold tracking-wide text-slate-500 uppercase">{job.company}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB CONTENT: TEXT */}
              {activeTab === 'text' && (
                <div className="animate-fade-in space-y-3">
                   <textarea 
                      placeholder="Paste deskripsi lowongan kerja di sini dari LinkedIn, WA, dll..." 
                      className="w-full h-40 p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/50 text-sm resize-none"
                      value={manualText} onChange={(e) => setManualText(e.target.value)}
                   ></textarea>
                   <button onClick={() => handleProcessManual('text')} disabled={isProcessingManual} className="w-full bg-blue-600 text-white p-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 transition-all disabled:bg-slate-300">
                     {isProcessingManual ? "AI Sedang Membaca..." : "Ekstrak & Analisis Teks"}
                   </button>
                </div>
              )}

              {/* TAB CONTENT: IMAGE */}
              {activeTab === 'image' && (
                <div className="animate-fade-in space-y-3">
                   <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 bg-slate-50 hover:bg-blue-50/50 hover:border-blue-300 transition-all relative flex flex-col items-center justify-center text-center h-40">
                    <input type="file" accept="image/jpeg, image/png, image/jpg" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => setManualImage(e.target.files[0])} />
                    <svg className="w-8 h-8 text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    <span className="text-xs font-bold text-slate-600">{manualImage ? manualImage.name : "Klik / Drag Poster Loker (JPG/PNG)"}</span>
                    {!manualImage && <span className="text-[10px] text-slate-400 mt-1">AI akan mengekstrak teks otomatis via OCR</span>}
                  </div>
                   <button onClick={() => handleProcessManual('image')} disabled={isProcessingManual} className="w-full bg-blue-600 text-white p-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 transition-all disabled:bg-slate-300">
                     {isProcessingManual ? "Memproses Gambar..." : "Scan Poster & Analisis"}
                   </button>
                </div>
              )}
            </section>
          </div>

          {/* ================= PANEL KANAN (HASIL AI) ================= */}
          <div className="lg:col-span-7 sticky top-24" id="analysis-area">
            
            {/* STATE 1: KOSONG */}
            {!matchResult && !analyzingJobId && !isProcessingManual && (
              <div className="bg-white border border-slate-200/60 rounded-3xl p-8 text-center min-h-[480px] flex flex-col items-center justify-center shadow-sm">
                 <div className="w-16 h-16 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-full flex items-center justify-center mb-4 border border-indigo-100">
                    <span className="text-2xl filter drop-shadow-sm">✨</span>
                 </div>
                 <h2 className="text-lg font-extrabold text-slate-800 mb-2">Studio Analisis AI</h2>
                 <p className="text-slate-500 text-xs max-w-xs leading-relaxed">Pilih loker, paste teks, atau upload poster. Biarkan agen cerdas kami menghitung persentase kecocokanmu.</p>
              </div>
            )}

            {/* STATE 2: LOADING ANIMATION */}
            {(analyzingJobId || isProcessingManual) && !matchResult && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center min-h-[480px] flex flex-col items-center justify-center shadow-lg relative overflow-hidden">
                 <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]"></div>
                 </div>
                 <div className="relative w-24 h-24 mb-6 z-10">
                    <div className="absolute inset-0 border-[3px] border-slate-700 rounded-full"></div>
                    <div className="absolute inset-0 border-[3px] border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
                    <div className="absolute inset-2 border-[3px] border-blue-400 rounded-full border-b-transparent animate-[spin_1.5s_linear_infinite_reverse]"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-3xl animate-pulse">🧠</div>
                 </div>
                 <h2 className="text-lg font-black text-white mb-2 z-10">
                   {isProcessingManual ? "Mengekstrak Data Manual..." : "Menganalisis Parameter..."}
                 </h2>
                 <p className="text-indigo-200 text-xs animate-pulse z-10 max-w-[250px] mx-auto">
                   {isProcessingManual ? "AI sedang membaca teks atau poster loker yang kamu masukkan." : "Membaca syarat pekerjaan dan mencocokannya dengan data CV-mu."}
                 </p>
              </div>
            )}

            {/* STATE 3: HASIL */}
            {matchResult && (
              <div className="bg-white rounded-3xl shadow-lg overflow-hidden animate-fade-in border border-slate-200">
                <div className="bg-slate-900 p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500 rounded-full filter blur-[60px] opacity-20 -translate-y-1/2 translate-x-1/3"></div>
                  <p className="text-indigo-400 text-[9px] font-black uppercase tracking-widest mb-1.5 relative z-10">Laporan Kecocokan</p>
                  <h2 className="text-xl font-black text-white leading-tight relative z-10 pr-8">{matchResult.jobDetails.title}</h2>
                  <div className="mt-2 relative z-10">
                    <span className="px-2 py-0.5 bg-white/10 rounded text-[11px] text-white font-semibold">{matchResult.jobDetails.company}</span>
                  </div>
                </div>

                <div className="p-6">
                  {/* Skor & Risk (Compact) */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center">
                       <p className="text-[9px] text-slate-400 font-black tracking-widest mb-1">MATCH SCORE</p>
                       <p className="text-4xl font-black text-slate-800 tracking-tight">{matchResult.analysis.match_score}<span className="text-xl text-indigo-500 ml-0.5">%</span></p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-center items-center text-center">
                       <p className="text-[9px] text-slate-400 font-black tracking-widest mb-2">TINGKAT RISIKO</p>
                       <span className={`inline-block px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-widest
                          ${matchResult.analysis.risk_level === 'low' ? 'bg-emerald-100 text-emerald-700' : 
                            matchResult.analysis.risk_level === 'medium' ? 'bg-amber-100 text-amber-700' : 
                            'bg-rose-100 text-rose-700'}`}>
                          {matchResult.analysis.risk_level}
                        </span>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="mb-6 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-indigo-600 text-sm">💡</span>
                      <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide">Pandangan AI</h3>
                    </div>
                    <p className="text-slate-600 text-xs leading-relaxed font-medium">"{matchResult.analysis.analysis_summary}"</p>
                  </div>

                  {/* Skills Mapping */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div>
                      <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Matched Skills
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {matchResult.analysis.matched_skills.map((s, i) => (
                          <span key={i} className="bg-white border border-emerald-200 text-emerald-700 px-2 py-1 rounded-lg text-[10px] font-bold">{s}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Missing Skills
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {matchResult.analysis.missing_skills.map((s, i) => (
                          <span key={i} className="bg-slate-50 border border-slate-200 text-slate-500 px-2 py-1 rounded-lg text-[10px] font-bold">{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Rekomendasi */}
                  <div className="mb-6">
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Saran AI</h4>
                     <ul className="space-y-2">
                        {matchResult.analysis.recommendations.map((r, i) => (
                          <li key={i} className="flex items-start text-xs font-medium text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            <span className="text-indigo-500 mr-2 leading-none">•</span> {r}
                          </li>
                        ))}
                      </ul>
                  </div>
                  
                  {/* Action - Sembunyikan tombol "Lamar via Adzuna" jika data dari input manual */}
                  {matchResult.jobDetails.redirect_url && (
                    <a href={matchResult.jobDetails.redirect_url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full bg-slate-900 hover:bg-indigo-600 text-white text-sm font-bold py-3 rounded-xl transition-all duration-300 shadow-md">
                      Lamar via Adzuna <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        
        .animate-fade-in { animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        .scan-line { animation: scan 1.5s ease-in-out infinite; }
        @keyframes scan {
          0% { width: 0%; opacity: 1; }
          50% { width: 100%; opacity: 0.4; }
          100% { width: 0%; opacity: 1; right: 0; left: auto; }
        }
      `}} />
    </div>
  );
}

export default App;