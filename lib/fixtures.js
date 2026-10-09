// Postagens reais do canal @PromocoesdoVeras usadas no teste e no modo demonstração.
// (Os caracteres invisíveis e os ~~ foram mantidos de propósito: é assim que chegam.)
const FOOT = `

Canal Promoções do Veras
https://whatsapp.com/channel/0029VbBX1t66buMHs99zHP2c

Grupo Promoções do Veras Só PC #2
https://chat.whatsapp.com/Cs9W3TwSZ3o0NMeNo03PLN`;

export const FIXTURES = [
  {
    expect: { store: 'shopee', price: 23.55, old_price: 79.99, rating: 5, coupon: null, url: 'https://s.shopee.com.br/5LCK0zkyqb' },
    text: ` Apoio Pulso Mouse Teclado Nuvem Espuma Memória Base PU Inferior Couro Antiderrapante Ergonômico PC

Nota de Avaliação:  5
De ~~R$ 79,99~~
 R$ 23.55 No Pix ou

 Compre aqui
https://s.shopee.com.br/5LCK0zkyqb${FOOT}`,
  },
  {
    expect: { store: null, price: 21, old_price: null, rating: 4.7, coupon: 'CUPOMNOAPP + COMPRANOAPP', url: 'https://oferta.pravce.com.br/aqFasF' },
    text: ` Concha y Toro Reservado Cabernet Sauvignon 750ml

Nota de Avaliação:  4.​​‌7
De
 R$ 21,00 no Pix ou

 Use o Cupom: CUPOMNOAPP + COMPRANOAPP

 Compre aqui
https://oferta.pravce.com.br/aqFasF${FOOT}`,
  },
  {
    expect: { store: 'shein', price: 76.99, old_price: null, rating: null, coupon: null, url: 'https://oferta.pravce.com.br/nPMUKa' },
    text: `SHEIN Essnce Shorts Casuais Plissados com Bolso em Cor Sólida para Mulheres

De
 R$ 76,99 via Pix ou

 Compre aqui
https://oferta.pravce.com.br/nPMUKa${FOOT}`,
  },
  {
    expect: { store: null, price: 303.05, old_price: 319, rating: 4, coupon: null, url: 'https://oferta.pravce.com.br/ZG2ZEc' },
    text: `‌
Mini Console Retro Gamer Super com 150 mil Jogos Mais 2 Controles Super 3D Games

Nota de Avaliação:  4
De ~~R$ 319~~
 R$ 303,05 No Pix ou  null

 Compre aqui
https://oferta.pravce.com.br/ZG2ZEc${FOOT}`,
  },
  {
    expect: { store: null, price: 177.68, old_price: 236.9, rating: null, coupon: null, url: 'https://oferta.pravce.com.br/WntQ2b' },
    text: `
Denim Perna Larga com Estampa de Esqueleto Feminino, Denim Boyfriend Estilo Escolar

De ~~R$ 236,90~~
 R$ 177.﻿68 á vista ou

 Compre aqui
https://oferta.pravce.com.br/WntQ2b${FOOT}`,
  },
  {
    expect: { store: 'ml', price: 36.64, old_price: 76.9, rating: 4.8, coupon: null, url: 'https://meli.la/2RwgKyz' },
    text: `Fone Bluetooth Capacete Moto NeoXtek V10 Resistência Água IPX6

Nota de Avaliação:  4.‌‌8
De ~~R$ 76,90~~
 R$ 36,64 ou

 Compre aqui
https://meli.la/2RwgKyz${FOOT}`,
  },
];
