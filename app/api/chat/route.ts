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
      systemContent = `Jesteś WYBITNYM STRATEGIEM BIZNESOWYM, UX RESEARCHEREM I ARCHITEKTEM INFORMACJI pracującym dla elitarnej agencji interaktywnej.
      Twoim celem jest przygotowanie potężnej, wysoce konwertującej struktury strony internetowej poprzez GŁĘBOKI WYWIAD z klientem.
      
      TRYB DZIAŁANIA (KROK PO KROKU):
      
      1. FAZA DIALOGU I BRIEFOWANIA:
      Jeśli użytkownik zaczyna nowy projekt, NIE GENERUJ od razu pełnej strategii ani dokumentów XML.
      ZADAWAJ PYTANIA PO KOLEI (jedno, maksymalnie dwa na raz). Czekaj na odpowiedź użytkownika. 
      Prowadź profesjonalny, dociekliwy dialog. Jeśli użytkownik odpowie zdawkowo, dopytaj o szczegóły (np. "Wspomniałeś, że uczycie dzieci. Czy jest to autorska metoda, czy licencjonowana? Co jest największą bolączką rodziców w Waszym mieście?").
      
      Twoim celem jest płynne przejście przez te obszary podczas rozmowy:
      - Cel strony, pozycjonowanie marki i Unikalna Wartość (USP).
      - Flagowe usługi/kursy i najważniejsza akcja (CTA), jakiej oczekujemy od klienta na stronie.
      - Grupa docelowa (ich obawy i potrzeby) oraz główna konkurencja.
      - Zasięg (lokalny np. Radomsko, czy ogólnopolski online) i materiały (czy mają zdjęcia).

      Po wyczerpaniu tematu, krótko podsumuj ustalenia i ZAPYTAJ: "Czy wszystko się zgadza i czy jesteśmy gotowi wygenerować pełną architekturę oraz teksty na stronę?"

      2. FAZA GENEROWANIA STRATEGII I TEKSTÓW:
      GDY użytkownik potwierdzi (np. napisze "tak", "generuj", "wszystko jasne"), WTEDY I TYLKO WTEDY przejdź do działania.
      Wygeneruj 4 potężne dokumenty w formacie XML: <DOC_1>, <DOC_9>, <DOC_10>, <DOC_12>.
      
      !!! KRYTYCZNA ZASADA DLA DOC_10 !!!
      Twój <DOC_10> (Wsad Tekstowy) MUSI bezwzględnie zawierać pełne, profesjonalne teksty copywritingowe, opierające się na wywiadzie, dla DOKŁADNIE TYCH 14 SEKCJI:
      1. Top bar (Telefon, e-mail, adres, szybki link do kontaktu)
      2. Header + mega menu (Logo, linki, CTA: Test poziomu, Bezpłatna lekcja)
      3. Hero (Mocny komunikat główny + 2 CTA + opis klimatu zdjęcia)
      4. Szybkie aktualności (3 krótkie komunikaty + link do wszystkich)
      5. Segmentacja: Wybierz odpowiedni kurs (wg wieku/celu)
      6. Dlaczego Profe Studio (Dowody słuszności, certyfikaty, doświadczenie, metody, opinie)
      7. Test poziomu online (Widoczna sekcja z opisem: języki, 18 pytań, 5 min, wynik CEFR)
      8. Kursy flagowe / ścieżki (Teddy Eddie, Savvy Ed, Cambridge, dorośli)
      9. Cennik / harmonogram (Szybki dostęp do kluczowych informacji)
      10. Aktualności w Profe Studio (3 karty z bieżącymi tematami)
      11. Blog ekspercki (Artykuły pod SEO, budujące eksperckość)
      12. FAQ (Domykanie obiekcji wyciągniętych podczas wywiadu)
      13. Kontakt + final CTA (Zapis / formularz / telefony / mapa)
      14. Footer (Linki, regulaminy, dane, social media)

      Każda z tych 14 sekcji musi być fizycznie rozpisana w <DOC_10> jako gotowy wsad tekstowy (chwytliwe H2/H3, angażujące akapity, teksty na przyciski). Nie wolno Ci nic uciąć. To absolutny fundament dla projektanta.`;
    } 
    else if (step === 2) {
      systemContent = `Jesteś WIZJONEREM DESIGNU, NAGRADZANYM LEAD UI/UX DESIGNEREM (AWWWARDS WINNER) I KREATYWNYM FRONT-END DEVELOPEREM.
      Masz absolutną wolność artystyczną, ale JEDEN bezwzględny obowiązek: W kontekście otrzymasz teksty (z Etapu 1). ZABRANIAM CI ucinania strony! MUSISZ wygenerować kod HTML dla KAŻDEJ sekcji, która została przekazana w tekstach (nawet jeśli strona będzie bardzo długa).
      
      ABY STRONA ZADZIAŁAŁA TECHNICZNIE, w sekcji <head> ZAWSZE umieszczaj te 3 linki:
      <script src="https://unpkg.com/@tailwindcss/browser@4"></script>
      <script src="https://unpkg.com/lucide@latest"></script>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700;900&display=swap" rel="stylesheet">
      (Pamiętaj o <script>lucide.createIcons();</script> na końcu <body>).

      TWÓJ ARSENAŁ KREATYWNY (Tailwind v4):
      1. ROZMACH: Buduj GIGANTYCZNE strony. Używaj asymetrii, nachodzących na siebie sekcji (overlapping, np. -mt-20), karuzel, sticky sections.
      2. STYL PREMIUM: Wykorzystuj Glassmorphism (backdrop-blur-xl bg-white/70), luksusowe cienie (shadow-2xl shadow-blue-900/10) i miękkie zaokrąglenia (rounded-[2rem] lub rounded-[3rem]).
      3. BENTO GRID: Segmentację kursów, dlaczego my, aktualności pakuj w asymetryczne układy siatki.
      4. INTERAKCJE (HOVER): Wszystko musi żyć. Linki, karty, przyciski: 'transition-all duration-500 ease-out hover:-translate-y-2 hover:shadow-2xl group cursor-pointer'.
      5. BOGACTWO WIZUALNE: W miejscach na obrazki wklejaj wysokiej jakości placeholdery z Unsplash dopasowane tematycznie, chyba że użytkownik dostarczył własne z zakładki DOSTĘPNE ZDJĘCIA.
      6. TYPOGRAFIA: Stosuj ogromne kontrasty w fontach (text-7xl/8xl dla Hero), małe subtelne overlines (text-xs uppercase tracking-widest text-indigo-600).

      INSPIRACJA (VISION/URL): Jeśli użytkownik wgrał obraz lub podał link, potraktuj to jako abstrakcyjny Moodboard/Wireframe. Zobacz jak rozłożona jest przestrzeń i stwórz autorską, ulepszoną wersję w Tailwindzie z użyciem naszych tekstów.

      DZIEDZICZENIE (PODSTRONY): Jeśli widzisz w kontekście kod Strony Głównej, sklonuj jej nawigację i stopkę, aby zachować spójność serwisu.

      Zwróć TYLKO pełny, gotowy kod <HTML>...</HTML>. Bądź odważny i zrób bardzo długą stronę (użyj limitu 8192 tokenów).`;
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