import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { messages, step } = await req.json();
    let systemContent = "";

    // 1. WYCIĄGAMY ZAPYTANIE UŻYTKOWNIKA
    const lastUserMessage = messages[messages.length - 1]?.content || "";
    let searchContext = "";

    // 2. AUTONOMICZNE WYSZUKIWANIE W INTERNECIE (TAVILY)
    // Uruchamiamy wyszukiwarkę, jeśli mamy klucz i użytkownik wpisał sensowne polecenie
    if (process.env.TAVILY_API_KEY && lastUserMessage.length > 10) {
        try {
            const searchRes = await fetch('https://api.tavily.com/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    api_key: process.env.TAVILY_API_KEY,
                    query: lastUserMessage,
                    search_depth: "basic",
                    include_answer: true,
                    max_results: 5
                })
            });
            const searchData = await searchRes.json();
            
            // Jeśli znaleźliśmy dane, budujemy paczkę wiedzy dla AI
            if (searchData && searchData.results) {
                const contextStr = searchData.results.map((r: any) => `Źródło: ${r.url}\nTreść: ${r.content}`).join('\n\n');
                searchContext = `\n\n--- TWARDE DANE Z INTERNETU (AKTUALNY KONTEKST) ---\nUżyj poniższych informacji pobranych z sieci, aby Twoja odpowiedź opierała się na prawdziwych danych, adresach, metodach i usługach firmy:\n${contextStr}\n----------------------------------------------------\n`;
            }
        } catch (e) {
            console.error("⚠️ Błąd silnika Tavily:", e);
            // Jeśli wyszukiwanie zawiedzie, AI i tak wygeneruje odpowiedź (fallback)
        }
    }

    // 3. LOGIKA ETAPÓW (Uniwersalne prompty inżynieryjne)
    if (step === 1) {
      systemContent = `Jesteś WYBITNYM ARCHITEKTEM INFORMACJI i STRATEGIEM BIZNESOWYM. Twoim zadaniem jest dogłębna analiza dostarczonych danych i stworzenie uniwersalnej, elastycznej architektury.
      
      Generujesz 4 rygorystyczne dokumenty w tagach XML:
      <DOC_1> Strategia i architektura podstrony (semantyczne landmarki, logika, ścieżki konwersji). </DOC_1>
      <DOC_9> Handoff dla copywritera (wartość merytoryczna, problem-solution). </DOC_9>
      <DOC_10> Wersja redakcyjna (Premium) - język dopasowany do grupy docelowej, precyzyjny i perswazyjny. </DOC_10>
      <DOC_12> Asset plan - uniwersalna lista potrzebnych mediów. </DOC_12>
      Zawsze otaczaj odpowiedź tagami XML. Brak jakiegokolwiek wstępu.`;
    } 
    else if (step === 2) {
      systemContent = `Jesteś ELITARNYM EKSPERTEM SEO oraz specjalistą AI Search Optimization (AISO). 
      Wygeneruj 1 rygorystyczny dokument:
      <DOC_11> Dokument 11 — SEO / AI Search Visibility. 
      Musisz uwzględnić:
      - Architekturę nagłówków (jeden szeroki H1, zagnieżdżone H2-H3).
      - Gotowy kod JSON-LD dopasowany do analizowanej branży (Organization, LocalBusiness, FAQPage itp.).
      - Strategię pod intencje lokalne i AI Overviews.
      </DOC_11>
      Zawsze otaczaj odpowiedź tagiem <DOC_11>. Brak wstępu.`;
    }
    else if (step === 3) {
      systemContent = `Jesteś WYBITNYM SENIOR FRONT-END DEVELOPEREM. Tworzysz kod na poziomie nagród Awwwards.
      Znajdujemy się w Etapie 3. Twój cel to wygenerowanie kompletnego pliku HTML + Tailwind CSS v4.
      
      RYGORYSTYCZNE ZASADY INŻYNIERYJNE:
      1. STRUKTURA BEM & SEMANTYKA: Używaj tagów (header, nav, main, section, aside, footer). Dodawaj 'aria-label' i niewidoczne linki 'skip-link'.
      2. FLUID TYPOGRAPHY: Używaj funkcji clamp() w Tailwind np: text-[clamp(2rem,5vw,4rem)].
      3. ZŁOŻONY DESIGN W TAILWIND: 
         - Wdrażaj radial-gradients, wielowarstwowe tła, glassmorphism (backdrop-blur-md, bg-white/10).
         - Projektuj układ oparty na CSS Grid i Flexbox z zachowaniem doskonałego "whitespace" i eleganckiej asymetrii.
      4. SEO W KODZIE: Kod musi zawierać poprawne meta tagi w sekcji <head> oraz wygenerowany w poprzednim etapie skrypt JSON-LD.
      5. IKONY I MEDIA: Używaj biblioteki Lucide (<i data-lucide="nazwa"></i>) i doskonałych placeholderów obrazów.

      ZWRÓĆ TYLKO I WYŁĄCZNIE CZYSTY KOD W ZNACZNIKACH <HTML> pełny kod strony </HTML>. Kod musi opierać się na Tailwind v4 CDN. Nie używaj dodatkowego formatowania markdown wewnątrz XML.`;
    } 
    else if (step === 4) {
      systemContent = `Jesteś EKSPERTEM JOOMLA i SP PAGE BUILDER.
      Wygeneruj uniwersalną dokumentację wdrożeniową w tagach:
      <DOC_2> Architektura SP Page Builder (mapowanie kodu na addony i rzędy). </DOC_2>
      <DOC_3> Tabela wdrożeniowa (Helix Ultimate vs SPPB). </DOC_3>
      <DOC_7> Master Handoff. </DOC_7>
      <DOC_13> QA / Audit checklist przed publikacją. </DOC_13>`;
    }

    // 4. WSTRZYKNIĘCIE KONTEKSTU DO ZAPYTANIA
    const messagesToSend = [...messages];
    if (searchContext) {
        messagesToSend[messagesToSend.length - 1].content = lastUserMessage + searchContext;
    }

    // 5. POŁĄCZENIE Z GPT-4o (Pełna moc)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Flagowy model OpenAI
        temperature: 0.7, 
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