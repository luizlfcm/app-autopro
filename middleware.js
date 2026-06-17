const UPSTASH_URL   = 'https://brave-squid-149229.upstash.io';
const UPSTASH_TOKEN = 'ggAAAAAAAkbtAAIgcDGlbiBG4BDcICZ-iYVZwvTqVeCyIYrwdkdqc77p0TNCsA';
const ADMIN_TOKEN   = 'ADMIN_FAP_2024';
const HOTMART_URL   = 'https://pay.hotmart.com/T106306252O';

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

  // Sem token — bloqueia
  if (!token) {
    return Response.redirect(HOTMART_URL, 302);
  }

  // Verificar token no Upstash
  try {
    const resp = await fetch(`${UPSTASH_URL}/get/token:${token}`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
    });

    const data = await resp.json();

    if (!data.result) {
      return Response.redirect(HOTMART_URL, 302);
    }

    const perms = JSON.parse(data.result);

    if (!perms.base) {
      return Response.redirect(HOTMART_URL, 302);
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
