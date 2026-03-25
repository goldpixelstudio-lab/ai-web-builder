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
                searchContext = `\n\n--- TWARDE DANE Z INTERNETU ---\nUżyj TYCH informacji (prawdziwe adresy, metody m.in. Teddy Eddie, Savvy Ed):\n${contextStr}\n-----------------------------------\n`;
            }
        } catch (e) {
            console.error("Tavily Error:", e);
        }
    }

    if (step === 1) {
      systemContent = `Jesteś WYBITNYM ARCHITEKTEM INFORMACJI. Generujesz 4 dokumenty XML:
      <DOC_1> Strategia i architektura (wymagane 6 wielkich sekcji: topbar, nav, hero, oferta bento-grid, opinie, footer). </DOC_1>
      <DOC_9> Handoff dla copywritera (wartość merytoryczna, konkretne nazwy kursów). </DOC_9>
      <DOC_10> Wersja redakcyjna - twarde, konkretne teksty do wstawienia na stronę (np. Teddy Eddie, Savvy Ed). </DOC_10>
      <DOC_12> Asset plan. </DOC_12>
      Zawsze otaczaj odpowiedź tagami XML. Brak jakiegokolwiek wstępu.`;
    } 
    else if (step === 2) {
      systemContent = `Jesteś GENERATOREM KODU SEO. 
      ZAKAZ PISANIA RAD, WSTĘPÓW, TEORII I ZDAŃ ZŁOŻONYCH. NIE UŻYWAJ SŁÓW TYPU "Wprowadzenie", "Podsumowanie".
      
      Zwróć JEDYNIE tag <DOC_11>, a w nim:
      1. Surowy, gotowy kod <script type="application/ld+json"> dla LocalBusiness i LanguageSchool, zawierający prawdziwe dane klienta.
      2. Listę 10 precyzyjnych fraz kluczowych (np. "szkoła językowa radomsko", "angielski dla dzieci teddy eddie radomsko").
      3. Meta Title i Meta Description.
      
      Nic więcej. Jeśli napiszesz jedno zdanie poradnika, system ulegnie awarii.`;
    }
    else if (step === 3) {
      systemContent = `Jesteś KOMPILATOREM KODU HTML + Tailwind CSS v4.
      
      KRYTYCZNE ZASADY (ZERO KOMPROMISÓW):
      1. UŻYJ PRAWDZIWYCH DANYCH: Przeanalizuj tekst od użytkownika. Musisz wstawić frazy "Teddy Eddie", "Savvy Ed", nazwy kursów i miasto.
      2. ZAKAZ PLACEHOLDERÓW: Zabraniam pisania "Usługa 1", "Twój Nowoczesny Biznes" itp.
      3. PEŁNA STRUKTURA: Zbuduj potężną stronę (Topbar, Mega Menu, Hero, Bento Grid z ofertą Dzieci/Młodzież/Dorośli, Sekcja Dlaczego My, Rozbudowany Footer).
      4. DESIGN PREMIUM: Użyj asymetrii, glassmorphismu (bg-white/10 backdrop-blur-lg), potężnej typografii (text-5xl md:text-7xl tracking-tighter). Odrzuć nudne 3 kolumny.
      
      Zwróć TYLKO I WYŁĄCZNIE kod zaczynający się od <!DOCTYPE html> i kończący na </html>. Brak znaczników Markdown. Brak komentarzy.`;
    } 
    else if (step === 4) {
      systemContent = `Jesteś EKSPERTEM JOOMLA i SP PAGE BUILDER. Generuj dokumentację wdrożeniową.
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
        temperature: 0.1, // Ekstremalnie niska temperatura - zero halucynacji, 100% trzymania się poleceń
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