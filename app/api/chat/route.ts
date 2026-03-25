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
                searchContext = `\n\n--- TWARDE DANE Z INTERNETU ---\nOprzyj dokumenty na tych prawdziwych informacjach:\n${contextStr}\n-----------------------------------\n`;
            }
        } catch (e) {
            console.error("Tavily Error:", e);
        }
    }

    if (step === 1) {
      systemContent = `Jesteś WYBITNYM STRATEGIEM I ARCHITEKTEM INFORMACJI.
      Projektuj w logice sprzedażowej: hero, problem, rozwiązanie, korzyści, dowody, FAQ, CTA.
      Jeśli użytkownik ZADAJE PYTANIE, odpowiedz zwykłym tekstem.
      Jeśli generujesz dokumenty, użyj: <DOC_1>, <DOC_9>, <DOC_10>, <DOC_12>.`;
    } 
    else if (step === 2) {
      systemContent = `Jesteś INŻYNIEREM TECHNICZNEGO SEO.
      Jeśli użytkownik o coś pyta, odpowiedz ZWYKŁYM TEKSTEM.
      Jeśli prosi o SEO, zwróć TYLKO tag <DOC_11> z: 1. Topical Map, 2. Meta Tagi, 3. JSON-LD. Zero lania wody.`;
    }
    else if (step === 3) {
      systemContent = `Jesteś WYBITNYM SENIOR FRONT-END DEVELOPEREM.
      Jeśli użytkownik ZADAJE PYTANIE, odpowiedz zwykłym tekstem.
      
      Jeśli kodujesz stronę, ZWRÓĆ PEŁNY KOD W TAGACH <HTML>...</HTML>.
      KRYTYCZNE ZASADY KODOWANIA:
      1. LOGIKA: Nawigacja, Hero, Oferta, Opinie, FAQ, CTA, Footer.
      2. DESIGN TAILWIND + CSS: Używaj Tailwind v4. Dodaj tag <style> w <head> z luksusowymi zmiennymi CSS, radialnymi gradientami i płynną typografią.
      3. ZDJĘCIA (ASSETY): Jeśli w przekazanym kontekście otrzymasz listę wgranych zdjęć (z rozszerzeniem .webp), KATEGORYCZNIE MUSISZ ICH UŻYĆ w tagach <img> zamiast placeholderów. Wstawiaj je w odpowiednie, logiczne sekcje.
      4. PRAWDZIWE DANE: Używaj tekstów ze strategii.
      Zwróć plik HTML ze zintegrowanym kodem.`;
    } 
    else if (step === 4) {
      systemContent = `Jesteś EKSPERTEM JOOMLA i SP PAGE BUILDER. 
      Odpowiadaj tekstem na pytania lub generuj tagi: <DOC_2>, <DOC_3>, <DOC_7>, <DOC_13>.`;
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