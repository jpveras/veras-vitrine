// Armazenamento local (sem Supabase): ofertas em data/offers.json e imagens em public/uploads/.
import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE = path.join(DATA_DIR, 'offers.json');

export function readLocal() {
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch {
    return [];
  }
}

export function upsertLocal(row) {
  const rows = readLocal();
  const i = rows.findIndex((r) => r.tg_chat_id === row.tg_chat_id && r.tg_message_id === row.tg_message_id);
  if (i >= 0) {
    rows[i] = { ...rows[i], ...row, id: rows[i].id };
  } else {
    rows.push({ ...row, id: Math.max(0, ...rows.map((r) => r.id || 0)) + 1 });
  }
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(rows, null, 2));
}

export function saveLocalImage(chatId, messageId, bytes) {
  const folder = String(chatId).replace('-', 'n');
  const dir = path.join(process.cwd(), 'public', 'uploads', folder);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${messageId}.jpg`), bytes);
  return `/uploads/${folder}/${messageId}.jpg?v=${Date.now()}`;
}
