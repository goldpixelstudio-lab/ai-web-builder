import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { messages, step } = await req.json();
    let systemContent = "";

    const lastUserMessage = messages[messages.length - 1]?.content || "";
    let searchContext = "";

    // Wyszukiwanie tylko w Etapie 1
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
                searchContext = `\n\n--- TWARDE DANE Z INTERNETU ---\nPrzeanalizuj te dane i zbuduj na ich podstawie całą architekturę:\n${contextStr}\n-----------------------------------\n`;
            }
        } catch (e) {
            console.error("Tavily Error:", e);
        }
    }

    if (step === 1) {
      systemContent = `Jesteś WYBITNYM ARCHITEKTEM INFORMACJI. 
      Jeśli użytkownik zadaje pytanie, odpowiedz zwykłym tekstem.
      Jeśli generujesz dokumenty, użyj tagów XML:
      <DOC_1> Strategia i architektura (Zaprojektuj układ strony wg własnego uznania). </DOC_1>
      <DOC_9> Handoff copywriterski. </DOC_9>
      <DOC_10> Wersja redakcyjna (Czyste teksty z informacjami np. Teddy Eddie). </DOC_10>
      <DOC_12> Asset plan. </DOC_12>`;
    } 
    else if (step === 2) {
      systemContent = `Jesteś INŻYNIEREM DANYCH SEO.
      ZASADA 1: Jeśli użytkownik zadaje pytanie (np. "Gdzie to wkleić?"), odpowiedz mu naturalnie ZWYKŁYM TEKSTEM (bez tagów).
      ZASADA 2: Jeśli użytkownik prosi o mapę SEO, ZAKAZUJĘ CI PISANIA PORAD. Masz zwrócić TYLKO tag <DOC_11>, a w nim:
      - Ultra profesjonalną Topical Map (klastry tematyczne, frazy long-tail i wolumeny w formie tabeli/listy).
      - Gotowy kod JSON-LD (Organization, LocalBusiness) z prawdziwymi danymi.
      - Meta Title i Meta Description.
      Zero lania wody. Zero "Wprowadzeń".`;
    }
    else if (step === 3) {
      systemContent = `Jesteś WYBITNYM SENIOR FRONT-END DEVELOPEREM.
      ZASADA 1: Jeśli użytkownik zadaje pytanie, odpowiedz mu ZWYKŁYM TEKSTEM.
      ZASADA 2: Jeśli modyfikujesz lub tworzysz kod, musisz zwrócić CAŁY KOD w tagach <HTML>...</HTML>.

      RYGORY TECHNICZNE DLA KODU HTML:
      1. STYLE CSS: W sekcji <head> MUSISZ dodać obszerny tag <style>. Zdefiniuj w nim zmienne :root (np. kolory brandowe, granat #1a2a6c, złoto #f7b731), dodaj luksusowe radial-gradients w tle (radial-gradient(circle at top left...)) oraz efekty hover. Nie polegaj tylko na samym Tailwindzie.
      2. STRUKTURA: Pełny dokument <!DOCTYPE html>, z <nav>, <header>, wieloma <section> i <footer>.
      3. DANE: Używaj tekstów ze strategii (DOC_10). Zero "Lorem Ipsum" czy "Usługa 1".
      Wygeneruj ultra profesjonalny kod.`;
    } 
    else if (step === 4) {
      systemContent = `Jesteś EKSPERTEM JOOMLA i SP PAGE BUILDER. 
      Jeśli użytkownik zadaje pytanie, odpowiedz tekstem.
      Jeśli mapujesz projekt, użyj tagów: <DOC_2>, <DOC_3>, <DOC_7>, <DOC_13>.`;
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
        temperature: 0.3, 
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