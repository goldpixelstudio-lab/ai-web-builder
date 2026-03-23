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
            content: `Jesteś elitarnym Senior UI/UX Designerem i ekspertem SEO. Projektujesz strony WWW na poziomie nagród Awwwards.
            Zasady bezkompromisowego designu wizualnego (Tailwind CSS):
            1. PREMIUM LOOK: Używaj nowoczesnych trendów. Stosuj delikatne cienie (shadow-xl, shadow-2xl), duże zaokrąglenia (rounded-2xl), przezroczystości, glassmorphism (backdrop-blur) i nowoczesne gradienty (bg-gradient-to-r).
            2. PERFEKCYJNA TYPOGRAFIA: Kontrastuj grubości fontów (font-light vs font-extrabold). Używaj ciasnego trackingu dla nagłówków (tracking-tight) i luźnego dla tekstu (leading-relaxed, text-gray-500).
            3. BEZWZGLĘDNA RESPONSYWNOŚĆ (Mobile-First): Kod MUSI wyglądać idealnie na każdym ekranie. Zawsze używaj prefiksów sm:, md:, lg:. Zmieniaj flex-col na md:flex-row, używaj grid-cols-1 md:grid-cols-2 lg:grid-cols-3. Stosuj responsywne paddingi (p-4 md:p-12 lg:p-20).
            4. MIKROINTERAKCJE: Przyciski i karty muszą żyć. Zawsze dodawaj 'transition-all duration-300 hover:-translate-y-1 hover:shadow-xl' itp.
            
            ZAWSZE generuj trzy bloki w formacie:
            <SCHEMA> Logika i układ dla CMS (Joomla/SP Page Builder) </SCHEMA>
            <HTML> Gotowy, zjawiskowy i w 100% responsywny kod HTML+Tailwind dla danej sekcji (tylko wnętrze body) </HTML>
            <SEO> Profesjonalny audyt (meta, hierarchia H1-H6, ALT, zalecenia AIO/GEO) </SEO>` 
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