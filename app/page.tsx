"use client";

import { useState, useEffect, useRef } from "react";
import { signIn, signOut, useSession } from "next-auth/react";

interface UploadedImage {
  name: string;
  dataUrl: string;
}

interface PageData {
  id: string;
  name: string;
  isHome: boolean;
  fileName: string;
  documents: Record<string, string>;
  htmlContent: string | null;
  images: UploadedImage[];
}

interface Project {
  id: string;
  name: string;
  date: string;
  pages: PageData[];
}

export default function Home() {
  // --- WERYFIKACJA TOŻSAMOŚCI (NEXT-AUTH) ---
  const { data: session, status } = useSession();

  const [currentView, setCurrentView] = useState<"landing" | "list" | "wizard">("landing");
  const [projects, setProjects] = useState<Project[]>([]);
  
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [documents, setDocuments] = useState<Record<string, string>>({});
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [images, setImages] = useState<UploadedImage[]>([]);
  
  const [viewMode, setViewMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [showCode, setShowCode] = useState(false);
  const [aiResponseText, setAiResponseText] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const viewWidths = { desktop: "100%", tablet: "768px", mobile: "390px" };

  useEffect(() => {
    const savedProjects = localStorage.getItem("profeProjectsV2");
    if (savedProjects) {
        setProjects(JSON.parse(savedProjects));
    } else {
        const oldProjects = localStorage.getItem("profeProjects");
        if (oldProjects) {
            const parsed = JSON.parse(oldProjects);
            const migrated: Project[] = parsed.map((p: any) => ({
                id: p.id,
                name: p.name,
                date: p.date,
                pages: [{
                    id: "home_" + p.id,
                    name: "Strona Główna",
                    isHome: true,
                    fileName: "index.html",
                    documents: {},
                    htmlContent: p.previewHtml !== "<div class='p-4'>Brak wygenerowanego podglądu...</div>" ? p.previewHtml : null,
                    images: []
                }]
            }));
            setProjects(migrated);
            localStorage.setItem("profeProjectsV2", JSON.stringify(migrated));
        }
    }
    const savedTheme = localStorage.getItem("profeTheme");
    if (savedTheme === "dark") setDarkMode(true);
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
        setImages([]);
        setActiveStep(1);
    }
  };

  const saveCurrentWorkToProject = () => {
    if (!activeProjectId || !activePageId) return;
    setProjects(prev => {
        const updated = prev.map(proj => {
            if (proj.id !== activeProjectId) return proj;
            return {
                ...proj,
                pages: proj.pages.map(page => {
                    if (page.id !== activePageId) return page;
                    return { ...page, documents, htmlContent, images };
                })
            };
        });
        localStorage.setItem("profeProjectsV2", JSON.stringify(updated));
        return updated;
    });
  };

  const loadPageToWorkspace = (projectId: string, pageId: string) => {
    const proj = projects.find(p => p.id === projectId);
    if (!proj) return;
    const page = proj.pages.find(p => p.id === pageId);
    if (!page) return;

    setDocuments(page.documents || {});
    setHtmlContent(page.htmlContent || null);
    setImages(page.images || []);
    setActiveStep(1);
    setAiResponseText(null);
    setInput("");
  };

  const createNewProject = () => {
    const name = prompt("Podaj nazwę nowego projektu:");
    if (!name) return;
    
    const newProjectId = Date.now().toString();
    const defaultPage: PageData = {
        id: "page_" + Date.now(),
        name: "Strona Główna",
        isHome: true,
        fileName: "index.html",
        documents: {},
        htmlContent: null,
        images: []
    };
    
    const newProject: Project = {
        id: newProjectId,
        name: name,
        date: new Date().toLocaleDateString(),
        pages: [defaultPage]
    };

    const updatedProjects = [...projects, newProject];
    setProjects(updatedProjects);
    localStorage.setItem("profeProjectsV2", JSON.stringify(updatedProjects));
    
    setActiveProjectId(newProjectId);
    setActivePageId(defaultPage.id);
    loadPageToWorkspace(newProjectId, defaultPage.id);
    setCurrentView("wizard");
  };

  const deleteProject = (id: string) => {
    if(confirm("Na pewno usunąć ten projekt z archiwum?")) {
        const updated = projects.filter(p => p.id !== id);
        setProjects(updated);
        localStorage.setItem("profeProjectsV2", JSON.stringify(updated));
    }
  };

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    saveCurrentWorkToProject();
    const newProjId = e.target.value;
    const proj = projects.find(p => p.id === newProjId);
    if (proj && proj.pages.length > 0) {
        setActiveProjectId(newProjId);
        setActivePageId(proj.pages[0].id);
        loadPageToWorkspace(newProjId, proj.pages[0].id);
    }
  };

  const handlePageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    saveCurrentWorkToProject();
    const val = e.target.value;
    
    if (val === "NEW_PAGE" && activeProjectId) {
        const pageName = prompt("Podaj nazwę nowej podstrony (np. O nas, Kontakt):");
        if (!pageName) return;
        
        const safeName = pageName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        const newPage: PageData = {
            id: "page_" + Date.now(),
            name: pageName,
            isHome: false,
            fileName: `${safeName}.html`,
            documents: {},
            htmlContent: null,
            images: []
        };
        
        setProjects(prev => {
            const updated = prev.map(p => p.id === activeProjectId ? { ...p, pages: [...p.pages, newPage] } : p);
            localStorage.setItem("profeProjectsV2", JSON.stringify(updated));
            return updated;
        });
        
        setActivePageId(newPage.id);
        loadPageToWorkspace(activeProjectId, newPage.id);
    } else {
        setActivePageId(val);
        if (activeProjectId) loadPageToWorkspace(activeProjectId, val);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width; let height = img.height;
          const MAX_SIZE = 1200;
          if (width > height && width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } 
          else if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const webpDataUrl = canvas.toDataURL('image/webp', 0.8);
          const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
          const safeName = baseName.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();
          const finalName = `${safeName}.webp`;

          setImages(prev => [...prev, { name: finalName, dataUrl: webpDataUrl }]);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (nameToRemove: string) => {
    setImages(prev => prev.filter(img => img.name !== nameToRemove));
  };

  const getRenderedHtml = (rawHtml: string | null, imgs: UploadedImage[]) => {
    let finalHtml = rawHtml || "";
    if (!finalHtml) return finalHtml;
    imgs.forEach(img => {
        const regex = new RegExp(`src=["']([^"']*${img.name})["']`, 'gi');
        finalHtml = finalHtml.replace(regex, `src="${img.dataUrl}"`);
    });
    return finalHtml;
  };

  const activeProject = projects.find(p => p.id === activeProjectId);
  const activePage = activeProject?.pages.find(p => p.id === activePageId);

  const applyAutopilot = () => {
    if (!activeProject || !activePage) return;
    let basePrompt = "";
    if (activeStep === 1) basePrompt = `Zbuduj optymalną, nowoczesną strategię. Pracujemy nad stroną/podstroną: ${activePage.name}. Dopasuj strukturę i teksty konkretnie do jej celu.`;
    else if (activeStep === 2) basePrompt = `Działaj jako Senior Dev. Wygeneruj innowacyjny kod HTML dla podstrony: ${activePage.name}. Zachowaj 100% spójności wizualnej ze Stroną Główną. Pamiętaj o podlinkowaniu menu. Zwróć tylko HTML.`;
    else if (activeStep === 3) basePrompt = `Działaj jako Inżynier SEO. Optymalizuj kod HTML podstrony ${activePage.name} (JSON-LD, tagi ALT, dopracowane nagłówki). Odpowiedz co zmieniłeś i zwróć nowy kod.`;
    else if (activeStep === 4) basePrompt = `Zmapuj ten kod na architekturę Joomla / SP Page Builder.`;
    setInput(basePrompt);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !activeProject || !activePage) return;
    setIsLoading(true);
    setAiResponseText(null); 

    let projectContext = `\n\n--- INFORMACJE O SYSTEMIE ---\nPracujesz nad projektem: ${activeProject.name}.\nAktualnie edytowana podstrona: ${activePage.name} (plik: ${activePage.fileName}).\n`;
    
    const siteMap = activeProject.pages.map(p => `- ${p.name} -> link: ${p.fileName}`).join("\n");
    projectContext += `\n--- MAPA WITRYNY (UŻYJ W MENU I STOPCE) ---\n${siteMap}\n`;

    if (activeStep > 1 && Object.keys(documents).length > 0) {
      projectContext += "\n--- WIEDZA Z ETAPU 1 (Dla tej podstrony) ---\n";
      if (documents.doc1) projectContext += `STRATEGIA:\n${documents.doc1.substring(0, 500)}...\n`;
      if (documents.doc10) projectContext += `TEKSTY:\n${documents.doc10}\n`;
    }

    if ((activeStep === 2 || activeStep === 3) && htmlContent) {
      projectContext += `\n--- OBECNY KOD WIZUALNY TEJ PODSTRONY ---\n${htmlContent}\n`;
    }

    if ((activeStep === 2 || activeStep === 3) && !activePage.isHome) {
        const homePage = activeProject.pages.find(p => p.isHome);
        if (homePage && homePage.htmlContent) {
            const fullHome = homePage.htmlContent;
            const topPart = fullHome.substring(0, 2500); 
            const bottomPart = fullHome.substring(fullHome.length - 2000); 
            
            projectContext += `\n--- GLOBALNY DESIGN SYSTEM (KOD STRONY GŁÓWNEJ) ---\nTo jest kod referencyjny Strony Głównej. MUSISZ utrzymać z nim spójność!\nZadania dla Ciebie:\n1. Skopiuj cały blok <style> z sekcji <head> (zmienne CSS).\n2. Skopiuj dokładnie strukturę i klasy <header> oraz <nav>.\n3. Skopiuj dokładnie strukturę i klasy <footer>.\n4. W nowej podstronie stosuj ten sam język designu. Oto początek Głównej:\n${topPart}\n\n[...środek wycięty...]\n\nOto koniec Głównej:\n${bottomPart}\n`;
        }
    }

    if (images.length > 0 && (activeStep === 2 || activeStep === 3)) {
        const imageNames = images.map(img => img.name).join(", ");
        projectContext += `\n--- DOSTĘPNE ZDJĘCIA ---\nWgrane pliki: ${imageNames}. Użyj ich w tagach img (np. src="${images[0].name}").\n`;
    }

    const payloadMessage = input + projectContext;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: payloadMessage }], step: activeStep }),
      });
      const data = await res.json();
      
      if (data.reply) {
        let aiText = data.reply;
        let isDocGenerated = false;
        
        const extractDoc = (tag: string) => {
          const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
          const match = aiText.match(regex);
          return match ? match[1].trim() : null;
        };

        if (activeStep === 1 || activeStep === 4) {
          let d1 = extractDoc("DOC_1"); let d9 = extractDoc("DOC_9"); let d10 = extractDoc("DOC_10"); let d12 = extractDoc("DOC_12");
          let doc2 = extractDoc("DOC_2"); let doc3 = extractDoc("DOC_3"); let doc7 = extractDoc("DOC_7"); let doc13 = extractDoc("DOC_13");
          
          if (d1 || d10 || doc2 || doc3) {
            const newDocs = { ...documents };
            if (d1) newDocs["doc1"] = d1; if (d9) newDocs["doc9"] = d9; if (d10) newDocs["doc10"] = d10; if (d12) newDocs["doc12"] = d12;
            if (doc2) newDocs["doc2"] = doc2; if (doc3) newDocs["doc3"] = doc3; if (doc7) newDocs["doc7"] = doc7; if (doc13) newDocs["doc13"] = doc13;
            setDocuments(newDocs);
            isDocGenerated = true;
          }
        }

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
          isDocGenerated = true;
          aiText = aiText.replace(new RegExp(`<HTML>[\\s\\S]*?<\\/HTML>`, 'i'), "")
                         .replace(/```html[\s\S]*?```/i, "")
                         .replace(/(<!DOCTYPE html>[\s\S]*<\/html>)/i, "")
                         .trim();
        }

        const cleanAiText = aiText.replace(/<DOC_[0-9]+>[\s\S]*?<\/DOC_[0-9]+>/gi, "").trim();
        if (cleanAiText) setAiResponseText(cleanAiText);
        else if (isDocGenerated) setAiResponseText(null);
        
        saveCurrentWorkToProject();
        setTimeout(() => setInput(""), 1500);
      }
    } catch (e) {
      console.error(e);
      alert("⚠️ Wystąpił błąd podczas komunikacji z API.");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadFullProject = () => {
    if (!activeProject) return;
    saveCurrentWorkToProject(); 
    
    activeProject.pages.forEach((page, index) => {
        if (!page.htmlContent) return;
        setTimeout(() => {
            const processedHtml = getRenderedHtml(page.htmlContent, page.images);
            const fullHtml = `<!DOCTYPE html>\n<html lang="pl" class="antialiased">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>${page.name} - ${activeProject.name}</title>\n    <script src="https://unpkg.com/@tailwindcss/browser@4"></script>\n    <script src="https://unpkg.com/lucide@latest"></script>\n    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700;900&display=swap" rel="stylesheet">\n</head>\n<body class="bg-gray-50 text-slate-900">\n    ${processedHtml}\n    <script>lucide.createIcons();</script>\n</body>\n</html>`;
            const blob = new Blob([fullHtml], { type: "text/html" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = page.fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, index * 400); 
    });
  };

  // --- BLOKADA EKRANU (LOGOWANIE) ---
  if (status === "loading") return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-bold tracking-widest uppercase text-sm">Weryfikacja tożsamości...</div>;
  if (status === "unauthenticated" || !session) return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-sans">
          <div className="text-center mb-10"><h1 className="text-5xl font-black tracking-tighter text-white uppercase">Profe<span className="text-red-600">Architect</span> OS</h1></div>
          <button onClick={() => signIn('google')} className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,255,255,0.15)]">Zaloguj przez Google</button>
          <p className="text-[9px] text-slate-600 uppercase tracking-widest mt-8 max-w-xs text-center">Tylko administrator przypisany do tego środowiska otrzyma dostęp.</p>
      </div>
  )

  // --- EKRAN STARTOWY ---
  if (currentView === "landing") {
    return (
      <div className={`${darkMode ? "dark" : ""}`}>
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col items-center justify-center font-sans transition-colors duration-300">
          <div className="absolute top-8 text-center w-full">
            <h1 className="text-4xl font-black tracking-tighter text-gray-900 dark:text-white uppercase">Profe<span className="text-red-600">Architect</span> OS</h1>
            <p className="text-sm font-bold tracking-widest text-gray-400 uppercase mt-2">Zalogowany jako {session?.user?.email}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-8 items-center justify-center w-full max-w-5xl px-6">
            <button onClick={createNewProject} className="w-full sm:w-1/2 bg-red-600 hover:bg-red-700 text-white py-20 rounded-[2.5rem] shadow-2xl hover:-translate-y-3 group flex flex-col items-center transition-all duration-500">
              <svg className="w-20 h-20 mb-6 group-hover:scale-110 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
              <span className="text-4xl font-black uppercase tracking-tight">Nowy Projekt</span>
            </button>
            <button onClick={() => setCurrentView("list")} className="w-full sm:w-1/2 bg-gray-900 dark:bg-slate-800 hover:bg-black dark:hover:bg-slate-700 text-white py-20 rounded-[2.5rem] shadow-2xl hover:-translate-y-3 group flex flex-col items-center transition-all duration-500">
              <svg className="w-20 h-20 mb-6 group-hover:scale-110 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              <span className="text-4xl font-black uppercase tracking-tight">Archiwum</span>
            </button>
          </div>
          <button onClick={toggleTheme} className="fixed bottom-8 right-8 p-4 bg-white dark:bg-slate-800 rounded-full shadow-xl border border-gray-100 dark:border-slate-700 text-gray-800 dark:text-white">{darkMode ? "☀️" : "🌙"}</button>
          <button onClick={() => signOut()} className="fixed bottom-8 left-8 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-full shadow-xl border border-red-100 dark:border-red-800 font-bold text-xs uppercase tracking-widest hover:bg-red-100 transition">Wyloguj</button>
        </div>
      </div>
    );
  }

  // --- ARCHIWUM PROJEKTÓW ---
  if (currentView === "list") {
    return (
      <div className={`${darkMode ? "dark" : ""}`}>
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-200 overflow-hidden font-sans text-sm transition-colors duration-300">
          <nav className="h-16 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 z-50 shadow-sm transition-colors duration-300">
            <div className="flex items-center space-x-10">
              <span className="text-xl font-black tracking-tighter cursor-pointer dark:text-white" onClick={() => setCurrentView("landing")}>Profe<span className="text-red-600">Architect</span> OS</span>
            </div>
            <button onClick={() => setCurrentView("landing")} className="bg-gray-200 dark:bg-slate-800 hover:bg-gray-300 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest transition">Wróć</button>
          </nav>

          <div className="flex-1 overflow-y-auto p-12">
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-between items-end mb-12">
                <div><h2 className="text-4xl font-black dark:text-white tracking-tighter">Archiwum Projektów</h2></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {projects.map(p => {
                  const mainPage = p.pages.find(page => page.isHome) || p.pages[0];
                  return (
                  <div key={p.id} className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border border-gray-100 dark:border-slate-800 overflow-hidden flex flex-col group hover:-translate-y-2 transition-all duration-500">
                    <div className="h-48 bg-gray-100 dark:bg-slate-800 flex items-center justify-center border-b border-gray-100 dark:border-slate-800 overflow-hidden relative">
                       <iframe className="w-[200%] h-[200%] absolute origin-top-left scale-50 pointer-events-none" srcDoc={mainPage?.htmlContent || ""} />
                    </div>
                    <div className="p-8">
                      <h3 className="text-xl font-black dark:text-white mb-1 uppercase tracking-tight">{p.name}</h3>
                      <p className="text-[10px] font-bold text-red-600 uppercase mb-6 tracking-widest">{p.date} • {p.pages.length} podstron</p>
                      
                      {/* PRZYWRÓCONE PRZYCISKI EDYCJI I USUWANIA */}
                      <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => {
                            setActiveProjectId(p.id);
                            if(p.pages.length > 0) {
                                setActivePageId(p.pages[0].id);
                                loadPageToWorkspace(p.id, p.pages[0].id);
                            }
                            setCurrentView("wizard");
                        }} className="bg-slate-900 dark:bg-slate-700 text-white text-[10px] font-black uppercase py-3 rounded-xl hover:bg-black transition">Edytuj Projekt</button>
                        <button onClick={() => deleteProject(p.id)} className="text-[10px] font-bold text-red-500 uppercase py-3 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 rounded-xl transition">Usuń Projekt</button>
                      </div>

                    </div>
                  </div>
                )})}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- WARSZTAT ROBOCZY ---
  return (
    <div className={`${darkMode ? "dark" : ""}`}>
      <div className="flex flex-col h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-200 overflow-hidden font-sans text-sm transition-colors duration-300">
        <nav className="h-16 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 z-50 shadow-sm transition-colors duration-300">
          <div className="flex items-center space-x-10">
            <span className="text-xl font-black tracking-tighter cursor-pointer dark:text-white" onClick={() => { saveCurrentWorkToProject(); setCurrentView("landing"); }}>Profe<span className="text-red-600">Architect</span></span>
            
            {activeProject && (
              <div className="flex items-center space-x-2 bg-gray-50 dark:bg-slate-800 p-1.5 rounded-xl border border-gray-200 dark:border-slate-700">
                <select value={activeProjectId || ""} onChange={handleProjectChange} className="bg-transparent font-bold text-xs outline-none cursor-pointer text-gray-700 dark:text-gray-300 px-2 uppercase tracking-wide">
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <span className="text-gray-300 dark:text-slate-600 font-bold">/</span>
                <select value={activePageId || ""} onChange={handlePageChange} className="bg-transparent font-black text-xs outline-none cursor-pointer text-red-600 dark:text-red-500 px-2 uppercase tracking-wide">
                  {activeProject.pages.map(p => <option key={p.id} value={p.id}>{p.name} {p.isHome ? '(Główna)' : ''}</option>)}
                  <option value="NEW_PAGE" className="bg-red-50 text-red-700">+ Nowa Podstrona...</option>
                </select>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={toggleTheme} className="p-2 text-gray-500 hover:text-red-600 transition-colors">{darkMode ? "☀️" : "🌙"}</button>
            <button onClick={saveCurrentWorkToProject} className="bg-gray-200 dark:bg-slate-800 hover:bg-gray-300 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest transition">Zapisz Stan</button>
            <button onClick={downloadFullProject} className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition shadow-lg shadow-green-500/20">Wydaj Cały Projekt</button>
          </div>
        </nav>

        {activePage && (
          <>
            <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-8 py-6 flex justify-between items-center shrink-0">
              <div className="flex space-x-4 w-full max-w-5xl">
                {[
                  { step: 1, name: "Struktura", desc: "Strategia & Copy" },
                  { step: 2, name: "Visual", desc: "UI/UX & Design" },
                  { step: 3, name: "Optimization", desc: "SEO & AI" },
                  { step: 4, name: "Deployment", desc: "Joomla & Handoff" }
                ].map((s) => (
                  <div key={s.step} onClick={() => setActiveStep(s.step as any)} className={`flex-1 p-4 rounded-2xl border-2 transition-all cursor-pointer ${activeStep === s.step ? "border-red-600 bg-red-50 dark:bg-red-900/10" : "border-gray-50 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700"}`}>
                    <div className={`text-[10px] font-black uppercase tracking-widest ${activeStep === s.step ? "text-red-600" : "text-gray-400"}`}>Etap 0{s.step}</div>
                    <div className={`font-black mt-1 uppercase ${activeStep === s.step ? "text-slate-900 dark:text-white" : "text-gray-500"}`}>{s.name}</div>
                  </div>
                ))}
              </div>
              <div className="ml-8 flex space-x-4">
                <button onClick={() => setActiveStep((activeStep + 1) as any)} disabled={activeStep === 4} className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl disabled:opacity-20">Dalej</button>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              <div className="w-[450px] bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col shrink-0 relative">
                
                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
                  <div>
                    <h3 className="font-black uppercase tracking-tighter text-lg dark:text-white truncate max-w-[200px]">{activePage.name}</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Plik: {activePage.fileName}</p>
                  </div>
                  {activePage.isHome && <span className="bg-red-100 text-red-700 text-[9px] font-black uppercase px-2 py-1 rounded">Baza Globalna</span>}
                </div>
                
                <div className="flex-1 p-6 overflow-y-auto flex flex-col">
                  {!aiResponseText && (
                    <div className="space-y-2 mb-6 text-[11px] font-bold uppercase tracking-tight text-gray-500">
                      <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">Edytujesz podstronę: {activePage.name}</div>
                      {!activePage.isHome && <div className="p-3 bg-indigo-50 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 rounded-xl border border-indigo-100 dark:border-slate-700">AI skopiuje top i stopkę z Głównej!</div>}
                    </div>
                  )}
                  
                  {aiResponseText && (
                    <div className="bg-red-50 dark:bg-slate-800 border-l-4 border-red-500 p-5 rounded-r-2xl mb-4 shadow-sm">
                       <p className="text-xs font-semibold text-red-900 dark:text-red-200 mb-2 uppercase tracking-widest">Odpowiedź asystenta:</p>
                       <p className="text-sm font-medium text-gray-800 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">{aiResponseText}</p>
                    </div>
                  )}
                </div>

                {(activeStep === 2 || activeStep === 3) && (
                  <div className="px-6 pb-2">
                      <div className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-4">
                          <div className="flex justify-between items-center mb-3">
                             <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Zasoby / Obrazy</span>
                             <button onClick={() => fileInputRef.current?.click()} className="text-[10px] font-bold text-red-600 uppercase bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-lg hover:bg-red-100 transition">+ Dodaj</button>
                             <input type="file" multiple accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />
                          </div>
                          {images.length === 0 ? (
                             <p className="text-xs text-gray-400 italic">Brak załączników.</p>
                          ) : (
                             <div className="flex flex-wrap gap-4">
                                 {images.map(img => (
                                     <div key={img.name} className="flex flex-col items-center w-[60px]">
                                         <div className="group relative w-14 h-14 rounded-xl bg-gray-200 border border-gray-300 dark:border-slate-600 overflow-hidden shadow-sm">
                                             <img src={img.dataUrl} alt={img.name} className="w-full h-full object-cover" />
                                             <button onClick={() => removeImage(img.name)} className="absolute inset-0 bg-red-600/90 text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition flex items-center justify-center">X</button>
                                         </div>
                                         <span className="text-[8px] font-bold text-gray-600 dark:text-gray-300 mt-1.5 w-full text-center truncate bg-gray-200 dark:bg-slate-700 px-1 py-0.5 rounded shadow-sm" title={img.name}>{img.name}</span>
                                     </div>
                                 ))}
                             </div>
                          )}
                      </div>
                  </div>
                )}

                <div className="p-6 pt-2 border-t border-gray-100 dark:border-slate-800">
                  <div className="flex gap-2 mb-4">
                    <button onClick={applyAutopilot} className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-800 dark:text-white font-bold py-2 rounded-xl transition text-[10px] uppercase tracking-widest shadow-sm">Autopilot dla: {activePage.name}</button>
                  </div>
                  <textarea value={input} onChange={(e) => setInput(e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-red-500 outline-none dark:text-white shadow-inner" rows={3} placeholder={`Wydaj polecenie dla ${activePage.name}...`}></textarea>
                  <button onClick={sendMessage} disabled={isLoading} className={`w-full mt-4 text-white font-black py-4 rounded-2xl transition uppercase tracking-[0.2em] text-[10px] ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/30'}`}>
                    {isLoading ? "Przetwarzanie..." : "Wyślij"}
                  </button>
                </div>
              </div>
              
              <div className="flex-1 bg-gray-100 dark:bg-slate-950 p-8 overflow-y-auto relative flex flex-col items-center">
                
                {(activeStep === 2 || activeStep === 3) && htmlContent && (
                  <div className="bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm flex space-x-2 mb-6 sticky top-0 z-10 w-full max-w-5xl justify-between">
                    <div className="flex space-x-1">
                      {["desktop", "tablet", "mobile"].map((m) => (
                        <button key={m} onClick={() => setViewMode(m as any)} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${viewMode === m && !showCode ? "bg-gray-100 dark:bg-slate-900 text-red-600 dark:text-white shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>
                          {m}
                        </button>
                      ))}
                    </div>
                    <div className="flex space-x-1 bg-gray-100 dark:bg-slate-900 rounded-xl p-1">
                       <button onClick={() => setShowCode(false)} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${!showCode ? "bg-white dark:bg-slate-700 text-red-600 dark:text-white shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>Podgląd Wizualny</button>
                       <button onClick={() => setShowCode(true)} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${showCode ? "bg-white dark:bg-slate-700 text-red-600 dark:text-white shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>Kod HTML</button>
                    </div>
                  </div>
                )}

                <div className="w-full max-w-5xl">
                  {activeStep === 1 && (
                    Object.keys(documents).length === 0 ? (
                      <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-xl p-12 min-h-[400px] flex items-center justify-center border border-gray-100 dark:border-slate-800">
                        <p className="text-gray-400 dark:text-slate-500 font-medium text-lg uppercase tracking-widest text-center">Brak danych dla: {activePage.name}</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {["doc1", "doc9", "doc10", "doc12"].map(key => documents[key] && (
                          <div key={key} className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-800 p-8">
                            <h3 className="text-xl font-black uppercase text-red-600 mb-4 border-b border-gray-100 dark:border-slate-800 pb-4">
                              {key === "doc1" && "Architektura i Strategia Konwersji"}
                              {key === "doc9" && "Handoff Copywriterski"}
                              {key === "doc10" && "Wsad Tekstowy"}
                              {key === "doc12" && "Plan Mediów"}
                            </h3>
                            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">{documents[key]}</div>
                          </div>
                        ))}
                      </div>
                    )
                  )}

                  {(activeStep === 2 || activeStep === 3) && (
                    !htmlContent ? (
                      <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-xl p-12 min-h-[400px] flex items-center justify-center border border-gray-100 dark:border-slate-800">
                        <p className="text-gray-400 dark:text-slate-500 font-medium text-lg uppercase tracking-widest text-center">Wygeneruj kod dla {activePage.name}.</p>
                      </div>
                    ) : (
                      <div className="space-y-8">
                        <div className="flex justify-center w-full">
                          {showCode ? (
                             <div className="w-full bg-slate-900 rounded-[2rem] p-6 shadow-2xl border border-slate-700">
                                <textarea readOnly className="w-full h-[700px] bg-transparent text-emerald-400 font-mono text-xs outline-none" value={htmlContent} />
                             </div>
                          ) : (
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
                                     ${getRenderedHtml(htmlContent, images)}
                                     <script>lucide.createIcons();</script>
                                   </body>
                                 </html>
                               `} />
                             </div>
                          )}
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
                              <h3 className="text-xl font-black uppercase text-red-600 mb-4 border-b border-gray-100 dark:border-slate-800 pb-4">
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