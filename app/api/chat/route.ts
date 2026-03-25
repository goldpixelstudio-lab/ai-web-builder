import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { messages, step } = await req.json();
    let systemContent = "";

    const lastUserMessage = messages[messages.length - 1]?.content || "";
    let searchContext = "";

    if (step === 1 && process.env.TAVILY_API_KEY && lastUserMessage.length > 10) {
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
                searchContext = `\n\n--- TWARDE DANE Z INTERNETU ---\nUżyj TYCH konkretnych informacji o ofercie (np. Teddy Eddie, Savvy Ed) w swoich dokumentach:\n${contextStr}\n-----------------------------------\n`;
            }
        } catch (e) {
            console.error("Tavily Error:", e);
        }
    }

    if (step === 1) {
      systemContent = `Jesteś WYBITNYM ARCHITEKTEM INFORMACJI. Generujesz 4 dokumenty XML:
      <DOC_1> Strategia i architektura (wymagane 6 wielkich sekcji: topbar, nav, hero, oferta bento-grid, opinie, footer). </DOC_1>
      <DOC_9> Handoff dla copywritera (wartość merytoryczna, konkretne nazwy kursów i metod). </DOC_9>
      <DOC_10> Wersja redakcyjna (Premium) - twarde, konkretne teksty do wstawienia na stronę. Zero lania wody. </DOC_10>
      <DOC_12> Asset plan. </DOC_12>
      Zawsze otaczaj odpowiedź tagami XML. Brak jakiegokolwiek wstępu.`;
    } 
    else if (step === 2) {
      systemContent = `Jesteś INŻYNIEREM TECHNICZNEGO SEO. 
      MASZ KATEGORYCZNY ZAKAZ PISANIA ESEJÓW, WSTĘPÓW I PODSUMOWAŃ.
      
      Zwróć JEDYNIE tag <DOC_11>, wewnątrz którego znajdą się:
      1. Kompletny, gotowy do wdrożenia kod JSON-LD (Organization oraz LocalBusiness) dla szkoły językowej, zawierający PRAWDZIWE DANE ze strategii (np. adres w Radomsku).
      2. Twarda architektura nagłówków (H1, H2, H3) oparta na realnych słowach kluczowych (np. "angielski dla dzieci radomsko teddy eddie").
      3. Meta Title i Meta Description.
      
      ZABRONIONE jest generowanie sekcji takich jak "Wprowadzenie" czy "Rekomendacje SEO". Zwracasz tylko czysty konkret do wdrożenia.`;
    }
    else if (step === 3) {
      systemContent = `Jesteś WYBITNYM SENIOR FRONT-END DEVELOPEREM. Twoje zadanie to zakodowanie strony głównej w HTML + Tailwind CSS v4.
      
      KRYTYCZNE, BEZWZGLĘDNE ZASADY:
      1. ZAKAZ PLACEHOLDERÓW: Kategorycznie zabraniam używania fraz takich jak "Innowacyjne Rozwiązania", "Wsparcie Techniczne" czy "Lorem Ipsum". MUSISZ wstawić do kodu prawdziwe teksty o szkole w Radomsku, metodach Teddy Eddie i Savvy Ed pobrane z DOC_10.
      2. WYMAGANA ARCHITEKTURA (Jeśli pominiesz jedną, projekt zostanie odrzucony):
         - <header> z Topbarem kontaktowym (telefon, adres) i szerokim paskiem nawigacji.
         - <section class="hero"> z asymetrycznym układem, potężnym H1 i mocnym CTA.
         - <section class="oferta"> zbudowana w nowoczesnym BENTO GRID (osobne kafle dla Dzieci, Młodzieży, Dorosłych).
         - <section class="opinie-dlaczego-my"> z liczbami i konkretnymi dowodami.
         - <section class="faq"> na dole strony.
         - <footer> z pełną mapą linków.
      3. DESIGN PREMIUM: Zastosuj zaawansowane klasy Tailwind: backdrop-blur-xl, radial-gradients, text-[clamp(...)], zaokrąglenia (rounded-3xl).
      
      ZWRÓĆ TYLKO I WYŁĄCZNIE CZYSTY KOD W ZNACZNIKACH <HTML> cały twój kod </HTML>. JSON-LD ma znaleźć się wewnątrz <head>.`;
    } 
    else if (step === 4) {
      systemContent = `Jesteś EKSPERTEM JOOMLA i SP PAGE BUILDER.
      Wygeneruj dokumentację wdrożeniową na bazie wygenerowanego kodu HTML:
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
        temperature: 0.2, // OBNIŻONA TEMPERATURA = MNIEJ FANTAZJOWANIA, WIĘCEJ TRZYMANIA SIĘ FAKTÓW
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