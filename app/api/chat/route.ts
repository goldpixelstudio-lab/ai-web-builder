import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // Teraz odbieramy całą historię rozmowy, nie tylko jedną wiadomość
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
            content: `Jesteś zaawansowanym asystentem tworzącym strony WWW. Użytkownik buduje nową stronę (np. Profe Studio).
            ZAWSZE musisz wygenerować dwie rzeczy w swojej odpowiedzi:
            1. Strukturę/Logikę/Wytyczne (np. dla systemu CMS) - ten tekst otocz znacznikami <SCHEMA> oraz </SCHEMA>.
            2. Gotowy wizualny podgląd strony napisany w czystym HTML i klasach Tailwind CSS. Ten kod otocz znacznikami <HTML> oraz </HTML>. Nie używaj znaczników <html> czy <body>, zwracaj sam kod sekcji (np. <div class="w-full...">...</div>). Bądź kreatywny, twórz nowoczesny, estetyczny design!` 
          },
          ...messages // Dodajemy całą historię czatu do pamięci AI
        ]
      })
    });

    const data = await response.json();

    if (data.error) {
      console.error('Szczegóły błędu OpenAI:', data.error);
      return NextResponse.json({ reply: `⚠️ Odmowa od OpenAI: ${data.error.message}` });
    }

    return NextResponse.json({ reply: data.choices[0].message.content });
  } catch (error) {
    console.error('Błąd aplikacji:', error);
    return NextResponse.json({ reply: '⚠️ Wystąpił krytyczny błąd połączenia z serwerem.' });
  }
}