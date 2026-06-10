import express from 'express';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

// POST /api/orders — create order
router.post('/', async (req, res) => {
  try {
    const {
      items, shippingAddress, paymentMethod,
      deliveryMethod = 'standard', couponCode,
      subtotal, shippingCost = 0, discount = 0, total,
    } = req.body;

    if (!items?.length)
      return res.status(400).json({ success: false, error: 'Order must have at least one item' });
    if (!shippingAddress || !paymentMethod)
      return res.status(400).json({ success: false, error: 'shippingAddress and paymentMethod are required' });

    const orderNumber = `HR-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
    const estDays     = deliveryMethod === 'express' ? 2 : deliveryMethod === 'overnight' ? 1 : 7;
    const estDelivery = new Date(Date.now() + estDays * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];

    const result = await pool.query(
      `INSERT INTO orders
         (order_number, user_id, items, subtotal, shipping_cost, discount, total,
          status, shipping_address, payment_method, delivery_method, coupon_code, estimated_delivery)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'pending',$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        orderNumber, req.user.id,
        JSON.stringify(items),
        parseFloat(subtotal) || 0,
        parseFloat(shippingCost) || 0,
        parseFloat(discount) || 0,
        parseFloat(total) || 0,
        JSON.stringify(shippingAddress),
        paymentMethod, deliveryMethod,
        couponCode || null, estDelivery,
      ]
    );

    // Decrement stock for each item (best-effort, non-fatal)
    for (const item of items) {
      const productId = item.productId || item.product_id || item.id;
      if (productId) {
        await pool.query(
          'UPDATE products SET stock = MAX(stock - $1, 0) WHERE id = $2',
          [item.quantity || 1, productId]
        ).catch(e => console.warn('Stock update warning:', e.message));
      }
    }

    // Clear only active cart items (not saved-for-later)
    await pool.query(
      'DELETE FROM cart_items WHERE user_id = $1 AND saved_for_later = 0',
      [req.user.id]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('POST /orders error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/orders — list user orders
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    // Parse JSON fields
    const orders = result.rows.map(o => ({
      ...o,
      items:            typeof o.items === 'string'            ? JSON.parse(o.items)            : o.items,
      shipping_address: typeof o.shipping_address === 'string' ? JSON.parse(o.shipping_address) : o.shipping_address,
    }));
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/orders/:id — single order (user-scoped)
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!result.rows.length)
      return res.status(404).json({ success: false, error: 'Order not found' });

    const o = result.rows[0];
    res.json({
      success: true,
      data: {
        ...o,
        items:            typeof o.items === 'string'            ? JSON.parse(o.items)            : o.items,
        shipping_address: typeof o.shipping_address === 'string' ? JSON.parse(o.shipping_address) : o.shipping_address,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
