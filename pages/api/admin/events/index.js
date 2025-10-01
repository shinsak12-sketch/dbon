import prisma from '../../../../../lib/prisma';

const ADMIN_PASS = process.env.ADMIN_PASS || 'dbsonsa';

export default async function handler(req, res) {
  const unauthorized = () => res.status(401).json({ error: 'UNAUTHORIZED' });
  const bad = () => res.status(400).json({ error: 'BAD_REQUEST' });

  try {
    if (req.method === 'GET') {
      // 목록(최신순)
      const items = await prisma.event.findMany({
        orderBy: [{ playedAt: 'desc' }, { createdAt: 'desc' }],
        select: {
          id: true, name: true, slug: true, playedAt: true, status: true,
          tier: true, overview: true, rules: true, prizes: true,
          season: { select: { id: true, name: true, year: true } },
        },
      });
      return res.status(200).json({ items });
    }

    // 인증
    const admin = req.method === 'GET' ? req.query.admin : req.body?.admin;
    if (admin !== ADMIN_PASS) return unauthorized();

    if (req.method === 'POST') {
      const {
        seasonId, name, slug, playedAt, status = 'open',
        overview, rules, prizes, tier = 100,
      } = req.body || {};
      if (!seasonId || !name || !slug) return bad();

      const created = await prisma.event.create({
        data: {
          seasonId: Number(seasonId),
          name: String(name).trim(),
          slug: String(slug).trim(),
          status: String(status),
          playedAt: playedAt ? new Date(playedAt) : null,
          overview: overview ?? null,
          rules: rules ?? null,
          prizes: prizes ?? null,
          tier: Number(tier),
        },
        select: { id: true, name: true, slug: true },
      });
      return res.status(201).json({ ok: true, event: created });
    }

    if (req.method === 'PUT') {
      const {
        id, seasonId, name, slug, playedAt, status,
        overview, rules, prizes, tier,
      } = req.body || {};
      if (!id) return bad();

      const data = {};
      if (seasonId !== undefined) data.seasonId = Number(seasonId);
      if (name !== undefined) data.name = String(name).trim();
      if (slug !== undefined) data.slug = String(slug).trim();
      if (status !== undefined) data.status = String(status);
      if (playedAt !== undefined) data.playedAt = playedAt ? new Date(playedAt) : null;
      if (overview !== undefined) data.overview = overview ?? null;
      if (rules !== undefined) data.rules = rules ?? null;
      if (prizes !== undefined) data.prizes = prizes ?? null;
      if (tier !== undefined) data.tier = Number(tier);

      const updated = await prisma.event.update({
        where: { id: Number(id) },
        data,
        select: { id: true, name: true, slug: true },
      });
      return res.status(200).json({ ok: true, event: updated });
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT']);
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  } catch (e) {
    console.error('admin events api error:', e);
    return res.status(500).json({ error: 'SERVER_ERROR' });
  }
}
