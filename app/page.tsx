"use client";

import { useState, useEffect } from "react";

interface Project {
  id: string;
  name: string;
  date: string;
  previewHtml: string;
}

export default function Home() {
  const [currentView, setCurrentView] = useState<"landing" | "list" | "wizard">("landing");
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);
  const [currentProjectName, setCurrentProjectName] = useState("Nowy Projekt Profe Studio");
  const [menuOpen, setMenuOpen] = useState(false);
  
  // SYSTEM MOTYWÓW
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedProjects = localStorage.getItem("profeProjects");
    if (savedProjects) setProjects(JSON.parse(savedProjects));
    
    const savedTheme = localStorage.getItem("profeTheme");
    if (savedTheme === "dark") setDarkMode(true);
  }, []);

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("profeTheme", newMode ? "dark" : "light");
  };

  const saveProject = () => {
    const newProject: Project = {
      id: Date.now().toString(),
      name: currentProjectName,
      date: new Date().toLocaleDateString(),
      previewHtml: "<div class='p-4'>Podgląd wizualny...</div>"
    };
    const updated = [...projects, newProject];
    setProjects(updated);
    localStorage.setItem("profeProjects", JSON.stringify(updated));
    alert("Projekt zapisany pomyślnie!");
  };

  const deleteProject = (id: string) => {
    const updated = projects.filter(p => p.id !== id);
    setProjects(updated);
    localStorage.setItem("profeProjects", JSON.stringify(updated));
  };

  // --- WIDOK 1: EKRAN POWITALNY ---
  if (currentView === "landing") {
    return (
      <div className={`${darkMode ? "dark" : ""}`}>
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col items-center justify-center font-sans transition-colors duration-300">
          <div className="absolute top-8 text-center w-full">
            <h1 className="text-4xl font-black tracking-tighter text-gray-900 dark:text-white uppercase">
              Profe<span className="text-blue-600">Architect</span> OS
            </h1>
            <p className="text-sm font-bold tracking-widest text-gray-400 uppercase mt-2">Enterprise Deployment System</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-8 items-center justify-center w-full max-w-5xl px-6">
            <button 
              onClick={() => { setActiveStep(1); setCurrentView("wizard"); }}
              className="w-full sm:w-1/2 bg-red-600 hover:bg-red-700 text-white py-20 rounded-[2.5rem] shadow-2xl hover:shadow-red-500/40 transition-all duration-500 hover:-translate-y-3 group flex flex-col items-center"
            >
              <svg className="w-20 h-20 mb-6 group-hover:scale-110 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
              <span className="text-4xl font-black uppercase tracking-tight">Nowy Projekt</span>
              <span className="mt-3 text-red-100 font-bold opacity-80 uppercase text-xs tracking-widest">Start 4-Step Wizard</span>
            </button>

            <button 
              onClick={() => setCurrentView("list")}
              className="w-full sm:w-1/2 bg-gray-900 dark:bg-slate-800 hover:bg-black dark:hover:bg-slate-700 text-white py-20 rounded-[2.5rem] shadow-2xl hover:shadow-gray-900/40 transition-all duration-500 hover:-translate-y-3 group flex flex-col items-center"
            >
              <svg className="w-20 h-20 mb-6 group-hover:scale-110 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              <span className="text-4xl font-black uppercase tracking-tight">Wszystkie Projekty</span>
              <span className="mt-3 text-gray-400 font-bold uppercase text-xs tracking-widest">Database & Archive</span>
            </button>
          </div>

          <button onClick={toggleTheme} className="fixed bottom-8 right-8 p-4 bg-white dark:bg-slate-800 rounded-full shadow-xl border border-gray-100 dark:border-slate-700 text-gray-800 dark:text-white">
            {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>
        </div>
      </div>
    );
  }

  // --- SZKIELET DLA LISTY I WIZARDA (Z PAZKIEM MENU) ---
  return (
    <div className={`${darkMode ? "dark" : ""}`}>
      <div className="flex flex-col h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-200 overflow-hidden font-sans text-sm transition-colors duration-300">
        
        {/* TOP NAVIGATION BAR */}
        <nav className="h-16 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 z-50 shadow-sm transition-colors duration-300">
          <div className="flex items-center space-x-10">
            <span className="text-xl font-black tracking-tighter cursor-pointer dark:text-white" onClick={() => setCurrentView("landing")}>
              Profe<span className="text-blue-600">Architect</span>
            </span>
            
            <div className="relative">
              <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white font-bold transition-all uppercase text-[11px] tracking-widest">
                Projekty <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
              </button>
              {menuOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden py-2 border border-gray-100 dark:border-slate-700 z-[100]">
                  <button onClick={() => { setActiveStep(1); setCurrentView("wizard"); setMenuOpen(false); }} className="w-full text-left px-5 py-3 hover:bg-gray-50 dark:hover:bg-slate-700 font-bold text-xs uppercase text-red-600">Nowy projekt</button>
                  <button onClick={() => { setCurrentView("list"); setMenuOpen(false); }} className="w-full text-left px-5 py-3 hover:bg-gray-50 dark:hover:bg-slate-700 font-bold text-xs uppercase text-gray-700 dark:text-white">Wszystkie projekty</button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <button onClick={toggleTheme} className="p-2 text-gray-500 hover:text-blue-600 transition-colors">
              {darkMode ? "☀️" : "🌙"}
            </button>
            {currentView === "wizard" && (
              <>
                <input 
                  type="text" 
                  value={currentProjectName}
                  onChange={(e) => setCurrentProjectName(e.target.value)}
                  className="bg-gray-100 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-500 w-64 dark:text-white"
                />
                <button onClick={saveProject} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition shadow-lg shadow-blue-500/20">Zapisz Projekt</button>
              </>
            )}
          </div>
        </nav>

        {/* --- CONTENT: LISTA PROJEKTÓW --- */}
        {currentView === "list" && (
          <div className="flex-1 overflow-y-auto p-12">
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-between items-end mb-12">
                <div>
                  <h2 className="text-4xl font-black dark:text-white tracking-tighter">Archiwum Projektów</h2>
                  <p className="text-gray-500 mt-2 font-medium">Zarządzaj swoją bazą wiedzy i wdrożeń.</p>
                </div>
                <button onClick={() => { setActiveStep(1); setCurrentView("wizard"); }} className="bg-red-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 shadow-xl shadow-red-500/20 transition-all">Nowy Projekt</button>
              </div>

              {projects.length === 0 ? (
                <div className="py-32 bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-slate-800 text-center text-gray-400">
                  <p className="text-xl font-bold italic">Baza projektów jest pusta.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                  {projects.map(p => (
                    <div key={p.id} className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border border-gray-100 dark:border-slate-800 overflow-hidden flex flex-col group hover:-translate-y-2 transition-all duration-500">
                      <div className="h-48 bg-gray-100 dark:bg-slate-800 flex items-center justify-center border-b border-gray-100 dark:border-slate-800">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Visual Snapshot</span>
                      </div>
                      <div className="p-8">
                        <h3 className="text-xl font-black dark:text-white mb-1 uppercase tracking-tight">{p.name}</h3>
                        <p className="text-[10px] font-bold text-blue-600 uppercase mb-6 tracking-widest">{p.date}</p>
                        <div className="grid grid-cols-2 gap-3">
                          <button onClick={() => { setCurrentProjectName(p.name); setCurrentView("wizard"); }} className="bg-slate-900 dark:bg-slate-700 text-white text-[10px] font-black uppercase py-3 rounded-xl hover:bg-black transition">Edytuj</button>
                          <button className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 text-[10px] font-black uppercase py-3 rounded-xl hover:bg-blue-100 transition">Pobierz</button>
                          <button onClick={() => deleteProject(p.id)} className="col-span-2 text-[10px] font-bold text-red-500 uppercase py-2 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition">Usuń Projekt</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- CONTENT: WIZARD 4-ETAPOWY --- */}
        {currentView === "wizard" && (
          <>
            {/* Stepper */}
            <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-8 py-6 flex justify-between items-center shrink-0">
              <div className="flex space-x-4 w-full max-w-5xl">
                {[
                  { step: 1, name: "Struktura", desc: "Strategia & Copy" },
                  { step: 2, name: "Visual", desc: "UI/UX & Design" },
                  { step: 3, name: "Optimization", desc: "SEO & AI" },
                  { step: 4, name: "Deployment", desc: "Joomla & Handoff" }
                ].map((s) => (
                  <div key={s.step} onClick={() => setActiveStep(s.step as any)} className={`flex-1 p-4 rounded-2xl border-2 transition-all cursor-pointer ${activeStep === s.step ? "border-blue-600 bg-blue-50 dark:bg-blue-900/10" : "border-gray-50 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700"}`}>
                    <div className={`text-[10px] font-black uppercase tracking-widest ${activeStep === s.step ? "text-blue-600" : "text-gray-400"}`}>Etap 0{s.step}</div>
                    <div className={`font-black mt-1 uppercase ${activeStep === s.step ? "text-slate-900 dark:text-white" : "text-gray-500"}`}>{s.name}</div>
                  </div>
                ))}
              </div>
              <div className="ml-8 flex space-x-4">
                <button onClick={() => setActiveStep((activeStep + 1) as any)} disabled={activeStep === 4} className="bg-black dark:bg-white dark:text-black text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl disabled:opacity-20">
                  Następny Krok
                </button>
              </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 flex overflow-hidden">
              <div className="w-[450px] bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col shrink-0">
                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-b border-gray-100 dark:border-slate-800">
                  <h3 className="font-black uppercase tracking-tighter text-lg dark:text-white">Expert System V11</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Etap {activeStep}: Aktywne dokumenty</p>
                </div>
                <div className="flex-1 p-6 overflow-y-auto space-y-2 text-[11px] font-bold uppercase tracking-tight text-gray-500">
                  {/* Lista dokumentów w zależności od etapu */}
                  {activeStep === 1 && ["Dokument 1: Strategia", "Dokument 9: Copy Handoff", "Dokument 10: Premium Polish", "Dokument 12: Asset Plan"].map(d => <div key={d} className="p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">{d}</div>)}
                  {activeStep === 4 && ["Dokument 2: SPPB Layout", "Dokument 3: Excel Matrix", "Dokument 7: Master Handoff", "Dokument 13: QA Checklist"].map(d => <div key={d} className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 rounded-xl border border-blue-100 dark:border-blue-800/50">{d}</div>)}
                </div>
                <div className="p-6 border-t border-gray-100 dark:border-slate-800">
                  <textarea className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" rows={4} placeholder="Wytyczne dla Eksperta..."></textarea>
                  <button className="w-full mt-4 bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 transition uppercase tracking-[0.2em] text-[10px]">Generuj Operacyjnie</button>
                </div>
              </div>
              <div className="flex-1 bg-gray-100 dark:bg-slate-950 p-10 overflow-y-auto">
                <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl min-h-full p-12 flex items-center justify-center border border-gray-100 dark:border-slate-800">
                   <p className="text-gray-400 font-black italic text-xl uppercase tracking-tighter opacity-20">Analiza Etapu 0{activeStep}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}