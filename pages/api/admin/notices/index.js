import prisma from '../../../../lib/prisma';
const ADMIN_PASS = process.env.ADMIN_PASS || 'dbsonsa';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const items = await prisma.notice.findMany({
        orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
        select: { id: true, title: true, content: true, pinned: true, createdAt: true },
      });
      return res.status(200).json({ items });
    }

    const admin = req.method === 'GET' ? req.query.admin : req.body?.admin;
    if (admin !== ADMIN_PASS) return res.status(401).json({ error: 'UNAUTHORIZED' });

    if (req.method === 'POST') {
      const { title, content, pinned = false } = req.body || {};
      if (!title || !content) return res.status(400).json({ error: 'BAD_REQUEST' });

      const created = await prisma.notice.create({
        data: { title: String(title).trim(), content: String(content), pinned: !!pinned },
        select: { id: true, title: true, pinned: true },
      });
      return res.status(201).json({ ok: true, notice: created });
    }

    if (req.method === 'PUT') {
      const { id, title, content, pinned } = req.body || {};
      if (!id) return res.status(400).json({ error: 'BAD_REQUEST' });
      const data = {};
      if (title !== undefined) data.title = String(title).trim();
      if (content !== undefined) data.content = String(content);
      if (pinned !== undefined) data.pinned = !!pinned;

      const updated = await prisma.notice.update({
        where: { id: Number(id) },
        data,
        select: { id: true, title: true, pinned: true },
      });
      return res.status(200).json({ ok: true, notice: updated });
    }

    if (req.method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'BAD_REQUEST' });
      await prisma.notice.delete({ where: { id: Number(id) } });
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  } catch (e) {
    console.error('admin notices api error:', e);
    return res.status(500).json({ error: 'SERVER_ERROR' });
  }
}
