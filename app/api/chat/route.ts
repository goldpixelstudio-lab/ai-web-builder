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
                    query: step === 2 ? `Zanalizuj układ i styl tych stron internetowych: ${hasUrls.join(", ")}` : userText,
                    search_depth: "advanced",
                    include_answer: true,
                    max_results: 5
                })
            });
            const searchData = await searchRes.json();
            if (searchData && searchData.results) {
                const contextStr = searchData.results.map((r: any) => `Źródło: ${r.url}\nTreść: ${r.content}`).join('\n\n');
                searchContext = step === 2 
                    ? `\n\n--- INSPIRACJA Z URL ---\nUżytkownik podał linki. Skopiuj i zainspiruj się układem oraz klimatem opisanym tutaj:\n${contextStr}\n-----------------------------------\n`
                    : `\n\n--- TWARDE DANE Z INTERNETU ---\nOprzyj dokumenty na tych informacjach:\n${contextStr}\n-----------------------------------\n`;
            }
        } catch (e) {
            console.error("Tavily Error:", e);
        }
    }

    if (step === 1) {
      systemContent = `Jesteś WYBITNYM STRATEGIEM. Zwróć format XML: <DOC_1>, <DOC_9>, <DOC_10>, <DOC_12>.`;
    } 
    else if (step === 2) {
      systemContent = `Jesteś WYBITNYM SENIOR FRONT-END DEVELOPEREM.
      ZWRÓĆ PEŁNY KOD W TAGACH <HTML>...</HTML>.
      KRYTYCZNE ZASADY KODOWANIA:
      1. WIZUALNA INSPIRACJA (VISION/URL): Jeśli podano obrazek lub URL, TWOIM GŁÓWNYM CELEM JEST WIERNE ODTWORZENIE TEGO LAYOUTU w Tailwind CSS v4.
      2. DZIEDZICZENIE: Jeśli kodujesz podstronę, skopiuj nawigację i stopkę ze Strony Głównej podanej w kontekście.
      3. ZDJĘCIA: Osadzaj nazwy plików (np. src="foto.webp") jeśli są podane jako DOSTĘPNE ZDJĘCIA.`;
    }
    else if (step === 3) {
      systemContent = `Jesteś WYBITNYM INŻYNIEREM SEO. Wdróż JSON-LD, zoptymalizuj H1/H2 i tagi ALT na bazie HTML podanego przez użytkownika. Zwróć nowy <HTML>...</HTML>. 
      BARDZO WAŻNE: W swojej naturalnej odpowiedzi (poza kodem HTML) stwórz dodatkowo poprawny kod sitemap.xml (w bloku kodu) dla Google, uwzględniając podstronę, nad którą pracujesz.`;
    } 
    else if (step === 4) {
      systemContent = `Jesteś EKSPERTEM JOOMLA i SP PAGE BUILDER. Użyj tagów: <DOC_2> Architektura SP Page Builder, <DOC_3> Tabela wdrożeniowa, <DOC_7> Master Handoff, <DOC_13> QA Checklist.`;
    }
    else if (step === 5) {
      systemContent = `Jesteś EKSPERTEM WORDPRESS i ELEMENTOR. Zmapuj HTML pod ekosystem WordPress. Użyj tagów XML: <DOC_14> Architektura Elementor, <DOC_15> Tabela wdrożeniowa WP.`;
    }
    else if (step === 6) {
      systemContent = `Jesteś WYBITNYM TECHNICAL WRITEREM. Przygotuj dokumentację końcową. Użyj tagów XML: <DOC_16> Dokumentacja techniczna dla deweloperów, <DOC_17> Instrukcja obsługi dla klienta.`;
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
        temperature: 0.4, 
        max_tokens: 4096, 
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