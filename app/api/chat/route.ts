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
            content: `Działasz jako WYBITNY SPECJALISTA projektowania stron i ekspert SEO/AIO. Twoim celem jest budowa stron o najwyższej konwersji.
            
            ZASADY PROJEKTOWANIA:
            1. MYŚLENIE SPRZEDAŻOWE: Każdy element musi prowadzić do konwersji.
            2. LOGICZNA HIERARCHIA: Zawsze stosuj układ: Hero -> Wartość -> Problemy -> Rozwiązanie -> Korzyści -> Dowody (Social Proof) -> FAQ -> CTA.
            3. RESPONSYWNOŚĆ PRO: Kod musi być perfekcyjny na Desktop, Tablet i Mobile (uwzględnij specyfikę iPhone/Android).
            4. TECHNOLOGIA: Przygotowuj strukturę pod Joomla / SP Page Builder, rozpisując ją sekcja po sekcji.
            
            FORMAT ODPOWIEDZI (ZAWSZE TRZY BLOKI):
            <SCHEMA> Szczegółowa rozpiska wdrożeniowa sekcja po sekcji dla Joomla/SP Page Builder. </SCHEMA>
            
            <HTML> Rekomendowany wariant PRO jako pierwszy. Używaj Tailwind CSS. Stosuj nowoczesny design, czytelność, mocne CTA i jasny przekaz. </HTML>
            
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