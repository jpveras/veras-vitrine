'use client';

import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { STORES } from '../lib/site.js';

const ART = (
  <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" aria-hidden="true">
    <path d="M60 14 104 36v48L60 106 16 84V36z" />
    <path d="M16 36l44 22 44-22M60 58v48" />
  </svg>
);

const brl = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const num = (v) => String(v).replace('.', ',');

function Message({ text }) {
  return (
    <>
      {text.split(/(~~.+?~~)/g).map((p, i) => (p.startsWith('~~') && p.endsWith('~~') ? <s key={i}>{p.slice(2, -2)}</s> : p))}
    </>
  );
}

function ago(iso, now) {
  const m = Math.max(1, Math.round((now - new Date(iso).getTime()) / 60000));
  if (m < 60) return `há ${m} min`;
  if (m < 1440) return `há ${Math.round(m / 60)}h`;
  return `há ${Math.round(m / 1440)}d`;
}

export default function Vitrine({ initialOffers, initialDemo, site }) {
  const [offers, setOffers] = useState(initialOffers);
  const [demo, setDemo] = useState(initialDemo);
  const [store, setStore] = useState('all');
  const [q, setQ] = useState('');
  const [now, setNow] = useState(null); // só no navegador, evita diferença com o servidor
  const [recent, setRecent] = useState([]);
  const [toast, setToast] = useState('');
  const [qr, setQr] = useState('');

  // atualiza a lista sozinho a cada 45 s (pega os novos disparos)
  useEffect(() => {
    setNow(Date.now());
    const tick = setInterval(() => setNow(Date.now()), 60000);
    const poll = setInterval(async () => {
      try {
        const r = await fetch('/api/offers', { cache: 'no-store' });
        const d = await r.json();
        if (!d.error) {
          setOffers(d.offers);
          setDemo(Boolean(d.demo));
        }
      } catch {}
    }, 20000);
    return () => {
      clearInterval(tick);
      clearInterval(poll);
    };
  }, []);

  useEffect(() => {
    try {
      setRecent(JSON.parse(localStorage.getItem('veras-recent') || '[]'));
    } catch {}
    QRCode.toDataURL(site.whatsappGroup, { margin: 1, width: 168 }).then(setQr).catch(() => {});
  }, [site.whatsappGroup]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  };

  const stores = useMemo(() => [...new Set(offers.map((o) => o.store))], [offers]);
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return offers.filter(
      (o) => (store === 'all' || o.store === store) && (!s || `${o.title} ${o.category || ''}`.toLowerCase().includes(s)),
    );
  }, [offers, store, q]);

  const coupons = useMemo(() => {
    const seen = new Set();
    return offers
      .filter((o) => o.coupon && !seen.has(o.coupon) && seen.add(o.coupon))
      .slice(0, 5);
  }, [offers]);

  const rememberView = (o) => {
    const next = [o.id, ...recent.filter((x) => x !== o.id)].slice(0, 3);
    setRecent(next);
    try {
      localStorage.setItem('veras-recent', JSON.stringify(next));
    } catch {}
  };
  const recentOffers = recent.map((id) => offers.find((o) => o.id === id)).filter(Boolean);

  const copy = (text, msg) => {
    try {
      navigator.clipboard.writeText(text).then(() => showToast(msg), () => showToast(text));
    } catch {
      showToast(text);
    }
  };

  const toggleTheme = () => {
    const r = document.documentElement;
    const dark = r.dataset.theme ? r.dataset.theme === 'dark' : !matchMedia('(prefers-color-scheme: light)').matches;
    r.dataset.theme = dark ? 'light' : 'dark';
  };

  const expireMs = site.expireAfterHours * 3600 * 1000;

  return (
    <>
      <div className="promo-strip">
        <div className="wrap">
          <span>A rede social das promoções no seu Zap</span>
          <b>Receba as melhores promoções</b>
          <a className="btn-wa" href={site.whatsappChannel} target="_blank" rel="noopener">
            No WhatsApp
          </a>
        </div>
      </div>

      <header className="top">
        <div className="wrap">
          <a className="brand" href="/">
            <span className="mono">VT</span>
            <span>
              <strong>{site.name}</strong>
              <small>{site.tagline}</small>
            </span>
          </a>
          <a className="nav-link" href="#cupons">Cupons</a>
          <span className="spacer" />
          <label className="search hide-sm" htmlFor="q">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input id="q" type="search" placeholder="Busque por produto, marca ou modelo" autoComplete="off" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <button className="icon-btn" onClick={toggleTheme} aria-label="Alternar tema">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          </button>
          <a className="btn-primary" style={{ display: 'inline-grid', placeItems: 'center' }} href={site.telegram} target="_blank" rel="noopener">
            Telegram
          </a>
        </div>
      </header>

      <main className="wrap">
        <section aria-labelledby="titulo">
          <div className="toolbar">
            <h1 id="titulo">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--accent)" aria-hidden="true">
                <path d="m12 2 3 6.5 7 .9-5.2 4.8 1.4 7L12 17.8 5.8 21.2 7.2 14.2 2 9.4l7-.9z" />
              </svg>
              Destaques
            </h1>
            <div className="chips" role="group" aria-label="Filtrar por loja">
              <button className="chip" aria-pressed={store === 'all'} onClick={() => setStore('all')}>
                Todas as lojas
              </button>
              {stores.map((id) => (
                <button key={id} className="chip" aria-pressed={store === id} onClick={() => setStore(id)}>
                  {(STORES[id] || STORES.outros).name}
                </button>
              ))}
            </div>
          </div>

          {demo && (
            <div className="demo">
              Modo demonstração: estas são 6 postagens reais do canal, lidas pelo mesmo leitor do site. As ofertas novas aparecem aqui
              assim que o banco de dados e o bot forem ligados.
            </div>
          )}
          <p className="count">
            {list.length} {list.length === 1 ? 'oferta' : 'ofertas'} · atualizado a cada disparo do canal
          </p>

          <div className="grid">
            {list.length === 0 && <div className="empty">Nenhuma oferta encontrada.</div>}
            {list.map((o) => {
              const s = STORES[o.store] || STORES.outros;
              const disc = o.old && o.price ? Math.round((1 - o.price / o.old) * 100) : 0;
              const stale = now && now - new Date(o.postedAt).getTime() > expireMs;
              return (
                <article key={o.id} className={`card${stale ? ' old' : ''}`}>
                  <div className="thumb">
                    <span className={`store ${s.cls}`}>
                      <i>{s.letter}</i>
                      {s.name}
                    </span>
                    {stale && <span className="tag-old">pode ter expirado</span>}
                    {o.image ? <img src={o.image} alt={o.title} loading="lazy" /> : ART}
                  </div>
                  <div className="body">
                    <h3>{o.title}</h3>
                    <div className="meta">
                      <span>{o.category}</span>
                    </div>
                    <div className="price-row">
                      <span className="price">{o.price !== null ? brl(o.price) : 'Ver preço'}</span>
                      {o.old && <span className="old">{brl(o.old)}</span>}
                      {disc > 0 && <span className="off">-{disc}%</span>}
                    </div>
                    <div className="sub">
                      <span className="rating">
                        {o.rating !== null ? (
                          <>
                            ★ <b>{num(o.rating)}</b>
                          </>
                        ) : (
                          o.payNote || ''
                        )}
                      </span>
                      <span>{o.payNote && o.rating !== null ? o.payNote : ''}</span>
                    </div>
                    {o.coupon && (
                      <div className="coupon" title={o.coupon}>
                        Cupom: <b>{o.coupon}</b>
                      </div>
                    )}
                    <a className="cta" href={o.url} target="_blank" rel="noopener sponsored nofollow" onClick={() => rememberView(o)}>
                      VER OFERTA
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
                        <path d="m9 6 6 6-6 6" />
                      </svg>
                    </a>
                  </div>
                  {o.message && (
                    <details className="msg">
                      <summary>Ver mensagem original</summary>
                      <pre>
                        <Message text={o.message} />
                      </pre>
                    </details>
                  )}
                  <div className="foot">
                    <span>{now ? ago(o.postedAt, now) : ''}</span>
                    <button type="button" onClick={() => copy(o.url, 'Link copiado')}>
                      Copiar link
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <aside>
          <div>
            <h2>Canais</h2>
            <div className="stories">
              <a className="story-link" href={site.telegram} target="_blank" rel="noopener">
                <span className="story"><span className="ring"><b>TG</b></span></span>Telegram
              </a>
              <a className="story-link" href={site.whatsappChannel} target="_blank" rel="noopener">
                <span className="story"><span className="ring"><b>Zap</b></span></span>Canal
              </a>
              <a className="story-link" href={site.whatsappGroup} target="_blank" rel="noopener">
                <span className="story"><span className="ring"><b>Zap</b></span></span>Grupo
              </a>
            </div>
          </div>

          <div>
            <h2>Vistos recentes</h2>
            <div className="recent">
              {recentOffers.length === 0 && <p className="muted">Os produtos que você abrir aparecem aqui.</p>}
              {recentOffers.map((o) => (
                <a key={o.id} className="rec" href={o.url} target="_blank" rel="noopener sponsored nofollow">
                  <span className="t">{o.image ? <img src={o.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 10 }} /> : ART}</span>
                  <p>
                    <span>{o.title}</span>
                    <b>{o.price !== null ? brl(o.price) : ''}</b>
                  </p>
                </a>
              ))}
            </div>
          </div>

          <div className="wa-box">
            <h2 style={{ margin: 0 }}>Receba no WhatsApp</h2>
            <p className="muted" style={{ margin: 0 }}>
              Entre no grupo do Veras e receba as promoções antes de acabarem.
            </p>
            <div className="wa-steps">
              <ol>
                <li>Escaneie o QR Code</li>
                <li>Pronto! Já está no grupo</li>
              </ol>
              <div className="qr">{qr ? <img src={qr} alt="QR Code do grupo de WhatsApp" /> : 'QR'}</div>
            </div>
            <a className="btn-wa full" href={site.whatsappGroup} target="_blank" rel="noopener">
              Entrar agora
            </a>
          </div>

          <div id="cupons">
            <h2>Cupons de descontos</h2>
            <div className="coupons">
              {coupons.length === 0 && <p className="muted">Os cupons das ofertas aparecem aqui.</p>}
              {coupons.map((o) => {
                const s = STORES[o.store] || STORES.outros;
                return (
                  <button key={o.coupon} className="cup" onClick={() => copy(o.coupon, `Cupom ${o.coupon} copiado`)}>
                    <i className={s.cls}>{s.letter}</i>
                    <span>
                      <strong>{o.coupon}</strong>
                      <small>{s.name}</small>
                    </span>
                    <em>COPIAR</em>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="legal">
            <a href="/privacidade">Política de privacidade</a>
          </div>
        </aside>
      </main>

      <p className="legal-note">{site.affiliateNotice}</p>
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </>
  );
}
