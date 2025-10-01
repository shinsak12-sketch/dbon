import prisma from '../../../../lib/prisma';
const ADMIN_PASS = process.env.ADMIN_PASS || 'dbsonsa';

const KEY = 'pointRules'; // Setting.key

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const row = await prisma.setting.findUnique({ where: { key: KEY } });
      let rules = { base: [30, 20, 15, 12, 10, 8, 6, 4, 2, 1], tier: { 120: 120, 100: 100, 80: 80 } };
      if (row?.value) {
        try { rules = JSON.parse(row.value); } catch {}
      }
      return res.status(200).json({ rules });
    }

    const { admin, rules } = req.body || {};
    if (admin !== ADMIN_PASS) return res.status(401).json({ error: 'UNAUTHORIZED' });
    if (!rules) return res.status(400).json({ error: 'BAD_REQUEST' });

    const value = JSON.stringify(rules);
    await prisma.setting.upsert({
      where: { key: KEY },
      update: { value },
      create: { key: KEY, value },
    });
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('settings api error:', e);
    return res.status(500).json({ error: 'SERVER_ERROR' });
  }
}
