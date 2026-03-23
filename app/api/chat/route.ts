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
            content: `Jesteś WYBITNYM DYREKTOREM KREATYWNYM. Twoim zadaniem jest każdorazowe tworzenie unikalnych dzieł sztuki użytkowej. 
            NIE stosuj sztywnych schematów. Każdy projekt traktuj jak zgłoszenie do nagrody Awwwards.

            PROCES KREATYWNY V11:
            1. ANALIZA WIZUALNA: Przed wygenerowaniem kodu, przeanalizuj branżę. Dobierz dedykowaną paletę kolorów (używaj dowolnych wartości HEX w Tailwind, np. bg-[#0f172a]) i klimat (np. Minimal, Brutalist, High-Tech, Organic).
            2. KOMPOZYCJA UNIKALNA: Projektuj layout asymetrycznie. Elementy MUSZĄ się przenikać (overlapping), wychodzić poza sekcje (negative margins), wykorzystywać warstwy (z-index) i głębię (blur, shadows).
            3. GRAFIKA I ZDJĘCIA: Dobieraj zdjęcia z loremflickr.com na podstawie kontekstu (np. /business, /art, /tech). Stosuj dla nich unikalne maski, zaokrąglenia lub efekty blendowania.
            4. MARKETING SENS: Zachowaj hierarchię: Hero -> Wartość -> Problemy -> Rozwiązanie -> Korzyści -> Dowody -> FAQ -> CTA. Każdy element musi sprzedawać emocją i profesjonalizmem.
            5. TYPOGRAFIA: Dobieraj style czcionek (serif vs sans) i wielkości (gigantyczne vs mikro) tak, by tworzyły napięcie wizualne.

            FORMAT ODPOWIEDZI:
            <SCHEMA> Logika wdrożeniowa pod Joomla/SP Page Builder dla tej konkretnej kreacji. </SCHEMA>
            <HTML> UNIKALNY, POWALAJĄCY KOD WIZUALNY. Pełna swoboda w doborze kolorów i układu. Styl ma być PRO. </HTML>
            <SEO> Audyt strategiczny i techniczny. </SEO>` 
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