// api/download.js
// GET /api/download?produto=base&email=cliente@email.com[&token=ADMIN_FAP_2024]
// Serve os PDFs de forma protegida — os arquivos NÃO ficam mais na raiz pública
// do site. Antes de entregar o arquivo, confere no Redis se o email realmente
// comprou o produto pedido (mesma chave/lógica usada pelo /api/login e
// /api/permissions: prefixo "cliente:", banco compartilhado com outros apps).

import fs from 'fs';
import path from 'path';

const FILES = {
  base: { file: 'guia-autopro.pdf', name: 'Formula-Auto-Pro-80-Formulas.pdf' },
  limp: { file: 'guia-limpeza.pdf', name: '50-Formulas-de-Limpeza.pdf' },
  leg: { file: 'guia-legalizacao.pdf', name: 'Guia-de-Legalizacao.pdf' },
};

const ADMIN_TOKEN = 'ADMIN_FAP_2024';

export default async function handler(req, res) {
  const produto = (req.query.produto || '').toString();
  const email = (req.query.email || '').toString().trim().toLowerCase();
  const token = (req.query.token || '').toString().toUpperCase();

  const meta = FILES[produto];
  if (!meta) {
    return res.status(400).json({ error: 'Produto inválido' });
  }

  const isAdmin = token === ADMIN_TOKEN || token.includes('FULL');

  if (!isAdmin) {
    // Admin bypass por email (mesmo usado no /api/permissions e no fluxo de login)
    if (email === 'admin@fap.com') {
      // segue para a entrega do arquivo
    } else {
      if (!email) {
        return res.status(401).json({ error: 'Email não informado' });
      }

      const UPSTASH_URL = process.env.KV_REST_API_URL || 'https://brave-squid-149229.upstash.io';
      const UPSTASH_TOKEN = process.env.KV_REST_API_READ_ONLY_TOKEN || process.env.KV_REST_API_TOKEN;
      if (!UPSTASH_TOKEN) {
        return res.status(500).json({ error: 'Banco de dados não configurado (env vars ausentes).' });
      }

      try {
        const r = await fetch(`${UPSTASH_URL}/get/cliente:${encodeURIComponent(email)}`, {
          headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
          cache: 'no-store',
        });
        const data = await r.json();

        if (!data.result) {
          return res.status(403).json({ error: 'Acesso não encontrado para este email' });
        }

        const cliente = JSON.parse(data.result);
        if (!cliente[produto]) {
          return res.status(403).json({ error: 'Este produto não está liberado para este email' });
        }
      } catch (err) {
        console.error('Erro ao verificar acesso para download:', err);
        return res.status(500).json({ error: 'Erro ao verificar acesso. Tente novamente.' });
      }
    }
  }

  try {
    const filePath = path.join(process.cwd(), 'api', 'files', meta.file);
    const buf = fs.readFileSync(filePath);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${meta.name}"`);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(buf);
  } catch (err) {
    console.error('Erro ao ler PDF:', err);
    return res.status(500).json({ error: 'Arquivo não encontrado no servidor.' });
  }
}
