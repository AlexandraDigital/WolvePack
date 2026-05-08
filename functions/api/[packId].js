const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

function validPackId(packId) {
  return /^[a-zA-Z0-9_-]{6,80}$/.test(packId || '');
}

function keyFor(packId) {
  return `pack:${packId}`;
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function onRequestGet({ env, params }) {
  if (!env.WOLVEPACK_KV) return json({ error: 'Missing WOLVEPACK_KV binding' }, 500);
  if (!validPackId(params.packId)) return json({ error: 'Invalid pack id' }, 400);

  const payload = await env.WOLVEPACK_KV.get(keyFor(params.packId), 'json');
  if (!payload) return json({ error: 'Pack not found' }, 404);

  return json(payload);
}

export async function onRequestPut(context) {
  return savePack(context);
}

export async function onRequestPost(context) {
  return savePack(context);
}

async function savePack({ request, env, params }) {
  if (!env.WOLVEPACK_KV) return json({ error: 'Missing WOLVEPACK_KV binding' }, 500);
  if (!validPackId(params.packId)) return json({ error: 'Invalid pack id' }, 400);

  const raw = await request.text();
  if (raw.length > 120000) return json({ error: 'Payload too large' }, 413);

  let incoming;
  try {
    incoming = JSON.parse(raw);
  } catch (e) {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const existing = await env.WOLVEPACK_KV.get(keyFor(params.packId), 'json');
  const payload = mergePack(existing, incoming);

  await env.WOLVEPACK_KV.put(keyFor(params.packId), JSON.stringify(payload));
  return json(payload);
}

function mergePack(existing, incoming) {
  const current = existing || {};
  const nextState = incoming.state || {};
  const currentState = current.state || {};

  return {
    ...current,
    ...incoming,
    updatedAt: Date.now(),
    state: {
      ...currentState,
      ...nextState,
      username: nextState.username || currentState.username,
      xp: Math.max(currentState.xp || 0, nextState.xp || 0),
      streak: Math.max(currentState.streak || 0, nextState.streak || 0),
      todaySteps: Math.max(currentState.todaySteps || 0, nextState.todaySteps || 0),
      history: { ...(currentState.history || {}), ...(nextState.history || {}) },
      awardedToday: { ...(currentState.awardedToday || {}), ...(nextState.awardedToday || {}) },
    },
    packMembers: mergeMembers(current.packMembers, incoming.packMembers),
  };
}

function mergeMembers(a = [], b = []) {
  const byName = new Map();
  [...a, ...b].forEach(member => {
    if (!member || !member.name) return;
    const key = member.name.toLowerCase();
    const existing = byName.get(key);
    if (!existing || (member.addedAt || 0) >= (existing.addedAt || 0)) {
      byName.set(key, member);
    }
  });
  return Array.from(byName.values()).slice(0, 50);
}
