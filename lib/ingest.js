// Transforma uma postagem do canal (formato da API do Telegram) em uma oferta salva.
// Usado pelo webhook (Vercel) e pelo leitor local (npm run local).
import { parseOffer } from './parse.js';
import { resolveStore } from './store.js';
import { getSupabase } from './db.js';
import { upsertLocal, saveLocalImage } from './localdb.js';

const INVISIBLE = /[​-‏⁠﻿‪-‮]/g;

// Texto da mensagem para mostrar no site: tachado vira ~~x~~, sem caracteres invisíveis
// e sem o rodapé com os links de WhatsApp/Telegram.
export function displayText(text = '', entities = []) {
  let t = text;
  const strikes = (entities || []).filter((e) => e.type === 'strikethrough').sort((a, b) => b.offset - a.offset);
  for (const e of strikes) {
    t = t.slice(0, e.offset) + '~~' + t.slice(e.offset, e.offset + e.length) + '~~' + t.slice(e.offset + e.length);
  }
  const lines = t.replace(INVISIBLE, '').replace(/\r/g, '').split('\n');
  const cut = lines.findIndex((l) => /whatsapp\.com|t\.me\//i.test(l));
  let end = cut === -1 ? lines.length : cut;
  if (cut !== -1) {
    let j = end - 1;
    while (j >= 0 && !lines[j].trim()) j--;
    if (j >= 0 && !/https?:\/\//.test(lines[j])) end = j;
  }
  return lines.slice(0, end).map((l) => l.trim()).join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

async function downloadPhoto(fileId) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const info = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`).then((r) => r.json());
  const p = info?.result?.file_path;
  if (!p) return null;
  const res = await fetch(`https://api.telegram.org/file/bot${token}/${p}`);
  if (!res.ok) return null;
  return new Uint8Array(await res.arrayBuffer());
}

async function storePhoto(db, chatId, messageId, fileId) {
  try {
    const bytes = await downloadPhoto(fileId);
    if (!bytes) return null;
    if (!db) return saveLocalImage(chatId, messageId, bytes);
    const key = `${chatId}/${messageId}.jpg`;
    const up = await db.storage.from('offers').upload(key, bytes, { contentType: 'image/jpeg', upsert: true });
    if (up.error) return null;
    return db.storage.from('offers').getPublicUrl(key).data.publicUrl + `?v=${Date.now()}`;
  } catch (e) {
    console.error('foto:', e.message);
    return null;
  }
}

/** Lê e salva uma postagem. Devolve a linha salva, ou null se a postagem não tem texto. */
export async function ingestChannelPost(msg) {
  const text = msg.text ?? msg.caption ?? '';
  const entities = msg.entities ?? msg.caption_entities ?? [];
  if (!text.trim()) return null;

  const offer = parseOffer({ text, entities });
  if (!offer.store && offer.url) offer.store = await resolveStore(offer.url);
  offer.store = offer.store || 'outros';

  const db = getSupabase(); // sem Supabase configurado, salva em arquivo local
  let imageUrl = null;
  if (msg.photo?.length) imageUrl = await storePhoto(db, msg.chat.id, msg.message_id, msg.photo[msg.photo.length - 1].file_id);

  const row = {
    tg_chat_id: msg.chat.id,
    tg_message_id: msg.message_id,
    store: offer.store,
    title: offer.title || '(sem título)',
    category: offer.category,
    price: offer.price,
    old_price: offer.old_price,
    pay_note: offer.pay_note,
    rating: offer.rating,
    coupon: offer.coupon,
    url: offer.url,
    status: offer.status,
    message: displayText(text, entities),
    raw: text,
    posted_at: new Date((msg.date || Date.now() / 1000) * 1000).toISOString(),
  };
  if (imageUrl) row.image_url = imageUrl; // edição sem foto mantém a imagem que já existe

  if (db) {
    const { error } = await db.from('offers').upsert(row, { onConflict: 'tg_chat_id,tg_message_id' });
    if (error) throw new Error(error.message);
  } else {
    upsertLocal(row);
  }
  return row;
}
