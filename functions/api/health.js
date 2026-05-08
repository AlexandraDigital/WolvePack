export function onRequestGet({ env }) {
  return new Response(JSON.stringify({
    ok: true,
    kv: !!env.WOLVEPACK_KV,
    ts: new Date().toISOString(),
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
    },
  });
}
