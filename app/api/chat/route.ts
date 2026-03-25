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
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ api_key: process.env.TAVILY_API_KEY, query: step === 2 ? `Zanalizuj estetykę i bogactwo stron: ${hasUrls.join(", ")}` : userText, search_depth: "advanced", include_answer: true, max_results: 5 })
            });
            const searchData = await searchRes.json();
            if (searchData && searchData.results) {
                const contextStr = searchData.results.map((r: any) => `Źródło: ${r.url}\nTreść: ${r.content}`).join('\n\n');
                searchContext = step === 2 
                    ? `\n\n--- INSPIRACJA Z URL ---\nZainspiruj się innowacyjnym układem, rozmachem i potraktuj to jako paliwo dla swojej wyobraźni:\n${contextStr}\n-----------------------------------\n`
                    : `\n\n--- TWARDE DANE Z INTERNETU ---\nOprzyj dokumenty na tych informacjach:\n${contextStr}\n-----------------------------------\n`;
            }
        } catch (e) { console.error("Tavily Error:", e); }
    }

    if (step === 1) {
      systemContent = `Jesteś WYBITNYM STRATEGIEM I COPYWRITEREM. Projektuj zorientowane na konwersję, BOGATE struktury dla podstron. Wyjdź poza schemat. Zwróć format XML: <DOC_1>, <DOC_9>, <DOC_10>, <DOC_12>.`;
    } 
    else if (step === 2) {
      systemContent = `Jesteś WIZJONEREM DESIGNU, NAGRADZANYM LEAD UI/UX DESIGNEREM (AWWWARDS WINNER) I KREATYWNYM FRONT-END DEVELOPEREM.
      Masz absolutną wolność artystyczną. Oczekuję od Ciebie rozmachu, kreatywności i wyjścia poza schemat. Nie rób "minimum". Zbuduj długą, angażującą, wielosekcyjną stronę internetową.
      
      ABY STRONA ZADZIAŁAŁA TECHNICZNIE, w sekcji <head> ZAWSZE umieszczaj te 3 linki (to Twój jedyny obowiązek techniczny):
      <script src="https://unpkg.com/@tailwindcss/browser@4"></script>
      <script src="https://unpkg.com/lucide@latest"></script>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700;900&display=swap" rel="stylesheet">
      (Pamiętaj o <script>lucide.createIcons();</script> na końcu <body>).

      TWÓJ ARSENAŁ KREATYWNY (Tailwind v4):
      1. ROZMACH I SEKCJE: Nie ograniczaj się. Generuj pełnoprawne strony z wieloma sekcjami (Epickie Hero, O nas, Oferta w kreatywnym Bento Grid, Opinie, Statystyki, FAQ, Rozbudowany Footer). Stosuj asymetrię, overlapping (elementy nachodzące na siebie, np. używaj ujemnych marginesów -mt-16), nieoczywiste podziały ekranu.
      2. STYL PREMIUM: Używaj Glassmorphismu (backdrop-blur-2xl bg-white/30 lub bg-black/30), zaawansowanych gradientów, luksusowych cieni (shadow-2xl, shadow-blue-500/20) i ekstremalnych zaokrągleń (rounded-3xl, rounded-[3rem], a nawet w pełni okrągłych elementów).
      3. TYPOGRAFIA Z CHARAKTEREM: Używaj font-sans (Montserrat). Twórz GIGANTYCZNE, chwytliwe nagłówki (text-6xl/7xl/8xl, tracking-tighter), które przełamują schemat. Dodawaj małe etykiety nad nagłówkami (text-xs uppercase tracking-[0.3em] text-blue-500).
      4. ŻYCIE I INTERAKCJE: Elementy muszą reagować na hover (group, group-hover:-translate-y-3, transition-all duration-500). Przyciski niech będą masywne, zachęcające do kliknięcia (np. z efektem ring lub glow).
      5. BOGACTWO WIZUALNE: Używaj pięknych, dynamicznych placeholderów wysokiej jakości (np. z Unsplash: https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80) jeśli użytkownik nie podał własnych zdjęć. Nakładaj na nie filtry, używaj ich jako coverów pełnoekranowych lub jako kafelków w gridzie.

      INSPIRACJA (VISION/URL): Jeśli użytkownik wgrał obraz lub podał link, potraktuj to jako mapę inspiracji. Zobacz, jak tam płynie treść, jakie są proporcje układu i ZBUDUJ WŁASNĄ, LEPSZĄ, BARDZIEJ ROZBUDOWANĄ WERSJĘ. Nie ograniczaj się do prostej, biednej kopii – dodaj od siebie "to coś". Zaskocz mnie.

      Zwróć TYLKO pełny, gotowy, kreatywny kod <HTML>...</HTML>. Bądź odważny w designie.`;
    }
    else if (step === 3) {
      systemContent = `Jesteś INŻYNIEREM SEO. Wdróż JSON-LD, zoptymalizuj H1/H2 i tagi ALT. Zwróć nowy <HTML>...</HTML> oraz napisz co zmieniłeś i dodaj blok sitemap.xml.`;
    } 
    else if (step === 4) { systemContent = `Jesteś EKSPERTEM JOOMLA. Użyj tagów: <DOC_2>, <DOC_3>, <DOC_7>, <DOC_13>.`; }
    else if (step === 5) { systemContent = `Jesteś EKSPERTEM WORDPRESS. Użyj tagów: <DOC_14>, <DOC_15>.`; }
    else if (step === 6) { systemContent = `Jesteś TECHNICAL WRITEREM. Użyj tagów: <DOC_16>, <DOC_17>.`; }

    const messagesToSend = [...messages];
    if (searchContext) {
        if (typeof messagesToSend[messagesToSend.length - 1].content === 'string') { messagesToSend[messagesToSend.length - 1].content += searchContext; } 
        else { messagesToSend[messagesToSend.length - 1].content[0].text += searchContext; }
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ 
        model: 'gpt-4o', 
        temperature: 0.85, // Zwiększona temperatura = większa kreatywność i odwaga!
        max_tokens: 8192, 
        messages: [{ role: 'system', content: systemContent }, ...messagesToSend] 
      })
    });
    const data = await response.json(); return NextResponse.json({ reply: data.choices[0].message.content });
  } catch (error) { console.error("Błąd API:", error); return NextResponse.json({ error: 'Błąd API' }, { status: 500 }); }
}