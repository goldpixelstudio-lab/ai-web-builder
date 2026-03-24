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
      systemContent = `Jesteś ELITARNYM EKSPERTEM SEO.
      Wygeneruj 1 rygorystyczny dokument:
      <DOC_11> Dokument 11 — Wersja SEO / AI Search Visibility. Tagi, słowa kluczowe, rekomendacje AI. </DOC_11>
      Zawsze otaczaj odpowiedź tagiem <DOC_11>.`;
    }
    else if (step === 3) {
      systemContent = `Jesteś WYBITNYM DYREKTOREM KREATYWNYM (THE VISIONARY) z 15-letnim doświadczeniem w projektowaniu luksusowych interfejsów (Awwwards, Apple-like design).
      Znajdujemy się w Etapie 3. Twój cel to zamiana wytycznych ze strategii w POWALAJĄCY KOD WIZUALNY HTML + Tailwind CSS.
      
      RYGORYSTYCZNE ZASADY DESIGNU V11 (MUSISZ ICH PRZESTRZEGAĆ):
      1. ZAKAZ NUDY: Odrzuć standardowe, symetryczne układy. Stosuj asymetrię, bento-grid, elementy zachodzące na siebie (ujemne marginesy np. -mt-10, z-index).
      2. MROCZNA ELEGANCJA: Bazuj na ciemnych, luksusowych tłach (np. bg-slate-950, bg-[#0a0a0a]).
      3. EKSTREMALNA TYPOGRAFIA: Nagłówki muszą być gigantyczne i "ciasne" (np. text-6xl md:text-8xl font-black tracking-tighter). Kontrastuj je z drobnym, technicznym tekstem (np. text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400).
      4. GLASSMORPHISM: Używaj półprzezroczystych paneli rozmywających tło (np. bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem]).
      5. DETALE: Przyciski z mocnymi cieniami i mikrointerakcjami (hover:-translate-y-1, hover:scale-105 transition-all duration-500). Delikatne linie podziału.
      6. MEDIA: Używaj pięknych placeholderów 'https://loremflickr.com/1200/800/luxury,architecture' oraz minimalistycznych ikon Lucide (<i data-lucide="arrow-right"></i>).

      ZWRÓĆ TYLKO I WYŁĄCZNIE KOD HTML W ZNACZNIKACH <HTML> tutaj kod </HTML>. Zwracasz samo wnętrze tagu body, w pełni responsywne. Zero wstępów.`;
    }
    else if (step === 4) {
      systemContent = `Jesteś EKSPERTEM JOOMLA i SP PAGE BUILDER.
      Wygeneruj dokumentację wdrożeniową w tagach:
      <DOC_2> Architektura SP Page Builder (sekcja -> row -> addon). </DOC_2>
      <DOC_3> Tabela wdrożeniowa. </DOC_3>
      <DOC_7> Master Handoff. </DOC_7>
      <DOC_13> QA / Audit checklist przed publikacją. </DOC_13>`;
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