// Vercel serverless function: guest wishes stored in Upstash Redis (REST API, no dependencies).
// Setup: Vercel dashboard -> Storage / Marketplace -> Upstash Redis -> connect to this project.
// That adds KV_REST_API_URL + KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_URL/TOKEN) automatically.
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const KEY = 'sangjit:wishes';

async function redis(cmd) {
  const r = await fetch(URL_, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd),
  });
  if (!r.ok) throw new Error('redis ' + r.status);
  return (await r.json()).result;
}

const clean = (s, n) => String(s || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!URL_ || !TOKEN) return res.status(503).json({ error: 'storage not configured' });
  try {
    if (req.method === 'GET') {
      const rows = await redis(['LRANGE', KEY, '0', '199']);
      return res.status(200).json((rows || []).map(r => JSON.parse(r)));
    }
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const name = clean(body.name, 60);
      const message = clean(body.message, 500);
      const attend = ['hadir', 'tidak', 'ragu'].includes(body.attend) ? body.attend : '';
      if (!name || !message) return res.status(400).json({ error: 'nama dan ucapan wajib diisi' });
      const item = { name, message, attend, at: Date.now() };
      await redis(['LPUSH', KEY, JSON.stringify(item)]);
      await redis(['LTRIM', KEY, '0', '999']);
      return res.status(201).json(item);
    }
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).end();
  } catch (e) {
    return res.status(500).json({ error: 'server error' });
  }
};
