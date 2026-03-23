import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const update = await req.json();
    
    // Sprawdzamy, czy przyszła do nas wiadomość tekstowa
    if (update.message && update.message.text) {
      const chatId = update.message.chat.id;
      
      // Nasza wiadomość powitalna
      const replyText = "Witaj! Jestem Twoim prywatnym asystentem AI. System jest w pełni podłączony i gotowy do pracy nad nową stroną Profe Studio. Możemy zaczynać analizę struktury menu i przygotowywać pierwsze wizualizacje!";
      
      // Komenda wysyłająca odpowiedź z powrotem do Telegrama
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: replyText
        })
      });
    }
    
    // Zawsze zwracamy 200 OK, żeby Telegram nie wysyłał wiadomości podwójnie
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Błąd webhooka:", error);
    return NextResponse.json({ ok: false });
  }
}