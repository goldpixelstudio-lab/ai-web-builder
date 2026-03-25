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
  
  // NOWOŚĆ: Okno konwersacyjne dla odpowiedzi AI
  const [aiResponseText, setAiResponseText] = useState<string | null>(null);

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

    const activeDocs = localStorage.getItem("profeActiveDocs");
    if (activeDocs) setDocuments(JSON.parse(activeDocs));

    const activeHtml = localStorage.getItem("profeActiveHtml");
    if (activeHtml) setHtmlContent(activeHtml);
  }, []);

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("profeTheme", newMode ? "dark" : "light");
  };

  const resetSession = () => {
    if (confirm("Czy na pewno chcesz zresetować bieżącą sesję roboczą?")) {
        setDocuments({});
        setHtmlContent(null);
        setInput("");
        setAiResponseText(null);
        setActiveStep(1);
        localStorage.removeItem("profeActiveDocs");
        localStorage.removeItem("profeActiveHtml");
    }
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
    alert("Projekt zapisany w Archiwum!");
  };

  const applyAutopilot = () => {
    let basePrompt = "";
    if (activeStep === 1) basePrompt = `Zbuduj optymalną, nowoczesną strategię dla szkoły językowej "Profe Studio Radomsko". Wyszukaj ich w internecie.`;
    else if (activeStep === 2) basePrompt = `Wygeneruj ULTRA PROFESJONALNĄ mapę słów (Topical Map) oraz kod JSON-LD na bazie zgromadzonych danych. Żadnych porad.`;
    else if (activeStep === 3) basePrompt = `Działaj jako Senior Dev. Wygeneruj innowacyjny, luksusowy kod HTML. Dodaj potężne style CSS w sekcji head. Użyj prawdziwych tekstów ze Strategii.`;
    else if (activeStep === 4) basePrompt = `Zmapuj projekt na Joomla i SP Page Builder.`;

    setInput(basePrompt);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    setIsLoading(true);
    setAiResponseText(null); // Czyścimy poprzednią odpowiedź

    // DOKLEJANIE KONTEKSTU (BIEŻĄCEGO STANU)
    let projectContext = "";
    
    // Jeśli mamy dane z Etapu 1 (Wiedza o firmie)
    if (activeStep > 1 && Object.keys(documents).length > 0) {
      projectContext += "\n\n--- WIEDZA BAZOWA Z ETAPU 1 ---\n";
      if (documents.doc1) projectContext += `STRATEGIA:\n${documents.doc1.substring(0, 800)}...\n\n`;
      if (documents.doc10) projectContext += `TEKSTY DO UŻYCIA:\n${documents.doc10}\n`;
    }

    // ITERACJA: Jeśli jesteśmy w E2, podajemy obecne SEO, by AI mogło je modyfikować
    if (activeStep === 2 && documents.doc11) {
      projectContext += `\n--- OBECNY DOKUMENT SEO (Do modyfikacji lub odniesienia) ---\n${documents.doc11}\n`;
    }
    
    // ITERACJA: Jeśli jesteśmy w E3, podajemy obecny HTML
    if (activeStep === 3 && htmlContent) {
      projectContext += `\n--- OBECNY KOD HTML STRONY (Zmodyfikuj go zgodnie z prośbą) ---\n${htmlContent}\n`;
    }

    const payloadMessage = input + projectContext;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: [{ role: "user", content: payloadMessage }],
          step: activeStep 
        }),
      });
      const data = await res.json();
      
      if (data.reply) {
        let aiText = data.reply;
        let isCodeGenerated = false;
        
        const extractDoc = (tag: string) => {
          const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
          const match = aiText.match(regex);
          return match ? match[1].trim() : null;
        };

        // ETAP 1
        if (activeStep === 1) {
          const newDocs: Record<string, string> = { ...documents };
          let d1 = extractDoc("DOC_1"); let d9 = extractDoc("DOC_9"); let d10 = extractDoc("DOC_10"); let d12 = extractDoc("DOC_12");
          
          if (d1 || d10) {
            if (d1) newDocs["doc1"] = d1;
            if (d9) newDocs["doc9"] = d9;
            if (d10) newDocs["doc10"] = d10;
            if (d12) newDocs["doc12"] = d12;
            setDocuments(newDocs);
            localStorage.setItem("profeActiveDocs", JSON.stringify(newDocs));
            isCodeGenerated = true;
          }
        }

        // ETAP 2
        if (activeStep === 2) {
          let doc11 = extractDoc("DOC_11");
          if (doc11) {
            const newDocs: Record<string, string> = { ...documents };
            newDocs["doc11"] = doc11;
            setDocuments(newDocs);
            localStorage.setItem("profeActiveDocs", JSON.stringify(newDocs));
            isCodeGenerated = true;
          }
        }

        // ETAP 3
        if (activeStep === 3) {
          let html = extractDoc("HTML");
          if (!html) {
            const mdMatch = aiText.match(/```html([\s\S]*?)```/i);
            if (mdMatch) html = mdMatch[1];
          }
          if (!html) {
             const docMatch = aiText.match(/(<!DOCTYPE html>[\s\S]*<\/html>)/i);
             if (docMatch) html = docMatch[1];
          }

          if (html) {
            let cleanHtml = html.replace(/```html/gi, "").replace(/```/g, "").trim();
            setHtmlContent(cleanHtml);
            localStorage.setItem("profeActiveHtml", cleanHtml);
            isCodeGenerated = true;
          }
        }

        // ETAP 4
        if (activeStep === 4) {
          const newDocs: Record<string, string> = { ...documents };
          const doc2 = extractDoc("DOC_2"); if (doc2) { newDocs["doc2"] = doc2; isCodeGenerated = true; }
          const doc3 = extractDoc("DOC_3"); if (doc3) newDocs["doc3"] = doc3;
          const doc7 = extractDoc("DOC_7"); if (doc7) newDocs["doc7"] = doc7;
          const doc13 = extractDoc("DOC_13"); if (doc13) newDocs["doc13"] = doc13;
          if(isCodeGenerated) {
            setDocuments(newDocs);
            localStorage.setItem("profeActiveDocs", JSON.stringify(newDocs));
          }
        }

        // Jeśli AI NIE wygenerowało tagów kodu, to znaczy, że odpowiedziało na pytanie!
        if (!isCodeGenerated) {
           setAiResponseText(aiText);
        }

        setTimeout(() => setInput(""), 1000);
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
      alert("⚠️ Brak wygenerowanego kodu wizualnego.");
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
</head>
<body class="bg-gray-50 text-slate-900">
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
            <button onClick={() => { setActiveStep(1); setCurrentView("wizard"); }} className="w-full sm:w-1/2 bg-blue-600 hover:bg-blue-700 text-white py-20 rounded-[2.5rem] shadow-2xl hover:shadow-blue-500/40 transition-all duration-500 hover:-translate-y-3 group flex flex-col items-center">
              <svg className="w-20 h-20 mb-6 group-hover:scale-110 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
              <span className="text-4xl font-black uppercase tracking-tight">Otwórz Warsztat</span>
            </button>
            <button onClick={() => setCurrentView("list")} className="w-full sm:w-1/2 bg-gray-900 dark:bg-slate-800 hover:bg-black dark:hover:bg-slate-700 text-white py-20 rounded-[2.5rem] shadow-2xl hover:shadow-gray-900/40 transition-all duration-500 hover:-translate-y-3 group flex flex-col items-center">
              <svg className="w-20 h-20 mb-6 group-hover:scale-110 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              <span className="text-4xl font-black uppercase tracking-tight">Archiwum</span>
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
                Menu <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
              </button>
              {menuOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden py-2 border border-gray-100 dark:border-slate-700 z-[100]">
                  <button onClick={() => { setActiveStep(1); setCurrentView("wizard"); setMenuOpen(false); }} className="w-full text-left px-5 py-3 hover:bg-gray-50 dark:hover:bg-slate-700 font-bold text-xs uppercase text-blue-600">Warsztat Roboczy</button>
                  <button onClick={() => { setCurrentView("list"); setMenuOpen(false); }} className="w-full text-left px-5 py-3 hover:bg-gray-50 dark:hover:bg-slate-700 font-bold text-xs uppercase text-gray-700 dark:text-white">Archiwum</button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={toggleTheme} className="p-2 text-gray-500 hover:text-blue-600 transition-colors">{darkMode ? "☀️" : "🌙"}</button>
            {currentView === "wizard" && (
              <>
                <button onClick={resetSession} className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest transition">Zresetuj Sesję</button>
                <input type="text" value={currentProjectName} onChange={(e) => setCurrentProjectName(e.target.value)} className="bg-gray-100 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-500 w-48 dark:text-white" />
                <button onClick={saveProject} className="bg-gray-900 dark:bg-white dark:text-slate-900 hover:bg-black text-white px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition">Zapisz Projekt</button>
              </>
            )}
          </div>
        </nav>

        {currentView === "list" && (
          <div className="flex-1 overflow-y-auto p-12">
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-between items-end mb-12">
                <div><h2 className="text-4xl font-black dark:text-white tracking-tighter">Archiwum Projektów</h2></div>
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
                        <button onClick={() => deleteProject(p.id)} className="col-span-2 text-[10px] font-bold text-red-500 uppercase py-3 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 rounded-xl transition">Usuń z archiwum</button>
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
                  { step: 2, name: "Optimization", desc: "SEO & AI" },
                  { step: 3, name: "Visual", desc: "UI/UX & Design" },
                  { step: 4, name: "Deployment", desc: "Joomla & Handoff" }
                ].map((s) => (
                  <div key={s.step} onClick={() => setActiveStep(s.step as any)} className={`flex-1 p-4 rounded-2xl border-2 transition-all cursor-pointer ${activeStep === s.step ? "border-blue-600 bg-blue-50 dark:bg-blue-900/10" : "border-gray-50 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700"}`}>
                    <div className={`text-[10px] font-black uppercase tracking-widest ${activeStep === s.step ? "text-blue-600" : "text-gray-400"}`}>Etap 0{s.step}</div>
                    <div className={`font-black mt-1 uppercase ${activeStep === s.step ? "text-slate-900 dark:text-white" : "text-gray-500"}`}>{s.name}</div>
                  </div>
                ))}
              </div>
              <div className="ml-8 flex space-x-4">
                <button onClick={() => setActiveStep((activeStep + 1) as any)} disabled={activeStep === 4} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl disabled:opacity-20">Dalej</button>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              <div className="w-[450px] bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col shrink-0">
                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-b border-gray-100 dark:border-slate-800">
                  <h3 className="font-black uppercase tracking-tighter text-lg dark:text-white">Expert System V13</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Interaktywny Asystent</p>
                </div>
                
                <div className="flex-1 p-6 overflow-y-auto flex flex-col">
                  {/* Instrukcje Etapu */}
                  <div className="space-y-2 mb-6 text-[11px] font-bold uppercase tracking-tight text-gray-500">
                    {activeStep === 1 && ["Analiza Biznesowa", "Projekt Architektury", "Copywriting Premium"].map(d => <div key={d} className="p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">{d}</div>)}
                    {activeStep === 2 && ["Ultra Topical Map", "Generowanie JSON-LD", "Optymalizacja Meta"].map(d => <div key={d} className="p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">{d}</div>)}
                    {activeStep === 3 && ["Generowanie kodu HTML", "Zaawansowane Style CSS", "Responsywność i A11y"].map(d => <div key={d} className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 rounded-xl border border-indigo-100 dark:border-indigo-800/50">{d}</div>)}
                  </div>
                  
                  {/* Dymek z konwersacyjną odpowiedzią AI */}
                  {aiResponseText && (
                    <div className="mt-auto bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 p-4 rounded-2xl mb-4 animate-fade-in">
                       <p className="text-xs font-medium text-blue-900 dark:text-blue-100 whitespace-pre-wrap">{aiResponseText}</p>
                    </div>
                  )}
                </div>

                <div className="p-6 border-t border-gray-100 dark:border-slate-800">
                  <div className="flex gap-2 mb-4">
                    <button onClick={applyAutopilot} className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-800 dark:text-white font-bold py-2 rounded-xl transition text-[10px] uppercase tracking-widest">Wklej Komendę Głównego Generowania</button>
                  </div>
                  <textarea 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-4 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" 
                    rows={4} 
                    placeholder="Wydaj polecenie (np. 'Zmień kolor tła na czarny' lub 'Jak wdrożyć ten kod?')..."
                  ></textarea>
                  <button onClick={sendMessage} disabled={isLoading} className={`w-full mt-4 text-white font-black py-4 rounded-2xl transition uppercase tracking-[0.2em] text-[10px] ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20'}`}>
                    {isLoading ? "Przetwarzanie..." : "Wyślij"}
                  </button>
                </div>
              </div>
              
              <div className="flex-1 bg-gray-100 dark:bg-slate-950 p-8 overflow-y-auto relative flex flex-col items-center">
                {activeStep === 3 && htmlContent && (
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
                        <p className="text-gray-400 dark:text-slate-500 font-medium text-lg uppercase tracking-widest text-center">Załaduj komendę z lewej i wygeneruj bazę.</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {["doc1", "doc9", "doc10", "doc12"].map(key => documents[key] && (
                          <div key={key} className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-800 p-8">
                            <h3 className="text-xl font-black uppercase text-blue-600 mb-4 border-b border-gray-100 dark:border-slate-800 pb-4">
                              {key === "doc1" && "Architektura i Strategia"}
                              {key === "doc9" && "Handoff Copywriterski"}
                              {key === "doc10" && "Wsad Tekstowy (Twarde dane)"}
                              {key === "doc12" && "Plan Mediów"}
                            </h3>
                            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">{documents[key]}</div>
                          </div>
                        ))}
                      </div>
                    )
                  )}

                  {activeStep === 2 && (
                    !documents.doc11 ? (
                      <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-xl p-12 min-h-[400px] flex items-center justify-center border border-gray-100 dark:border-slate-800">
                        <p className="text-gray-400 dark:text-slate-500 font-medium text-lg uppercase tracking-widest text-center">Wpisz komendę, aby wygenerować mapę SEO, lub zadaj pytanie.</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-800 p-8">
                          <h3 className="text-xl font-black uppercase text-blue-600 mb-4 border-b border-gray-100 dark:border-slate-800 pb-4">Topical Map & JSON-LD</h3>
                          <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">{documents.doc11}</div>
                        </div>
                      </div>
                    )
                  )}

                  {activeStep === 3 && (
                    !htmlContent ? (
                      <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-xl p-12 min-h-[400px] flex items-center justify-center border border-gray-100 dark:border-slate-800">
                        <p className="text-gray-400 dark:text-slate-500 font-medium text-lg uppercase tracking-widest text-center">Wpisz komendę, aby AI zaprojektowało HTML z luksusowym CSS.</p>
                      </div>
                    ) : (
                      <div className="space-y-8">
                        <div className="flex justify-center w-full">
                          <div style={{ width: viewWidths[viewMode] }} className="h-[750px] bg-white shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] transition-all duration-500 rounded-[2rem] overflow-hidden border border-gray-200 relative">
                            <iframe className="w-full h-full border-none" sandbox="allow-scripts allow-same-origin" srcDoc={`
                              <!DOCTYPE html>
                              <html lang="pl" class="antialiased">
                                <head>
                                  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
                                  <script src="https://unpkg.com/@tailwindcss/browser@4"></script>
                                  <script src="https://unpkg.com/lucide@latest"></script>
                                  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700;900&display=swap" rel="stylesheet">
                                </head>
                                <body>
                                  ${htmlContent}
                                  <script>lucide.createIcons();</script>
                                </body>
                              </html>
                            `} />
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-r from-gray-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 rounded-3xl shadow-2xl p-8 flex flex-col md:flex-row items-center justify-between border border-gray-800 dark:border-slate-700">
                           <div className="mb-6 md:mb-0">
                             <h4 className="text-white font-black text-xl uppercase tracking-tight">Gotowy do wdrożenia?</h4>
                             <p className="text-gray-400 text-sm mt-1">Pobierz kod. Jeśli chcesz coś zmienić (np. "Dodaj sekcję"), wpisz to po lewej stronie i wyślij!</p>
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
                          <p className="text-gray-400 dark:text-slate-500 font-medium text-lg uppercase tracking-widest text-center">Zmapuj projekt pod SP Page Builder.</p>
                        </div>
                      ) : (
                        <>
                          {["doc2", "doc3", "doc7", "doc13"].map(key => documents[key] && (
                            <div key={key} className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-800 p-8">
                              <h3 className="text-xl font-black uppercase text-blue-600 mb-4 border-b border-gray-100 dark:border-slate-800 pb-4">
                                {key === "doc2" && "Architektura SP Page Builder"}
                                {key === "doc3" && "Tabela wdrożeniowa"}
                                {key === "doc7" && "Master Handoff"}
                                {key === "doc13" && "QA / Audit Checklist"}
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