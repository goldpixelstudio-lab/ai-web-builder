import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { messages, step } = await req.json();
    let systemContent = "";

    const lastUserMessage = messages[messages.length - 1]?.content || "";
    let searchContext = "";

    if (step === 1 && process.env.TAVILY_API_KEY && lastUserMessage.length > 10 && !lastUserMessage.includes("--- WIEDZA")) {
        try {
            const searchRes = await fetch('https://api.tavily.com/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    api_key: process.env.TAVILY_API_KEY,
                    query: lastUserMessage,
                    search_depth: "advanced",
                    include_answer: true,
                    max_results: 5
                })
            });
            const searchData = await searchRes.json();
            if (searchData && searchData.results) {
                const contextStr = searchData.results.map((r: any) => `Źródło: ${r.url}\nTreść: ${r.content}`).join('\n\n');
                searchContext = `\n\n--- TWARDE DANE Z INTERNETU ---\nOprzyj dokumenty na tych informacjach:\n${contextStr}\n-----------------------------------\n`;
            }
        } catch (e) {
            console.error("Tavily Error:", e);
        }
    }

    if (step === 1) {
      systemContent = `Jesteś WYBITNYM STRATEGIEM I ARCHITEKTEM INFORMACJI.
      Zwróć uwagę na kontekst: użytkownik może tworzyć STRONĘ GŁÓWNĄ lub PODSTRONĘ (np. "O nas", "Cennik").
      Projektuj w logice sprzedażowej (hero, problem, rozwiązanie, dowody, CTA).
      Jeśli użytkownik ZADAJE PYTANIE, odpowiedz zwykłym tekstem.
      Jeśli generujesz dokumenty, użyj: <DOC_1>, <DOC_9>, <DOC_10>, <DOC_12>.`;
    } 
    else if (step === 2) {
      systemContent = `Jesteś WYBITNYM SENIOR FRONT-END DEVELOPEREM.
      Jeśli użytkownik ZADAJE PYTANIE, odpowiedz tekstem.
      
      ZWRÓĆ PEŁNY KOD W TAGACH <HTML>...</HTML>.
      KRYTYCZNE ZASADY KODOWANIA:
      1. DZIEDZICZENIE STYLÓW (DESIGN SYSTEM): 
         - Jeśli kodujesz PODSTRONĘ, w kontekście otrzymasz kod Strony Głównej. 
         - TWOIM BEZWZGLĘDNYM OBOWIĄZKIEM jest utrzymanie 100% spójności wizualnej z Głęwną.
         - Skopiuj <head> ze stylami CSS, <header>, <nav> i <footer> DOKŁADNIE tak, jak wyglądają.
         - W nowym contencie podstrony sklonuj estetykę: użyj tych samych kolorów tła, identycznych klas dla przycisków (np. te same gradienty, paddingi, zaokrąglenia), tych samych cieni (shadow) i fontów. Strona musi stanowić jednorodną całość z resztą serwisu.
      2. MENU: Zaktualizuj atrybuty 'href' w <nav> oraz stopce na bazie Mapy Stron z kontekstu.
      3. DESIGN: Używaj Tailwind v4. Pamiętaj o zachowaniu asymetrii i nowoczesnego układu (Bento grid dla ofert).
      4. ZDJĘCIA: Zastępuj placeholdery nazwami plików z załączników WebP.`;
    }
    else if (step === 3) {
      systemContent = `Jesteś WYBITNYM INŻYNIEREM SEO I OPTYMALIZACJI.
      Otrzymasz gotowy kod HTML. Nasyć go optymalizacją pod AI i SEO.
      1. Zawsze zacznij od naturalnego tekstu (poza tagami), opisując optymalizacje.
      2. ZWRÓĆ ZAKTUALIZOWANY KOD W TAGACH <HTML>...</HTML>.
      3. Wdróż JSON-LD, optymalizuj nagłówki (H1, H2) i dodaj atrybuty alt. Nie zmieniaj wizualnych klas Tailwind!`;
    } 
    else if (step === 4) {
      systemContent = `Jesteś EKSPERTEM JOOMLA i SP PAGE BUILDER. Zmapuj HTML pod CMS. 
      Użyj tagów: <DOC_2>, <DOC_3>, <DOC_7>, <DOC_13>.`;
    }

    const messagesToSend = [...messages];
    if (searchContext) {
        messagesToSend[messagesToSend.length - 1].content = lastUserMessage + searchContext;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o', 
        temperature: 0.3, // Zmniejszyłem lekko temperaturę, aby ściślej trzymał się wzorców CSS
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