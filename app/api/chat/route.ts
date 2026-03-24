import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { messages, step } = await req.json();
    let systemContent = "";

    if (step === 1) {
      systemContent = `Jesteś WYBITNYM ARCHITEKTEM INFORMACJI i STRATEGIEM BIZNESOWYM.
      Generujesz 4 rygorystyczne dokumenty w tagach XML:
      <DOC_1> Strategia i architektura podstrony. Układ strony, cel sekcji. </DOC_1>
      <DOC_9> Handoff dla copywritera. Czysty wsad treści. </DOC_9>
      <DOC_10> Wersja redakcyjna (Premium). Luksusowy język sprzedażowy. </DOC_10>
      <DOC_12> Asset plan. Lista zdjęć i grafik. </DOC_12>
      Zawsze otaczaj odpowiedź tagami.`;
    } 
    else if (step === 2) {
      systemContent = `Jesteś WYBITNYM DYREKTOREM KREATYWNYM (THE VISIONARY).
      Znajdujemy się w Etapie 2. Twój cel to zamiana wytycznych w POWALAJĄCY KOD WIZUALNY HTML+Tailwind.
      
      ZASADY DESIGNU V11:
      1. ZAKAZ NUDY: Brak standardowych siatek. Stosuj asymetrię, przenikanie się warstw.
      2. STYL: Dobierz unikalną paletę kolorów.
      3. GRAFIKI I IKONY: Używaj '[https://loremflickr.com/1200/800/business](https://loremflickr.com/1200/800/business)' oraz biblioteki Lucide.

      ZWRÓĆ TYLKO I WYŁĄCZNIE KOD HTML W ZNACZNIKACH <HTML> tutaj kod </HTML>. Bez żadnego dodatkowego tekstu.`;
    } 
    else if (step === 3) {
      systemContent = `Jesteś ELITARNYM EKSPERTEM SEO.
      Wygeneruj 1 rygorystyczny dokument:
      <DOC_11> Dokument 11 — Wersja SEO / AI Search Visibility. Tagi, słowa kluczowe, rekomendacje AI. </DOC_11>
      Zawsze otaczaj odpowiedź tagiem <DOC_11>.`;
    }
    else if (step === 4) {
      systemContent = `Jesteś EKSPERTEM JOOMLA i SP PAGE BUILDER.
      Wygeneruj dokumentację wdrożeniową w tagach:
      <DOC_2> Architektura SP Page Builder (sekcja -> row -> addon). </DOC_2>
      <DOC_3> Tabela wdrożeniowa. </DOC_3>
      <DOC_7> Master Handoff. </DOC_7>
      <DOC_13> QA / Audit checklist przed publikacją. </DOC_13>`;
    }

    const response = await fetch('[https://api.openai.com/v1/chat/completions](https://api.openai.com/v1/chat/completions)', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', 
        messages: [
          { role: 'system', content: systemContent },
          ...messages
        ]
      })
    });

    const data = await response.json();
    return NextResponse.json({ reply: data.choices[0].message.content });
  } catch (error) {
    return NextResponse.json({ error: 'Błąd połączenia z serwerem AI' }, { status: 500 });
  }
}