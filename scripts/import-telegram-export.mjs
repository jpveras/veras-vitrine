// Importa o histórico do canal a partir da exportação do Telegram Desktop (arquivo result.json).
//   npm run import -- caminho/para/ChatExport/result.json --dry   (só mostra o que seria importado)
//   npm run import -- caminho/para/ChatExport/result.json         (importa de verdade)
// Pode rodar de novo sem medo: mensagens já importadas são atualizadas, não duplicadas.
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { parseOffer } from '../lib/parse.js';
import { resolveStore } from '../lib/store.js';

if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const file = process.argv[2];
const dry = process.argv.includes('--dry');
if (!file || !existsSync(file)) {
  console.log('Uso: npm run import -- caminho/para/result.json [--dry]');
  process.exit(1);
}
const dir = path.dirname(file);
const data = JSON.parse(readFileSync(file, 'utf8'));
// o Telegram Desktop grava o id do canal sem o prefixo -100 que a API do bot usa
const chatId = Number('-100' + data.id);

// texto do export: string, ou lista de pedaços {type, text, href}
function flatten(text) {
  if (typeof text === 'string') return { text, entities: [] };
  let out = '';
  const entities = [];
  for (const part of text || []) {
    if (typeof part === 'string') {
      out += part;
      continue;
    }
    const offset = out.length;
    out += part.text;
    if (part.type === 'strikethrough') entities.push({ type: 'strikethrough', offset, length: part.text.length });
    if (part.type === 'text_link' && part.href) entities.push({ type: 'text_link', offset, length: part.text.length, url: part.href });
  }
  return { text: out, entities };
}

let db = null;
if (!dry) {
  const { getSupabase } = await import('../lib/db.js');
  db = getSupabase();
  if (!db) throw new Error('Faltou SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no .env.local');
}

const stats = { lidas: 0, importadas: 0, revisar: 0, ignoradas: 0 };
const rows = [];
for (const msg of data.messages || []) {
  if (msg.type !== 'message') continue;
  const { text, entities } = flatten(msg.text);
  if (!text.trim()) {
    stats.ignoradas++;
    continue;
  }
  stats.lidas++;
  const offer = parseOffer({ text, entities });
  if (!offer.store && offer.url && !dry) offer.store = await resolveStore(offer.url);
  offer.store = offer.store || 'outros';
  if (offer.status !== 'ativa') stats.revisar++;

  let imageUrl = null;
  if (!dry && msg.photo) {
    const p = path.join(dir, msg.photo);
    if (existsSync(p)) {
      const key = `${chatId}/${msg.id}.jpg`;
      const up = await db.storage.from('offers').upload(key, readFileSync(p), { contentType: 'image/jpeg', upsert: true });
      if (!up.error) imageUrl = db.storage.from('offers').getPublicUrl(key).data.publicUrl;
    }
  }

  rows.push({
    tg_chat_id: chatId,
    tg_message_id: msg.id,
    store: offer.store,
    title: offer.title || '(sem título)',
    category: offer.category,
    price: offer.price,
    old_price: offer.old_price,
    pay_note: offer.pay_note,
    rating: offer.rating,
    coupon: offer.coupon,
    url: offer.url,
    image_url: imageUrl,
    status: offer.status,
    raw: text,
    posted_at: new Date(Number(msg.date_unixtime) * 1000).toISOString(),
  });
  if (dry && rows.length <= 5) console.log(`• ${offer.store ?? '(resolver link)'} | R$ ${offer.price} | ${offer.title.slice(0, 50)}`);
}

if (!dry) {
  for (let i = 0; i < rows.length; i += 50) {
    const { error } = await db.from('offers').upsert(rows.slice(i, i + 50), { onConflict: 'tg_chat_id,tg_message_id' });
    if (error) throw new Error(error.message);
    stats.importadas += Math.min(50, rows.length - i);
  }
}
console.log(dry ? '\n(simulação, nada foi salvo)' : '\nImportação concluída.', stats);
