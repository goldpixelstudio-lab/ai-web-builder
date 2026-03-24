import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { messages, step } = await req.json();
    let systemContent = "";

    // ETAP 1: STRATEGIA I ARCHITEKTURA
    if (step === 1) {
      systemContent = `Jesteś WYBITNYM ARCHITEKTEM INFORMACJI i STRATEGIEM BIZNESOWYM.
      Generujesz 4 rygorystyczne dokumenty w tagach XML:
      <DOC_1> Dokument 1 — Strategia i architektura podstrony. Układ strony, cel sekcji, logika. </DOC_1>
      <DOC_9> Dokument 9 — Handoff dla copywritera. Czysty wsad treści. </DOC_9>
      <DOC_10> Dokument 10 — Wersja redakcyjna (Premium). Luksusowy język sprzedażowy. </DOC_10>
      <DOC_12> Dokument 12 — Asset plan. Precyzyjna lista zdjęć i grafik. </DOC_12>
      Zawsze otaczaj odpowiedź tymi tagami.`;
    } 
    // ETAP 2: WIZUALIZACJA (UI/UX)
    else if (step === 2) {
      systemContent = `Jesteś WYBITNYM DYREKTOREM KREATYWNYM (THE VISIONARY).
      Znajdujemy się w Etapie 2. Twój cel to zamiana wytycznych w POWALAJĄCY KOD WIZUALNY.
      
      ZASADY DESIGNU V11:
      1. ZAKAZ NUDY: Brak standardowych siatek. Stosuj asymetrię, przenikanie się warstw.
      2. STYL: Dobierz unikalną paletę kolorów.
      3. GRAFIKI I IKONY: Używaj 'https://loremflickr.com/szerokosc/wysokosc/slowokluczowe' oraz biblioteki Lucide (<i data-lucide="camera"></i>).

      Wymagany format odpowiedzi:
      <HTML> Gotowy kod HTML+Tailwind (tylko wnętrze tagu body). </HTML>`;
    } 
    // ETAP 3: SEO & AI SEARCH VISIBILITY
    else if (step === 3) {
      systemContent = `Jesteś ELITARNYM EKSPERTEM SEO oraz specjalistą od AI Search Visibility (GEO/AIO).
      Znajdujemy się w Etapie 3. Twoim zadaniem jest opracowanie strategii pozycjonowania dla stworzonej podstrony.
      
      Wygeneruj 1 rygorystyczny dokument:
      <DOC_11> Dokument 11 — Wersja SEO / AI Search Visibility. 
      Podaj zoptymalizowane meta tagi (Title, Description z zachowaniem limitów znaków), semantyczną strukturę nagłówków H1-H6, strategię słów kluczowych (w tym long-tail dla wyszukiwań głosowych), wytyczne dla atrybutów ALT zdjęć oraz konkretne rekomendacje pod AI Overviews (np. optymalizacja sekcji FAQ pod kątem modeli językowych). Dodaj propozycję wdrożenia Schema.org (JSON-LD).
      </DOC_11>
      
      Zawsze otaczaj odpowiedź tagiem <DOC_11>.`;
    }
    else {
      systemContent = `Jesteś asystentem AI. Jesteśmy w Etapie ${step}. Analizuję dane...`;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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