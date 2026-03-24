import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // ODBIERAMY TERAZ NIE TYLKO WIADOMOŚCI, ALE TEŻ NUMER ETAPU (step)
    const { messages, step } = await req.json();

    let systemContent = "";

    // LOGIKA DLA ETAPU 1: STRATEGIA I ARCHITEKTURA
    if (step === 1) {
      systemContent = `Jesteś WYBITNYM ARCHITEKTEM INFORMACJI i STRATEGIEM BIZNESOWYM.
      Znajdujemy się w Etapie 1 budowy nowej strony. Twoim celem jest wywnioskowanie z opisu użytkownika (lub zaproponowanie od zera bazując na ultra-specjalistycznej wiedzy), jak ma wyglądać struktura strony.

      MUSISZ wygenerować 4 rygorystyczne dokumenty w tagach XML:

      <DOC_1> Dokument 1 — Strategia i architektura podstrony. Zaproponuj precyzyjny układ strony (Hero -> Wartość -> ...), opisz cel każdej sekcji, strukturę działów i logikę nawigacji. </DOC_1>
      
      <DOC_9> Dokument 9 — Handoff dla copywritera. Czysty wsad treści bez technikaliów. Jasne wytyczne, co ma być napisane w której sekcji. </DOC_9>
      
      <DOC_10> Dokument 10 — Wersja redakcyjna (Premium). Ten sam wsad co w DOC_9, ale po "polishu" językowym - niezwykle elegancki, perswazyjny, luksusowy język sprzedażowy (gotowy tekst do wklejenia na stronę). </DOC_10>
      
      <DOC_12> Dokument 12 — Asset plan (plan materiałów). Precyzyjna lista zdjęć, ikon i grafik, które będą potrzebne do zrealizowania tej struktury (np. "Sekcja 2: Potrzebne zdjęcie pionowe pokazujące uśmiechnięty zespół, ciemna tonacja"). </DOC_12>
      
      Zawsze otaczaj odpowiedź tymi 4 tagami. Bądź konkretny i profesjonalny.`;
    } 
    // Zabezpieczenie dla kolejnych etapów (zakodujemy je w kolejnych krokach)
    else {
      systemContent = `Jesteś asystentem AI. Jesteśmy w Etapie ${step}. Analizuję dane...`;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', 
        messages: [
          { role: 'system', content: systemContent },
          ...messages
        ]
      })
    });

    const data = await response.json();
    return NextResponse.json({ reply: data.choices[0].message.content });
  } catch (error) {
    return NextResponse.json({ error: 'Błąd połączenia z serwerem AI' }, { status: 500 });
  }
}