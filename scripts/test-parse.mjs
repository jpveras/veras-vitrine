import { parseOffer } from '../lib/parse.js';
import { FIXTURES } from '../lib/fixtures.js';

let fail = 0;
FIXTURES.forEach((f, i) => {
  const got = parseOffer({ text: f.text });
  const bad = Object.entries(f.expect).filter(([k, v]) => got[k] !== v);
  if (got.status !== 'ativa') bad.push(['status', got.status]);
  if (bad.length) {
    fail++;
    console.log(`✗ #${i + 1} ${got.title.slice(0, 40)}`);
    for (const [k, v] of bad) console.log(`    ${k}: esperado ${JSON.stringify(f.expect[k])}, veio ${JSON.stringify(got[k] ?? v)}`);
  } else {
    console.log(`✓ #${i + 1} ${got.title.slice(0, 45)} | R$ ${got.price}${got.old_price ? ' (de ' + got.old_price + ')' : ''} | ${got.store ?? 'resolver link'} | ${got.category}`);
  }
});

// Formato real do Telegram: tachado vem como "entities", sem ~~
const t = 'Fone X\nDe R$ 100,00\nR$ 59,90 no Pix\nCompre aqui\nhttps://meli.la/abc';
const e = [{ type: 'strikethrough', offset: t.indexOf('R$ 100,00'), length: 'R$ 100,00'.length }];
const g = parseOffer({ text: t, entities: e });
if (g.price !== 59.9 || g.old_price !== 100) { fail++; console.log('✗ entidade de tachado', g); } else console.log('✓ tachado via entidade do Telegram');

console.log(fail ? `\n${fail} falha(s)` : '\nTudo certo.');
process.exit(fail ? 1 : 0);
