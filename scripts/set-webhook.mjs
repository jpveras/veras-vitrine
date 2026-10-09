// Liga o bot ao site. Rode UMA vez depois de publicar o site:
//   npm run webhook            (liga)
//   npm run webhook -- status  (mostra como está)
//   npm run webhook -- off     (desliga)
// Lê as variáveis de .env.local, ou do ambiente.
import { readFileSync, existsSync } from 'node:fs';

if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
const { TELEGRAM_BOT_TOKEN: token, TELEGRAM_WEBHOOK_SECRET: secret, SITE_URL: site } = process.env;
if (!token) throw new Error('Faltou TELEGRAM_BOT_TOKEN');
const api = (m, body) =>
  fetch(`https://api.telegram.org/bot${token}/${m}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body || {}),
  }).then((r) => r.json());

const cmd = process.argv[2];
if (cmd === 'off') console.log(await api('deleteWebhook'));
else if (cmd === 'status') {
  const r = await api('getWebhookInfo');
  console.log({ url: r.result?.url, pendentes: r.result?.pending_update_count, ultimoErro: r.result?.last_error_message });
} else {
  if (!secret || !site) throw new Error('Faltou TELEGRAM_WEBHOOK_SECRET ou SITE_URL');
  const url = `${site.replace(/\/$/, '')}/api/telegram`;
  console.log(await api('setWebhook', { url, secret_token: secret, allowed_updates: ['channel_post', 'edited_channel_post'] }));
  console.log('Webhook apontando para', url);
}
