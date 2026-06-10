import express from 'express';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

// GET /api/cart
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ci.id, ci.quantity, ci.saved_for_later,
              p.id as product_id, p.name, p.price, p.discount_price,
              p.images, p.stock, p.sku
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = $1 ORDER BY ci.created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/cart
router.post('/', async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    if (!productId) return res.status(400).json({ success: false, error: 'productId required' });

    const product = await pool.query('SELECT id, stock FROM products WHERE id = $1 AND is_active = true', [productId]);
    if (!product.rows.length) return res.status(404).json({ success: false, error: 'Product not found' });

    const existing = await pool.query(
      'SELECT id, quantity FROM cart_items WHERE user_id = $1 AND product_id = $2 AND saved_for_later = false',
      [req.user.id, productId]
    );
    if (existing.rows.length) {
      await pool.query('UPDATE cart_items SET quantity = quantity + $1 WHERE id = $2', [quantity, existing.rows[0].id]);
    } else {
      await pool.query('INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3)', [req.user.id, productId, quantity]);
    }
    res.json({ success: true, message: 'Added to cart' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/cart/:id
router.put('/:id', async (req, res) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity < 1) return res.status(400).json({ success: false, error: 'Invalid quantity' });
    await pool.query('UPDATE cart_items SET quantity = $1 WHERE id = $2 AND user_id = $3', [quantity, req.params.id, req.user.id]);
    res.json({ success: true, message: 'Updated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/cart/clear  — must be before /:id
router.delete('/clear', async (req, res) => {
  try {
    await pool.query('DELETE FROM cart_items WHERE user_id = $1 AND saved_for_later = false', [req.user.id]);
    res.json({ success: true, message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/cart/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM cart_items WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ success: true, message: 'Item removed' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/cart/:id/save-later
router.put('/:id/save-later', async (req, res) => {
  try {
    const item = await pool.query('SELECT saved_for_later FROM cart_items WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (!item.rows.length) return res.status(404).json({ success: false, error: 'Item not found' });
    await pool.query('UPDATE cart_items SET saved_for_later = $1 WHERE id = $2', [!item.rows[0].saved_for_later, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
