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
  refImages: UploadedImage[];
}

interface Project {
  id: string;
  name: string;
  date: string;
  createdAt?: string; // Nowe pola czasu
  updatedAt?: string; // Nowe pola czasu
  pages: PageData[];
}

export default function Home() {
  const { data: session, status } = useSession();

  const [currentView, setCurrentView] = useState<"landing" | "list" | "wizard">("landing");
  const [projects, setProjects] = useState<Project[]>([]);
  
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [documents, setDocuments] = useState<Record<string, string>>({});
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [refImages, setRefImages] = useState<UploadedImage[]>([]);
  
  const [viewMode, setViewMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [showCode, setShowCode] = useState(false);
  const [aiResponseText, setAiResponseText] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const refInputRef = useRef<HTMLInputElement>(null);
  const importProjectRef = useRef<HTMLInputElement>(null); // Referencja dla importu JSON

  const viewWidths = { desktop: "100%", tablet: "768px", mobile: "390px" };

  useEffect(() => {
    const savedProjects = localStorage.getItem("profeProjectsV2");
    if (savedProjects) setProjects(JSON.parse(savedProjects));
    const savedTheme = localStorage.getItem("profeTheme");
    if (savedTheme === "dark") setDarkMode(true);
  }, []);

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("profeTheme", newMode ? "dark" : "light");
  };

  const getFormattedDate = () => new Date().toLocaleString("pl-PL");

  const saveCurrentWorkToProject = () => {
    if (!activeProjectId || !activePageId) return;
    setProjects(prev => {
        const updated = prev.map(proj => {
            if (proj.id !== activeProjectId) return proj;
            return {
                ...proj,
                updatedAt: getFormattedDate(), // Zaktualizowana data modyfikacji
                pages: proj.pages.map(page => {
                    if (page.id !== activePageId) return page;
                    return { ...page, documents, htmlContent, images, refImages };
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
    setRefImages(page.refImages || []);
    setActiveStep(1);
    setAiResponseText(null);
    setInput("");
  };

  const createNewProject = () => {
    const name = prompt("Podaj nazwę nowego projektu:");
    if (!name) return;
    
    // Zabezpieczenie przed dublowaniem nazw
    if (projects.some(p => p.name.toLowerCase() === name.toLowerCase())) {
        alert("Projekt o takiej nazwie już istnieje. Wybierz inną.");
        return;
    }
    
    const newProjectId = Date.now().toString();
    const currentDate = getFormattedDate();

    const defaultPage: PageData = {
        id: "page_" + Date.now(), name: "Strona Główna", isHome: true, fileName: "index.html",
        documents: {}, htmlContent: null, images: [], refImages: []
    };
    
    const newProject: Project = {
        id: newProjectId, name: name, date: new Date().toLocaleDateString(), 
        createdAt: currentDate, updatedAt: currentDate,
        pages: [defaultPage]
    };

    const updatedProjects = [...projects, newProject];
    setProjects(updatedProjects);
    localStorage.setItem("profeProjectsV2", JSON.stringify(updatedProjects));
    
    setActiveProjectId(newProjectId); setActivePageId(defaultPage.id);
    loadPageToWorkspace(newProjectId, defaultPage.id);
    setCurrentView("wizard");
  };

  const saveProjectAs = () => {
    const activeProject = projects.find(p => p.id === activeProjectId);
    if (!activeProject) return;
    
    const newName = prompt("Zapisz bieżący projekt jako nową wersję (podaj nazwę):", activeProject.name + " - Wersja 2");
    if (!newName) return;

    if (projects.some(p => p.name.toLowerCase() === newName.toLowerCase())) {
        alert("Projekt o takiej nazwie już istnieje. Wybierz inną.");
        return;
    }

    saveCurrentWorkToProject();

    const newProjectId = Date.now().toString();
    const currentDate = getFormattedDate();

    const duplicatedPages = activeProject.pages.map(page => ({
        ...page,
        id: "page_" + Date.now() + Math.random().toString(36).substr(2, 9)
    }));

    const newProject: Project = {
        ...activeProject,
        id: newProjectId,
        name: newName,
        date: new Date().toLocaleDateString(),
        createdAt: currentDate,
        updatedAt: currentDate,
        pages: duplicatedPages
    };

    setProjects(prev => {
        const updated = [...prev, newProject];
        localStorage.setItem("profeProjectsV2", JSON.stringify(updated));
        return updated;
    });

    setActiveProjectId(newProjectId);
    setActivePageId(duplicatedPages[0].id);
    loadPageToWorkspace(newProjectId, duplicatedPages[0].id);
    alert(`Stworzono nową wersję projektu: ${newName}`);
  };

  const deleteProject = (id: string) => {
    if(confirm("Na pewno usunąć ten projekt z archiwum?")) {
        const updated = projects.filter(p => p.id !== id);
        setProjects(updated);
        localStorage.setItem("profeProjectsV2", JSON.stringify(updated));
    }
  };

  // --- IMPORT / EXPORT PROJEKTÓW (JSON) ---
  const exportProjectJson = (project: Project) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(project));
    const a = document.createElement("a");
    a.href = dataStr;
    a.download = `${project.name.replace(/\s+/g, '-').toLowerCase()}-backup.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleProjectImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const importedProject: Project = JSON.parse(event.target?.result as string);
            
            if (!importedProject.id || !importedProject.name || !importedProject.pages) {
                throw new Error("Nieprawidłowy format pliku projektu.");
            }
            
            let finalName = importedProject.name;
            if (projects.some(p => p.name.toLowerCase() === finalName.toLowerCase())) {
                finalName = finalName + " (Import)";
            }
            
            importedProject.name = finalName;
            importedProject.id = Date.now().toString(); // Reset ID dla pewności braku kolizji
            importedProject.createdAt = getFormattedDate();
            importedProject.updatedAt = getFormattedDate();
            
            setProjects(prev => {
                const updated = [...prev, importedProject];
                localStorage.setItem("profeProjectsV2", JSON.stringify(updated));
                return updated;
            });
            alert("Projekt zaimportowany pomyślnie!");
        } catch (err) {
            alert("Błąd podczas importowania projektu: " + (err as Error).message);
        }
    };
    reader.readAsText(file);
    if(importProjectRef.current) importProjectRef.current.value = "";
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
            id: "page_" + Date.now(), name: pageName, isHome: false, fileName: `${safeName}.html`,
            documents: {}, htmlContent: null, images: [], refImages: []
        };
        setProjects(prev => {
            const updated = prev.map(p => p.id === activeProjectId ? { 
                ...p, 
                updatedAt: getFormattedDate(), 
                pages: [...p.pages, newPage] 
            } : p);
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

  const processImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isReference: boolean) => {
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

          if (isReference) {
              setRefImages(prev => [...prev, { name: finalName, dataUrl: webpDataUrl }]);
          } else {
              setImages(prev => [...prev, { name: finalName, dataUrl: webpDataUrl }]);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  // DODANA FUNKCJA USUWANIA ZDJĘĆ
  const removeImage = (nameToRemove: string) => {
    setImages(prev => prev.filter(img => img.name !== nameToRemove));
    setRefImages(prev => prev.filter(img => img.name !== nameToRemove));
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
    if (activeStep === 1) basePrompt = `Zbuduj optymalną, nowoczesną strategię dla: ${activePage.name}.`;
    else if (activeStep === 2) basePrompt = `Działaj jako Senior Dev. Wygeneruj innowacyjny kod HTML dla: ${activePage.name}. Jeśli załączyłem zdjęcia w sekcji INSPIRACJE lub linki URL - zbuduj design w oparciu o nie. Zachowaj 100% spójności ze Stroną Główną. Wstaw Assety (zdjęcia do osadzenia). Zwróć tylko HTML.`;
    else if (activeStep === 3) basePrompt = `Działaj jako Inżynier SEO. Optymalizuj obecny kod HTML podstrony ${activePage.name} (JSON-LD, tagi ALT). Odpowiedz w dymku co zmieniłeś i zwróć HTML.`;
    else if (activeStep === 4) basePrompt = `Zmapuj projekt pod Joomla / SP Page Builder.`;
    else if (activeStep === 5) basePrompt = `Zmapuj projekt pod WordPress i Elementor.`;
    else if (activeStep === 6) basePrompt = `Przygotuj pełną dokumentację techniczną i instrukcję obsługi.`;
    setInput(basePrompt);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !activeProject || !activePage) return;
    setIsLoading(true);
    setAiResponseText(null); 

    let projectContext = `\n\n--- KONTEKST PROJEKTU ---\nProjekt: ${activeProject.name}\nPodstrona: ${activePage.name}\nMap: ${activeProject.pages.map(p => p.fileName).join(", ")}\n`;
    
    if (activeStep > 1 && Object.keys(documents).length > 0) {
      projectContext += `\n--- WIEDZA (ETAP 1) ---\nSTRATEGIA:\n${documents.doc1?.substring(0, 500) || ""}\nTEKSTY:\n${documents.doc10 || ""}\n`;
    }
    if ((activeStep === 2 || activeStep === 3) && htmlContent) {
      projectContext += `\n--- OBECNY KOD HTML TEJ PODSTRONY ---\n${htmlContent}\n`;
    }
    if ((activeStep === 2 || activeStep === 3) && !activePage.isHome) {
        const homePage = activeProject.pages.find(p => p.isHome);
        if (homePage && homePage.htmlContent) {
            projectContext += `\n--- BAZA DESIGNU (STRONA GŁÓWNA) ---\nZachowaj poniższe menu i stopkę:\n${homePage.htmlContent.substring(0, 2000)}\n[...]\n${homePage.htmlContent.substring(homePage.htmlContent.length - 2000)}\n`;
        }
    }
    if (images.length > 0 && (activeStep === 2 || activeStep === 3)) {
        projectContext += `\n--- DOSTĘPNE ZDJĘCIA (ASSETY DO OSADZENIA) ---\nWgrane pliki: ${images.map(img => img.name).join(", ")}. Użyj ich np. src="${images[0].name}".\n`;
    }

    let payloadMessage: any = input + projectContext;

    if (refImages.length > 0 && activeStep === 2) {
        payloadMessage = [
            { type: "text", text: input + projectContext + "\n--- GRAFIKI REFERENCYJNE (INSPIRACJE) ---\nPrzeanalizuj poniższe grafiki. Odtwórz ich układ, styl i kolorystykę w kodzie Tailwind CSS." }
        ];
        refImages.forEach(img => {
            payloadMessage.push({ type: "image_url", image_url: { url: img.dataUrl } });
        });
    }

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
          const match = aiText.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
          return match ? match[1].trim() : null;
        };

        if (activeStep === 1 || activeStep === 4 || activeStep === 5 || activeStep === 6) {
          let d1 = extractDoc("DOC_1"); let d9 = extractDoc("DOC_9"); let d10 = extractDoc("DOC_10"); let d12 = extractDoc("DOC_12");
          let doc2 = extractDoc("DOC_2"); let doc3 = extractDoc("DOC_3"); let doc7 = extractDoc("DOC_7"); let doc13 = extractDoc("DOC_13");
          let doc14 = extractDoc("DOC_14"); let doc15 = extractDoc("DOC_15"); 
          let doc16 = extractDoc("DOC_16"); let doc17 = extractDoc("DOC_17");
          
          const newDocs = { ...documents };
          let changed = false;
          
          if (d1) { newDocs["doc1"] = d1; changed = true; }
          if (d9) { newDocs["doc9"] = d9; changed = true; }
          if (d10) { newDocs["doc10"] = d10; changed = true; }
          if (d12) { newDocs["doc12"] = d12; changed = true; }
          if (doc2) { newDocs["doc2"] = doc2; changed = true; }
          if (doc3) { newDocs["doc3"] = doc3; changed = true; }
          if (doc7) { newDocs["doc7"] = doc7; changed = true; }
          if (doc13) { newDocs["doc13"] = doc13; changed = true; }
          if (doc14) { newDocs["doc14"] = doc14; changed = true; }
          if (doc15) { newDocs["doc15"] = doc15; changed = true; }
          if (doc16) { newDocs["doc16"] = doc16; changed = true; }
          if (doc17) { newDocs["doc17"] = doc17; changed = true; }

          if (changed) {
            setDocuments(newDocs);
            isDocGenerated = true;
          }
        }

        let html = extractDoc("HTML") || aiText.match(/```html([\s\S]*?)```/i)?.[1] || aiText.match(/(<!DOCTYPE html>[\s\S]*<\/html>)/i)?.[1];
        if (html) {
          setHtmlContent(html.replace(/```html/gi, "").replace(/```/g, "").trim());
          isDocGenerated = true;
          aiText = aiText.replace(new RegExp(`<HTML>[\\s\\S]*?<\\/HTML>`, 'i'), "").replace(/```html[\s\S]*?```/i, "").replace(/(<!DOCTYPE html>[\s\S]*<\/html>)/i, "").trim();
        }

        const cleanAiText = aiText.replace(/<DOC_[0-9]+>[\s\S]*?<\/DOC_[0-9]+>/gi, "").trim();
        if (cleanAiText) setAiResponseText(cleanAiText); else if (isDocGenerated) setAiResponseText(null);
        
        saveCurrentWorkToProject();
        setTimeout(() => setInput(""), 1000);
      }
    } catch (e) {
      console.error(e); alert("⚠️ Wystąpił błąd.");
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
            const fullHtml = processedHtml.includes("<!DOCTYPE html>") ? processedHtml : `<!DOCTYPE html>\n<html lang="pl">\n<head>\n<meta charset="UTF-8">\n<script src="https://unpkg.com/@tailwindcss/browser@4"></script>\n<script src="https://unpkg.com/lucide@latest"></script>\n</head>\n<body>${processedHtml}<script>lucide.createIcons();</script></body></html>`;
            const blob = new Blob([fullHtml], { type: "text/html" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = page.fileName;
            document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
        }, index * 400); 
    });
  };

  if (status === "loading") return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-bold tracking-widest uppercase text-sm">Weryfikacja...</div>;
  if (status === "unauthenticated" || !session) return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-sans">
          <div className="text-center mb-10"><h1 className="text-5xl font-black tracking-tighter text-white uppercase">Profe<span className="text-red-600">Architect</span> OS</h1></div>
          <button onClick={() => signIn('google')} className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,255,255,0.15)]">Zaloguj przez Google</button>
      </div>
  )

  if (currentView === "landing") {
    return (
      <div className={`${darkMode ? "dark" : ""}`}>
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col items-center justify-center font-sans transition-colors duration-300">
          <div className="absolute top-8 text-center w-full">
            <h1 className="text-4xl font-black tracking-tighter text-gray-900 dark:text-white uppercase">Profe<span className="text-red-600">Architect</span> OS</h1>
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
        </div>
      </div>
    );
  }

  if (currentView === "list") {
    return (
      <div className={`${darkMode ? "dark" : ""}`}>
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-200 overflow-hidden font-sans text-sm transition-colors duration-300">
          <nav className="h-16 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 z-50 shadow-sm transition-colors duration-300">
            <div className="flex items-center space-x-10"><span className="text-xl font-black tracking-tighter cursor-pointer dark:text-white" onClick={() => setCurrentView("landing")}>Profe<span className="text-red-600">Architect</span> OS</span></div>
            <div className="flex items-center space-x-4">
              <button onClick={() => importProjectRef.current?.click()} className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 hover:bg-indigo-100 px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest transition">Importuj Projekt JSON</button>
              <input type="file" accept=".json" ref={importProjectRef} className="hidden" onChange={handleProjectImport} />
              <button onClick={() => setCurrentView("landing")} className="bg-gray-200 dark:bg-slate-800 hover:bg-gray-300 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest transition">Wróć</button>
            </div>
          </nav>
          <div className="flex-1 overflow-y-auto p-12">
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-between items-end mb-12">
                <div><h2 className="text-4xl font-black dark:text-white tracking-tighter">Archiwum Projektów</h2></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {projects.map(p => (
                  <div key={p.id} className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl overflow-hidden flex flex-col group hover:-translate-y-2 transition-all duration-500 border border-gray-100 dark:border-slate-800">
                    <div className="h-40 bg-gray-100 dark:bg-slate-800 flex items-center justify-center relative border-b border-gray-100 dark:border-slate-800">
                      <iframe className="w-[200%] h-[200%] absolute origin-top-left scale-50 pointer-events-none" srcDoc={p.pages[0]?.htmlContent || ""} />
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <h3 className="text-xl font-black uppercase truncate text-slate-900 dark:text-white" title={p.name}>{p.name}</h3>
                      
                      <div className="text-[9px] font-bold text-gray-500 uppercase mt-3 mb-5 space-y-1">
                        <p>Utworzono: <span className="text-red-600">{p.createdAt || p.date}</span></p>
                        <p>Zaktualizowano: <span className="text-red-600">{p.updatedAt || p.date}</span></p>
                        <p>Podstron w bazie: <span className="text-red-600">{p.pages.length}</span></p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mt-auto">
                        <button onClick={() => { setActiveProjectId(p.id); setActivePageId(p.pages[0].id); loadPageToWorkspace(p.id, p.pages[0].id); setCurrentView("wizard"); }} className="bg-slate-900 dark:bg-slate-700 text-white text-[10px] font-black uppercase py-2.5 rounded-xl hover:bg-black transition">Edytuj</button>
                        <button onClick={() => exportProjectJson(p)} className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-100 text-[10px] font-black uppercase py-2.5 rounded-xl transition">Pobierz JSON</button>
                        <button onClick={() => deleteProject(p.id)} className="col-span-2 text-[10px] font-bold text-red-500 uppercase py-2.5 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 rounded-xl transition mt-1">Usuń z archiwum</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${darkMode ? "dark" : ""}`}>
      <div className="flex flex-col h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-200 overflow-hidden font-sans text-sm transition-colors duration-300">
        <nav className="h-16 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 z-50 shadow-sm transition-colors duration-300">
          <div className="flex items-center space-x-10">
            <span className="text-xl font-black tracking-tighter cursor-pointer dark:text-white" onClick={() => { saveCurrentWorkToProject(); setCurrentView("landing"); }}>Profe<span className="text-red-600">Architect</span></span>
            {activeProject && (
              <div className="flex items-center space-x-2 bg-gray-50 dark:bg-slate-800 p-1.5 rounded-xl border border-gray-200 dark:border-slate-700">
                <select value={activeProjectId || ""} onChange={handleProjectChange} className="bg-transparent font-bold text-xs outline-none cursor-pointer text-gray-700 dark:text-gray-300 px-2 uppercase tracking-wide w-32 truncate">
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <span className="text-gray-300 dark:text-slate-600 font-bold">/</span>
                <select value={activePageId || ""} onChange={handlePageChange} className="bg-transparent font-black text-xs outline-none cursor-pointer text-red-600 dark:text-red-500 px-2 uppercase tracking-wide w-32 truncate">
                  {activeProject.pages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  <option value="NEW_PAGE" className="bg-red-50 text-red-700">+ Nowa Podstrona...</option>
                </select>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={() => { saveCurrentWorkToProject(); setCurrentView("list"); }} className="bg-transparent border border-gray-300 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:text-red-600 px-4 py-2 rounded-xl font-bold text-[10px] uppercase transition">Archiwum</button>
            <button onClick={saveProjectAs} className="bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 text-indigo-600 px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest transition">💾 Zapisz jako...</button>
            <button onClick={saveCurrentWorkToProject} className="bg-gray-200 dark:bg-slate-800 hover:bg-gray-300 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest transition">Zapisz Stan</button>
            <button onClick={downloadFullProject} className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition shadow-lg">Wydaj Projekt</button>
            <button onClick={() => signOut()} className="bg-transparent border border-gray-300 dark:border-slate-700 text-gray-600 dark:text-slate-400 px-4 py-2 rounded-xl font-bold text-[10px] uppercase transition hover:text-red-500">Wyloguj</button>
          </div>
        </nav>

        {activePage && (
          <>
            <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-8 py-4 flex justify-between items-center shrink-0">
              <div className="flex space-x-2 w-full max-w-6xl">
                {[ { step: 1, name: "Struktura" }, { step: 2, name: "Visual" }, { step: 3, name: "SEO & AI" }, { step: 4, name: "Joomla" }, { step: 5, name: "WordPress" }, { step: 6, name: "Docs" } ].map((s) => (
                  <div key={s.step} onClick={() => setActiveStep(s.step as any)} className={`flex-1 p-3 rounded-xl border-2 transition-all cursor-pointer ${activeStep === s.step ? "border-red-600 bg-red-50 dark:bg-red-900/10" : "border-gray-50 dark:border-slate-800"}`}>
                    <div className={`text-[9px] font-black uppercase tracking-widest ${activeStep === s.step ? "text-red-600" : "text-gray-400"}`}>Etap {s.step}</div>
                    <div className="font-black mt-0.5 text-xs uppercase">{s.name}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              <div className="w-[450px] bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col shrink-0 relative">
                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-b border-gray-100 dark:border-slate-800">
                  <h3 className="font-black uppercase tracking-tighter text-lg dark:text-white truncate">{activePage.name}</h3>
                </div>
                
                <div className="flex-1 p-6 overflow-y-auto flex flex-col">
                  {aiResponseText && (
                    <div className="bg-red-50 dark:bg-slate-800 border-l-4 border-red-500 p-5 rounded-r-2xl mb-4 shadow-sm">
                       <p className="text-xs font-semibold text-red-900 dark:text-red-200 mb-2 uppercase tracking-widest">Odpowiedź asystenta:</p>
                       <p className="text-sm font-medium text-gray-800 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">{aiResponseText}</p>
                    </div>
                  )}

                  {activeStep === 2 && (
                    <div className="space-y-4 mt-auto">
                        <div className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-4">
                            <div className="flex justify-between items-center mb-3">
                               <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Zdjęcia na stronę (Assety)</span>
                               <button onClick={() => fileInputRef.current?.click()} className="text-[10px] font-bold text-red-600 uppercase bg-red-50 px-3 py-1 rounded-lg hover:bg-red-100 transition">+ Dodaj</button>
                               <input type="file" multiple accept="image/*" ref={fileInputRef} className="hidden" onChange={(e) => processImageUpload(e, false)} />
                            </div>
                            <div className="flex flex-wrap gap-2">
                               {images.map(img => (
                                   <div key={img.name} className="relative w-10 h-10 rounded bg-gray-200 group"><img src={img.dataUrl} className="w-full h-full object-cover rounded" /><button onClick={() => removeImage(img.name)} className="absolute inset-0 bg-red-600/90 text-white text-xs opacity-0 group-hover:opacity-100 flex items-center justify-center">X</button></div>
                               ))}
                            </div>
                        </div>
                        <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30 rounded-2xl p-4">
                            <div className="flex justify-between items-center mb-3">
                               <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Grafika Inspiracyjna (Vision)</span>
                               <button onClick={() => refInputRef.current?.click()} className="text-[10px] font-bold text-indigo-600 uppercase bg-indigo-100 px-3 py-1 rounded-lg">+ Wgraj Wzór</button>
                               <input type="file" multiple accept="image/*" ref={refInputRef} className="hidden" onChange={(e) => processImageUpload(e, true)} />
                            </div>
                            <div className="flex flex-wrap gap-2">
                               {refImages.map(img => (
                                   <div key={img.name} className="relative w-10 h-10 rounded bg-gray-200 group"><img src={img.dataUrl} className="w-full h-full object-cover rounded" /><button onClick={() => removeImage(img.name)} className="absolute inset-0 bg-red-600/90 text-white text-xs opacity-0 group-hover:opacity-100 flex items-center justify-center">X</button></div>
                               ))}
                            </div>
                        </div>
                    </div>
                  )}
                </div>

                <div className="p-6 pt-2 border-t border-gray-100 dark:border-slate-800">
                  <textarea value={input} onChange={(e) => setInput(e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-red-500 outline-none dark:text-white" rows={3} placeholder={activeStep === 2 ? "Wpisz polecenie lub podaj linki (URL) do inspiracji..." : "Polecenie dla asystenta..."}></textarea>
                  <button onClick={sendMessage} disabled={isLoading} className={`w-full mt-4 text-white font-black py-4 rounded-2xl transition uppercase tracking-[0.2em] text-[10px] ${isLoading ? 'bg-gray-400' : 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/30'}`}>
                    {isLoading ? "Przetwarzanie..." : "Wyślij"}
                  </button>
                </div>
              </div>
              
              <div className="flex-1 bg-gray-100 dark:bg-slate-950 p-8 overflow-y-auto relative flex flex-col items-center">
                {(activeStep === 2 || activeStep === 3) && htmlContent && (
                  <div className="bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm flex space-x-2 mb-6 sticky top-0 z-10 w-full max-w-5xl justify-between">
                    <div className="flex space-x-1">
                      {["desktop", "tablet", "mobile"].map((m) => (
                        <button key={m} onClick={() => setViewMode(m as any)} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${viewMode === m && !showCode ? "bg-gray-100 dark:bg-slate-900 text-red-600" : "text-gray-400"}`}>{m}</button>
                      ))}
                    </div>
                    <div className="flex space-x-1 bg-gray-100 dark:bg-slate-900 rounded-xl p-1">
                       <button onClick={() => setShowCode(false)} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${!showCode ? "bg-white text-red-600" : "text-gray-400"}`}>Podgląd Wizualny</button>
                       <button onClick={() => setShowCode(true)} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${showCode ? "bg-white text-red-600" : "text-gray-400"}`}>Kod HTML</button>
                    </div>
                  </div>
                )}
                
                <div className="w-full max-w-5xl">
                   {(activeStep === 2 || activeStep === 3) && htmlContent ? (
                       showCode ? (
                           <div className="w-full bg-slate-900 rounded-[2rem] p-6 shadow-2xl border border-slate-700"><textarea readOnly className="w-full h-[700px] bg-transparent text-emerald-400 font-mono text-xs outline-none" value={htmlContent} /></div>
                       ) : (
                           <div style={{ width: viewWidths[viewMode] }} className="h-[750px] bg-white shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] transition-all duration-500 rounded-[2rem] overflow-hidden border border-gray-200 relative">
                               <iframe className="w-full h-full border-none" sandbox="allow-scripts allow-same-origin" srcDoc={`<!DOCTYPE html><html lang="pl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><script src="https://unpkg.com/@tailwindcss/browser@4"></script><script src="https://unpkg.com/lucide@latest"></script><link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700;900&display=swap" rel="stylesheet"></head><body>${getRenderedHtml(htmlContent, images)}<script>lucide.createIcons();</script></body></html>`} />
                           </div>
                       )
                   ) : activeStep === 1 || activeStep === 4 || activeStep === 5 || activeStep === 6 ? (
                       <div className="space-y-6">
                           {activeStep === 1 && Object.keys(documents).filter(k => ["doc1", "doc9", "doc10", "doc12"].includes(k)).length === 0 && <div className="bg-white p-12 text-center rounded-3xl">Brak danych. Wpisz polecenie.</div>}
                           {activeStep === 4 && Object.keys(documents).filter(k => ["doc2", "doc3", "doc7", "doc13"].includes(k)).length === 0 && <div className="bg-white p-12 text-center rounded-3xl">Brak danych dla Joomla. Wpisz polecenie.</div>}
                           {activeStep === 5 && Object.keys(documents).filter(k => ["doc14", "doc15"].includes(k)).length === 0 && <div className="bg-white p-12 text-center rounded-3xl">Brak danych dla WordPress. Wpisz polecenie.</div>}
                           {activeStep === 6 && Object.keys(documents).filter(k => ["doc16", "doc17"].includes(k)).length === 0 && <div className="bg-white p-12 text-center rounded-3xl">Brak dokumentacji końcowej. Wpisz polecenie.</div>}
                           
                           {["doc1", "doc9", "doc10", "doc12", "doc2", "doc3", "doc7", "doc13", "doc14", "doc15", "doc16", "doc17"].map(key => {
                               if (!documents[key]) return null;
                               const stepMap: Record<string, number> = { doc1:1, doc9:1, doc10:1, doc12:1, doc2:4, doc3:4, doc7:4, doc13:4, doc14:5, doc15:5, doc16:6, doc17:6 };
                               if (stepMap[key] !== activeStep) return null;
                               
                               const titles: Record<string, string> = {
                                   doc1: "Architektura", doc9: "Handoff Copywriterski", doc10: "Wsad Tekstowy", doc12: "Plan Mediów",
                                   doc2: "Architektura SP Page Builder", doc3: "Tabela Joomla", doc7: "Master Handoff", doc13: "QA Checklist",
                                   doc14: "Architektura Elementor", doc15: "Tabela WordPress",
                                   doc16: "Dokumentacja Techniczna", doc17: "Instrukcja dla Klienta"
                               };
                               return (
                                  <div key={key} className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-800 p-8">
                                      <h3 className="text-xl font-black uppercase text-red-600 mb-4 border-b border-gray-100 pb-4">{titles[key]}</h3>
                                      <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">{documents[key]}</div>
                                  </div>
                               )
                           })}
                       </div>
                   ) : (
                       <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-xl p-12 min-h-[400px] flex items-center justify-center border border-gray-100 dark:border-slate-800">
                          <p className="text-gray-400 uppercase tracking-widest text-center text-sm">Brak widoku. Wygeneruj kod.</p>
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