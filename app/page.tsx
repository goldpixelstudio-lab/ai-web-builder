"use client";

import { useState, useEffect } from "react";

// Definicja struktury projektu
interface Project {
  id: string;
  name: string;
  date: string;
  previewHtml: string;
}

export default function Home() {
  // Stan nawigacji: 'landing', 'list', 'wizard'
  const [currentView, setCurrentView] = useState<"landing" | "list" | "wizard">("landing");
  
  // Stan projektów i kreatora
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);
  const [currentProjectName, setCurrentProjectName] = useState("Nowy Projekt Profe Studio");
  const [menuOpen, setMenuOpen] = useState(false);

  // Wczytywanie projektów z pamięci przeglądarki przy starcie
  useEffect(() => {
    const saved = localStorage.getItem("profeProjects");
    if (saved) setProjects(JSON.parse(saved));
  }, []);

  // Funkcja zapisu projektu
  const saveProject = () => {
    const newProject: Project = {
      id: Date.now().toString(),
      name: currentProjectName,
      date: new Date().toLocaleDateString(),
      previewHtml: "<div class='p-4 bg-gray-100'>Zapisany podgląd projektu...</div>" // Tu docelowo wpadnie kod HTML z etapu 2
    };
    const updated = [...projects, newProject];
    setProjects(updated);
    localStorage.setItem("profeProjects", JSON.stringify(updated));
    alert("Projekt został zapisany!");
  };

  const deleteProject = (id: string) => {
    const updated = projects.filter(p => p.id !== id);
    setProjects(updated);
    localStorage.setItem("profeProjects", JSON.stringify(updated));
  };

  // --- WIDOK 1: EKRAN POWITALNY (LANDING PAGE) ---
  if (currentView === "landing") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-sans">
        <div className="absolute top-8 text-center w-full">
          <h1 className="text-4xl font-black tracking-tighter text-gray-900 uppercase">Profe<span className="text-blue-600">Architect</span> OS</h1>
          <p className="text-sm font-bold tracking-widest text-gray-400 uppercase mt-2">Enterprise Deployment System</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-6 items-center justify-center w-full max-w-4xl px-4">
          <button 
            onClick={() => { setActiveStep(1); setCurrentView("wizard"); }}
            className="w-full sm:w-1/2 bg-red-600 hover:bg-red-700 text-white py-16 rounded-3xl shadow-2xl hover:shadow-red-500/30 transition-all duration-300 hover:-translate-y-2 group relative overflow-hidden flex flex-col items-center"
          >
            <svg className="w-16 h-16 mb-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
            <span className="text-3xl font-black uppercase tracking-tight">Nowy Projekt</span>
            <span className="mt-2 text-red-200 font-medium">Uruchom 4-etapowy kreator</span>
          </button>

          <button 
            onClick={() => setCurrentView("list")}
            className="w-full sm:w-1/2 bg-gray-900 hover:bg-black text-white py-16 rounded-3xl shadow-2xl hover:shadow-gray-900/30 transition-all duration-300 hover:-translate-y-2 group relative overflow-hidden flex flex-col items-center"
          >
            <svg className="w-16 h-16 mb-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            <span className="text-3xl font-black uppercase tracking-tight">Wszystkie Projekty</span>
            <span className="mt-2 text-gray-400 font-medium">Zarządzaj i edytuj</span>
          </button>
        </div>
      </div>
    );
  }

  // --- WIDOK 2: LISTA PROJEKTÓW ---
  if (currentView === "list") {
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        {/* Pasek Nawigacji */}
        <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
          <h2 className="text-xl font-black tracking-tight cursor-pointer" onClick={() => setCurrentView("landing")}>Profe<span className="text-blue-600">Architect</span></h2>
          <button onClick={() => { setActiveStep(1); setCurrentView("wizard"); }} className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-red-700">Utwórz Nowy</button>
        </nav>

        <div className="max-w-7xl mx-auto py-12 px-6">
          <h2 className="text-3xl font-black mb-8">Twoje Projekty</h2>
          {projects.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300 text-gray-500">Brak projektów. Rozpocznij tworzenie nowego.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {projects.map(p => (
                <div key={p.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden flex flex-col">
                  <div className="h-48 bg-gray-200 relative">
                    {/* Tutaj docelowo renderowany podgląd iframe */}
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 font-bold uppercase tracking-widest text-xs">Podgląd Wizualny</div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{p.name}</h3>
                    <p className="text-xs text-gray-400 mb-6">Ostatnia modyfikacja: {p.date}</p>
                    <div className="mt-auto flex justify-between gap-2">
                      <button onClick={() => { setCurrentProjectName(p.name); setCurrentView("wizard"); }} className="flex-1 bg-gray-900 text-white text-xs font-bold py-2.5 rounded-lg hover:bg-black transition">Edytuj</button>
                      <button className="flex-1 bg-blue-50 text-blue-600 text-xs font-bold py-2.5 rounded-lg hover:bg-blue-100 transition">Pobierz</button>
                      <button onClick={() => deleteProject(p.id)} className="px-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- WIDOK 3: KREATOR 4-ETAPOWY (WIZARD) ---
  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans text-sm">
      
      {/* GÓRNE MENU */}
      <nav className="h-16 bg-gray-900 text-white flex items-center justify-between px-6 shrink-0 z-50 shadow-md relative">
        <div className="flex items-center space-x-8">
          <span className="text-xl font-black tracking-tighter cursor-pointer" onClick={() => setCurrentView("landing")}>Profe<span className="text-red-500">Architect</span></span>
          
          {/* Dropdown Menu "Projekty" */}
          <div className="relative">
            <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center text-gray-300 hover:text-white font-medium transition">
              Projekty <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {menuOpen && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl overflow-hidden py-2 border border-gray-100 text-gray-800">
                <button onClick={() => { setActiveStep(1); setMenuOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 font-medium">Nowy projekt</button>
                <button onClick={() => { setCurrentView("list"); setMenuOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 font-medium">Wszystkie projekty</button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <input 
            type="text" 
            value={currentProjectName}
            onChange={(e) => setCurrentProjectName(e.target.value)}
            className="bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-gray-500 w-64"
          />
          <button onClick={saveProject} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-1.5 rounded-lg font-bold text-xs transition">Zapisz Projekt</button>
        </div>
      </nav>

      {/* Pasek Postępu (Steper) */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shrink-0">
        <div className="flex space-x-2 w-2/3">
          {[
            { step: 1, name: "Struktura i Schemat", desc: "Strategia & Copy" },
            { step: 2, name: "Wizualizacja", desc: "UI/UX & Design" },
            { step: 3, name: "SEO & AI", desc: "Pozycjonowanie & Export" },
            { step: 4, name: "Wdrożenie Joomla", desc: "SP Page Builder & Handoff" }
          ].map((s) => (
            <div key={s.step} onClick={() => setActiveStep(s.step as any)} className={`flex-1 p-3 rounded-xl border-2 cursor-pointer transition-all ${activeStep === s.step ? "border-blue-600 bg-blue-50" : "border-gray-100 hover:border-gray-300"}`}>
              <div className={`text-xs font-black uppercase tracking-wider ${activeStep === s.step ? "text-blue-700" : "text-gray-400"}`}>Etap {s.step}</div>
              <div className={`font-bold mt-1 ${activeStep === s.step ? "text-gray-900" : "text-gray-600"}`}>{s.name}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">{s.desc}</div>
            </div>
          ))}
        </div>
        <div className="flex space-x-3">
          <button className="bg-white border border-gray-300 text-gray-700 px-6 py-2.5 rounded-xl font-bold hover:bg-gray-50 shadow-sm transition">Edytuj Etap</button>
          {activeStep < 4 ? (
            <button onClick={() => setActiveStep((activeStep + 1) as any)} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition flex items-center">
              Przejdź do punktu kolejnego <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          ) : (
            <button className="bg-green-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-200 transition flex items-center">
              Eksportuj Pakiet Finalny <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            </button>
          )}
        </div>
      </div>

      {/* GŁÓWNY OBSZAR ROBOCZY WIZARDA */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Lewy panel roboczy (Czat/Prompty) */}
        <div className="w-[400px] bg-white border-r border-gray-200 flex flex-col shadow-xl z-10 shrink-0">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-bold text-gray-800">Asystent Etapu {activeStep}</h3>
            <p className="text-xs text-gray-500 mt-1">Wprowadź wytyczne, aby wygenerować dokumentację.</p>
          </div>
          <div className="flex-1 p-4 overflow-y-auto bg-white">
            <div className="bg-blue-50 border border-blue-100 text-blue-800 p-4 rounded-xl text-xs leading-relaxed">
              <strong>Zadania do wygenerowania w tym etapie:</strong>
              <ul className="list-disc pl-4 mt-2 space-y-1 font-medium">
                {activeStep === 1 && (
                  <>
                    <li>Dokument 1: Strategia i architektura</li>
                    <li>Dokument 9: Handoff dla copywritera</li>
                    <li>Dokument 10: Wersja redakcyjna (Premium)</li>
                    <li>Dokument 12: Asset plan (materiały)</li>
                  </>
                )}
                {activeStep === 2 && (
                  <><li>Silnik Wizualny (Renderowanie UI/UX i HTML)</li></>
                )}
                {activeStep === 3 && (
                  <><li>Dokument 11: Wersja SEO / AI Search Visibility</li></>
                )}
                {activeStep === 4 && (
                  <>
                    <li>Dokument 2: Architektura SP Page Builder</li>
                    <li>Dokument 3: Tabela wdrożeniowa (Excel logic)</li>
                    <li>Dokument 4: Deployment checklist</li>
                    <li>Dokument 5: Custom CSS</li>
                    <li>Dokument 6: Mapa klas CSS</li>
                    <li>Dokument 7: Master Handoff</li>
                    <li>Dokument 8: Ultra-krótki handoff</li>
                    <li>Dokument 13: QA / Audit checklist</li>
                  </>
                )}
              </ul>
            </div>
          </div>
          <div className="p-4 border-t border-gray-100 bg-white">
            <textarea className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" rows={3} placeholder="Opisz swoje wymagania dla tego etapu..."></textarea>
            <button className="w-full mt-2 bg-gray-900 text-white font-bold py-2.5 rounded-xl hover:bg-black transition text-xs uppercase tracking-widest">Generuj Dokumenty</button>
          </div>
        </div>

        {/* Prawy panel - Wyniki / Podgląd */}
        <div className="flex-1 bg-gray-100 p-8 overflow-y-auto">
          <div className="max-w-5xl mx-auto space-y-8">
            <h2 className="text-3xl font-black text-gray-800">Wyniki Operacyjne: Etap {activeStep}</h2>
            
            {/* Tutaj docelowo będą renderowane wygenerowane dokumenty */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 min-h-[500px] flex items-center justify-center">
              <div className="text-center text-gray-400">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <p className="font-medium text-lg">Oczekiwanie na generowanie danych...</p>
                <p className="text-sm mt-2">Użyj asystenta po lewej stronie, aby rozpocząć pracę nad dokumentacją.</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}