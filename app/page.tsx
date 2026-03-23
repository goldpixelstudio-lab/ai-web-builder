"use client";

import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "ai", text: "Witaj w wersji 3.0! Moduł analizy SEO i AIO został aktywowany. Co dzisiaj projektujemy?" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Stany dla wygenerowanych treści
  const [schemaContent, setSchemaContent] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [seoContent, setSeoContent] = useState<string | null>(null);
  
  // Stan dla aktywnej zakładki (preview, code, seo)
  const [activeTab, setActiveTab] = useState<"preview" | "code" | "seo">("preview");

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput("");
    
    const updatedMessages = [...messages, { role: "user", text: userMessage }];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const apiMessages = updatedMessages.map(msg => ({
        role: msg.role === "ai" ? "assistant" : "user",
        content: msg.text
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });
      
      const data = await res.json();
      
      if (data.reply) {
        let aiText = data.reply;
        let hasUpdates = false;
        
        // Wyciągamy SCHEMA
        const schemaMatch = aiText.match(/<SCHEMA>([\s\S]*?)<\/SCHEMA>/);
        if (schemaMatch) {
          setSchemaContent(schemaMatch[1].trim());
          aiText = aiText.replace(/<SCHEMA>[\s\S]*?<\/SCHEMA>/, ""); 
          hasUpdates = true;
        }

        // Wyciągamy SEO
        const seoMatch = aiText.match(/<SEO>([\s\S]*?)<\/SEO>/);
        if (seoMatch) {
          setSeoContent(seoMatch[1].trim());
          aiText = aiText.replace(/<SEO>[\s\S]*?<\/SEO>/, "");
          hasUpdates = true;
        }

        // Wyciągamy HTML
        const htmlMatch = aiText.match(/<HTML>([\s\S]*?)<\/HTML>/);
        if (htmlMatch) {
          let rawHtml = htmlMatch[1].trim();
          rawHtml = rawHtml.replace(/```html/gi, "").replace(/```/g, "").trim();
          rawHtml = rawHtml.replace(/<\/?html[^>]*>/gi, "").replace(/<\/?body[^>]*>/gi, "").replace(/<\/?head[^>]*>[\s\S]*?<\/head>/gi, "").trim();
          setHtmlContent(rawHtml);
          aiText = aiText.replace(/<HTML>[\s\S]*?<\/HTML>/, "");
          hasUpdates = true;
        }
        
        if (hasUpdates) {
          aiText += "\n\n🚀 [Wygenerowano: Wizualizację, Kod HTML oraz Raport SEO]";
        }
        
        setMessages((prev) => [...prev, { role: "ai", text: aiText.trim() }]);
      }
    } catch (error) {
      console.error("Błąd", error);
      setMessages((prev) => [...prev, { role: "ai", text: "⚠️ Błąd połączenia z serwerem." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans text-gray-900 overflow-hidden">
      
      {/* LEWA KOLUMNA */}
      <div className="w-1/3 min-w-[350px] max-w-[450px] bg-white border-r border-gray-200 flex flex-col shadow-xl z-10">
        <div className="p-4 border-b border-gray-100 bg-white shrink-0">
          <h1 className="text-xl font-bold text-gray-800">Profe Studio Builder</h1>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50 border-b border-gray-200">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`p-3 rounded-2xl max-w-[90%] shadow-sm text-sm whitespace-pre-wrap ${msg.role === "user" ? "bg-gray-800 text-white rounded-tr-none" : "bg-blue-600 text-white rounded-tl-none"}`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-blue-600 text-white p-3 rounded-2xl rounded-tl-none max-w-[85%] shadow-sm animate-pulse text-sm">
                Analizuję SEO, generuję kod i widok...
              </div>
            </div>
          )}
        </div>

        <div className="p-3 bg-white border-b border-gray-200 shrink-0">
          <div className="relative">
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              className="w-full bg-gray-50 border border-gray-300 rounded-xl py-2 px-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
              rows={2}
              placeholder="Np. Zbuduj zoptymalizowaną sekcję Usługi..."
            ></textarea>
            <button 
              onClick={sendMessage}
              disabled={isLoading}
              className={`absolute bottom-2 right-2 p-1.5 rounded-lg transition-colors shadow-sm ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </div>

        <div className="h-1/3 min-h-[200px] bg-slate-900 flex flex-col shrink-0">
          <div className="bg-slate-950 text-slate-400 text-xs px-4 py-2 uppercase tracking-wider font-semibold border-b border-slate-800">
            Struktura / CMS / Wytyczne
          </div>
          <div className="p-4 overflow-y-auto flex-1 font-mono text-xs text-green-400 whitespace-pre-wrap">
            {schemaContent ? schemaContent : "// Oczekiwanie na generowanie schematu..."}
          </div>
        </div>
      </div>

      {/* PRAWA KOLUMNA (Zakładki) */}
      <div className="flex-1 bg-gray-100 flex flex-col h-full overflow-hidden">
        
        {/* Pasek Zakładek */}
        <div className="h-12 bg-gray-50 border-b border-gray-200 flex items-end px-4 shadow-sm shrink-0 space-x-1">
          <button 
            onClick={() => setActiveTab("preview")}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-t border-x ${activeTab === "preview" ? "bg-white text-blue-600 border-gray-200" : "bg-gray-50 text-gray-500 border-transparent hover:bg-gray-200"}`}
          >
            👁️ Wizualizacja
          </button>
          <button 
            onClick={() => setActiveTab("code")}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-t border-x ${activeTab === "code" ? "bg-white text-blue-600 border-gray-200" : "bg-gray-50 text-gray-500 border-transparent hover:bg-gray-200"}`}
          >
            💻 Czysty Kod
          </button>
          <button 
            onClick={() => setActiveTab("seo")}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-t border-x ${activeTab === "seo" ? "bg-white text-blue-600 border-gray-200" : "bg-gray-50 text-gray-500 border-transparent hover:bg-gray-200"}`}
          >
            🚀 Audyt SEO / AIO
          </button>
        </div>
        
        {/* Obszar roboczy dla zakładek */}
        <div className="flex-1 w-full relative bg-white">
          
          {/* Zakładka 1: Preview */}
          {activeTab === "preview" && (
            htmlContent ? (
              <iframe 
                className="w-full h-full border-none absolute top-0 left-0"
                sandbox="allow-scripts allow-same-origin"
                srcDoc={`
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <meta charset="UTF-8">
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                      <script src="https://cdn.tailwindcss.com"></script>
                      <style>body { font-family: ui-sans-serif, system-ui, sans-serif; }</style>
                    </head>
                    <body>${htmlContent}</body>
                  </html>
                `}
              />
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center text-gray-400">
                <p>Brak wygenerowanego podglądu</p>
              </div>
            )
          )}

          {/* Zakładka 2: Czysty Kod */}
          {activeTab === "code" && (
            <div className="h-full w-full bg-slate-900 p-6 overflow-y-auto">
              <pre className="font-mono text-sm text-gray-300 whitespace-pre-wrap">
                {htmlContent ? htmlContent : "// Kod pojawi się tutaj..."}
              </pre>
            </div>
          )}

          {/* Zakładka 3: SEO / AIO */}
          {activeTab === "seo" && (
            <div className="h-full w-full p-8 overflow-y-auto bg-gray-50">
              <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">Raport Optymalizacji SEO & AIO</h2>
                <div className="prose prose-blue max-w-none whitespace-pre-wrap text-gray-700">
                  {seoContent ? seoContent : "Brak danych SEO. Poproś asystenta o wygenerowanie sekcji."}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}