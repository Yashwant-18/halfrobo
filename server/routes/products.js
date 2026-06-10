import express from 'express';
import { pool } from '../config/database.js';

const router = express.Router();

// GET /api/products — list with search, filter, sort, pagination
router.get('/', async (req, res) => {
  try {
    const {
      search   = '',
      category = '',
      minPrice = 0,
      maxPrice = 999999,
      sort     = 'newest',
      page     = 1,
      limit    = 12,
    } = req.query;

    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    const conditions = ['p.is_active = true'];
    const params = [];
    let idx = 1;

    if (search) {
      conditions.push(`(p.name ILIKE $${idx} OR p.description ILIKE $${idx})`);
      params.push(`%${search}%`); idx++;
    }
    if (category) {
      conditions.push(`c.slug = $${idx}`);
      params.push(category); idx++;
    }
    conditions.push(`p.price >= $${idx}`); params.push(parseFloat(minPrice)); idx++;
    conditions.push(`p.price <= $${idx}`); params.push(parseFloat(maxPrice)); idx++;

    const where   = 'WHERE ' + conditions.join(' AND ');
    const sortMap = {
      price_asc:  'p.price ASC',
      price_desc: 'p.price DESC',
      newest:     'p.created_at DESC',
      rating:     'p.rating DESC',
    };
    const orderBy = sortMap[sort] || 'p.created_at DESC';

    const sql = `
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p LEFT JOIN categories c ON p.category_id = c.id
      ${where} ORDER BY ${orderBy} LIMIT $${idx} OFFSET $${idx + 1}`;

    const countSql = `
      SELECT COUNT(*) FROM products p
      LEFT JOIN categories c ON p.category_id = c.id ${where}`;

    const [products, countResult] = await Promise.all([
      pool.query(sql, [...params, parseInt(limit), offset]),
      pool.query(countSql, params),
    ]);

    const total = parseInt(countResult.rows[0].count) || 0;
    res.json({
      success: true,
      data: products.rows,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    console.error('GET /products error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/products/featured
router.get('/featured', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, c.name as category_name
       FROM products p LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.is_featured = true AND p.is_active = true
       ORDER BY p.created_at DESC LIMIT 8`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, c.name as category_name, c.slug as category_slug
       FROM products p LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = $1`,
      [req.params.id]
    );
    if (!result.rows.length)
      return res.status(404).json({ success: false, error: 'Product not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
