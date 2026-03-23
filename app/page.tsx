"use client";

import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "ai", text: "System Bezkompromisowej Funkcjonalności aktywny. Projektuję z myślą o sprzedaży, SEO i pełnej responsywności. Co budujemy?" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [schemaContent, setSchemaContent] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [seoContent, setSeoContent] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<"preview" | "code" | "seo">("preview");
  const [viewMode, setViewMode] = useState<"desktop" | "tablet" | "mobile">("desktop");

  const viewWidths = {
    desktop: "100%",
    tablet: "768px",
    mobile: "390px", // Standard modern smartphone
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    setIsLoading(true);
    const updatedMessages = [...messages, { role: "user", text: input }];
    setMessages(updatedMessages);
    setInput("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages.map(m => ({ role: m.role === "ai" ? "assistant" : "user", content: m.text })) }),
      });
      const data = await res.json();
      
      if (data.reply) {
        let aiText = data.reply;
        const schema = aiText.match(/<SCHEMA>([\s\S]*?)<\/SCHEMA>/);
        const html = aiText.match(/<HTML>([\s\S]*?)<\/HTML>/);
        const seo = aiText.match(/<SEO>([\s\S]*?)<\/SEO>/);

        if (schema) setSchemaContent(schema[1].trim());
        if (seo) setSeoContent(seo[1].trim());
        if (html) {
          let cleanHtml = html[1].replace(/```html/gi, "").replace(/```/g, "").trim();
          setHtmlContent(cleanHtml);
        }
        
        setMessages(prev => [...prev, { role: "ai", text: "Projekt został zaktualizowany zgodnie z wytycznymi PRO." }]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-100 text-slate-900 overflow-hidden font-sans text-sm">
      
      {/* PANEL KONTROLNY (Lewy) */}
      <div className="w-full lg:w-[450px] bg-white border-r border-slate-200 flex flex-col shadow-2xl z-30 shrink-0 h-full">
        <div className="p-6 border-b border-slate-100 shrink-0">
          <h1 className="text-xl font-black tracking-tighter text-blue-700 uppercase italic">Profe Builder 4.0</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Sales & SEO Performance Engine</p>
        </div>

        {/* Czat */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/30">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`p-3.5 rounded-2xl max-w-[90%] shadow-sm ${msg.role === "user" ? "bg-blue-700 text-white" : "bg-white border border-slate-200 text-slate-700"}`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && <div className="text-blue-600 font-bold animate-pulse">Ekspert analizuje dane...</div>}
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-slate-100">
          <textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none transition-all font-medium"
            rows={2}
            placeholder="Wydaj polecenie (np. Zaprojektuj sekcję korzyści)..."
          ></textarea>
        </div>

        {/* Struktura Joomla */}
        <div className="h-[30%] bg-slate-900 flex flex-col shrink-0 overflow-hidden">
          <div className="bg-black/40 text-[10px] px-4 py-2 uppercase tracking-widest font-black text-slate-500 border-b border-white/5">Wdrożenie Joomla / SP Page Builder</div>
          <div className="p-5 overflow-y-auto flex-1 font-mono text-[11px] text-blue-300 leading-relaxed">
            {schemaContent || "// Wytyczne wdrożeniowe pojawią się tutaj..."}
          </div>
        </div>
      </div>

      {/* OBSZAR PROJEKTOWY (Prawy) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Pasek narzędzi PRO */}
        <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-20">
          <div className="flex space-x-2 h-full items-end">
            {["preview", "code", "seo"].map((t) => (
              <button key={t} onClick={() => setActiveTab(t as any)} className={`px-5 py-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === t ? "border-blue-700 text-blue-700" : "border-transparent text-slate-400 hover:text-slate-600"}`}>
                {t}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
              {(["desktop", "tablet", "mobile"] as const).map((m) => (
                <button key={m} onClick={() => setViewMode(m)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${viewMode === m ? "bg-white text-blue-700 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Canvas */}
        <div className="flex-1 overflow-hidden flex items-center justify-center p-6 lg:p-12 bg-slate-100/50">
          {activeTab === "preview" && (
            <div style={{ width: viewWidths[viewMode] }} className="h-full bg-white shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] transition-all duration-500 rounded-2xl overflow-hidden border border-slate-200">
              {htmlContent ? (
                <iframe className="w-full h-full border-none" sandbox="allow-scripts allow-same-origin" srcDoc={`
                  <!DOCTYPE html>
                  <html class="antialiased">
                    <head>
                      <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
                      <script src="https://cdn.tailwindcss.com"></script>
                      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700;800&display=swap" rel="stylesheet">
                      <style>body { font-family: 'Plus Jakarta Sans', sans-serif; }</style>
                    </head>
                    <body class="bg-white">${htmlContent}</body>
                  </html>
                `} />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-300 font-black italic text-xl uppercase tracking-tighter">Oczekiwanie na projekt PRO...</div>
              )}
            </div>
          )}

          {activeTab === "code" && (
            <div className="w-full h-full bg-[#0d1117] p-8 overflow-y-auto rounded-2xl shadow-2xl border border-white/5">
              <pre className="text-blue-100/80 font-mono text-xs leading-relaxed">{htmlContent}</pre>
            </div>
          )}

          {activeTab === "seo" && (
            <div className="w-full h-full bg-white p-10 overflow-y-auto rounded-2xl shadow-2xl border border-slate-200">
              <div className="max-w-4xl mx-auto prose prose-blue prose-slate">
                <h2 className="text-3xl font-black text-slate-900 mb-8 border-b pb-4 italic tracking-tighter">Audyt Ekspercki & Strategia SEO/AIO</h2>
                <div className="whitespace-pre-wrap text-slate-600 leading-relaxed font-medium">{seoContent}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}