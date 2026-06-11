import express from 'express';
import { allQuery, getQuery, runQuery } from '../database';
import { Concert, ConcertWithStats } from '../types';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { artist, venue, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    let sql = `
      SELECT c.*,
        COUNT(DISTINCT r.id) as review_count,
        AVG(r.overall_score) as avg_overall,
        AVG(r.sound_score) as avg_sound,
        AVG(r.stage_score) as avg_stage,
        AVG(r.atmosphere_score) as avg_atmosphere,
        AVG(r.value_score) as avg_value,
        SUM(CASE WHEN r.created_at >= datetime('now', '-7 days') THEN 1 ELSE 0 END) as weekly_reviews
      FROM concerts c
      LEFT JOIN reviews r ON c.id = r.concert_id AND r.status = 'approved'
      WHERE 1=1
    `;
    const params: any[] = [];

    if (artist) {
      sql += ' AND c.artist LIKE ?';
      params.push(`%${artist}%`);
    }
    if (venue) {
      sql += ' AND c.venue LIKE ?';
      params.push(`%${venue}%`);
    }

    sql += ` GROUP BY c.id ORDER BY c.date DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), offset);

    const concerts = await allQuery<ConcertWithStats>(sql, params);
    
    let countSql = 'SELECT COUNT(*) as total FROM concerts WHERE 1=1';
    const countParams: any[] = [];
    if (artist) {
      countSql += ' AND artist LIKE ?';
      countParams.push(`%${artist}%`);
    }
    if (venue) {
      countSql += ' AND venue LIKE ?';
      countParams.push(`%${venue}%`);
    }
    const countResult = await getQuery<{ total: number }>(countSql, countParams);

    res.json({
      concerts,
      total: countResult?.total || 0,
      page: Number(page),
      limit: Number(limit)
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/hot', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const sql = `
      SELECT c.*,
        COUNT(DISTINCT r.id) as review_count,
        AVG(r.overall_score) as avg_overall,
        AVG(r.sound_score) as avg_sound,
        AVG(r.stage_score) as avg_stage,
        AVG(r.atmosphere_score) as avg_atmosphere,
        AVG(r.value_score) as avg_value,
        SUM(CASE WHEN r.created_at >= datetime('now', '-7 days') THEN 1 ELSE 0 END) as weekly_reviews
      FROM concerts c
      LEFT JOIN reviews r ON c.id = r.concert_id AND r.status = 'approved'
      GROUP BY c.id
      HAVING weekly_reviews > 0
      ORDER BY weekly_reviews DESC, review_count DESC
      LIMIT ?
    `;
    const concerts = await allQuery<ConcertWithStats>(sql, [Number(limit)]);
    res.json({ concerts });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/artists', async (req, res) => {
  try {
    const sql = 'SELECT DISTINCT artist FROM concerts ORDER BY artist';
    const result = await allQuery<{ artist: string }>(sql);
    res.json({ artists: result.map(r => r.artist) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/venues', async (req, res) => {
  try {
    const sql = 'SELECT DISTINCT venue FROM concerts ORDER BY venue';
    const result = await allQuery<{ venue: string }>(sql);
    res.json({ venues: result.map(r => r.venue) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const sql = `
      SELECT c.*,
        COUNT(DISTINCT r.id) as review_count,
        AVG(r.overall_score) as avg_overall,
        AVG(r.sound_score) as avg_sound,
        AVG(r.stage_score) as avg_stage,
        AVG(r.atmosphere_score) as avg_atmosphere,
        AVG(r.value_score) as avg_value,
        SUM(CASE WHEN r.created_at >= datetime('now', '-7 days') THEN 1 ELSE 0 END) as weekly_reviews
      FROM concerts c
      LEFT JOIN reviews r ON c.id = r.concert_id AND r.status = 'approved'
      WHERE c.id = ?
      GROUP BY c.id
    `;
    const concert = await getQuery<ConcertWithStats>(sql, [req.params.id]);
    
    if (!concert) {
      return res.status(404).json({ error: '演唱会不存在' });
    }

    res.json({ concert });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { artist, venue, city, date, poster } = req.body;
    
    if (!artist || !venue || !city || !date) {
      return res.status(400).json({ error: '请填写完整信息' });
    }

    const result = await runQuery(
      'INSERT INTO concerts (artist, venue, city, date, poster) VALUES (?, ?, ?, ?, ?)',
      [artist, venue, city, date, poster || null]
    );

    res.json({ id: result.lastID });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
