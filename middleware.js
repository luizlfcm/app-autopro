const UPSTASH_URL   = 'https://brave-squid-149229.upstash.io';
const UPSTASH_TOKEN = 'ggAAAAAAAkbtAAIgcDGlbiBG4BDcICZ-iYVZwvTqVeCyIYrwdkdqc77p0TNCsA';
const ADMIN_TOKEN   = 'ADMIN_FAP_2024';
const HOTMART_URL   = 'https://pay.hotmart.com/T106306252O';
const WA_URL        = 'https://wa.me/558131963052';

const BLOCKED_PAGE = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Fórmula Auto Pro</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:#080B0F;color:#f2f4f6;font-family:Arial,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
  .card{background:#111418;border:1px solid #2a2f38;border-radius:20px;padding:36px 28px;max-width:380px;width:100%;text-align:center}
  .icon{font-size:48px;margin-bottom:16px}
  h1{font-size:20px;font-weight:800;color:#E8720C;margin-bottom:8px}
  p{font-size:14px;color:#8b95a1;line-height:1.6;margin-bottom:24px}
  .btn{display:block;padding:14px 20px;border-radius:12px;font-size:14px;font-weight:700;text-decoration:none;margin-bottom:10px;transition:opacity .2s}
  .btn:hover{opacity:.85}
  .btn-primary{background:linear-gradient(135deg,#E8720C,#c45e08);color:#fff}
  .btn-wa{background:#25D366;color:#fff}
  .btn-sec{background:#1a1f26;border:1px solid #2a2f38;color:#8b95a1}
  .divider{font-size:11px;color:#3a3f48;margin:4px 0 10px}
</style>
</head>
<body>
<div class="card">
  <div class="icon">🔒</div>
  <h1>Acesso não encontrado</h1>
  <p>Não encontramos um acesso ativo associado a este link.<br>Se você já adquiriu o produto, entre em contato com o suporte.</p>
  <a href="${WA_URL}?text=Ola!+Comprei+o+Formula+Auto+Pro+mas+nao+consigo+acessar." class="btn btn-wa">💬 Falar com suporte</a>
  <div class="divider">ou</div>
  <a href="${HOTMART_URL}" class="btn btn-primary">🔓 Adquirir agora</a>
  <a href="javascript:history.back()" class="btn btn-sec">← Voltar</a>
</div>
</body>
</html>`;

export default async function middleware(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  const token = (url.searchParams.get('t') || url.searchParams.get('access') || '').toUpperCase();

  // Deixar passar arquivos estáticos
  if (
    path.endsWith('.pdf') ||
    path.endsWith('.json') ||
    path.endsWith('.png') ||
    path.endsWith('.ico') ||
    path.endsWith('.js') ||
    path.startsWith('/api/')
  ) {
    return;
  }

  // Admin — passa sempre
  if (token === ADMIN_TOKEN || token.includes('FULL')) {
    return;
  }

  // Sem token — mostra página de bloqueio
  if (!token) {
    return new Response(BLOCKED_PAGE, {
      status: 403,
      headers: { 'Content-Type': 'text/html;charset=UTF-8' }
    });
  }

  // Verificar token no Upstash
  try {
    const resp = await fetch(`${UPSTASH_URL}/get/token:${token}`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
    });

    const data = await resp.json();

    if (!data.result) {
      return new Response(BLOCKED_PAGE, {
        status: 403,
        headers: { 'Content-Type': 'text/html;charset=UTF-8' }
      });
    }

    const perms = JSON.parse(data.result);

    if (!perms.base) {
      return new Response(BLOCKED_PAGE, {
        status: 403,
        headers: { 'Content-Type': 'text/html;charset=UTF-8' }
      });
    }

    // Token válido — deixa passar
    return;

  } catch (e) {
    // Erro técnico — fail open
    return;
  }
}

export const config = {
  matcher: '/(.*)',
};
