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
  const [darkMode, setDarkMode] = useState(false);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [documents, setDocuments] = useState<Record<string, string>>({});
  
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"desktop" | "tablet" | "mobile">("desktop");

  const viewWidths = {
    desktop: "100%",
    tablet: "768px",
    mobile: "390px",
  };

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
      previewHtml: htmlContent || "<div class='p-4'>Brak wygenerowanego podglądu...</div>"
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

  // --- ZAKTUALIZOWANA FUNKCJA Z AUTOPILOTEM ---
  const sendMessage = async () => {
    if (isLoading) return;

    let promptToSend = input.trim();

    // Jeśli pole jest puste, AI samo wybiera odpowiednią komendę dla danego Etapu
    if (!promptToSend) {
      if (activeStep === 1) promptToSend = "Zbuduj strategię i architekturę (Dokument 1, 9, 10, 12) dla nowej, profesjonalnej strony.";
      else if (activeStep === 2) promptToSend = "Bazując na ustalonej strategii, wygeneruj powalający kod wizualny HTML+Tailwind, zachowując asymetrię i nowoczesny design.";
      else if (activeStep === 3) promptToSend = "Opracuj rygorystyczną optymalizację SEO i zalecenia dla wyszukiwarek bazujących na AI (Dokument 11).";
      else if (activeStep === 4) promptToSend = "Zmapuj kod wizualny na środowisko Joomla i SP Page Builder (Dokument 2, 3, 7, 13).";
      
      setInput(promptToSend);
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: [{ role: "user", content: promptToSend }],
          step: activeStep 
        }),
      });
      const data = await res.json();
      
      if (data.reply) {
        let aiText = data.reply;
        
        const extractDoc = (tag: string) => {
          const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
          const match = aiText.match(regex);
          return match ? match[1].trim() : null;
        };

        if (activeStep === 1) {
          const newDocs: Record<string, string> = { ...documents };
          const doc1 = extractDoc("DOC_1"); if (doc1) newDocs["doc1"] = doc1;
          const doc9 = extractDoc("DOC_9"); if (doc9) newDocs["doc9"] = doc9;
          const doc10 = extractDoc("DOC_10"); if (doc10) newDocs["doc10"] = doc10;
          const doc12 = extractDoc("DOC_12"); if (doc12) newDocs["doc12"] = doc12;
          setDocuments(newDocs);
        }

        if (activeStep === 2) {
          let html = extractDoc("HTML");
          
          if (!html) {
            const mdMatch = aiText.match(/```html([\s\S]*?)```/i);
            if (mdMatch) html = mdMatch[1];
          }
          if (!html) {
             html = aiText;
          }

          if (html) {
            let cleanHtml = html.replace(/```html/gi, "").replace(/```/g, "").trim();
            setHtmlContent(cleanHtml);
          }
        }

        if (activeStep === 3) {
          const doc11 = extractDoc("DOC_11");
          if (doc11) {
            const newDocs: Record<string, string> = { ...documents };
            newDocs["doc11"] = doc11;
            setDocuments(newDocs);
          }
        }

        if (activeStep === 4) {
          const newDocs: Record<string, string> = { ...documents };
          const doc2 = extractDoc("DOC_2"); if (doc2) newDocs["doc2"] = doc2;
          const doc3 = extractDoc("DOC_3"); if (doc3) newDocs["doc3"] = doc3;
          const doc7 = extractDoc("DOC_7"); if (doc7) newDocs["doc7"] = doc7;
          const doc13 = extractDoc("DOC_13"); if (doc13) newDocs["doc13"] = doc13;
          setDocuments(newDocs);
        }

        // System czeka 3 sekundy, żebyś mógł przeczytać wklejony prompt, i dopiero go czyści
        setTimeout(() => setInput(""), 3000);
      }
    } catch (e) {
      console.error(e);
      alert("⚠️ Wystąpił błąd podczas komunikacji z API.");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadHtmlPackage = () => {
    if (!htmlContent) {
      alert("⚠️ Brak wygenerowanego kodu wizualnego (Etap 2). Nie ma czego eksportować.");
      return;
    }

    const fullHtml = `<!DOCTYPE html>
<html lang="pl" class="antialiased">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${currentProjectName} - Export</title>
    <script src="https://unpkg.com/@tailwindcss/browser@4"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700;900&display=swap" rel="stylesheet">
    <style>body { font-family: 'Montserrat', sans-serif; overflow-x: hidden; }</style>
</head>
<body class="bg-white text-slate-900">
    ${htmlContent}
    <script>lucide.createIcons();</script>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentProjectName.replace(/\s+/g, '-').toLowerCase()}-export.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (currentView === "landing") {
    return (
      <div className={`${darkMode ? "dark" : ""}`}>
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col items-center justify-center font-sans transition-colors duration-300">
          <div className="absolute top-8 text-center w-full">
            <h1 className="text-4xl font-black tracking-tighter text-gray-900 dark:text-white uppercase">Profe<span className="text-blue-600">Architect</span> OS</h1>
            <p className="text-sm font-bold tracking-widest text-gray-400 uppercase mt-2">Enterprise Deployment System</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-8 items-center justify-center w-full max-w-5xl px-6">
            <button onClick={() => { setActiveStep(1); setCurrentView("wizard"); }} className="w-full sm:w-1/2 bg-red-600 hover:bg-red-700 text-white py-20 rounded-[2.5rem] shadow-2xl hover:shadow-red-500/40 transition-all duration-500 hover:-translate-y-3 group flex flex-col items-center">
              <svg className="w-20 h-20 mb-6 group-hover:scale-110 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
              <span className="text-4xl font-black uppercase tracking-tight">Nowy Projekt</span>
            </button>
            <button onClick={() => setCurrentView("list")} className="w-full sm:w-1/2 bg-gray-900 dark:bg-slate-800 hover:bg-black dark:hover:bg-slate-700 text-white py-20 rounded-[2.5rem] shadow-2xl hover:shadow-gray-900/40 transition-all duration-500 hover:-translate-y-3 group flex flex-col items-center">
              <svg className="w-20 h-20 mb-6 group-hover:scale-110 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              <span className="text-4xl font-black uppercase tracking-tight">Wszystkie Projekty</span>
            </button>
          </div>
          <button onClick={toggleTheme} className="fixed bottom-8 right-8 p-4 bg-white dark:bg-slate-800 rounded-full shadow-xl border border-gray-100 dark:border-slate-700 text-gray-800 dark:text-white">{darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${darkMode ? "dark" : ""}`}>
      <div className="flex flex-col h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-200 overflow-hidden font-sans text-sm transition-colors duration-300">
        
        <nav className="h-16 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 z-50 shadow-sm transition-colors duration-300">
          <div className="flex items-center space-x-10">
            <span className="text-xl font-black tracking-tighter cursor-pointer dark:text-white" onClick={() => setCurrentView("landing")}>Profe<span className="text-blue-600">Architect</span></span>
            <div className="relative">
              <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center text-gray-600 dark:text-slate-400 hover:text-blue-600 font-bold uppercase text-[11px] tracking-widest">
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
            <button onClick={toggleTheme} className="p-2 text-gray-500 hover:text-blue-600 transition-colors">{darkMode ? "☀️" : "🌙"}</button>
            {currentView === "wizard" && (
              <>
                <input type="text" value={currentProjectName} onChange={(e) => setCurrentProjectName(e.target.value)} className="bg-gray-100 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-500 w-64 dark:text-white" />
                <button onClick={saveProject} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition shadow-lg shadow-blue-500/20">Zapisz Projekt</button>
              </>
            )}
          </div>
        </nav>

        {currentView === "list" && (
          <div className="flex-1 overflow-y-auto p-12">
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-between items-end mb-12">
                <div><h2 className="text-4xl font-black dark:text-white tracking-tighter">Archiwum Projektów</h2></div>
                <button onClick={() => { setActiveStep(1); setCurrentView("wizard"); }} className="bg-red-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 shadow-xl shadow-red-500/20 transition-all">Nowy Projekt</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {projects.map(p => (
                  <div key={p.id} className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border border-gray-100 dark:border-slate-800 overflow-hidden flex flex-col group hover:-translate-y-2 transition-all duration-500">
                    <div className="h-48 bg-gray-100 dark:bg-slate-800 flex items-center justify-center border-b border-gray-100 dark:border-slate-800 overflow-hidden relative">
                       <iframe className="w-[200%] h-[200%] absolute origin-top-left scale-50 pointer-events-none" srcDoc={p.previewHtml} />
                    </div>
                    <div className="p-8">
                      <h3 className="text-xl font-black dark:text-white mb-1 uppercase tracking-tight">{p.name}</h3>
                      <p className="text-[10px] font-bold text-blue-600 uppercase mb-6 tracking-widest">{p.date}</p>
                      <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => { setCurrentProjectName(p.name); setCurrentView("wizard"); }} className="bg-slate-900 dark:bg-slate-700 text-white text-[10px] font-black uppercase py-3 rounded-xl hover:bg-black transition">Edytuj</button>
                        <button onClick={() => deleteProject(p.id)} className="text-[10px] font-bold text-red-500 uppercase py-3 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 rounded-xl transition">Usuń</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentView === "wizard" && (
          <>
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
                <button onClick={() => setActiveStep((activeStep + 1) as any)} disabled={activeStep === 4} className="bg-black dark:bg-white dark:text-black text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl disabled:opacity-20">Następny Krok</button>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              <div className="w-[450px] bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col shrink-0">
                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-b border-gray-100 dark:border-slate-800">
                  <h3 className="font-black uppercase tracking-tighter text-lg dark:text-white">Expert System V11</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Etap {activeStep}: Aktywne zadania</p>
                </div>
                <div className="flex-1 p-6 overflow-y-auto space-y-2 text-[11px] font-bold uppercase tracking-tight text-gray-500">
                  {activeStep === 1 && ["Dokument 1: Strategia", "Dokument 9: Copy", "Dokument 10: Premium Polish", "Dokument 12: Asset Plan"].map(d => <div key={d} className="p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">{d}</div>)}
                  {activeStep === 2 && ["Silnik Wizualny (Render HTML)", "Aplikacja Stylów Tailwind", "Implementacja Lucide Icons"].map(d => <div key={d} className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 rounded-xl border border-indigo-100 dark:border-indigo-800/50">{d}</div>)}
                  {activeStep === 3 && ["Dokument 11: SEO / AI Search"].map(d => <div key={d} className="p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">{d}</div>)}
                  {activeStep === 4 && ["Dokument 2: SPPB Layout", "Dokument 3: Excel Matrix", "Dokument 7: Master Handoff", "Dokument 13: QA Checklist"].map(d => <div key={d} className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 rounded-xl border border-blue-100 dark:border-blue-800/50">{d}</div>)}
                </div>
                <div className="p-6 border-t border-gray-100 dark:border-slate-800">
                  <textarea 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" 
                    rows={4} 
                    placeholder="Wprowadź wytyczne dla Eksperta lub zostaw puste, aby odpalić autopilota..."
                  ></textarea>
                  <button onClick={sendMessage} disabled={isLoading} className={`w-full mt-4 text-white font-black py-4 rounded-2xl transition uppercase tracking-[0.2em] text-[10px] ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20'}`}>
                    {isLoading ? "Przetwarzanie..." : "Generuj Operacyjnie"}
                  </button>
                </div>
              </div>
              
              <div className="flex-1 bg-gray-100 dark:bg-slate-950 p-8 overflow-y-auto relative flex flex-col items-center">
                {activeStep === 2 && htmlContent && (
                  <div className="bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm flex space-x-1 mb-6 sticky top-0 z-10">
                    {(["desktop", "tablet", "mobile"] as const).map((m) => (
                      <button key={m} onClick={() => setViewMode(m)} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${viewMode === m ? "bg-gray-100 dark:bg-slate-900 text-blue-600 dark:text-white shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>
                        {m}
                      </button>
                    ))}
                  </div>
                )}

                <div className="w-full max-w-5xl">
                  {activeStep === 1 && (
                    Object.keys(documents).length === 0 ? (
                      <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-xl p-12 min-h-[400px] flex items-center justify-center border border-gray-100 dark:border-slate-800">
                        <p className="text-gray-400 dark:text-slate-500 font-medium text-lg uppercase tracking-widest">Oczekiwanie na dane ze strategii...</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {["doc1", "doc9", "doc10", "doc12"].map(key => documents[key] && (
                          <div key={key} className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-800 p-8">
                            <h3 className="text-xl font-black uppercase text-blue-600 mb-4 border-b border-gray-100 dark:border-slate-800 pb-4">
                              {key === "doc1" && "Dokument 1 — Strategia i architektura"}
                              {key === "doc9" && "Dokument 9 — Handoff dla copywritera"}
                              {key === "doc10" && "Dokument 10 — Wersja redakcyjna (Premium)"}
                              {key === "doc12" && "Dokument 12 — Asset plan"}
                            </h3>
                            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">{documents[key]}</div>
                          </div>
                        ))}
                      </div>
                    )
                  )}

                  {activeStep === 2 && (
                    htmlContent ? (
                      <div className="flex justify-center w-full">
                        <div style={{ width: viewWidths[viewMode] }} className="h-[750px] bg-white shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] transition-all duration-500 rounded-[2rem] overflow-hidden border border-gray-200 dark:border-slate-700 relative">
                          <iframe className="w-full h-full border-none" sandbox="allow-scripts allow-same-origin" srcDoc={`
                            <!DOCTYPE html>
                            <html lang="pl" class="antialiased">
                              <head>
                                <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
                                <script src="https://unpkg.com/@tailwindcss/browser@4"></script>
                                <script src="https://unpkg.com/lucide@latest"></script>
                                <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700;900&display=swap" rel="stylesheet">
                                <style>body { font-family: 'Montserrat', sans-serif; overflow-x: hidden; }</style>
                              </head>
                              <body class="bg-white text-slate-900">
                                ${htmlContent}
                                <script>lucide.createIcons();</script>
                              </body>
                            </html>
                          `} />
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-xl p-12 min-h-[400px] flex items-center justify-center border border-gray-100 dark:border-slate-800">
                        <p className="text-gray-400 dark:text-slate-500 font-medium text-lg uppercase tracking-widest text-center">
                          Oczekiwanie na render wizualny... <br/>
                          <span className="text-sm opacity-70 mt-2 block">Zostaw pole puste i kliknij przycisk, aby wygenerować design.</span>
                        </p>
                      </div>
                    )
                  )}

                  {activeStep === 3 && (
                    !documents.doc11 ? (
                      <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-xl p-12 min-h-[400px] flex items-center justify-center border border-gray-100 dark:border-slate-800">
                        <p className="text-gray-400 dark:text-slate-500 font-medium text-lg uppercase tracking-widest text-center">
                          Oczekiwanie na analizę SEO... <br/>
                          <span className="text-sm opacity-70 mt-2 block">Kliknij przycisk z pustym polem, by rozpocząć.</span>
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-800 p-8">
                          <h3 className="text-xl font-black uppercase text-blue-600 mb-4 border-b border-gray-100 dark:border-slate-800 pb-4">Dokument 11 — Wersja SEO / AI Search Visibility</h3>
                          <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">{documents.doc11}</div>
                        </div>
                        
                        <div className="bg-gradient-to-r from-gray-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 rounded-3xl shadow-2xl p-8 flex flex-col md:flex-row items-center justify-between border border-gray-800 dark:border-slate-700">
                           <div className="mb-6 md:mb-0">
                             <h4 className="text-white font-black text-xl uppercase tracking-tight">Gotowy do wdrożenia?</h4>
                             <p className="text-gray-400 text-sm mt-1">Pobierz wygenerowany kod (Etap 2) jako autonomiczną paczkę HTML gotową do wrzucenia na serwer.</p>
                           </div>
                           <button onClick={downloadHtmlPackage} className="bg-green-500 hover:bg-green-400 text-gray-900 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-[0_0_30px_rgba(34,197,94,0.3)] hover:shadow-[0_0_40px_rgba(34,197,94,0.5)] transition-all flex items-center shrink-0">
                             <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                             Eksportuj Paczkę HTML
                           </button>
                        </div>
                      </div>
                    )
                  )}
                  
                  {activeStep === 4 && (
                    <div className="space-y-6">
                      {Object.keys(documents).filter(k => ["doc2", "doc3", "doc7", "doc13"].includes(k)).length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-xl p-12 min-h-[400px] flex items-center justify-center border border-gray-100 dark:border-slate-800">
                          <p className="text-gray-400 dark:text-slate-500 font-medium text-lg uppercase tracking-widest text-center">
                            Oczekiwanie na dokumentację wdrożeniową... <br/>
                            <span className="text-sm opacity-70 mt-2 block">Zostaw pole puste i kliknij, by odpalić autopilota i zmapować na Joomla / SP Page Builder.</span>
                          </p>
                        </div>
                      ) : (
                        <>
                          {["doc2", "doc3", "doc7", "doc13"].map(key => documents[key] && (
                            <div key={key} className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-800 p-8">
                              <h3 className="text-xl font-black uppercase text-blue-600 mb-4 border-b border-gray-100 dark:border-slate-800 pb-4">
                                {key === "doc2" && "Dokument 2 — Architektura SP Page Builder"}
                                {key === "doc3" && "Dokument 3 — Tabela wdrożeniowa"}
                                {key === "doc7" && "Dokument 7 — Master Handoff"}
                                {key === "doc13" && "Dokument 13 — QA / Audit Checklist"}
                              </h3>
                              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">{documents[key]}</div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  )}

                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}