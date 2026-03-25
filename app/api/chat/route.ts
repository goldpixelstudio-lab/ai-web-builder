import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { messages, step } = await req.json();
    let systemContent = "";

    const lastUserMessage = messages[messages.length - 1]?.content || "";
    let searchContext = "";

    // Wyszukiwanie tylko w Etapie 1
    if (step === 1 && process.env.TAVILY_API_KEY && lastUserMessage.length > 10 && !lastUserMessage.includes("--- SKOPIOWANA WIEDZA")) {
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
      systemContent = `Jesteś WYBITNYM ARCHITEKTEM INFORMACJI. Twoim zadaniem jest dynamiczne zaprojektowanie optymalnej struktury dla danego biznesu. Generujesz 4 dokumenty XML:
      <DOC_1> Strategia i architektura (Zaprojektuj układ strony wg własnego, profesjonalnego uznania - tak, aby konwertował). </DOC_1>
      <DOC_9> Handoff copywriterski (Konkretne wezwania do akcji, wartości merytoryczne). </DOC_9>
      <DOC_10> Wersja redakcyjna (Czyste, gotowe teksty na stronę oparte o prawdziwe dane z wyszukiwania. Zero zapychaczy). </DOC_10>
      <DOC_12> Asset plan. </DOC_12>
      Otaczaj odpowiedź tagami XML. Brak wstępu.`;
    } 
    else if (step === 2) {
      systemContent = `Jesteś INŻYNIEREM DANYCH SEO. ZAKAZ PISANIA JAKICHKOLWIEK ZDAŃ BĘDĄCYCH PORADAMI LUB TEORIĄ.
      
      Zwróć JEDYNIE tag <DOC_11>, a w nim:
      1. MAPĘ SŁÓW KLUCZOWYCH (Topical Map): Wypisz w punktach klastry tematyczne i precyzyjne frazy (np. "angielski dla dzieci radomsko", "egzamin 8 klasisty radomsko"). Żadnych rad jak ich szukać – to Ty masz je podać.
      2. Meta Title i Meta Description.
      3. Surowy, rozbudowany kod JSON-LD (Organization, LocalBusiness) z PRAWDZIWYMI DANYMI.
      
      ZABRONIONE JEST PISANIE ESEJÓW O SEO.`;
    }
    else if (step === 3) {
      systemContent = `Jesteś WYBITNYM SENIOR FRONT-END DEVELOPEREM. Wygeneruj KOMPLETNY plik HTML + Tailwind CSS v4.
      
      MASZ PEŁNĄ SWOBODĘ ARCHITEKTONICZNĄ, ale musisz spełnić najwyższe rygory techniczne:
      1. UŻYJ PRAWDZIWYCH DANYCH: Zintegruj teksty z DOC_10 i strukturę z DOC_1. Zakaz używania "Lorem Ipsum" czy generycznych nagłówków.
      2. TECHNIKALIA: Zastosuj semantyczne tagi (header, nav, main, section, footer), ukryte linki 'skip-link' dla a11y.
      3. DESIGN PREMIUM: Użyj płynnej typografii (np. text-[clamp(2rem,5vw,4rem)]), zaawansowanych layoutów (Grid, Flexbox, asymetria), subtelnych gradientów i glassmorphismu. Projekt ma wyglądać jak nagrodzony na Awwwards.
      
      Zwróć TYLKO I WYŁĄCZNIE kod zaczynający się od <!DOCTYPE html> i kończący na </html>. JSON-LD ma znaleźć się wewnątrz <head>. Brak znaczników Markdown. Brak komentarzy tłumaczących kod.`;
    } 
    else if (step === 4) {
      systemContent = `Jesteś EKSPERTEM JOOMLA i SP PAGE BUILDER. Zbuduj mapowanie dla wygenerowanego wcześniej kodu HTML.
      <DOC_2> Architektura SP Page Builder. </DOC_2>
      <DOC_3> Tabela wdrożeniowa. </DOC_3>
      <DOC_7> Master Handoff. </DOC_7>
      <DOC_13> QA / Audit checklist. </DOC_13>`;
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
        temperature: 0.3, // Optymalny balans: chłodna kalkulacja dla SEO, ale lekka kreatywność dla HTML i tekstów
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