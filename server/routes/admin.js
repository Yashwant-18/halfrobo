import express from 'express';
import { pool } from '../config/database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { uploadMultiple, uploadSingle, processImage } from '../middleware/upload.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();
router.use(authenticateToken, requireAdmin);

// ─── DASHBOARD ────────────────────────────────────────────────
router.get('/dashboard/stats', async (req, res) => {
  try {
    const [users, products, orders, revenue, recentOrders] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users WHERE role = $1', ['user']),
      pool.query('SELECT COUNT(*) FROM products WHERE is_active = true'),
      pool.query('SELECT COUNT(*) FROM orders'),
      pool.query(`SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE status != 'cancelled'`),
      pool.query(`SELECT o.*, u.name as user_name, u.email as user_email FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC LIMIT 5`)
    ]);
    res.json({ success: true, data: {
      totalUsers: parseInt(users.rows[0].count),
      totalProducts: parseInt(products.rows[0].count),
      totalOrders: parseInt(orders.rows[0].count),
      totalRevenue: parseFloat(revenue.rows[0].total),
      recentOrders: recentOrders.rows
    }});
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/dashboard/revenue', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT TO_CHAR(created_at, 'Mon YYYY') as month, TO_CHAR(created_at, 'YYYY-MM') as month_key,
             SUM(total) as revenue, COUNT(*) as orders
      FROM orders WHERE status != 'cancelled' AND created_at >= NOW() - INTERVAL '12 months'
      GROUP BY month_key, month ORDER BY month_key ASC`);
    res.json({ success: true, data: result.rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/dashboard/analytics', async (req, res) => {
  try {
    const [topProducts, userGrowth, orderStatus] = await Promise.all([
      pool.query(`SELECT p.name, p.price, COUNT(o.id) as order_count FROM products p
        LEFT JOIN orders o ON o.items::text LIKE '%' || p.id::text || '%'
        GROUP BY p.id ORDER BY order_count DESC LIMIT 5`),
      pool.query(`SELECT TO_CHAR(created_at, 'Mon') as month, TO_CHAR(created_at, 'YYYY-MM') as month_key,
        COUNT(*) as users FROM users WHERE created_at >= NOW() - INTERVAL '6 months'
        GROUP BY month_key, month ORDER BY month_key`),
      pool.query(`SELECT status, COUNT(*) as count FROM orders GROUP BY status`)
    ]);
    res.json({ success: true, data: { topProducts: topProducts.rows, userGrowth: userGrowth.rows, orderStatus: orderStatus.rows } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ─── PRODUCTS ────────────────────────────────────────────────
router.get('/products', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = search ? [`%${search}%`, parseInt(limit), offset] : [parseInt(limit), offset];
    const where = search ? 'WHERE p.name ILIKE $1' : '';
    const limitIdx = search ? '$2' : '$1'; const offsetIdx = search ? '$3' : '$2';
    const result = await pool.query(`SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id ${where} ORDER BY p.created_at DESC LIMIT ${limitIdx} OFFSET ${offsetIdx}`, params);
    const count = await pool.query(`SELECT COUNT(*) FROM products p ${where}`, search ? [`%${search}%`] : []);
    res.json({ success: true, data: result.rows, total: parseInt(count.rows[0].count), page: parseInt(page), totalPages: Math.ceil(parseInt(count.rows[0].count) / parseInt(limit)) });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/products', (req, res, next) => {
  uploadMultiple(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, error: err.message });
    processImage(req, res, next);
  });
}, async (req, res) => {
  try {
    const { name, description, specifications, price, discountPrice, categoryId, stock, sku, tags, isFeatured, isActive, gtin, brand, syncedToMeta, publishDate, discount_price, category_id, is_featured, is_active, synced_to_meta, publish_date } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();
    const images = req.files ? req.files.map(f => '/uploads/products/' + f.filename) : [];
    const specs = typeof specifications === 'string' ? JSON.parse(specifications || '{}') : (specifications || {});
    const tagsArr = typeof tags === 'string' ? JSON.parse(tags || '[]') : (tags || []);
    const result = await pool.query(
      `INSERT INTO products (name, slug, description, specifications, price, discount_price, category_id, images, stock, sku, tags, is_featured, is_active, gtin, brand, synced_to_meta, publish_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,
      [name, slug, description, JSON.stringify(specs), parseFloat(price),
       (discount_price || discountPrice) ? parseFloat(discount_price || discountPrice) : null,
       category_id || categoryId || null,
       JSON.stringify(images), parseInt(stock) || 0, sku || null,
       JSON.stringify(tagsArr),
       (is_featured || isFeatured) === 'true' || (is_featured || isFeatured) === true,
       (is_active || isActive) !== 'false' && (is_active || isActive) !== false,
       gtin || null, brand || null,
       (synced_to_meta || syncedToMeta) === 'true' || (synced_to_meta || syncedToMeta) === true,
       (publish_date || publishDate) || null
      ]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.put('/products/:id', (req, res, next) => {
  uploadMultiple(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, error: err.message });
    processImage(req, res, next);
  });
}, async (req, res) => {
  try {
    const { name, description, specifications, price, discountPrice, categoryId, stock, sku, tags, isFeatured, isActive, existingImages, gtin, brand, syncedToMeta, publishDate, discount_price, category_id, is_featured, is_active, synced_to_meta, publish_date } = req.body;
    const newImages = req.files ? req.files.map(f => '/uploads/products/' + f.filename) : [];
    let images = [];
    if (existingImages) { try { images = JSON.parse(existingImages); } catch(e) { images = []; } }
    images = [...images, ...newImages];
    const specs = typeof specifications === 'string' ? JSON.parse(specifications || '{}') : (specifications || {});
    const tagsArr = typeof tags === 'string' ? JSON.parse(tags || '[]') : (tags || []);
    const result = await pool.query(
      `UPDATE products SET name=COALESCE($1,name), description=COALESCE($2,description), specifications=$3, price=COALESCE($4,price),
       discount_price=$5, category_id=$6, images=$7, stock=COALESCE($8,stock), sku=COALESCE($9,sku), tags=$10,
       is_featured=$11, is_active=$12, gtin=$13, brand=$14, synced_to_meta=$15, publish_date=$16,
       updated_at=NOW() WHERE id=$17 RETURNING *`,
      [name, description, JSON.stringify(specs),
       price ? parseFloat(price) : null,
       (discount_price || discountPrice) ? parseFloat(discount_price || discountPrice) : null,
       category_id || categoryId || null,
       JSON.stringify(images), stock ? parseInt(stock) : null, sku, JSON.stringify(tagsArr),
       (is_featured || isFeatured) === 'true' || (is_featured || isFeatured) === true,
       (is_active || isActive) !== 'false' && (is_active || isActive) !== false,
       gtin || null, brand || null,
       (synced_to_meta || syncedToMeta) === 'true' || (synced_to_meta || syncedToMeta) === true,
       (publish_date || publishDate) || null,
       req.params.id
      ]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.delete('/products/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ─── ORDERS ────────────────────────────────────────────────
router.get('/orders', async (req, res) => {
  try {
    const { page = 1, limit = 20, status = '', search = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let conditions = []; const params = [];
    if (status) { conditions.push(`o.status = $${params.length + 1}`); params.push(status); }
    if (search) { conditions.push(`o.order_number ILIKE $${params.length + 1}`); params.push(`%${search}%`); }
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    params.push(parseInt(limit)); params.push(offset);
    const result = await pool.query(`SELECT o.*, u.name as user_name, u.email as user_email FROM orders o JOIN users u ON o.user_id = u.id ${where} ORDER BY o.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
    const count = await pool.query(`SELECT COUNT(*) FROM orders o ${where}`, params.slice(0, -2));
    res.json({ success: true, data: result.rows, total: parseInt(count.rows[0].count), page: parseInt(page), totalPages: Math.ceil(parseInt(count.rows[0].count) / parseInt(limit)) });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/orders/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT o.*, u.name as user_name, u.email as user_email, u.phone as user_phone FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Order not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.put('/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    await pool.query('UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2', [status, req.params.id]);
    res.json({ success: true, message: 'Order status updated' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.delete('/orders/:id', async (req, res) => {
  try {
    await pool.query("UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = $1", [req.params.id]);
    res.json({ success: true, message: 'Order cancelled' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ─── USERS ────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = search ? [`%${search}%`, parseInt(limit), offset] : [parseInt(limit), offset];
    const where = search ? "WHERE (name ILIKE $1 OR email ILIKE $1) AND role = 'user'" : "WHERE role = 'user'";
    const li = search ? '$2' : '$1'; const oi = search ? '$3' : '$2';
    const result = await pool.query(`SELECT id, name, email, phone, role, avatar, is_blocked, created_at FROM users ${where} ORDER BY created_at DESC LIMIT ${li} OFFSET ${oi}`, params);
    const count = await pool.query(`SELECT COUNT(*) FROM users ${where}`, search ? [`%${search}%`] : []);
    res.json({ success: true, data: result.rows, total: parseInt(count.rows[0].count), page: parseInt(page), totalPages: Math.ceil(parseInt(count.rows[0].count) / parseInt(limit)) });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.put('/users/:id/block', async (req, res) => {
  try {
    const user = await pool.query('SELECT is_blocked FROM users WHERE id = $1', [req.params.id]);
    if (!user.rows.length) return res.status(404).json({ success: false, error: 'User not found' });
    await pool.query('UPDATE users SET is_blocked = $1 WHERE id = $2', [!user.rows[0].is_blocked, req.params.id]);
    res.json({ success: true, message: user.rows[0].is_blocked ? 'User unblocked' : 'User blocked' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.delete('/users/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = $1 AND role != $2', [req.params.id, 'admin']);
    res.json({ success: true, message: 'User deleted' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ─── CATEGORIES ────────────────────────────────────────────────
router.get('/categories', async (req, res) => {
  try {
    const result = await pool.query(`SELECT c.*, COUNT(p.id)::int as product_count FROM categories c LEFT JOIN products p ON p.category_id = c.id GROUP BY c.id ORDER BY c.name`);
    res.json({ success: true, data: result.rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/categories', (req, res, next) => {
  uploadSingle(req, res, (err) => { if (err) return res.status(400).json({ success: false, error: err.message }); next(); });
}, async (req, res) => {
  try {
    const { name, description } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const image = req.file ? '/uploads/products/' + req.file.filename : null;
    const result = await pool.query('INSERT INTO categories (name, slug, image, description) VALUES ($1, $2, $3, $4) RETURNING *', [name, slug, image, description]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.put('/categories/:id', (req, res, next) => {
  uploadSingle(req, res, (err) => { if (err) return res.status(400).json({ success: false, error: err.message }); next(); });
}, async (req, res) => {
  try {
    const { name, description } = req.body;
    const image = req.file ? '/uploads/products/' + req.file.filename : undefined;
    const result = await pool.query(
      `UPDATE categories SET name=COALESCE($1,name), description=COALESCE($2,description) ${image ? ', image=$4' : ''} WHERE id=$3 RETURNING *`,
      image ? [name, description, req.params.id, image] : [name, description, req.params.id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.delete('/categories/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM categories WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ─── REVIEWS ────────────────────────────────────────────────
router.get('/reviews', async (req, res) => {
  try {
    const { page = 1, limit = 20, status = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = status ? `WHERE r.status = '${status}'` : '';
    const result = await pool.query(`SELECT r.*, u.name as user_name, p.name as product_name FROM reviews r JOIN users u ON r.user_id = u.id JOIN products p ON r.product_id = p.id ${where} ORDER BY r.created_at DESC LIMIT $1 OFFSET $2`, [parseInt(limit), offset]);
    const count = await pool.query(`SELECT COUNT(*) FROM reviews r ${where}`);
    res.json({ success: true, data: result.rows, total: parseInt(count.rows[0].count) });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.put('/reviews/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const review = await pool.query('UPDATE reviews SET status = $1 WHERE id = $2 RETURNING product_id', [status, req.params.id]);
    if (review.rows.length) {
      await pool.query(`UPDATE products SET rating = (SELECT COALESCE(AVG(rating),0) FROM reviews WHERE product_id = $1 AND status = 'approved'), review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = $1 AND status = 'approved') WHERE id = $1`, [review.rows[0].product_id]);
    }
    res.json({ success: true, message: 'Review status updated' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.delete('/reviews/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM reviews WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Review deleted' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ─── INVENTORY ────────────────────────────────────────────────
router.get('/inventory', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, sku, stock, price, is_active, (stock < 10) as low_stock FROM products ORDER BY stock ASC');
    res.json({ success: true, data: result.rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.put('/inventory/:id', async (req, res) => {
  try {
    const { stock } = req.body;
    await pool.query('UPDATE products SET stock = $1, updated_at = NOW() WHERE id = $2', [parseInt(stock), req.params.id]);
    res.json({ success: true, message: 'Stock updated' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ─── COUPONS ────────────────────────────────────────────────
router.get('/coupons', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM coupons ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/coupons', async (req, res) => {
  try {
    const { code, discountPercent, discountAmount, minOrder, maxUses, expiresAt } = req.body;
    const result = await pool.query(
      'INSERT INTO coupons (code, discount_percent, discount_amount, min_order, max_uses, expires_at) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [code.toUpperCase(), discountPercent || null, discountAmount || null, minOrder || 0, maxUses || null, expiresAt || null]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.put('/coupons/:id', async (req, res) => {
  try {
    const { isActive } = req.body;
    await pool.query('UPDATE coupons SET is_active = $1 WHERE id = $2', [isActive, req.params.id]);
    res.json({ success: true, message: 'Coupon updated' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.delete('/coupons/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM coupons WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ─── SETTINGS ────────────────────────────────────────────────
router.get('/settings', async (req, res) => {
  try {
    const rows = await pool.query('SELECT key, value FROM site_settings');
    const settings = {};
    rows.rows.forEach(r => { settings[r.key] = r.value; });
    res.json({ success: true, data: settings });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.put('/settings', async (req, res) => {
  try {
    const updates = req.body;
    for (const [key, value] of Object.entries(updates)) {
      await pool.query(
        `INSERT INTO site_settings (key, value, updated_at) VALUES ($1, $2, $3)
         ON CONFLICT(key) DO UPDATE SET value = $2, updated_at = $3`,
        [key, String(value), new Date().toISOString()]
      );
    }
    res.json({ success: true, message: 'Settings saved' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ─── 3D PRINT ORDERS (ADMIN) ─────────────────────────────────
router.get('/3dprint', async (req, res) => {
  try {
    const { page = 1, limit = 12, status = '', search = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = []; const params = [];
    if (status) { conditions.push(`po.status = $${params.length + 1}`); params.push(status); }
    if (search) { conditions.push(`(u.name ILIKE $${params.length + 1} OR u.email ILIKE $${params.length + 1} OR po.id::text ILIKE $${params.length + 1})`); params.push(`%${search}%`); }
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    params.push(parseInt(limit)); params.push(offset);
    const result = await pool.query(
      `SELECT po.*, u.name as user_name, u.email as user_email FROM print_orders po JOIN users u ON po.user_id = u.id ${where} ORDER BY po.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    const count = await pool.query(`SELECT COUNT(*) FROM print_orders po JOIN users u ON po.user_id = u.id ${where}`, params.slice(0, -2));
    res.json({ success: true, data: result.rows, total: parseInt(count.rows[0].count), page: parseInt(page) });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.put('/3dprint/:id', async (req, res) => {
  try {
    const { status, admin_note, price_estimate } = req.body;
    await pool.query(
      `UPDATE print_orders SET status=COALESCE($1,status), admin_note=$2, price_estimate=$3, updated_at=NOW() WHERE id=$4`,
      [status, admin_note || null, price_estimate ? parseFloat(price_estimate) : null, req.params.id]
    );
    res.json({ success: true, message: 'Print order updated' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.delete('/3dprint/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM print_orders WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Print order deleted' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

export default router;

