import { NextResponse } from 'next/server';

const UPSTASH_URL   = 'https://brave-squid-149229.upstash.io';
const UPSTASH_TOKEN = 'ggAAAAAAAkbtAAIgcDGlbiBG4BDcICZ-iYVZwvTqVeCyIYrwdkdqc77p0TNCsA';
const ADMIN_TOKEN   = 'ADMIN_FAP_2024';
const HOTMART_URL   = 'https://pay.hotmart.com/T106306252O';

export async function middleware(request) {
  const { searchParams } = new URL(request.url);
  const token = (searchParams.get('t') || searchParams.get('access') || '').toUpperCase();

  // Deixar passar: arquivos estáticos (PDF, manifest, etc.)
  const path = request.nextUrl.pathname;
  if (
    path.endsWith('.pdf') ||
    path.endsWith('.json') ||
    path.endsWith('.png') ||
    path.endsWith('.ico') ||
    path.startsWith('/api/')
  ) {
    return NextResponse.next();
  }

  // Admin — passa sempre
  if (token === ADMIN_TOKEN || token.includes('FULL')) {
    return NextResponse.next();
  }

  // Sem token — bloqueia
  if (!token) {
    return NextResponse.redirect(HOTMART_URL);
  }

  // Verificar token no Upstash
  try {
    const resp = await fetch(`${UPSTASH_URL}/get/token:${token}`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      cache: 'no-store'
    });

    const data = await resp.json();

    if (!data.result) {
      // Token não encontrado — bloqueia
      return NextResponse.redirect(HOTMART_URL);
    }

    const perms = JSON.parse(data.result);

    if (!perms.base) {
      // Token existe mas acesso revogado (reembolso) — bloqueia
      return NextResponse.redirect(HOTMART_URL);
    }

    // Token válido e ativo — deixa passar
    return NextResponse.next();

  } catch (e) {
    // Erro ao verificar — fail open (não bloqueia por erro técnico)
    console.error('Middleware token check error:', e);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
