import React from 'react';

const Maintenance = () => {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4 selection:bg-indigo-100 selection:text-indigo-900">
      <div className="bg-white p-8 sm:p-12 rounded-3xl shadow-xl border border-slate-200/60 max-w-lg w-full text-center relative overflow-hidden">
        {/* Dekorasi Background */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-500"></div>
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-50 rounded-full blur-3xl opacity-60"></div>
        
        {/* Icon Gear Berputar */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 bg-indigo-100 rounded-full animate-pulse"></div>
          <div className="absolute inset-0 flex items-center justify-center text-indigo-600 animate-[spin_4s_linear_infinite]">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
          </div>
        </div>

        {/* Teks Konten */}
        <h1 className="text-2xl sm:text-3xl font-black text-slate-800 mb-4 tracking-tight">
          Sistem Sedang Diperbarui
        </h1>
        <p className="text-slate-500 text-sm leading-relaxed mb-8 font-medium">
          Kami sedang melakukan peningkatan pada AI dan server <span className="font-bold text-indigo-600">HireReady.AI</span> untuk memberikan hasil analisis kecocokan yang lebih akurat. Silakan kembali beberapa saat lagi.
        </p>

        {/* Status Indikator */}
        <div className="inline-flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-full border border-amber-200">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          </span>
          <span className="text-xs font-bold text-amber-700 tracking-wide uppercase">Maintenance Mode Aktif</span>
        </div>
      </div>
    </div>
  );
};

export default Maintenance;