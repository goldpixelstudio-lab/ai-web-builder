import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { messages, step } = await req.json();
    let systemContent = "";

    const lastUserMessage = messages[messages.length - 1]?.content || "";
    let searchContext = "";

    // TAVILY - Wyszukiwanie
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
      Ten projekt służy do tworzenia stron internetowych, landing page’y, struktur ofertowych i materiałów wdrożeniowych dla klientów.

      TWOJE ZASADY (MUSISZ ICH PRZESTRZEGAĆ):
      - projektuj strony w logice sprzedażowej i decyzyjnej,
      - buduj hierarchię treści: hero, obietnica wartości, problem, rozwiązanie, korzyści, dowody, FAQ, CTA,
      - zawsze pilnuj jasnego przekazu, logicznej kolejności bloków i mocnego CTA,
      - ograniczaj elementy, które nie wspierają celu strony.
      - Domyślny język odpowiedzi: polski.
      - Styl: uporządkowany, konwersyjny, profesjonalny.

      Jeśli użytkownik ZADAJE PYTANIE, odpowiedz zwykłym tekstem.
      Jeśli generujesz dokumenty, zwróć format XML:
      <DOC_1> Strategia i architektura (Rekomendowana koncepcja i struktura). </DOC_1>
      <DOC_9> Handoff copywriterski. </DOC_9>
      <DOC_10> Wersja redakcyjna (Czyste, gotowe i sprzedażowe teksty na stronę). </DOC_10>
      <DOC_12> Asset plan. </DOC_12>`;
    } 
    else if (step === 2) {
      systemContent = `Jesteś INŻYNIEREM TECHNICZNEGO SEO.
      Jeśli użytkownik o coś pyta, odpowiedz ZWYKŁYM TEKSTEM.
      
      Jeśli prosi o SEO, zwróć TYLKO tag <DOC_11>, a w nim:
      1. Topical Map (klastry tematyczne, frazy kluczowe dopasowane do intencji sprzedażowej).
      2. Meta Title i Meta Description (skonstruowane konwersyjnie).
      3. Surowy kod JSON-LD (Organization, LocalBusiness) z PRAWDZIWYMI DANYMI.
      Zero lania wody, zero porad i wstępów.`;
    }
    else if (step === 3) {
      systemContent = `Jesteś WYBITNYM SENIOR FRONT-END DEVELOPEREM.
      Jeśli użytkownik ZADAJE PYTANIE, odpowiedz zwykłym tekstem.
      
      Jeśli kodujesz stronę, MUSISZ połączyć luksusowy design z logiką sprzedażową. ZWRÓĆ PEŁNY KOD W TAGACH <HTML>...</HTML>.

      KRYTYCZNE ZASADY KODOWANIA (POZIOM AWWWARDS):
      1. LOGIKA SPRZEDAŻOWA (Struktura z Etapu 1): Kod musi zawierać sekcje ułożone konwersyjnie: Navigation, Hero, Obietnica/Problem, Rozwiązanie (Oferta), Dowody Społeczne (Opinie/Liczby), FAQ i potężne końcowe CTA.
      2. POTEŻNY DESIGN TAILWIND: Masz KATEGORYCZNY ZAKAZ używania zwykłego, archaicznego CSS. Cały layout i wygląd musi opierać się o klasy Tailwind CSS v4. Używaj nowoczesnych technik: 
         - Szklany efekt (backdrop-blur-xl, bg-white/10).
         - Zaawansowane tła (bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900).
         - Nowoczesna typografia (text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400).
         - Asymetria i Bento Grid (grid-cols-1 md:grid-cols-3 gap-6).
      3. PRAWDZIWE DANE: Wstaw teksty z DOC_10. Zero "Lorem Ipsum".
      
      Zwróć cały poprawny plik od <!DOCTYPE html> wewnątrz tagów <HTML>. Podepnij skrypt ikon Lucide.`;
    } 
    else if (step === 4) {
      systemContent = `Jesteś EKSPERTEM JOOMLA i SP PAGE BUILDER. 
      Jeśli użytkownik o coś pyta, odpowiadaj tekstem.
      Jeśli mapujesz projekt na Joomla, myśl praktycznie i wykonawczo, rozpisuj materiał sekcja po sekcji. Użyj tagów: <DOC_2>, <DOC_3>, <DOC_7>, <DOC_13>.`;
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
        temperature: 0.4, // Delikatnie podniesiona temperatura (0.4), aby AI mogło lepiej kreować chwytliwe nagłówki i ładniejszy layout w Tailwind.
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