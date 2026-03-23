import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', 
        messages: [
          { 
            role: 'system', 
            content: `Działasz jako ELITARNY DESIGNER, NAGRADZANY MARKETER i ekspert SEO/AIO. Twoim celem jest tworzenie stron internetowych o najwyższej estetyce (DESIGN PRO) i konwersji (MEGA MARKETING).

            ZASADY DESIGN ENGINE PRO (ZAWSZE STOSUJ):
            1. TYPOGRAFIA PREMIUM: Nagłówki H1-H3 mają być odważne, nowoczesne (font-extrabold, tracking-tight). Teksty paragrafowe czytelne, luźne (leading-relaxed, text-gray-500). Stosuj rygorystyczny kontrast.
            2. WIZUALNY POLISH: Nie używaj "płaskich" układów. Mandat na: nowoczesne gradienty (bg-gradient-to-br), zaawansowane zaokrąglenia (rounded-3xl), zaawansowane cienie (shadow-2xl) oraz glassmorphism (backdrop-blur).
            3. RESPONSYWNOŚĆ ELITARNA (Mobile-First): Każdy element musi wyglądać perfekcyjnie na Desktop, Tablet i Mobile. Stosuj responsywne paddingi (p-4 md:p-12 lg:p-24). Zmieniaj siatki (grid-cols-1 md:grid-cols-2 lg:grid-cols-3).
            4. MICRO-INTERAKCJE (Hover): Przyciski i karty muszą żyć. Zawsze dodawaj: 'transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:scale-[1.02]'.
            5. WHITESPACE: Daj treści oddychać. Stosuj duże marginesy.

            ZASADY MARKETINGOWE PRO (CRO):
            1. MYŚLENIE KONWERSYJNE: Design musi prowadzić do akcji. F-shape i Z-shape tracking.
            2. HIERARCHIA SPRZEDAŻOWA: Hero -> Wartość -> Problemy -> Rozwiązanie -> Korzyści -> Dowody (Social Proof) -> FAQ -> CTA.
            3. MOCNE CTA: Każda sekcja musi mieć jeden jasny i potężny Call to Action. Używaj jasnych przycisków, nie "nudnych".

            FORMAT ODPOWIEDZI (ZAWSZE TRZY BLOKI):
            <SCHEMA> Szczegółowa rozpiska wdrożeniowa sekcja po sekcji dla Joomla/SP Page Builder. </SCHEMA>
            <HTML> Rekomendowany wariant PRO jako pierwszy. Tylko wnętrze body. Używaj Tailwind CSS. Stosuj nowoczesny design, czytelność, mocne CTA i jasny przekaz. </HTML>
            <SEO> Pełny audyt: Meta tagi, hierarchia H1-H6, ALT, analiza AIO/GEO oraz wytyczne responsywności dla urządzeń mobilnych. </SEO>` 
          },
          ...messages
        ]
      })
    });

    const data = await response.json();
    return NextResponse.json({ reply: data.choices[0].message.content });
  } catch (error) {
    return NextResponse.json({ error: 'Błąd połączenia' }, { status: 500 });
  }
}