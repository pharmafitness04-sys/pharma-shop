# PHARMA SHOP — integração de pagamentos

## Estado
O repositório contém um Cloudflare Worker inicial para criar preferências do Mercado Pago Checkout Pro. **A integração ainda não está ativa e a loja ainda não pode receber pedidos pagos**: o Worker precisa ser implantado e configurado, e faltam webhook validado e armazenamento persistente dos pedidos.

## Implantação necessária (Cloudflare)
1. Acesse https://dash.cloudflare.com/ e abra **Workers & Pages**.
2. Crie um Worker e publique o código de `worker.js` deste repositório.
3. Em **Settings → Variables and Secrets**, configure:
   - Variável `SITE_ORIGIN`: `https://pharmafitness04-sys.github.io`
   - Variável `SITE_BASE_URL`: `https://pharmafitness04-sys.github.io/pharma-shop`
   - Variável `PRODUCT_CATALOG_JSON`: catálogo real em JSON, com IDs, nomes e preços em reais. Exemplo ilustrativo: `[{"id":"item-1","title":"Produto cadastrado","price":19.9}]`
   - Secret `MP_ACCESS_TOKEN`: Access Token de teste do Mercado Pago. Digite-o diretamente no painel Cloudflare; nunca o envie por chat ou o grave no GitHub.
4. Salve e implante o Worker. Anote a URL pública atribuída pela Cloudflare.
5. Teste `GET https://SUA-URL-DO-WORKER/health`.

## Endpoint disponível
`POST /api/create-preference`

Exemplo:
```json
{"items":[{"id":"item-1","quantity":1}]}
```
O servidor confere os IDs e preços no catálogo configurado e devolve uma URL de Checkout Pro. O frontend ainda precisa chamar esse endpoint e redirecionar o cliente para a URL retornada.

## Antes de vender
- Configurar no frontend a chamada ao Worker e testar o checkout em ambiente de teste.
- Implementar webhook com validação de assinatura e consulta do pagamento diretamente à API do Mercado Pago.
- Registrar pedidos e estados de pagamento em armazenamento persistente.
- Só confirmar pedidos após validação no servidor; nunca confiar apenas na página de retorno do navegador.
- Validar catálogo, estoque, frete, políticas e requisitos sanitários aplicáveis aos produtos.
- Pix, boleto e cartão dependem dos meios habilitados e da aprovação/configuração da conta Mercado Pago.

**Não use a integração atual para vendas reais nem libere mercadorias:** o Worker ainda não confirma nem registra pagamentos.

Documentação oficial:
- https://www.mercadopago.com.br/developers/pt/reference/online-payments/checkout-pro-preferences/overview
- https://www.mercadopago.com.br/developers/pt/docs/checkout-pro-preferences/payment-notifications
- https://www.mercadopago.com.br/developers/pt/reference/online-payments/checkout-pro-orders/overview
