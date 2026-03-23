"use client"; // Ta linijka mówi, że strona jest interaktywna

import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "ai", text: "Cześć! System jest gotowy. Od czego zaczynamy projektowanie?" }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });
      
      const data = await res.json();
      
      if (data.reply) {
        setMessages((prev) => [...prev, { role: "ai", text: data.reply }]);
      }
    } catch (error) {
      console.error("Błąd", error);
      setMessages((prev) => [...prev, { role: "ai", text: "Przepraszam, wystąpił błąd połączenia." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans text-gray-900">
      
      {/* LEWY PANEL */}
      <div className="w-1/3 min-w-[350px] max-w-[450px] bg-white border-r border-gray-200 flex flex-col shadow-xl z-10">
        <div className="p-6 border-b border-gray-100 bg-white">
          <h1 className="text-2xl font-bold text-gray-800">AI Web Builder</h1>
          <p className="text-sm text-gray-500 mt-1">Twój asystent projektowania</p>
        </div>

        {/* Dynamiczny Czat */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-50">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`p-4 rounded-2xl max-w-[85%] shadow-sm ${msg.role === "user" ? "bg-gray-800 text-white rounded-tr-none" : "bg-blue-600 text-white rounded-tl-none"}`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-blue-600 text-white p-4 rounded-2xl rounded-tl-none max-w-[85%] shadow-sm animate-pulse">
                Myślę...
              </div>
            </div>
          )}
        </div>

        {/* Pole tekstowe z przypiętą funkcją sendMessage */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="relative">
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              className="w-full bg-gray-50 border border-gray-300 rounded-xl py-3 px-4 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
              rows={3}
              placeholder="Napisz polecenie..."
            ></textarea>
            <button 
              onClick={sendMessage}
              disabled={isLoading}
              className={`absolute bottom-3 right-3 p-2 rounded-lg transition-colors shadow-sm ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* PRAWY PANEL - Podgląd (Na razie bez zmian) */}
      <div className="flex-1 bg-gray-100 flex flex-col">
        <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
          </div>
          <div className="text-xs font-medium text-gray-500 bg-gray-100 px-4 py-1.5 rounded-full border border-gray-200">Podgląd na żywo</div>
          <div className="w-12"></div>
        </div>
        <div className="flex-1 p-8 overflow-y-auto flex items-center justify-center">
          <div className="bg-white w-full h-full max-w-5xl rounded-2xl shadow-sm border-2 border-gray-200 border-dashed flex flex-col items-center justify-center text-gray-400 transition-all hover:border-blue-300 hover:bg-gray-50">
            <svg className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-lg font-medium text-gray-500">Miejsce na wygenerowany projekt</p>
          </div>
        </div>
      </div>
    </div>
  );
}