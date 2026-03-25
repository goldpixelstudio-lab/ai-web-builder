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
                searchContext = `\n\n--- TWARDE DANE Z INTERNETU ---\nOprzyj dokumenty na tych prawdziwych informacjach (adres, metody np. Teddy Eddie, Savvy Ed):\n${contextStr}\n-----------------------------------\n`;
            }
        } catch (e) {
            console.error("Tavily Error:", e);
        }
    }

    if (step === 1) {
      systemContent = `Jesteś WYBITNYM ARCHITEKTEM INFORMACJI. 
      Jeśli użytkownik ZADAJE PYTANIE LUB PROSI O RADĘ, odpowiedz zwykłym tekstem.
      Jeśli generujesz strukturę, użyj tagów XML:
      <DOC_1> Strategia i architektura (Zaprojektuj mądrą, konwertującą strukturę strony). </DOC_1>
      <DOC_9> Handoff copywriterski. </DOC_9>
      <DOC_10> Wersja redakcyjna (Czyste, mocne teksty oparte na zebranych danych. Zero zapychaczy). </DOC_10>
      <DOC_12> Asset plan. </DOC_12>`;
    } 
    else if (step === 2) {
      systemContent = `Jesteś INŻYNIEREM TECHNICZNEGO SEO.
      Jeśli użytkownik o coś pyta (np. "Jak to wdrożyć?"), odpowiedz ZWYKŁYM TEKSTEM.
      Jeśli prosi o SEO, zwróć TYLKO tag <DOC_11>, a w nim:
      1. Topical Map (klastry tematyczne, frazy long-tail i wolumeny w formie tabeli/listy).
      2. Meta Title i Meta Description.
      3. Surowy, poprawny kod JSON-LD (Organization, LocalBusiness) z PRAWDZIWYMI DANYMI.
      Zero lania wody, zero wstępów.`;
    }
    else if (step === 3) {
      systemContent = `Jesteś WYBITNYM SENIOR FRONT-END DEVELOPEREM.
      Jeśli użytkownik ZADAJE PYTANIE, odpowiedz zwykłym tekstem.
      Jeśli prosi o wygenerowanie lub modyfikację strony, MUSISZ ZWRÓCIĆ PEŁNY KOD W TAGACH <HTML>...</HTML>.

      KRYTYCZNE ZASADY KODOWANIA (POZIOM AWWWARDS):
      1. KORZYSTAJ Z DANYCH: Zintegruj teksty z DOC_10 (np. Radomsko, Teddy Eddie). Zakaz używania "Usługa 1" czy "Lorem Ipsum".
      2. POTEŻNY DESIGN SYSTEM: Użyj Tailwind CSS v4, ale wspomóż go customowym tagiem <style>, wprowadzając luksusowe zmienne CSS:
         :root { --bg: #f6f7fb; --navy: #1a2a6c; --gold: #f7b731; --brand: #d81f2a; }
         Zastosuj w CSS 'clamp()' do fontów oraz 'radial-gradient' na tle.
      3. NOWOCZESNY UKŁAD: Użyj asymetrycznego układu Hero, BENTO GRID do oferty i szklanego efektu (backdrop-blur, bg-white/80).
      4. SEMANTYKA: Używaj tagów <nav>, <header>, <main>, <section>, <footer>.
      
      Zwróć cały poprawny plik od <!DOCTYPE html> wewnątrz tagów <HTML>. Zero znaczników markdown wewnątrz.`;
    } 
    else if (step === 4) {
      systemContent = `Jesteś EKSPERTEM JOOMLA i SP PAGE BUILDER. 
      Jeśli pytają, odpowiadaj tekstem. Jeśli mapujesz, użyj tagów: <DOC_2>, <DOC_3>, <DOC_7>, <DOC_13>.`;
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
        temperature: 0.2, // Niska temperatura, by utrzymać jakość kodu
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