# Vitrine Promoções do Veras

## Rodar no seu computador (sem Supabase, sem Vercel)

Você só precisa do **token do bot** e do bot como administrador do canal.

1. Instale o **Node.js LTS** (nodejs.org).
2. Descompacte o projeto e abra o terminal dentro da pasta. No Windows: abra a pasta, clique na barra de endereço, digite `cmd` e Enter.
3. Copie o arquivo `.env.example` para `.env.local` e deixe só estas duas linhas preenchidas (as do Supabase ficam com `#` na frente):
   ```
   TELEGRAM_BOT_TOKEN=cole_o_token_aqui
   TELEGRAM_CHANNEL_USERNAME=PromocoesdoVeras
   ```
4. Rode, um de cada vez:
   ```
   npm install
   npm run start:local
   ```
5. Abra **http://localhost:3000**. Aparecem as 6 ofertas de exemplo até chegar a primeira postagem real.
6. Quando o Dispara Promo postar no canal, o terminal mostra uma linha com ✓ e a oferta aparece no site em até 20 segundos, com imagem, mensagem original e o link de afiliado exatamente como foi postado.

Tudo fica salvo na pasta do projeto: ofertas em `data/offers.json`, imagens em `public/uploads/`. Para recomeçar do zero, apague a pasta `data` e a pasta `public/uploads`.
Para parar, aperte `Ctrl + C` no terminal.

**Importante:** o leitor local só funciona com o bot sem webhook. Ele desliga o webhook ao iniciar. Quando for para a Vercel, ligue o webhook de novo (passo 4 abaixo).

Quando estiver satisfeito localmente, siga os passos abaixo para publicar.

---

Cada oferta que o Dispara Promo posta no canal do Telegram `@PromocoesdoVeras` aparece sozinha no site.

```
Dispara Promo → canal do Telegram → seu bot → /api/telegram (lê a postagem) → Supabase → site
```

## O que está pronto

- Site com o layout da vitrine (filtros por loja, busca, cupons, WhatsApp, vistos recentes, tema claro/escuro).
- Leitor das postagens, testado com as 6 mensagens reais (`npm run test:parse`).
- Rota que recebe o bot, copia a imagem para o seu armazenamento e salva a oferta.
- Atualização automática do site a cada 45 segundos.
- Sem banco configurado, o site abre em **modo demonstração** com as 6 postagens reais.

## Passo a passo para colocar no ar

### 1. Banco de dados (Supabase, plano grátis)
1. Crie uma conta em supabase.com e um projeto novo.
2. Menu **SQL Editor → New query**, cole o conteúdo de `supabase/schema.sql` e clique **Run**.
3. Em **Project Settings → API**, copie o **Project URL** e a chave **service_role**. Essa chave é secreta.

### 2. Bot do Telegram
1. No Telegram, converse com **@BotFather**, envie `/newbot` e guarde o **token**.
2. No canal: Administradores → Adicionar administrador → escolha o bot.

### 3. Publicar o site (Vercel, plano grátis)
1. Envie esta pasta para um repositório no GitHub (sem `node_modules` nem `.env.local`).
2. Em vercel.com, **Add New → Project**, escolha o repositório.
3. Em **Environment Variables**, cadastre as variáveis de `.env.example`:
   `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_CHANNEL_USERNAME`, `SITE_URL`.
4. Clique **Deploy**. A Vercel dá um endereço provisório do tipo `seu-projeto.vercel.app`.

### 4. Ligar o bot ao site
Cole no navegador, trocando `SEU_TOKEN`, `SUA_SENHA` e o endereço:

```
https://api.telegram.org/botSEU_TOKEN/setWebhook?url=https://seu-projeto.vercel.app/api/telegram&secret_token=SUA_SENHA&allowed_updates=["channel_post","edited_channel_post"]
```

A resposta deve conter `"ok":true`. Para conferir: troque `setWebhook?...` por `getWebhookInfo`.
(Alternativa: `npm run webhook` com um arquivo `.env.local`.)

### 5. Teste
Poste (ou espere o Dispara Promo postar) uma oferta no canal. Em até 1 minuto ela aparece no site.

### 6. Domínio promocoesdoveras.com.br
1. Na Vercel: **Project → Settings → Domains**, adicione `www.promocoesdoveras.com.br` e `promocoesdoveras.com.br`.
2. A Vercel mostra os registros DNS exatos. No painel onde o domínio foi comprado, crie o que ela pedir (normalmente um `CNAME` para o `www` e um `A` para o domínio sem `www`).
3. Depois que o domínio funcionar, troque `SITE_URL` na Vercel e refaça o passo 4 com o novo endereço.

### 7. Trazer o histórico do canal (opcional)
O bot só recebe o que for postado depois de ligado. Para trazer as ofertas antigas:
1. No **Telegram Desktop** (computador), abra o canal, clique nos três pontinhos (⋮) e escolha **Exportar histórico do chat**.
2. Em formato, marque **JSON legível por máquina**. Marque também **Fotos** se quiser as imagens. Exporte.
3. Crie o arquivo `.env.local` nesta pasta, com `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` (modelo em `.env.example`).
4. Teste sem salvar: `npm run import -- C:\caminho\ChatExport_2026\result.json --dry`
5. Importe: `npm run import -- C:\caminho\ChatExport_2026\result.json`

Pode rodar de novo quando quiser: as ofertas já importadas são atualizadas, não duplicadas.

## Como o leitor entende cada postagem

| Campo | De onde vem |
|---|---|
| Título | primeira linha |
| Preço de antes | valor tachado depois de "De" |
| Preço atual | primeiro valor em R$ fora do tachado |
| Pix / à vista | palavras "Pix" ou "à vista" perto do preço |
| Nota | "Nota de Avaliação" |
| Cupom | linha "Cupom:" |
| Link | primeiro link que não seja WhatsApp ou Telegram, **guardado sem alteração** |
| Loja | pelo domínio do link (Shopee, meli.la, Amazon, Shein...). Para encurtadores como `oferta.pravce.com.br`, segue o redirecionamento uma vez, sem abrir a página da loja |
| Categoria | palavras do título (ajuste em `lib/parse.js`) |

Postagens sem título, preço ou link ficam com status `revisar` e não aparecem no site. Dá para ver e corrigir no Supabase (tabela `offers`).

## Pontos de atenção

- **Loja "Outras lojas":** se o encurtador do Dispara Promo não devolver redirecionamento, a loja fica como "outras". Nesse caso é só me avisar para ligar por palavras do título ou por um marcador na mensagem.
- **Imagens:** o site só mostra imagem se a postagem do Telegram tiver foto. Sem foto aparece um ícone.
- **Histórico:** o bot só recebe o que for postado depois de ligado. Use o passo 7 para trazer o que já foi postado.
- **Expiração:** depois de 24 h a oferta fica esmaecida com "pode ter expirado" (`expireAfterHours` em `lib/site.js`).
- **Aviso de afiliado:** o rodapé segue o texto exigido pela Amazon. Confira os termos de cada programa antes de divulgar o site.
- **Cliques:** o site não altera nem encurta links de afiliado, para não perder comissão.
- **Segurança:** nunca publique o token do bot nem a chave `service_role`. Se algum vazar, gere outro (`/revoke` no BotFather; reset no Supabase).
