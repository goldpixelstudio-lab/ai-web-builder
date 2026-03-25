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
                    query: step === 2 ? `Zanalizuj układ, sekcje i styl tych stron internetowych: ${hasUrls.join(", ")}` : userText,
                    search_depth: "advanced",
                    include_answer: true,
                    max_results: 5
                })
            });
            const searchData = await searchRes.json();
            if (searchData && searchData.results) {
                const contextStr = searchData.results.map((r: any) => `Źródło: ${r.url}\nTreść: ${r.content}`).join('\n\n');
                searchContext = step === 2 
                    ? `\n\n--- INSPIRACJA Z URL ---\nUżytkownik podał linki. Zignoruj domyślny, nudny wygląd. Skopiuj ich innowacyjny układ i luksusowy klimat opisany tutaj:\n${contextStr}\n-----------------------------------\n`
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
      systemContent = `Jesteś NAGRADZANYM LEAD UI/UX DESIGNEREM (AWWWARDS WINNER) I SENIOR FRONT-END DEVELOPEREM.
      Twoim zadaniem jest wygenerowanie ABSOLUTNIE LUKSUSOWEGO, INNOWACYJNEGO KODU HTML, z użyciem Tailwind CSS v4.
      
      ZABRANIAM CI używać przestarzałych układów (nudne paski nawigacji, płaskie sekcje pod rząd, brak paddingów, małe fonty). Strona musi krzyczeć "Premium 2026".
      
      BEZWZGLĘDNE REGUŁY DESIGNU (Użyj tych klas Tailwind):
      1. BENTO GRID & KARTY: Nie używaj zwykłych list. Sekcje ofert/o nas pakuj w asymetryczne siatki (np. grid-cols-1 md:grid-cols-3 gap-6). Elementy to "karty" - używaj klas: 'bg-white rounded-[2rem] p-8 shadow-xl shadow-blue-900/5 ring-1 ring-gray-100/50'.
      2. MICRO-INTERAKCJE (HOVER): Każda karta i przycisk musi żyć. Używaj: 'transition-all duration-500 ease-out hover:-translate-y-2 hover:shadow-2xl group cursor-pointer'.
      3. GLASSMORPHISM: Nawigacja (Header) lub unoszące się karty muszą mieć efekt szkła: 'sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-white/20'.
      4. TYPOGRAFIA (HIERARCHIA): 
         - Etykiety nad nagłówkami (Overlines): 'text-[10px] font-black uppercase tracking-widest text-blue-600 mb-4 block'.
         - Główne nagłówki (H1/H2): 'text-5xl md:text-6xl font-black tracking-tighter text-slate-900 leading-tight mb-6'. Stosuj łamanie linii.
         - Paragrafy (p): 'text-base md:text-lg font-medium text-slate-500 leading-relaxed'.
      5. POTĘŻNE CTA (PRZYCISKI): Przyciski muszą być duże i wyraziste. Używaj: 'inline-flex items-center px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-600 hover:scale-105 transition-all shadow-lg'.
      6. ZDJĘCIA (ASSETY): Zastępuj placeholdery konkretnymi nazwami z sekcji "DOSTĘPNE ZDJĘCIA". Zdjęcia pakuj w luksusowe ramy: 'w-full h-full object-cover rounded-[2.5rem] shadow-2xl'.
      7. IKONY LUCIDE: Wzbogacaj layout ikonami. Używaj tagu <i data-lucide="arrow-right" class="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform"></i>.
      8. PRZESTRZEŃ (WHITESPACE): Stosuj GIGANTYCZNE odstępy między sekcjami, np. 'py-24 md:py-32'.

      DZIEDZICZENIE (PODSTRONY): Jeśli w kontekście widzisz "BAZA DESIGNU (STRONA GŁÓWNA)", sklonuj jej <header>, <nav> i <footer> DOKŁADNIE 1:1, a nowoczesny środek (main) wpasuj w ten sam styl kolorystyczny.

      WIZUALNA INSPIRACJA (VISION): Jeśli użytkownik wgrał pliki graficzne w prompcie lub podał link do strony, to Twoje GŁÓWNE zadanie: Odtwórz ten układ wizualny w kodzie Tailwind!

      Odpowiadasz zwracając TYLKO I WYŁĄCZNIE kod objęty w tagi <HTML>...</HTML>. Zero dodatkowego gadania.`;
    }
    else if (step === 3) {
      systemContent = `Jesteś WYBITNYM INŻYNIEREM SEO. Wdróż JSON-LD, zoptymalizuj H1/H2 i tagi ALT na bazie HTML podanego przez użytkownika. Zwróć nowy <HTML>...</HTML>. 
      BARDZO WAŻNE: W naturalnej odpowiedzi wymień co zmieniłeś i ZAWSZE stwórz gotowy, poprawny kod sitemap.xml (w bloku kodu markdown) dla Google.`;
    } 
    else if (step === 4) {
      systemContent = `Jesteś EKSPERTEM JOOMLA i SP PAGE BUILDER. Zmapuj dostarczoną architekturę. Użyj tagów: <DOC_2>, <DOC_3>, <DOC_7>, <DOC_13>.`;
    }
    else if (step === 5) {
      systemContent = `Jesteś EKSPERTEM WORDPRESS i ELEMENTOR. Zmapuj HTML pod ten ekosystem. Użyj tagów: <DOC_14>, <DOC_15>.`;
    }
    else if (step === 6) {
      systemContent = `Jesteś WYBITNYM TECHNICAL WRITEREM. Przygotuj dokumentację i instrukcje. Użyj tagów: <DOC_16>, <DOC_17>.`;
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
        temperature: 0.7, // Podnosimy z 0.4 na 0.7, aby dać mu trochę więcej artystycznej swobody do wymyślania asymetrycznych układów
        max_tokens: 8192, // Ustawiamy gigantyczny limit, żeby nie ucinał skomplikowanego, nowoczesnego kodu
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