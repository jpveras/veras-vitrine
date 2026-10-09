// Descobre de qual loja é um link.

const RULES = [
  ['shopee', /(^|\.)shopee\.com\.br$|(^|\.)shp\.ee$/],
  ['ml', /(^|\.)meli\.la$|(^|\.)mercadolivre\.com\.br$|(^|\.)mercadolibre\.com$/],
  ['amazon', /(^|\.)amazon\.com\.br$|(^|\.)amzn\.to$|(^|\.)amzn\.com$|(^|\.)a\.co$/],
  ['shein', /(^|\.)shein\.com(\.br)?$|(^|\.)shein\.top$|(^|\.)shein\.co$/],
  ['aliexpress', /(^|\.)aliexpress\.com$|(^|\.)s\.click\.aliexpress\.com$|(^|\.)aliexpress\.us$/],
  ['magalu', /(^|\.)magazineluiza\.com\.br$|(^|\.)magalu\.com$|(^|\.)magazinevoce\.com\.br$/],
];

export function storeFromUrl(url) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    for (const [id, re] of RULES) if (re.test(host)) return id;
  } catch {}
  return null;
}

// Pistas pelo texto do título quando o link é um encurtador (ex.: oferta.pravce.com.br).
export function storeFromTitle(title) {
  if (/^\s*shein\b/i.test(title)) return 'shein';
  return null;
}

// Segue os redirecionamentos de um encurtador SEM abrir a página da loja,
// só para descobrir o destino. Usado apenas quando o link não é de uma loja conhecida.
export async function resolveStore(url, hops = 5) {
  let cur = url;
  for (let i = 0; i < hops; i++) {
    const found = storeFromUrl(cur);
    if (found) return found;
    try {
      const res = await fetch(cur, {
        method: 'GET',
        redirect: 'manual',
        headers: { 'user-agent': 'Mozilla/5.0 (compatible; VerasVitrine/1.0)' },
        signal: AbortSignal.timeout(5000),
      });
      const loc = res.headers.get('location');
      if (!loc) break;
      cur = new URL(loc, cur).toString();
    } catch {
      break;
    }
  }
  return storeFromUrl(cur);
}
