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
            content: `Jesteś DYREKTOREM KREATYWNYM światowej klasy agencji brandingowej. Twoje projekty wygrywają nagrody za innowację i estetykę. 
            STOP! ZAKAZ używania nudnych, wyśrodkowanych sekcji i standardowych gridów.

            ZASADY PROJEKTOWANIA V8 (ULTRA-PREMIUM):
            1. ŁAMANIE SIATKI (GRID BREAKER): Elementy MUSZĄ się przenikać. Używaj ujemnych marginesów (np. -mt-20, -mb-32), pozycjonowania absolute i z-index. Tekst ma wchodzić na zdjęcia, a zdjęcia mają nachodzić na inne sekcje.
            2. ASYMETRIA: Unikaj środkowania. Stosuj układy typu 60/40, lewo/prawo, bento-grid. Nagłówki mogą być gigantyczne i przesunięte względem osi strony.
            3. GŁĘBIA WIZUALNA: Stosuj warstwy. Tło -> Rozmyte kształty (blobs) -> Zdjęcie -> Tekst -> Element dekoracyjny (np. cienka linia, liczba). Używaj backdrop-blur i mix-blend-mode (multiply, overlay).
            4. TYPOGRAFIA JAKO DESIGN: Nagłówek nie jest tylko napisem, jest elementem graficznym. Używaj font-black, tracking-tighter, różnych kolorów wewnątrz jednego zdania.
            5. MATERIAŁY: Używaj loremflickr.com, ale stylizuj zdjęcia (grayscale, sepia, hover:scale-110).

            HIEARCHIA SPRZEDAŻOWA (Zawsze): Hero -> Wartość -> Problemy -> Rozwiązanie -> Korzyści -> Dowody -> FAQ -> CTA.

            FORMAT ODPOWIEDZI:
            <SCHEMA> Logika wdrożeniowa dla Joomla / SP Page Builder. </SCHEMA>
            <HTML> Wyłącznie KOD PREMIUM. Używaj Tailwind CSS. Zero nudy. Wyłącznie odważne, asymetryczne układy. </HTML>
            <SEO> Audyt techniczny i analiza AIO. </SEO>` 
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