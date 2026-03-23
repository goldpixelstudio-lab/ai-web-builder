import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

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
            content: 'Jesteś ekspertem web developmentu i UX/UI. Pomagasz projektować profesjonalne, zoptymalizowane pod SEO struktury stron i kod. Skupiasz się na dostarczaniu rozwiązań idealnie pasujących do wdrożeń opartych na systemach CMS i zaawansowanych page builderach. Zawsze odpowiadaj zwięźle i profesjonalnie.' 
          },
          { role: 'user', content: message }
        ]
      })
    });

    const data = await response.json();

    // TUTAJ JEST MAGIA: Jeśli OpenAI odrzuci prośbę, wyświetlimy powód na czacie!
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