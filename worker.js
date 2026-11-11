/**
 * PHARMA SHOP — Cloudflare Worker para Mercado Pago Checkout Pro.
 * Configure MP_ACCESS_TOKEN, SITE_URL e PRODUCT_CATALOG_JSON como secrets/vars.
 * Nunca coloque credenciais no HTML ou no Git.
 */
const cors = (origin, allowed) => ({
  "Access-Control-Allow-Origin": origin === allowed ? allowed : "null",
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
  "Access-Control-Allow-Headers": "Content-Type",
  "Vary": "Origin"
});
const json = (data, status=200, headers={}) => new Response(JSON.stringify(data), {
  status, headers: { "Content-Type":"application/json; charset=utf-8", ...headers }
});
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const headers = cors(origin, env.SITE_URL || "");
    if (request.method === "OPTIONS") return new Response(null, {status:204, headers});
    if (url.pathname === "/health" && request.method === "GET") {
      return json({ok:true, service:"pharma-shop-checkout", configured:!!env.MP_ACCESS_TOKEN}, 200, headers);
    }
    if (url.pathname !== "/api/create-preference" || request.method !== "POST") {
      return json({error:"Rota não encontrada"},404,headers);
    }
    if (!env.MP_ACCESS_TOKEN || !env.SITE_URL || !env.PRODUCT_CATALOG_JSON) {
      return json({error:"Checkout ainda não configurado no servidor."},503,headers);
    }
    if (origin !== env.SITE_URL) return json({error:"Origem não autorizada"},403,headers);
    let body;
    try { body = await request.json(); } catch { return json({error:"JSON inválido"},400,headers); }
    if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 20) {
      return json({error:"Informe os produtos do pedido."},400,headers);
    }
    let catalog;
    try { catalog = JSON.parse(env.PRODUCT_CATALOG_JSON); } catch {
      return json({error:"Catálogo do servidor inválido."},500,headers);
    }
    const byId = new Map(catalog.map(p => [String(p.id), p]));
    const items = [];
    for (const requested of body.items) {
      const product = byId.get(String(requested.id));
      const quantity = Number(requested.quantity);
      if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > 10 ||
          !Number.isFinite(Number(product.price)) || Number(product.price) <= 0) {
        return json({error:"Produto ou quantidade inválida."},400,headers);
      }
      items.push({
        id:String(product.id),
        title:String(product.title).slice(0,120),
        quantity,
        currency_id:"BRL",
        unit_price:Number(product.price)
      });
    }
    const reference = crypto.randomUUID();
    const payload = {
      items,
      external_reference: reference,
      statement_descriptor:"PHARMA SHOP",
      back_urls: {
        success: env.SITE_URL + "/?pagamento=sucesso",
        pending: env.SITE_URL + "/?pagamento=pendente",
        failure: env.SITE_URL + "/?pagamento=falhou"
      },
      auto_return:"approved",
      notification_url: env.WEBHOOK_URL || undefined
    };
    const mp = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method:"POST",
      headers:{
        "Authorization":"Bearer " + env.MP_ACCESS_TOKEN,
        "Content-Type":"application/json",
        "X-Idempotency-Key":reference
      },
      body:JSON.stringify(payload)
    });
    const result = await mp.json().catch(()=>({}));
    if (!mp.ok || !result.init_point) {
      return json({error:"O Mercado Pago não conseguiu criar o checkout. Verifique as credenciais e o modo de teste.", detail: result.message || result.error || undefined},502,headers);
    }
    return json({checkout_url:result.init_point, preference_id:result.id, external_reference:reference},200,headers);
  }
};
