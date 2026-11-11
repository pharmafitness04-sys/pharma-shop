# PHARMA SHOP — integração de pagamentos

## Estado
O site público está no GitHub Pages. Este repositório agora contém o esqueleto do backend Cloudflare Worker para iniciar um Checkout Pro do Mercado Pago. **Ainda não recebe pagamentos** até o Worker ser implantado e configurado com credenciais, catálogo real e testes.

## Por que precisa de um servidor
O GitHub Pages serve arquivos estáticos e não protege tokens privados. O Worker mantém o Access Token fora do navegador. O endpoint usa a API clássica de preferências do Checkout Pro, que continua suportada pelo Mercado Pago; para novas integrações, confira também a API Orders recomendada na documentação oficial.

## Implantação necessária (Cloudflare)
1. Crie/acesse uma conta em https://dash.cloudflare.com/
2. Abra Workers & Pages → Create → Worker e implante este projeto (ou conecte o repositório).
3. Configure as variáveis:
   - `SITE_URL`: `https://pharmafitness04-sys.github.io`
   - `PRODUCT_CATALOG_JSON`: JSON com os produtos reais e preços em reais, por exemplo: `[{"id":"item-1","title":"Nome comercial cadastrado","price":19.9}]`
4. Em Settings → Variables and Secrets, crie `MP_ACCESS_TOKEN` como **Secret** usando primeiro a credencial de teste do Mercado Pago.
5. Não envie token por chat, não o grave no GitHub e não o coloque no HTML.
6. Configure o domínio/URL do Worker e teste o endpoint `GET /health`.
7. Antes de produção, configurar Webhooks com validação de assinatura, consulta do pagamento e registro persistente de pedidos. Não considere o retorno do navegador como confirmação de pagamento.

## Endpoint
`POST /api/create-preference`
Body:
```json
{"items":[{"id":"item-1","quantity":1}]}
```
O servidor calcula os preços usando `PRODUCT_CATALOG_JSON` e devolve `checkout_url`. O cliente deve ser redirecionado para essa URL.

## Segurança e limitações
- Não há produtos comerciais confirmados neste repositório: o catálogo público atual é demonstrativo.
- Este Worker ainda não grava pedidos nem implementa webhook de confirmação. Portanto, não use para vender nem liberar mercadorias até concluir essas etapas.
- Pix, boleto e cartão dependem dos meios habilitados na conta Mercado Pago e da aprovação/configuração da aplicação.
- Não inclua medicamentos sujeitos a prescrição sem cumprir as regras sanitárias aplicáveis.

Documentação oficial:
- https://www.mercadopago.com.br/developers/pt/reference/online-payments/checkout-pro-preferences/overview
- https://www.mercadopago.com.br/developers/pt/docs/checkout-pro-preferences/payment-notifications
- https://www.mercadopago.com.br/developers/pt/reference/online-payments/checkout-pro-orders/overview
