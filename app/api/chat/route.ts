import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { messages, step } = await req.json();
    let systemContent = "";

    const lastUserMessage = messages[messages.length - 1]?.content || "";
    let searchContext = "";

    // TAVILY
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
      Projektuj w logice sprzedażowej (hero, problem, rozwiązanie, dowody, CTA). Użytkownik będzie prosił Cię o iteracyjne poprawki w strukturze (np. dodaj sekcję).
      Jeśli użytkownik ZADAJE PYTANIE, odpowiedz zwykłym tekstem.
      Jeśli generujesz dokumenty, użyj: <DOC_1>, <DOC_9>, <DOC_10>, <DOC_12>.`;
    } 
    else if (step === 2) {
      // DAWNIEJ ETAP 3 (VISUAL)
      systemContent = `Jesteś WYBITNYM SENIOR FRONT-END DEVELOPEREM.
      Jeśli użytkownik ZADAJE PYTANIE LUB PROSI O ZMIANĘ (np. kolorystyki), odpowiedz tekstem i zwróć zaktualizowany kod.
      
      ZWRÓĆ PEŁNY KOD W TAGACH <HTML>...</HTML>.
      KRYTYCZNE ZASADY KODOWANIA:
      1. LOGIKA: Nawigacja, Hero, Oferta, Opinie, FAQ, CTA, Footer.
      2. DESIGN TAILWIND + CSS: Używaj Tailwind v4. Dodaj tag <style> w <head> z luksusowymi zmiennymi CSS i gradientami.
      3. ZDJĘCIA (ASSETY): Zastępuj placeholdery konkretnymi nazwami plików z WebP, jeśli użytkownik Ci je poda.
      4. PRAWDZIWE DANE: Używaj tekstów ze strategii (DOC_10).`;
    }
    else if (step === 3) {
      // DAWNIEJ ETAP 2 (SEO) - TERAZ HYBRYDA SEO + HTML
      systemContent = `Jesteś WYBITNYM INŻYNIEREM SEO I OPTYMALIZACJI.
      Użytkownik prześle Ci gotowy kod HTML. Twoim zadaniem jest nasycenie go optymalizacją pod AI i pozycjonowanie.
      
      JAK ODPOWIADAĆ (BARDZO WAŻNE):
      1. Zawsze zacznij od naturalnego tekstu (poza tagami HTML), w którym ocenisz sugestie użytkownika, doradzisz (np. "Tak, ten tekst sprawdzi się lepiej pod kątem intencji wyszukiwania") i opiszesz, co dodałeś do kodu.
      2. ZWRÓĆ ZAKTUALIZOWANY KOD W TAGACH <HTML>...</HTML>.
      
      CO MUSISZ ZROBIĆ W KODZIE HTML:
      - Dodaj zaawansowany kod JSON-LD (Schema.org dla LocalBusiness/School) wewnątrz tagu <head>.
      - Uzupełnij atrybuty 'alt' w tagach <img> i zoptymalizuj teksty nagłówków (H1, H2) pod kątem słów kluczowych.
      - Dodaj meta title i meta description, jeśli ich brakuje.
      Zachowaj istniejący design i klasy Tailwind – nie psuj wyglądu!`;
    } 
    else if (step === 4) {
      systemContent = `Jesteś EKSPERTEM JOOMLA i SP PAGE BUILDER. Zmapuj dostarczony HTML pod system CMS. 
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