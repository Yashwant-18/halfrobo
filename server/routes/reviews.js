import express from 'express';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/reviews/product/:productId (public)
router.get('/product/:productId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.id, r.rating, r.comment, r.created_at, u.name as user_name, u.avatar
       FROM reviews r JOIN users u ON r.user_id = u.id
       WHERE r.product_id = $1 AND r.status = 'approved' ORDER BY r.created_at DESC`,
      [req.params.productId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/reviews (requires auth)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    const result = await pool.query(
      'INSERT INTO reviews (user_id, product_id, rating, comment) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, productId, rating, comment]
    );
    // Update product rating
    await pool.query(
      `UPDATE products SET rating = (SELECT AVG(rating) FROM reviews WHERE product_id = $1 AND status = 'approved'),
       review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = $1 AND status = 'approved') WHERE id = $1`,
      [productId]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

export default router;
