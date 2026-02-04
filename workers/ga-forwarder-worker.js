addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request, event));
});

async function handleRequest(request, event){
  if(request.method !== 'POST'){
    return new Response(JSON.stringify({error:'POST only'}), {status:405, headers:{'Content-Type':'application/json'}});
  }
  // Simple auth: either a token header matches or the Origin matches an allowed origin.
  const env = (typeof __ENV__ !== 'undefined' && __ENV__) || {};
  const MID = env.MEASUREMENT_ID || (typeof MEASUREMENT_ID !== 'undefined' && MEASUREMENT_ID);
  const SECRET = env.API_SECRET || (typeof API_SECRET !== 'undefined' && API_SECRET);
  const FORWARDER_TOKEN = env.FORWARDER_TOKEN || (typeof FORWARDER_TOKEN !== 'undefined' && FORWARDER_TOKEN);
  const ALLOWED_ORIGIN = env.ALLOWED_ORIGIN || (typeof ALLOWED_ORIGIN !== 'undefined' && ALLOWED_ORIGIN);

  // auth check
  const tokenHeader = request.headers.get('x-forwarder-token');
  const origin = request.headers.get('origin');
  if(FORWARDER_TOKEN){
    if(!tokenHeader || tokenHeader !== FORWARDER_TOKEN){
      return new Response(JSON.stringify({error:'unauthorized - invalid token'}), {status:403, headers:{'Content-Type':'application/json'}});
    }
  } else if(ALLOWED_ORIGIN){
    if(!origin || origin !== ALLOWED_ORIGIN){
      return new Response(JSON.stringify({error:'unauthorized - origin not allowed'}), {status:403, headers:{'Content-Type':'application/json'}});
    }
  } else {
    return new Response(JSON.stringify({error:'server not configured for auth (set FORWARDER_TOKEN or ALLOWED_ORIGIN)'}), {status:500, headers:{'Content-Type':'application/json'}});
  }

  let body;
  try{ body = await request.json(); } catch(e){
    return new Response(JSON.stringify({error:'invalid json'}), {status:400, headers:{'Content-Type':'application/json'}});
  }
  const { client_id, name, params } = body;
  if(!client_id || !name){
    return new Response(JSON.stringify({error:'client_id and name required'}), {status:400, headers:{'Content-Type':'application/json'}});
  }

  if(!MID || !SECRET){
    return new Response(JSON.stringify({error:'server not configured (MEASUREMENT_ID/API_SECRET missing)'}), {status:500, headers:{'Content-Type':'application/json'}});
  }

  const mpUrl = `https://www.google-analytics.com/mp/collect?measurement_id=${MID}&api_secret=${SECRET}`;
  const payload = { client_id: client_id, events: [ { name: name, params: params || {} } ] };
  const resp = await fetch(mpUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  const text = await resp.text();
  return new Response(text || JSON.stringify({status:'ok'}), { status: resp.status, headers: { 'Content-Type': 'application/json' } });
}

/*
Deployment notes:
- Use Wrangler to publish this worker. Bind secrets `MEASUREMENT_ID` and `API_SECRET` via Wrangler or Cloudflare dashboard.
Example wrangler.toml snippet:

[env.production]
name = "ga-forwarder"
vars = { MEASUREMENT_ID = "G-XXXXXXXXXX", API_SECRET = "your_api_secret" }

Then deploy with `wrangler publish`.
*/
