import express from 'express';
import { allQuery, getQuery, runQuery } from '../database';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken, requireAdmin);

router.get('/reviews/pending', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const sql = `
      SELECT r.*,
        u.username,
        c.artist, c.venue
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN concerts c ON r.concert_id = c.id
      WHERE r.status = 'pending'
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const reviews = await allQuery(sql, [Number(limit), offset]);

    const countResult = await getQuery<{ total: number }>(
      'SELECT COUNT(*) as total FROM reviews WHERE status = ?',
      ['pending']
    );

    res.json({
      reviews,
      total: countResult?.total || 0,
      page: Number(page),
      limit: Number(limit)
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/reviews/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    await runQuery('UPDATE reviews SET status = ? WHERE id = ?', ['approved', id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/reviews/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    await runQuery('UPDATE reviews SET status = ? WHERE id = ?', ['rejected', id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/reports', async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const sql = `
      SELECT rp.*,
        u.username as reporter_name,
        r.content as review_content,
        ru.username as reviewer_name,
        c.artist, c.venue
      FROM reports rp
      JOIN users u ON rp.user_id = u.id
      JOIN reviews r ON rp.review_id = r.id
      JOIN users ru ON r.user_id = ru.id
      JOIN concerts c ON r.concert_id = c.id
      WHERE rp.status = ?
      ORDER BY rp.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const reports = await allQuery(sql, [status, Number(limit), offset]);

    const countResult = await getQuery<{ total: number }>(
      'SELECT COUNT(*) as total FROM reports WHERE status = ?',
      [status]
    );

    res.json({
      reports,
      total: countResult?.total || 0,
      page: Number(page),
      limit: Number(limit)
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/reports/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    if (action === 'remove_review') {
      const report = await getQuery<any>('SELECT review_id FROM reports WHERE id = ?', [id]);
      if (report) {
        await runQuery('UPDATE reviews SET status = ? WHERE id = ?', ['rejected', report.review_id]);
      }
    }

    await runQuery('UPDATE reports SET status = ? WHERE id = ?', ['resolved', id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/reports/:id/dismiss', async (req, res) => {
  try {
    const { id } = req.params;
    await runQuery('UPDATE reports SET status = ? WHERE id = ?', ['dismissed', id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/stats/artists', async (req, res) => {
  try {
    const sql = `
      SELECT 
        c.artist,
        COUNT(DISTINCT r.id) as review_count,
        AVG(r.overall_score) as avg_overall,
        AVG(r.sound_score) as avg_sound,
        AVG(r.stage_score) as avg_stage,
        AVG(r.atmosphere_score) as avg_atmosphere,
        AVG(r.value_score) as avg_value
      FROM concerts c
      LEFT JOIN reviews r ON c.id = r.concert_id AND r.status = 'approved'
      GROUP BY c.artist
      ORDER BY review_count DESC
    `;
    const stats = await allQuery(sql);
    res.json({ stats });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/stats/overview', async (req, res) => {
  try {
    const totalUsers = await getQuery<{ count: number }>('SELECT COUNT(*) as count FROM users');
    const totalConcerts = await getQuery<{ count: number }>('SELECT COUNT(*) as count FROM concerts');
    const totalReviews = await getQuery<{ count: number }>('SELECT COUNT(*) as count FROM reviews WHERE status = ?', ['approved']);
    const pendingReviews = await getQuery<{ count: number }>('SELECT COUNT(*) as count FROM reviews WHERE status = ?', ['pending']);
    const pendingReports = await getQuery<{ count: number }>('SELECT COUNT(*) as count FROM reports WHERE status = ?', ['pending']);

    const recentReviews = await allQuery(`
      SELECT r.*, u.username, c.artist, c.venue
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN concerts c ON r.concert_id = c.id
      WHERE r.status = 'approved'
      ORDER BY r.created_at DESC
      LIMIT 10
    `);

    res.json({
      total_users: totalUsers?.count || 0,
      total_concerts: totalConcerts?.count || 0,
      total_reviews: totalReviews?.count || 0,
      pending_reviews: pendingReviews?.count || 0,
      pending_reports: pendingReports?.count || 0,
      recent_reviews: recentReviews
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
