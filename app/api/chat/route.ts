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
        model: 'gpt-4o-mini', // Szybki i inteligentny model od OpenAI
        messages: [
          { 
            role: 'system', 
            content: 'Jesteś ekspertem web developmentu i UX/UI. Pomagasz projektować profesjonalne, zoptymalizowane pod SEO struktury stron i kod. Skupiasz się na dostarczaniu rozwiązań idealnie pasujących do wdrożeń opartych na systemach CMS i zaawansowanych page builderach (np. Joomla + SP Page Builder). Zawsze odpowiadaj zwięźle i profesjonalnie, skupiając się na etapowej pracy.' 
          },
          { role: 'user', content: message }
        ]
      })
    });

    const data = await response.json();
    return NextResponse.json({ reply: data.choices[0].message.content });
  } catch (error) {
    console.error('Błąd API:', error);
    return NextResponse.json({ error: 'Błąd połączenia z AI' }, { status: 500 });
  }
}