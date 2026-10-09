import { getSupabase } from '../../../lib/db.js';
import { ingestChannelPost } from '../../../lib/ingest.js';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// O Telegram chama esta rota a cada postagem nova (ou editada) no canal. Usada na Vercel.
export async function POST(req) {
  // 1) só aceita chamadas que tragam a senha combinada com o Telegram
  if (req.headers.get('x-telegram-bot-api-secret-token') !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return new Response('forbidden', { status: 403 });
  }

  const update = await req.json().catch(() => null);
  const msg = update?.channel_post || update?.edited_channel_post;
  if (!msg) return Response.json({ ok: true });

  // 2) só aceita o seu canal
  const wanted = (process.env.TELEGRAM_CHANNEL_USERNAME || '').toLowerCase();
  if (wanted && (msg.chat?.username || '').toLowerCase() !== wanted) return Response.json({ ok: true });

  // 3) na Vercel o disco é só leitura: precisa do Supabase
  if (!getSupabase()) return new Response('supabase não configurado', { status: 500 });

  try {
    await ingestChannelPost(msg);
  } catch (err) {
    console.error('telegram webhook', err);
    return new Response('erro', { status: 500 }); // o Telegram tenta de novo
  }
  return Response.json({ ok: true });
}
