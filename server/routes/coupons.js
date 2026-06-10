import express from 'express';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/validate', authenticateToken, async (req, res) => {
  try {
    const { code, orderTotal } = req.body;
    const result = await pool.query(
      `SELECT * FROM coupons WHERE code = $1 AND is_active = true AND (expires_at IS NULL OR expires_at > NOW()) AND (max_uses IS NULL OR used_count < max_uses)`,
      [code.toUpperCase()]
    );
    if (!result.rows.length) return res.status(400).json({ success: false, error: 'Invalid or expired coupon code' });
    const coupon = result.rows[0];
    if (parseFloat(orderTotal) < parseFloat(coupon.min_order)) {
      return res.status(400).json({ success: false, error: `Minimum order of ₹${coupon.min_order} required` });
    }
    let discountAmount = 0;
    if (coupon.discount_percent) discountAmount = (parseFloat(orderTotal) * parseFloat(coupon.discount_percent)) / 100;
    else if (coupon.discount_amount) discountAmount = parseFloat(coupon.discount_amount);
    res.json({ success: true, data: { coupon: { code: coupon.code, discountPercent: coupon.discount_percent, discountAmount: coupon.discount_amount }, discountAmount: discountAmount.toFixed(2) } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

export default router;
