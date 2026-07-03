export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  const token = (req.query.t || '').toUpperCase().trim();

  // Sem token
  if (!token) {
    return res.json({ base: false, limp: false, leg: false, form: false });
  }

  // Admin bypass
  if (token === 'ADMIN_FAP_2024' || token.includes('FULL')) {
    return res.json({ base: true, limp: true, leg: true, form: true, admin: true });
  }

  const UPSTASH_URL   = process.env.KV_REST_API_URL   || 'https://brave-squid-149229.upstash.io';
  const UPSTASH_TOKEN = process.env.KV_REST_API_READ_ONLY_TOKEN || process.env.KV_REST_API_TOKEN;

  try {
    const resp = await fetch(`${UPSTASH_URL}/get/token:${token}`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      cache: 'no-store'
    });

    const data = await resp.json();

    if (!data.result) {
      return res.json({ base: false, limp: false, leg: false, form: false });
    }

    const perms = JSON.parse(data.result);

    return res.json({
      base: perms.base || false,
      limp: perms.limp || false,
      leg:  perms.leg  || false,
      form: perms.form || false
    });

  } catch (e) {
    console.error('Permissions error:', e);
    // Fail open — não bloqueia cliente por erro técnico
    return res.json({ base: true, limp: false, leg: false, form: false });
  }
}
