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
            content: `Jesteś zaawansowanym asystentem tworzącym strony WWW, z ogromnym naciskiem na SEO i optymalizację pod AI (AIO). Użytkownik buduje stronę dla CMS (np. Joomla).
            ZAWSZE generuj trzy bloki w swojej odpowiedzi:
            1. Strukturę/Logikę/Moduły CMS - otocz znacznikami <SCHEMA> oraz </SCHEMA>.
            2. Gotowy wizualny kod sekcji (HTML + Tailwind CSS) - otocz znacznikami <HTML> oraz </HTML>. Zwracaj sam kod sekcji, bez <html> i <body>.
            3. Analizę SEO/AIO - otocz znacznikami <SEO> oraz </SEO>. Wypisz tu propozycje meta tagów, hierarchię nagłówków (H1-H6), wytyczne dla tekstów alternatywnych (ALT) oraz wskazówki, jak boty Google i AI zrozumieją ten fragment.` 
          },
          ...messages
        ]
      })
    });

    const data = await response.json();

    if (data.error) {
      console.error('Błąd OpenAI:', data.error);
      return NextResponse.json({ reply: `⚠️ Odmowa od OpenAI: ${data.error.message}` });
    }

    return NextResponse.json({ reply: data.choices[0].message.content });
  } catch (error) {
    console.error('Błąd aplikacji:', error);
    return NextResponse.json({ reply: '⚠️ Wystąpił krytyczny błąd połączenia.' });
  }
}