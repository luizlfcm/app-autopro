export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  const email = (req.query.email || '').toLowerCase().trim();

  if (!email) {
    return res.json({ success: false, error: 'Email não informado.' });
  }

  // Admin bypass
  if (email === 'admin@fap.com') {
    return res.json({ success: true, permissions: { base: true, limp: true, leg: true, form: true, admin: true } });
  }

  const UPSTASH_URL   = process.env.KV_REST_API_URL   || 'https://brave-squid-149229.upstash.io';
  const UPSTASH_TOKEN = process.env.KV_REST_API_READ_ONLY_TOKEN || process.env.KV_REST_API_TOKEN;

  try {
    const resp = await fetch(`${UPSTASH_URL}/get/cliente:${encodeURIComponent(email)}`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      cache: 'no-store'
    });

    const data = await resp.json();

    if (!data.result) {
      return res.json({ success: false, error: 'Email não encontrado. Verifique se usou o mesmo email da compra.' });
    }

    const cliente = JSON.parse(data.result);
    const temAcesso = cliente.base || cliente.limp || cliente.leg || cliente.form;

    if (!temAcesso) {
      return res.json({ success: false, error: 'Acesso não disponível. Entre em contato com o suporte.' });
    }

    return res.json({
      success: true,
      permissions: {
        base: cliente.base || false,
        limp: cliente.limp || false,
        leg:  cliente.leg  || false,
        form: cliente.form || false
      }
    });

  } catch (e) {
    console.error('Login error:', e);
    return res.json({ success: false, error: 'Erro ao verificar acesso. Tente novamente.' });
  }
}
