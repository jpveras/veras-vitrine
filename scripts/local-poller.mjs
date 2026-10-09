// Lê o canal pelo bot, direto do seu computador (sem site público e sem Supabase).
//   npm run local        (só o leitor)
//   npm run start:local  (site + leitor juntos)
// Cada postagem nova vira uma oferta em data/offers.json, com a imagem em public/uploads/.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';

if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('Faltou TELEGRAM_BOT_TOKEN no arquivo .env.local');
  process.exit(1);
}
const wanted = (process.env.TELEGRAM_CHANNEL_USERNAME || '').toLowerCase();

const { ingestChannelPost } = await import('../lib/ingest.js');

const api = (method, body) =>
  fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body || {}),
  }).then((r) => r.json());
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const me = await api('getMe');
if (!me.ok) {
  console.error('Token recusado pelo Telegram:', me.description);
  process.exit(1);
}
console.log(`Bot @${me.result.username} conectado. Esperando postagens do canal${wanted ? ' @' + wanted : ''}...`);

// getUpdates não funciona se o bot tiver webhook ligado, então desliga (a Vercel liga de novo depois)
await api('deleteWebhook', { drop_pending_updates: false });

mkdirSync('data', { recursive: true });
const OFFSET_FILE = 'data/offset.txt';
let offset = existsSync(OFFSET_FILE) ? Number(readFileSync(OFFSET_FILE, 'utf8')) || 0 : 0;

while (true) {
  let r;
  try {
    r = await api('getUpdates', { offset, timeout: 25, allowed_updates: ['channel_post', 'edited_channel_post'] });
  } catch (e) {
    console.error('Sem conexão, tentando de novo em 5 s...');
    await sleep(5000);
    continue;
  }
  if (!r.ok) {
    console.error('Telegram:', r.description);
    await sleep(5000);
    continue;
  }
  for (const u of r.result) {
    offset = u.update_id + 1;
    const msg = u.channel_post || u.edited_channel_post;
    if (!msg) continue;
    if (wanted && (msg.chat?.username || '').toLowerCase() !== wanted) continue;
    try {
      const row = await ingestChannelPost(msg);
      if (row) console.log(`✓ ${row.store} | R$ ${row.price} | ${row.title.slice(0, 60)}${row.image_url ? ' | com imagem' : ' | sem imagem'}${row.status !== 'ativa' ? ' | REVISAR' : ''}`);
    } catch (e) {
      console.error('Erro ao salvar postagem:', e.message);
    }
    writeFileSync(OFFSET_FILE, String(offset));
  }
}
