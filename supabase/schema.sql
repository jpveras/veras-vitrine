-- Rode este arquivo uma vez no Supabase: SQL Editor > New query > cole tudo > Run.

create table if not exists offers (
  id            bigint generated always as identity primary key,
  tg_chat_id    bigint not null,
  tg_message_id bigint not null,
  store         text not null default 'outros',   -- amazon | shopee | ml | shein | aliexpress | magalu | outros
  title         text not null,
  category      text,
  price         numeric(12,2),
  old_price     numeric(12,2),
  pay_note      text,                              -- "no Pix", "à vista"
  rating        numeric(2,1),
  coupon        text,
  url           text,                              -- link de afiliado exatamente como foi postado
  image_url     text,
  status        text not null default 'ativa',     -- ativa | revisar | oculta
  message       text,                              -- mensagem como aparece no site (tachado entre ~~)
  raw           text,                              -- texto original da postagem
  posted_at     timestamptz not null,
  created_at    timestamptz not null default now(),
  unique (tg_chat_id, tg_message_id)
);

create index if not exists offers_posted_at_idx on offers (posted_at desc);

-- Leitura pública só das ofertas ativas. Escrita só pelo servidor (service role).
alter table offers enable row level security;
drop policy if exists "leitura publica" on offers;
create policy "leitura publica" on offers for select using (status = 'ativa');

-- Pasta pública para as imagens das ofertas
insert into storage.buckets (id, name, public)
values ('offers', 'offers', true)
on conflict (id) do nothing;
