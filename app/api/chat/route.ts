import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { messages, step } = await req.json();
    let systemContent = "";

    const lastUserMessage = messages[messages.length - 1];
    const userText = typeof lastUserMessage?.content === 'string' 
        ? lastUserMessage.content 
        : lastUserMessage?.content?.find((c: any) => c.type === 'text')?.text || "";

    let searchContext = "";
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const hasUrls = userText.match(urlRegex);

    if ((step === 1 || (step === 2 && hasUrls)) && process.env.TAVILY_API_KEY && userText.length > 10 && !userText.includes("--- WIEDZA")) {
        try {
            const searchRes = await fetch('https://api.tavily.com/search', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ api_key: process.env.TAVILY_API_KEY, query: step === 2 ? `Zanalizuj estetykę i bogactwo stron: ${hasUrls.join(", ")}` : userText, search_depth: "advanced", include_answer: true, max_results: 5 })
            });
            const searchData = await searchRes.json();
            if (searchData && searchData.results) {
                const contextStr = searchData.results.map((r: any) => `Źródło: ${r.url}\nTreść: ${r.content}`).join('\n\n');
                searchContext = step === 2 
                    ? `\n\n--- INSPIRACJA Z URL ---\nZainspiruj się innowacyjnym układem, rozmachem i potraktuj to jako paliwo dla swojej wyobraźni:\n${contextStr}\n-----------------------------------\n`
                    : `\n\n--- TWARDE DANE Z INTERNETU ---\nOprzyj dokumenty na tych informacjach:\n${contextStr}\n-----------------------------------\n`;
            }
        } catch (e) { console.error("Tavily Error:", e); }
    }

    if (step === 1) {
      systemContent = `Jesteś WYBITNYM STRATEGIEM BIZNESOWYM, UX RESEARCHEREM I ARCHITEKTEM INFORMACJI.
      Twoim zadaniem jest przygotowanie potężnej, wysoce konwertującej i ROZBUDOWANEJ architektury strony internetowej. ZABRANIAM CI generować krótkich, minimalnych schematów. Strona musi być potężna.

      JEŚLI PROJEKTUJESZ STRONĘ GŁÓWNĄ (lub inną ważną podstronę), ZAWSZE opieraj się na tym 14-punktowym standardzie premium (możesz go dostosować, ale zachowaj rozmach):
      1. Top bar: Telefon, e-mail, adres, szybki link do kontaktu.
      2. Header + mega menu: Logo, menu, przyciski CTA (np. Test poziomu, Bezpłatna lekcja).
      3. Hero: Mocny komunikat główny + 2 CTA + zarys wizualny (kolaż/zdjęcie).
      4. Szybkie aktualności: 3 krótkie alerty/komunikaty + link "zobacz wszystkie".
      5. Segmentacja (Wybierz odpowiedni kurs): Podział wg wieku, celu, branży.
      6. Dlaczego My (Social Proof): Certyfikaty, doświadczenie, metody, opinie, logotypy partnerów.
      7. Lead Magnet / Interakcja: Np. Test poziomu online (języki, 18 pytań, 5 minut, wynik CEFR).
      8. Produkty/Kursy flagowe: Rozbudowana sekcja (np. Teddy Eddie, Savvy Ed, dorośli, egzaminy).
      9. Cennik / Harmonogram: Szybki dostęp do kluczowych informacji.
      10. Aktualności / Kafelki: 3 karty z bieżącymi wydarzeniami z życia szkoły/firmy.
      11. Blog ekspercki: Artykuły pod SEO, budowanie autorytetu.
      12. FAQ: Domykanie obiekcji (najczęstsze pytania i wyczerpujące odpowiedzi).
      13. Kontakt + Final CTA: Zapisy, formularz, telefony, mapa/lokalizacja.
      14. Footer: Linki, regulaminy, dane rejestrowe, social media.

      TWOJE ZADANIE:
      Wygeneruj 4 dokumenty w formacie XML:
      <DOC_1> Architektura i Strategia (Rozpisz tu analitycznie te 14 sekcji) </DOC_1>
      <DOC_9> Handoff Copywriterski (Tone of voice, grupy docelowe) </DOC_9>
      <DOC_10> Wsad Tekstowy - KRYTYCZNE! Musisz wygenerować obszerne, gotowe teksty, chwytliwe nagłówki i paragrafy DLA KAŻDEJ Z TYCH 14 SEKCJI. To "paliwo" dla Etapu 2. Jeśli zrobisz to krótko, strona wyjdzie pusta! </DOC_10>
      <DOC_12> Plan Mediów (Jakie zdjęcia/ikony będą potrzebne w każdej sekcji) </DOC_12>
      
      Zwróć wyłącznie bloki XML z pełną zawartością.`;
    } 
    else if (step === 2) {
      systemContent = `Jesteś WIZJONEREM DESIGNU, NAGRADZANYM LEAD UI/UX DESIGNEREM (AWWWARDS WINNER) I KREATYWNYM FRONT-END DEVELOPEREM.
      Masz absolutną wolność artystyczną. Oczekuję od Ciebie rozmachu, kreatywności i wyjścia poza schemat. Będziesz miał gigantyczną ilość tekstów w kontekście - MUSISZ użyć ich wszystkich i wygenerować te 14 sekcji!
      
      ABY STRONA ZADZIAŁAŁA TECHNICZNIE, w sekcji <head> ZAWSZE umieszczaj te 3 linki:
      <script src="https://unpkg.com/@tailwindcss/browser@4"></script>
      <script src="https://unpkg.com/lucide@latest"></script>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700;900&display=swap" rel="stylesheet">
      (Pamiętaj o <script>lucide.createIcons();</script> na końcu <body>).

      TWÓJ ARSENAŁ KREATYWNY (Tailwind v4):
      1. ROZMACH I SEKCJE: Buduj masywne strony. Stosuj asymetrię, overlapping (elementy nachodzące na siebie, np. -mt-16), nieoczywiste podziały ekranu.
      2. STYL PREMIUM: Używaj Glassmorphismu (backdrop-blur-2xl bg-white/60), zaawansowanych gradientów, luksusowych cieni (shadow-2xl) i ekstremalnych zaokrągleń (rounded-[2.5rem]).
      3. TYPOGRAFIA Z CHARAKTEREM: Używaj font-sans (Montserrat). Twórz GIGANTYCZNE, chwytliwe nagłówki (text-6xl/7xl/8xl, tracking-tighter). Dodawaj małe etykiety nad nagłówkami (text-xs uppercase tracking-[0.3em] text-blue-600).
      4. ŻYCIE I INTERAKCJE: Elementy muszą reagować na hover (group, group-hover:-translate-y-3, transition-all duration-500). 
      5. BOGACTWO WIZUALNE: Używaj pięknych, dynamicznych placeholderów wysokiej jakości (np. z Unsplash: https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80) jeśli użytkownik nie podał własnych.

      INSPIRACJA (VISION/URL): Jeśli użytkownik wgrał obraz lub podał link, potraktuj to jako mapę inspiracji. Zobacz, jak tam płynie treść, jakie są proporcje układu i ZBUDUJ WŁASNĄ, LEPSZĄ, BARDZIEJ ROZBUDOWANĄ WERSJĘ.

      DZIEDZICZENIE (PODSTRONY): Jeśli widzisz w kontekście kod Strony Głównej, sklonuj jej nawigację i stopkę, aby zachować spójność serwisu.

      Zwróć TYLKO pełny, gotowy, kreatywny kod <HTML>...</HTML>. Bądź odważny w designie.`;
    }
    else if (step === 3) {
      systemContent = `Jesteś INŻYNIEREM SEO. Wdróż JSON-LD, zoptymalizuj H1/H2 i tagi ALT. Zwróć nowy <HTML>...</HTML> oraz napisz co zmieniłeś i dodaj blok sitemap.xml.`;
    } 
    else if (step === 4) { systemContent = `Jesteś EKSPERTEM JOOMLA. Użyj tagów: <DOC_2>, <DOC_3>, <DOC_7>, <DOC_13>.`; }
    else if (step === 5) { systemContent = `Jesteś EKSPERTEM WORDPRESS. Użyj tagów: <DOC_14>, <DOC_15>.`; }
    else if (step === 6) { systemContent = `Jesteś TECHNICAL WRITEREM. Użyj tagów: <DOC_16>, <DOC_17>.`; }

    const messagesToSend = [...messages];
    if (searchContext) {
        if (typeof messagesToSend[messagesToSend.length - 1].content === 'string') { messagesToSend[messagesToSend.length - 1].content += searchContext; } 
        else { messagesToSend[messagesToSend.length - 1].content[0].text += searchContext; }
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ 
        model: 'gpt-4o', 
        temperature: 0.8, 
        max_tokens: 8192, 
        messages: [{ role: 'system', content: systemContent }, ...messagesToSend] 
      })
    });
    const data = await response.json(); return NextResponse.json({ reply: data.choices[0].message.content });
  } catch (error) { console.error("Błąd API:", error); return NextResponse.json({ error: 'Błąd API' }, { status: 500 }); }
}