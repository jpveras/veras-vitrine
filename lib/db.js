import { createClient } from '@supabase/supabase-js';
import { FIXTURES } from './fixtures.js';
import { parseOffer } from './parse.js';
import { SITE } from './site.js';
import { readLocal } from './localdb.js';

export function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

const n = (v) => (v === null || v === undefined ? null : Number(v));

// Formato público enviado ao navegador (sem texto bruto nem ids internos do Telegram).
function toPublic(r) {
  return {
    id: r.id,
    store: r.store,
    title: r.title,
    category: r.category,
    price: n(r.price),
    old: n(r.old_price),
    payNote: r.pay_note ?? null,
    rating: n(r.rating),
    coupon: r.coupon ?? null,
    url: r.url,
    image: r.image_url ?? null,
    message: r.message ?? null,
    postedAt: r.posted_at,
  };
}

// Sem banco e sem nada salvo localmente, mostra as 6 postagens reais de exemplo.
function demoOffers() {
  const now = Date.now();
  return FIXTURES.map((f, i) => {
    const p = parseOffer({ text: f.text });
    return {
      id: -(i + 1),
      store: p.store || 'outros',
      title: p.title,
      category: p.category,
      price: p.price,
      old: p.old_price,
      payNote: p.pay_note,
      rating: p.rating,
      coupon: p.coupon,
      url: p.url,
      image: null,
      message: f.text
        .split('\n')
        .slice(0, f.text.split('\n').findIndex((l) => /whatsapp\.com/.test(l)) - 1)
        .join('\n')
        .replace(/[​-‏﻿]/g, '')
        .trim(),
      postedAt: new Date(now - (i + 1) * 47 * 60 * 1000).toISOString(),
    };
  });
}

export async function listOffers() {
  const db = getSupabase();
  if (db) {
    const { data, error } = await db
      .from('offers')
      .select('*')
      .eq('status', 'ativa')
      .order('posted_at', { ascending: false })
      .limit(SITE.limit);
    if (error) {
      console.error('listOffers', error.message);
      return { offers: [], demo: false, error: true };
    }
    return { offers: data.map(toPublic), demo: false };
  }

  // modo local: ofertas salvas em data/offers.json pelo leitor do canal
  const local = readLocal()
    .filter((r) => r.status === 'ativa')
    .sort((a, b) => new Date(b.posted_at) - new Date(a.posted_at))
    .slice(0, SITE.limit);
  if (local.length) return { offers: local.map(toPublic), demo: false };

  return { offers: demoOffers(), demo: true };
}
