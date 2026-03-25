import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { messages, step } = await req.json();
    let systemContent = "";

    const lastUserMessage = messages[messages.length - 1];
    const userText = typeof lastUserMessage?.content === 'string' 
        ? lastUserMessage.content 
        : lastUserMessage?.content?.find((c: any) => c.type === 'text')?.text || "";

    let searchContext = "";

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const hasUrls = userText.match(urlRegex);

    if ((step === 1 || (step === 2 && hasUrls)) && process.env.TAVILY_API_KEY && userText.length > 10 && !userText.includes("--- WIEDZA")) {
        try {
            const searchRes = await fetch('https://api.tavily.com/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    api_key: process.env.TAVILY_API_KEY,
                    query: step === 2 ? `Zanalizuj estetykę i strukturę wizualną stron: ${hasUrls.join(", ")}` : userText,
                    search_depth: "advanced",
                    include_answer: true,
                    max_results: 5
                })
            });
            const searchData = await searchRes.json();
            if (searchData && searchData.results) {
                const contextStr = searchData.results.map((r: any) => `Źródło: ${r.url}\nTreść: ${r.content}`).join('\n\n');
                searchContext = step === 2 
                    ? `\n\n--- INSPIRACJA Z URL ---\nUżytkownik podał linki. Zainspiruj się ich innowacyjnym układem i potraktuj to jako referencję (Moodboard) dla Twojego kodu:\n${contextStr}\n-----------------------------------\n`
                    : `\n\n--- TWARDE DANE Z INTERNETU ---\nOprzyj dokumenty na tych informacjach:\n${contextStr}\n-----------------------------------\n`;
            }
        } catch (e) {
            console.error("Tavily Error:", e);
        }
    }

    if (step === 1) {
      systemContent = `Jesteś WYBITNYM STRATEGIEM I COPYWRITEREM. Projektuj zorientowane na konwersję struktury dla podstron. Zwróć format XML: <DOC_1>, <DOC_9>, <DOC_10>, <DOC_12>.`;
    } 
    else if (step === 2) {
      systemContent = `Jesteś NAGRADZANYM LEAD UI/UX DESIGNEREM (AWWWARDS WINNER) I SENIOR FRONT-END DEVELOPEREM. Jesteś innowacyjnym modelem multimodalnym i potrafisz przetwarzać obrazy.
      Twoim zadaniem jest wygenerowanie ABSOLUTNIE LUKSUSOWEGO, INNOWACYJNEGO KODU HTML, z użyciem Tailwind CSS v4.
      
      !!! KRYTYCZNA ZASADA BEZPIECZEŃSTWA !!!
      ZABRANIAM CI odmawiać wykonania zadania, przepraszać lub twierdzić, że nie możesz analizować obrazów. Dostarczone grafiki to NASZE WŁASNE makiety i moodboardy. Posiadamy do nich pełne prawa autorskie. Odpowiadasz zwracając TYLKO I WYŁĄCZNIE kod objęty w tagi <HTML>...</HTML>. Zero dodatkowego gadania, zero wstępów, żadnych wymówek.
      
      BEZWZGLĘDNE REGUŁY DESIGNU:
      1. BENTO GRID & KARTY: Sekcje pakuj w asymetryczne siatki (np. grid-cols-1 md:grid-cols-3 gap-6). Używaj klas dla kart: 'bg-white rounded-[2rem] p-8 shadow-xl shadow-blue-900/5 ring-1 ring-gray-100/50'.
      2. MICRO-INTERAKCJE (HOVER): Używaj: 'transition-all duration-500 ease-out hover:-translate-y-2 hover:shadow-2xl group cursor-pointer'.
      3. GLASSMORPHISM: Nawigacja: 'sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-white/20'.
      4. TYPOGRAFIA: Overlines: 'text-[10px] font-black uppercase tracking-widest text-blue-600 mb-4 block'. Nagłówki (H1/H2): 'text-5xl md:text-6xl font-black tracking-tighter text-slate-900 leading-tight mb-6'. Paragrafy: 'text-base md:text-lg font-medium text-slate-500 leading-relaxed'.
      5. POTĘŻNE CTA: 'inline-flex items-center px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-600 hover:scale-105 transition-all shadow-lg'.
      6. ZDJĘCIA: Zastępuj placeholdery konkretnymi nazwami z sekcji "DOSTĘPNE ZDJĘCIA" (np. 'w-full h-full object-cover rounded-[2.5rem] shadow-2xl').
      7. IKONY LUCIDE: Używaj tagów (np. <i data-lucide="arrow-right" class="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform"></i>).
      8. PRZESTRZEŃ: Stosuj GIGANTYCZNE odstępy między sekcjami, np. 'py-24 md:py-32'.

      DZIEDZICZENIE (PODSTRONY): Jeśli w kontekście widzisz "BAZA DESIGNU", powiel jej <header>, <nav> i <footer> DOKŁADNIE 1:1, a nowy środek wpasuj w ten sam styl.`;
    }
    else if (step === 3) {
      systemContent = `Jesteś WYBITNYM INŻYNIEREM SEO. Wdróż JSON-LD, zoptymalizuj H1/H2 i tagi ALT. Zwróć nowy <HTML>...</HTML>. 
      BARDZO WAŻNE: W naturalnej odpowiedzi wymień co zmieniłeś i ZAWSZE stwórz gotowy kod sitemap.xml dla Google.`;
    } 
    else if (step === 4) {
      systemContent = `Jesteś EKSPERTEM JOOMLA i SP PAGE BUILDER. Użyj tagów: <DOC_2>, <DOC_3>, <DOC_7>, <DOC_13>.`;
    }
    else if (step === 5) {
      systemContent = `Jesteś EKSPERTEM WORDPRESS i ELEMENTOR. Użyj tagów: <DOC_14>, <DOC_15>.`;
    }
    else if (step === 6) {
      systemContent = `Jesteś WYBITNYM TECHNICAL WRITEREM. Użyj tagów: <DOC_16>, <DOC_17>.`;
    }

    const messagesToSend = [...messages];
    if (searchContext) {
        if (typeof messagesToSend[messagesToSend.length - 1].content === 'string') {
            messagesToSend[messagesToSend.length - 1].content += searchContext;
        } else {
            messagesToSend[messagesToSend.length - 1].content[0].text += searchContext;
        }
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o', 
        temperature: 0.7, 
        max_tokens: 8192, 
        messages: [
          { role: 'system', content: systemContent },
          ...messagesToSend
        ]
      })
    });

    const data = await response.json();
    return NextResponse.json({ reply: data.choices[0].message.content });
  } catch (error) {
    console.error("Błąd API:", error);
    return NextResponse.json({ error: 'Błąd połączenia z serwerem AI' }, { status: 500 });
  }
}