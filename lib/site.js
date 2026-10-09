// Configurações do site. Troque aqui o que mudar no futuro.
export const SITE = {
  name: 'Promoções do Veras',
  tagline: 'Vitrine de ofertas',
  domain: 'www.promocoesdoveras.com.br',
  telegram: 'https://t.me/PromocoesdoVeras',
  whatsappChannel: 'https://whatsapp.com/channel/0029VbBX1t66buMHs99zHP2c',
  whatsappGroup: 'https://chat.whatsapp.com/Cs9W3TwSZ3o0NMeNo03PLN',
  // Depois dessas horas a oferta aparece como "pode ter expirado".
  expireAfterHours: 24,
  // Quantas ofertas a vitrine carrega.
  limit: 120,
  affiliateNotice:
    'Como Associado da Amazon, ganho com compras qualificadas. Também participo dos programas de afiliados do Mercado Livre, Shopee e Shein e posso receber comissão pelas compras feitas pelos links. Preços e disponibilidade mudam sem aviso e valem no momento da postagem.',
};

export const STORES = {
  amazon: { name: 'Amazon', letter: 'a', cls: 'st-amazon' },
  ml: { name: 'Mercado Livre', letter: 'M', cls: 'st-ml' },
  shopee: { name: 'Shopee', letter: 'S', cls: 'st-shopee' },
  shein: { name: 'Shein', letter: 'S', cls: 'st-shein' },
  aliexpress: { name: 'AliExpress', letter: 'A', cls: 'st-ali' },
  magalu: { name: 'Magalu', letter: 'M', cls: 'st-mgl' },
  outros: { name: 'Outras lojas', letter: '?', cls: 'st-outros' },
};
