// Lê o texto de uma postagem do canal e devolve os campos da oferta.
// Entende o formato que o Dispara Promo usa (título, "De R$ x", preço, cupom, "Compre aqui", link).

import { storeFromUrl, storeFromTitle } from './store.js';

const INVISIBLE = /[​-‏⁠﻿‪-‮]/g;
// aceita 23.55 | 79,99 | 1.299,90 | 1.299 | 319
const MONEY = /R\$\s*(\d+\.\d{2}(?!\d)|(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d{2})?)/g;
const IGNORED_HOSTS = /(^|\.)whatsapp\.com$|^t\.me$|^wa\.me$|^telegram\.me$/;

const clean = (s) => s.replace(INVISIBLE, '').replace(/\r/g, '');

export function parseBRL(s) {
  if (s.includes(',')) return Number(s.replace(/\./g, '').replace(',', '.'));
  if (/\.\d{2}$/.test(s) && !/\.\d{3}/.test(s)) return Number(s);
  return Number(s.replace(/\./g, ''));
}

function moneyIn(text) {
  return [...text.matchAll(MONEY)].map((m) => parseBRL(m[1]));
}

function strikeTexts(raw, entities) {
  const out = [];
  for (const e of entities || []) {
    if (e.type === 'strikethrough') out.push(raw.slice(e.offset, e.offset + e.length));
  }
  for (const m of raw.matchAll(/~~(.+?)~~/g)) out.push(m[1]);
  return out.map(clean);
}

const CATEGORIES = [
  ['Moda', /shorts?|camiseta|blusa|vestido|jeans|denim|cal[cç]a|t[eê]nis|sapat|bolsa|mochila|saia|jaqueta|moletom|sand[aá]lia/i],
  ['Informática', /notebook|mouse|teclado|monitor|ssd|\bhd\b|pc\b|placa|mem[oó]ria|webcam|roteador|apoio pulso|impressora/i],
  ['Games', /console|game|jogo|playstation|xbox|nintendo|controle|pok[eé]mon/i],
  ['Áudio, TV e Eletrônicos', /fone|caixa de som|bluetooth|soundbar|\btv\b|smart tv|alexa|echo/i],
  ['Celulares e Smartphones', /celular|smartphone|iphone|galaxy|carregador|power bank|capinha/i],
  ['Casa e Cozinha', /batedeira|air ?fryer|panela|sanduicheira|liquidificador|geladeira|fog[aã]o|mop|aspirador|colch[aã]o/i],
  ['Bebidas', /vinho|cabernet|cerveja|whisky|vodka|espumante|\d+ ?ml\b.*(vinho|cabernet)/i],
  ['Automotivo e Moto', /capacete|moto\b|automotivo|pneu|carro/i],
];

export function guessCategory(title) {
  for (const [name, re] of CATEGORIES) if (re.test(title)) return name;
  return 'Geral';
}

/**
 * @param {{text?: string, entities?: Array}} input  texto da postagem e entidades do Telegram
 * @returns campos da oferta + status ('ativa' | 'revisar')
 */
export function parseOffer({ text = '', entities = [] }) {
  const strikes = strikeTexts(text, entities);
  const t = clean(text).replace(/~~/g, '');
  let body = t;
  for (const s of strikes) body = body.replace(s, ' ');

  const lines = t.split('\n').map((l) => l.trim()).filter(Boolean);
  const title = (lines[0] || '').replace(/\s+/g, ' ').trim();
  const bodyAfterTitle = body.split('\n').slice(1).join('\n');

  // preços
  let old = strikes.flatMap(moneyIn)[0] ?? null;
  const prices = moneyIn(bodyAfterTitle);
  let price = prices[0] ?? null;
  if (old === null && prices.length >= 2 && /^De\b.*R\$/im.test(bodyAfterTitle)) {
    old = prices[0];
    price = prices[1];
  }
  if (old !== null && price !== null && old <= price) old = null;

  const payNote = /pix/i.test(bodyAfterTitle) ? 'no Pix' : /[aáà]\s*vista/i.test(bodyAfterTitle) ? 'à vista' : null;

  // nota
  let rating = null;
  const r = t.match(/Nota de Avalia\S*\s*:?\s*(\d+(?:[.,]\d+)?)/i);
  if (r) {
    const n = Number(r[1].replace(',', '.'));
    if (n >= 0 && n <= 5) rating = n;
  }

  // cupom
  let coupon = null;
  const c = t.match(/Cupom\s*:\s*(.+)/i);
  if (c) {
    const v = c[1].trim();
    if (v && !/^null$/i.test(v)) coupon = v;
  }

  // link (o primeiro que não seja WhatsApp/Telegram)
  const urls = [...t.matchAll(/https?:\/\/[^\s<>)]+/g)].map((m) => m[0].replace(/[.,;]+$/, ''));
  for (const e of entities || []) if (e.type === 'text_link' && e.url) urls.push(e.url);
  const url =
    urls.find((u) => {
      try {
        return !IGNORED_HOSTS.test(new URL(u).hostname);
      } catch {
        return false;
      }
    }) || null;

  const store = (url && storeFromUrl(url)) || storeFromTitle(title) || null; // null = precisa resolver o encurtador

  const ok = Boolean(title && url && price !== null);
  return {
    title,
    category: guessCategory(title),
    price,
    old_price: old,
    pay_note: payNote,
    rating,
    coupon,
    url,
    store,
    status: ok ? 'ativa' : 'revisar',
  };
}
