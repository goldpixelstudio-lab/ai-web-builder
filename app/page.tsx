"use client";

import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "ai", text: "Witaj w środowisku PRO! Wymuszono tryb najwyższej jakości wizualnej, pełnej responsywności i optymalizacji SEO. Zaprojektujmy coś niesamowitego." }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [schemaContent, setSchemaContent] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [seoContent, setSeoContent] = useState<string | null>(null);
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
        
        const schemaMatch = aiText.match(/<SCHEMA>([\s\S]*?)<\/SCHEMA>/);
        if (schemaMatch) {
          setSchemaContent(schemaMatch[1].trim());
          aiText = aiText.replace(/<SCHEMA>[\s\S]*?<\/SCHEMA>/, ""); 
          hasUpdates = true;
        }

        const seoMatch = aiText.match(/<SEO>([\s\S]*?)<\/SEO>/);
        if (seoMatch) {
          setSeoContent(seoMatch[1].trim());
          aiText = aiText.replace(/<SEO>[\s\S]*?<\/SEO>/, "");
          hasUpdates = true;
        }

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
          aiText += "\n\n✨ [PRO: Wygenerowano zoptymalizowany kod i widoki]";
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
    // ZMIANA: Układ zmienia się w zależności od szerokości ekranu (flex-col na małych, flex-row na dużych)
    <div className="flex flex-col lg:flex-row h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">
      
      {/* LEWA KOLUMNA (Na desktopach w-1/3, na mobile 100% szerokości i połowa wysokości) */}
      <div className="w-full lg:w-[400px] xl:w-[450px] h-[50vh] lg:h-screen bg-white border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col shadow-2xl z-20 shrink-0">
        <div className="p-5 border-b border-gray-100 bg-white shrink-0 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Studio Builder PRO</h1>
            <p className="text-xs text-gray-400 font-medium tracking-wide mt-1 uppercase">AIO & Design Engine</p>
          </div>
        </div>

        <div className="flex-1 p-5 overflow-y-auto space-y-5 bg-gray-50/50">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`p-3.5 rounded-2xl max-w-[90%] shadow-sm text-sm whitespace-pre-wrap leading-relaxed ${msg.role === "user" ? "bg-slate-800 text-white rounded-tr-none" : "bg-white border border-gray-100 text-gray-700 rounded-tl-none shadow-md"}`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-100 text-gray-500 p-3.5 rounded-2xl rounded-tl-none shadow-md flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-75"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-150"></div>
                <span className="ml-2 font-medium">Generuję piksel-perfekcyjny projekt...</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-white border-t border-gray-100 shrink-0">
          <div className="relative shadow-sm rounded-xl">
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-none text-sm placeholder-gray-400"
              rows={2}
              placeholder="Zbuduj sekcję Usługi. Użyj ciemnego motywu..."
            ></textarea>
            <button 
              onClick={sendMessage}
              disabled={isLoading}
              className={`absolute bottom-3 right-3 p-2 rounded-lg transition-all ${isLoading ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5 text-white'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </div>

        <div className="h-[30%] min-h-[150px] bg-slate-900 flex flex-col shrink-0">
          <div className="bg-slate-950 text-slate-400 text-[10px] px-4 py-2 uppercase tracking-widest font-bold border-b border-slate-800 flex items-center justify-between">
            <span>Struktura Joomla CMS</span>
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          </div>
          <div className="p-4 overflow-y-auto flex-1 font-mono text-xs text-emerald-400/90 whitespace-pre-wrap leading-relaxed">
            {schemaContent ? schemaContent : "// Oczekiwanie na generowanie schematu..."}
          </div>
        </div>
      </div>

      {/* PRAWA KOLUMNA (Zakładki - na mobile zajmuje resztę wysokości) */}
      <div className="flex-1 bg-white flex flex-col h-[50vh] lg:h-screen overflow-hidden z-10 relative">
        
        {/* Pasek Zakładek PRO */}
        <div className="h-14 bg-white border-b border-gray-100 flex items-end px-2 lg:px-6 shrink-0 space-x-2 pt-2">
          <button 
            onClick={() => setActiveTab("preview")}
            className={`px-5 py-2.5 text-sm font-semibold rounded-t-xl transition-all ${activeTab === "preview" ? "bg-gray-50 text-blue-600 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]" : "bg-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50/50"}`}
          >
            👁️ Live Preview
          </button>
          <button 
            onClick={() => setActiveTab("code")}
            className={`px-5 py-2.5 text-sm font-semibold rounded-t-xl transition-all ${activeTab === "code" ? "bg-gray-50 text-blue-600 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]" : "bg-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50/50"}`}
          >
            💻 HTML & Tailwind
          </button>
          <button 
            onClick={() => setActiveTab("seo")}
            className={`px-5 py-2.5 text-sm font-semibold rounded-t-xl transition-all ${activeTab === "seo" ? "bg-gray-50 text-blue-600 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]" : "bg-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50/50"}`}
          >
            🚀 SEO / AIO Audit
          </button>
        </div>
        
        {/* Obszar roboczy */}
        <div className="flex-1 w-full bg-gray-50 relative">
          
          {/* Zakładka 1: Preview */}
          {activeTab === "preview" && (
            htmlContent ? (
              <iframe 
                className="w-full h-full border-none absolute top-0 left-0 bg-white"
                sandbox="allow-scripts allow-same-origin"
                srcDoc={`
                  <!DOCTYPE html>
                  <html class="antialiased">
                    <head>
                      <meta charset="UTF-8">
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                      <script src="https://cdn.tailwindcss.com"></script>
                      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
                      <style>body { font-family: 'Inter', sans-serif; }</style>
                    </head>
                    <body>${htmlContent}</body>
                  </html>
                `}
              />
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center text-gray-300">
                <p className="font-medium text-lg">Wprowadź polecenie, aby wygenerować projekt</p>
              </div>
            )
          )}

          {/* Zakładka 2: Kod z motywem ciemnym */}
          {activeTab === "code" && (
            <div className="h-full w-full bg-[#1E1E1E] p-6 lg:p-8 overflow-y-auto">
              <pre className="font-mono text-[13px] leading-relaxed text-[#D4D4D4] whitespace-pre-wrap">
                {htmlContent ? htmlContent : ""}
              </pre>
            </div>
          )}

          {/* Zakładka 3: SEO */}
          {activeTab === "seo" && (
            <div className="h-full w-full p-6 lg:p-12 overflow-y-auto bg-gray-50">
              <div className="max-w-4xl mx-auto bg-white p-8 lg:p-10 rounded-3xl shadow-xl border border-gray-100">
                <h2 className="text-3xl font-extrabold text-gray-900 mb-8 tracking-tight">Raport Techniczny & AIO</h2>
                <div className="prose prose-lg prose-blue max-w-none whitespace-pre-wrap text-gray-600 leading-relaxed">
                  {seoContent ? seoContent : "Brak danych audytu."}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}