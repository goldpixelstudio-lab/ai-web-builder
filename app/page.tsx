"use client";

import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "ai", text: "Witaj w wersji 2.0! Jestem gotowy. Pamiętam naszą rozmowę i potrafię rysować projekty na żywo. Co dzisiaj zbudujemy?" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Dwa osobne stany: na schemat i na czysty HTML
  const [schemaContent, setSchemaContent] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput("");
    
    // Zapisujemy nową wiadomość
    const updatedMessages = [...messages, { role: "user", text: userMessage }];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      // Tłumaczymy historię czatu na format zrozumiały dla OpenAI
      const apiMessages = updatedMessages.map(msg => ({
        role: msg.role === "ai" ? "assistant" : "user",
        content: msg.text
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }), // Wysyłamy całą pamięć!
      });
      
      const data = await res.json();
      
      if (data.reply) {
        let aiText = data.reply;
        
        // Wyciągamy SCHEMA do dolnego, lewego okienka
        const schemaMatch = aiText.match(/<SCHEMA>([\s\S]*?)<\/SCHEMA>/);
        if (schemaMatch) {
          setSchemaContent(schemaMatch[1].trim());
          aiText = aiText.replace(/<SCHEMA>[\s\S]*?<\/SCHEMA>/, ""); // Usuwamy z czatu
        }

        // Wyciągamy HTML do prawego, dużego okienka
        const htmlMatch = aiText.match(/<HTML>([\s\S]*?)<\/HTML>/);
        if (htmlMatch) {
          setHtmlContent(htmlMatch[1].trim());
          aiText = aiText.replace(/<HTML>[\s\S]*?<\/HTML>/, "\n\n🚀 [Wygenerowano nową wizualizację strony i zaktualizowano schemat]");
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
      
      {/* LEWA KOLUMNA (Podzielona na pół) */}
      <div className="w-1/3 min-w-[350px] max-w-[450px] bg-white border-r border-gray-200 flex flex-col shadow-xl z-10">
        
        <div className="p-4 border-b border-gray-100 bg-white">
          <h1 className="text-xl font-bold text-gray-800">Profe Studio Builder</h1>
        </div>

        {/* GÓRA: Czat (Zajmuje dostępną przestrzeń, elastyczny) */}
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
                Generuję układ i wizualizację...
              </div>
            </div>
          )}
        </div>

        {/* POLE TEKSTOWE */}
        <div className="p-3 bg-white border-b border-gray-200">
          <div className="relative">
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              className="w-full bg-gray-50 border border-gray-300 rounded-xl py-2 px-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
              rows={2}
              placeholder="Np. Zbuduj sekcję Hero dla Profe Studio..."
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

        {/* DÓŁ: Okno Schematu (Stała wysokość, np. 30% lewego panelu) */}
        <div className="h-1/3 min-h-[200px] bg-slate-900 flex flex-col">
          <div className="bg-slate-950 text-slate-400 text-xs px-4 py-2 uppercase tracking-wider font-semibold border-b border-slate-800">
            Struktura / Moduły Joomla
          </div>
          <div className="p-4 overflow-y-auto flex-1 font-mono text-xs text-green-400 whitespace-pre-wrap">
            {schemaContent ? schemaContent : "// Tutaj pojawi się schemat krok po kroku..."}
          </div>
        </div>
      </div>

      {/* PRAWA KOLUMNA (Duża Tablica renderująca na żywo) */}
      <div className="flex-1 bg-gray-200 flex flex-col h-full">
        <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm shrink-0">
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
          </div>
          <div className="text-xs font-medium text-gray-500 bg-gray-100 px-4 py-1.5 rounded-full border border-gray-200">Wizualizacja Live</div>
          <div className="w-12"></div>
        </div>
        
        {/* Płótno z renderowaniem HTML */}
        <div className="flex-1 overflow-y-auto">
          {htmlContent ? (
            // Silnik renderujący na żywo to, co zwraca AI
            <div 
              className="w-full min-h-full bg-white"
              dangerouslySetInnerHTML={{ __html: htmlContent }} 
            />
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center text-gray-400">
              <svg className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-lg font-medium text-gray-500">Miejsce na wygenerowaną stronę</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}