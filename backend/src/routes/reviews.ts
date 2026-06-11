import express from 'express';
import { allQuery, getQuery, runQuery } from '../database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { ReviewWithDetails, Review } from '../types';

const router = express.Router();

router.get('/', async (req: AuthRequest, res) => {
  try {
    const { concert_id, artist, venue, page = 1, limit = 10 } = req.query;
    const userId = req.user?.id || 0;
    const offset = (Number(page) - 1) * Number(limit);

    let sql = `
      SELECT r.*,
        u.username, u.avatar as user_avatar,
        c.artist, c.venue, c.date as concert_date,
        (SELECT COUNT(*) FROM likes WHERE review_id = r.id) as likes_count,
        (SELECT COUNT(*) FROM favorites WHERE review_id = r.id) as favorites_count,
        EXISTS(SELECT 1 FROM likes WHERE user_id = ? AND review_id = r.id) as is_liked,
        EXISTS(SELECT 1 FROM favorites WHERE user_id = ? AND review_id = r.id) as is_favorited
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN concerts c ON r.concert_id = c.id
      WHERE r.status = 'approved'
    `;
    const params: any[] = [userId, userId];

    if (concert_id) {
      sql += ' AND r.concert_id = ?';
      params.push(concert_id);
    }
    if (artist) {
      sql += ' AND c.artist LIKE ?';
      params.push(`%${artist}%`);
    }
    if (venue) {
      sql += ' AND c.venue LIKE ?';
      params.push(`%${venue}%`);
    }

    sql += ` ORDER BY r.created_at DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), offset);

    const reviews = await allQuery<ReviewWithDetails>(sql, params);

    let countSql = `
      SELECT COUNT(*) as total FROM reviews r
      JOIN concerts c ON r.concert_id = c.id
      WHERE r.status = 'approved'
    `;
    const countParams: any[] = [];
    if (concert_id) {
      countSql += ' AND r.concert_id = ?';
      countParams.push(concert_id);
    }
    if (artist) {
      countSql += ' AND c.artist LIKE ?';
      countParams.push(`%${artist}%`);
    }
    if (venue) {
      countSql += ' AND c.venue LIKE ?';
      countParams.push(`%${venue}%`);
    }
    const countResult = await getQuery<{ total: number }>(countSql, countParams);

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

router.get('/concert/:concertId', async (req: AuthRequest, res) => {
  try {
    const { concertId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user?.id || 0;
    const offset = (Number(page) - 1) * Number(limit);

    const sql = `
      SELECT r.*,
        u.username, u.avatar as user_avatar,
        c.artist, c.venue, c.date as concert_date,
        (SELECT COUNT(*) FROM likes WHERE review_id = r.id) as likes_count,
        (SELECT COUNT(*) FROM favorites WHERE review_id = r.id) as favorites_count,
        EXISTS(SELECT 1 FROM likes WHERE user_id = ? AND review_id = r.id) as is_liked,
        EXISTS(SELECT 1 FROM favorites WHERE user_id = ? AND review_id = r.id) as is_favorited
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN concerts c ON r.concert_id = c.id
      WHERE r.concert_id = ? AND r.status = 'approved'
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const reviews = await allQuery<ReviewWithDetails>(sql, [userId, userId, concertId, Number(limit), offset]);

    const countResult = await getQuery<{ total: number }>(
      'SELECT COUNT(*) as total FROM reviews WHERE concert_id = ? AND status = ?',
      [concertId, 'approved']
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

router.get('/user/:userId', async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const currentUserId = req.user?.id || 0;
    const offset = (Number(page) - 1) * Number(limit);

    const sql = `
      SELECT r.*,
        u.username, u.avatar as user_avatar,
        c.artist, c.venue, c.date as concert_date,
        (SELECT COUNT(*) FROM likes WHERE review_id = r.id) as likes_count,
        (SELECT COUNT(*) FROM favorites WHERE review_id = r.id) as favorites_count,
        EXISTS(SELECT 1 FROM likes WHERE user_id = ? AND review_id = r.id) as is_liked,
        EXISTS(SELECT 1 FROM favorites WHERE user_id = ? AND review_id = r.id) as is_favorited
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN concerts c ON r.concert_id = c.id
      WHERE r.user_id = ? AND r.status = 'approved'
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const reviews = await allQuery<ReviewWithDetails>(sql, [currentUserId, currentUserId, userId, Number(limit), offset]);

    const countResult = await getQuery<{ total: number }>(
      'SELECT COUNT(*) as total FROM reviews WHERE user_id = ? AND status = ?',
      [userId, 'approved']
    );

    const likesReceived = await getQuery<{ total: number }>(
      `SELECT COUNT(*) as total FROM likes l
       JOIN reviews r ON l.review_id = r.id
       WHERE r.user_id = ?`,
      [userId]
    );

    const favoritesReceived = await getQuery<{ total: number }>(
      `SELECT COUNT(*) as total FROM favorites f
       JOIN reviews r ON f.review_id = r.id
       WHERE r.user_id = ?`,
      [userId]
    );

    res.json({
      reviews,
      total: countResult?.total || 0,
      likes_received: likesReceived?.total || 0,
      favorites_received: favoritesReceived?.total || 0,
      page: Number(page),
      limit: Number(limit)
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 0;

    const sql = `
      SELECT r.*,
        u.username, u.avatar as user_avatar,
        c.artist, c.venue, c.date as concert_date,
        (SELECT COUNT(*) FROM likes WHERE review_id = r.id) as likes_count,
        (SELECT COUNT(*) FROM favorites WHERE review_id = r.id) as favorites_count,
        EXISTS(SELECT 1 FROM likes WHERE user_id = ? AND review_id = r.id) as is_liked,
        EXISTS(SELECT 1 FROM favorites WHERE user_id = ? AND review_id = r.id) as is_favorited
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN concerts c ON r.concert_id = c.id
      WHERE r.id = ? AND r.status = 'approved'
    `;
    const review = await getQuery<ReviewWithDetails>(sql, [userId, userId, id]);

    if (!review) {
      return res.status(404).json({ error: '评价不存在' });
    }

    res.json({ review });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const {
      concert_id,
      sound_score,
      stage_score,
      atmosphere_score,
      value_score,
      content,
      images,
      videos
    } = req.body;

    if (!concert_id || !sound_score || !stage_score || !atmosphere_score || !value_score || !content) {
      return res.status(400).json({ error: '请填写完整信息' });
    }

    const scores = [sound_score, stage_score, atmosphere_score, value_score];
    if (scores.some(s => s < 1 || s > 10)) {
      return res.status(400).json({ error: '评分必须在1-10之间' });
    }

    const overall_score = scores.reduce((a, b) => a + b, 0) / 4;

    const result = await runQuery(
      `INSERT INTO reviews (user_id, concert_id, sound_score, stage_score, atmosphere_score, value_score, overall_score, content, images, videos)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        concert_id,
        sound_score,
        stage_score,
        atmosphere_score,
        value_score,
        overall_score,
        content,
        JSON.stringify(images || []),
        JSON.stringify(videos || [])
      ]
    );

    res.json({ id: result.lastID, overall_score });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/like', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const reviewId = req.params.id;

    const existing = await getQuery('SELECT id FROM likes WHERE user_id = ? AND review_id = ?', [userId, reviewId]);
    
    if (existing) {
      await runQuery('DELETE FROM likes WHERE user_id = ? AND review_id = ?', [userId, reviewId]);
      res.json({ liked: false });
    } else {
      await runQuery('INSERT INTO likes (user_id, review_id) VALUES (?, ?)', [userId, reviewId]);
      res.json({ liked: true });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/favorite', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const reviewId = req.params.id;

    const existing = await getQuery('SELECT id FROM favorites WHERE user_id = ? AND review_id = ?', [userId, reviewId]);
    
    if (existing) {
      await runQuery('DELETE FROM favorites WHERE user_id = ? AND review_id = ?', [userId, reviewId]);
      res.json({ favorited: false });
    } else {
      await runQuery('INSERT INTO favorites (user_id, review_id) VALUES (?, ?)', [userId, reviewId]);
      res.json({ favorited: true });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/report', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const reviewId = req.params.id;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: '请填写举报原因' });
    }

    await runQuery(
      'INSERT INTO reports (user_id, review_id, reason) VALUES (?, ?, ?)',
      [userId, reviewId, reason]
    );

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
