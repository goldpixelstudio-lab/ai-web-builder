"use client";

import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "ai", text: "Witaj w wersji 6.0! Visual Engine aktywny. Dodaję teraz ikony, zdjęcia i grafiki. Co dzisiaj projektujemy?" }
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
    mobile: "390px",
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
        
        setMessages(prev => [...prev, { role: "ai", text: "Projekt został zaktualizowany wizualnie." }]);
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
          <h1 className="text-xl font-black tracking-tighter text-blue-700 uppercase italic">Visual Builder V6</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Design, Graphics & SEO Performance</p>
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
          {isLoading && <div className="text-blue-600 font-bold animate-pulse">Ładuję Visual Engine...</div>}
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-slate-100 relative">
          <textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 pr-16 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none transition-all font-medium placeholder-slate-400"
            rows={2}
            placeholder="Zaprojektuj sekcję z 3 usługami i ikonami..."
          ></textarea>
           <button onClick={sendMessage} className="absolute right-7 bottom-7 text-blue-600 hover:text-blue-800 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
           </button>
        </div>

        {/* Struktura Joomla */}
        <div className="h-[25%] bg-slate-900 flex flex-col shrink-0 overflow-hidden relative">
          <div className="bg-black/40 text-[10px] px-4 py-2 uppercase tracking-widest font-black text-slate-500 border-b border-white/5">Wdrożenie</div>
          <div className="p-5 overflow-y-auto flex-1 font-mono text-[11px] text-emerald-300 leading-relaxed">
            {schemaContent || "// Struktura pojawi się tutaj..."}
          </div>
        </div>
      </div>

      {/* OBSZAR PROJEKTOWY (Prawy) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Pasek narzędzi PRO */}
        <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-20 shadow-sm relative">
          <div className="flex space-x-2 h-full items-end">
            {["preview", "code", "seo"].map((t) => (
              <button key={t} onClick={() => setActiveTab(t as any)} className={`px-5 py-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === t ? "border-blue-700 text-blue-700" : "border-transparent text-slate-400 hover:text-slate-600"}`}>
                {t}
              </button>
            ))}
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            {(["desktop", "tablet", "mobile"] as const).map((m) => (
              <button key={m} onClick={() => setViewMode(m)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${viewMode === m ? "bg-white text-blue-700 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>
                {m}
              </button>
            ))}
          </div>
        </div>
        
        {/* Canvas */}
        <div className="flex-1 overflow-hidden flex items-center justify-center p-4 lg:p-8 bg-slate-200/50 relative">
          {activeTab === "preview" && (
            <div style={{ width: viewWidths[viewMode] }} className="h-full bg-white shadow-2xl transition-all duration-500 rounded-3xl overflow-hidden border border-slate-200 relative">
              {htmlContent ? (
                <iframe className="w-full h-full border-none" sandbox="allow-scripts allow-same-origin" srcDoc={`
                  <!DOCTYPE html>
                  <html class="antialiased">
                    <head>
                      <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
                      <script src="https://cdn.tailwindcss.com"></script>
                      
                      <script src="https://unpkg.com/lucide@latest"></script>
                      
                      <link href="https://fonts.googleapis.com/css2?family=Jakarta+Sans:wght@400;700;800&display=swap" rel="stylesheet">
                      <style>body { font-family: 'Jakarta Sans', sans-serif; }</style>
                    </head>
                    <body class="bg-white">
                      ${htmlContent}
                      
                      <script>lucide.createIcons();</script>
                    </body>
                  </html>
                `} />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-300 font-black italic text-2xl uppercase tracking-tighter">Visual Engine gotowy...</div>
              )}
            </div>
          )}

          {activeTab === "code" && (
            <div className="w-full h-full bg-[#0d1117] p-8 overflow-y-auto rounded-3xl shadow-2xl border border-white/5 relative">
              <pre className="text-emerald-100/80 font-mono text-xs leading-relaxed">{htmlContent}</pre>
            </div>
          )}

          {activeTab === "seo" && (
            <div className="w-full h-full bg-white p-10 overflow-y-auto rounded-3xl shadow-2xl border border-slate-200 relative">
              <div className="max-w-4xl mx-auto prose prose-blue prose-slate">
                <h2 className="text-3xl font-black text-slate-900 mb-8 border-b pb-4 italic tracking-tighter">Audyt Visual & AIO</h2>
                <div className="whitespace-pre-wrap text-slate-600 leading-relaxed font-medium">{seoContent}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}