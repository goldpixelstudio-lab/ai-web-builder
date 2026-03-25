import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { messages, step } = await req.json();
    let systemContent = "";

    const lastUserMessage = messages[messages.length - 1]?.content || "";
    let searchContext = "";

    // AUTONOMICZNE WYSZUKIWANIE (TAVILY)
    if (process.env.TAVILY_API_KEY && lastUserMessage.length > 10) {
        try {
            const searchRes = await fetch('https://api.tavily.com/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    api_key: process.env.TAVILY_API_KEY,
                    query: lastUserMessage,
                    search_depth: "advanced", // Zmiana na deep search
                    include_answer: true,
                    max_results: 5
                })
            });
            const searchData = await searchRes.json();
            
            if (searchData && searchData.results) {
                const contextStr = searchData.results.map((r: any) => `Źródło: ${r.url}\nTreść: ${r.content}`).join('\n\n');
                searchContext = `\n\n--- TWARDE DANE Z INTERNETU (AKTUALNY KONTEKST) ---\nUżyj poniższych informacji pobranych z sieci, aby Twoja odpowiedź opierała się na prawdziwych danych (adresy, metody np. Teddy Eddie, Savvy Ed, certyfikaty):\n${contextStr}\n----------------------------------------------------\n`;
            }
        } catch (e) {
            console.error("⚠️ Błąd silnika Tavily:", e);
        }
    }

    if (step === 1) {
      systemContent = `Jesteś WYBITNYM ARCHITEKTEM INFORMACJI. Twoim zadaniem jest dogłębna analiza dostarczonych danych z internetu i stworzenie potężnej architektury.
      
      Generujesz 4 rygorystyczne dokumenty w tagach XML:
      <DOC_1> Strategia i architektura (semantyczne landmarki, logika, minimum 6 sekcji). </DOC_1>
      <DOC_9> Handoff dla copywritera (wartość merytoryczna, używaj konkretnych nazw np. Teddy Eddie, Savvy Ed). </DOC_9>
      <DOC_10> Wersja redakcyjna (Premium) - język dopasowany do grupy docelowej. </DOC_10>
      <DOC_12> Asset plan. </DOC_12>
      Zawsze otaczaj odpowiedź tagami XML. Brak jakiegokolwiek wstępu.`;
    } 
    else if (step === 2) {
      systemContent = `Jesteś ELITARNYM EKSPERTEM SEO. 
      Wygeneruj 1 rygorystyczny dokument:
      <DOC_11> Dokument 11 — SEO / AI Search Visibility. 
      Musisz uwzględnić precyzyjny JSON-LD dla szkoły językowej z danymi z poprzedniego kroku.
      </DOC_11>
      Zawsze otaczaj odpowiedź tagiem <DOC_11>. Brak wstępu.`;
    }
    else if (step === 3) {
      systemContent = `Jesteś WYBITNYM SENIOR FRONT-END DEVELOPEREM.
      Znajdujemy się w Etapie 3. Wygeneruj KOMPLETNY plik HTML + Tailwind CSS v4.
      
      BEZWZGLĘDNE ZASADY INŻYNIERYJNE (JEŚLI ICH NIE SPEŁNISZ, PROJEKT UPADNIE):
      1. ZAKAZ PLACEHOLDERÓW: Kod ma być masywny (min. 200-300 linijek). Nie możesz zignorować żadnej sekcji.
      2. OBOWIĄZKOWE SEKCJE:
         - Topbar (dane kontaktowe, Radomsko).
         - Header z zaawansowanym Mega Menu.
         - Potężna sekcja Hero z CTA.
         - Sekcja Oferty (Bento Grid dla dzieci, młodzieży, dorosłych).
         - Sekcja Dlaczego My / Opinie.
         - Kompleksowy Footer z linkami.
      3. TREŚĆ: Używaj prawdziwych tekstów z Etapów 1 i 2 (Teddy Eddie, Savvy Ed, przygotowania do egzaminów). ZABRONIONE jest używanie fraz "Lorum Ipsum" czy "Innowacyjne strategie".
      4. DESIGN PREMIUM: Używaj glassmorphismu, gradientów, zaokrągleń (rounded-2xl) i asymetrii.
      5. TECHNIKALIA: CDN Tailwind v4, Lucide Icons, semantyka (nav, main, section).

      ZWRÓĆ TYLKO I WYŁĄCZNIE KOD HTML W ZNACZNIKACH <HTML> cały kod od <!DOCTYPE html> do </html> </HTML>.`;
    } 
    else if (step === 4) {
      systemContent = `Jesteś EKSPERTEM JOOMLA i SP PAGE BUILDER.
      Wygeneruj uniwersalną dokumentację wdrożeniową w tagach:
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
        temperature: 0.7, 
        max_tokens: 4096, // ZMUSZAMY MODEL DO GENEROWANIA DŁUGIEGO KODU
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