import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase, pool } from './config/database.js';
import authRoutes    from './routes/auth.js';
import productRoutes from './routes/products.js';
import cartRoutes    from './routes/cart.js';
import wishlistRoutes from './routes/wishlist.js';
import orderRoutes   from './routes/orders.js';
import reviewRoutes  from './routes/reviews.js';
import categoryRoutes from './routes/categories.js';
import couponRoutes  from './routes/coupons.js';
import adminRoutes   from './routes/admin.js';
import projectRoutes from './routes/projects.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL, // set this on Render to your Vercel URL
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, curl, Render health checks)
    if (!origin) return cb(null, true);
    if (allowedOrigins.some(o => origin.startsWith(o)) || origin.endsWith('.vercel.app')) {
      return cb(null, true);
    }
    cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Routes ──────────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/products',   productRoutes);
app.use('/api/cart',       cartRoutes);
app.use('/api/wishlist',   wishlistRoutes);
app.use('/api/orders',     orderRoutes);
app.use('/api/reviews',    reviewRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/coupons',    couponRoutes);
app.use('/api/admin',      adminRoutes);
app.use('/api/projects',   projectRoutes);

// ─── Public: Footer settings (no auth) ───────────────────────
app.get('/api/settings/footer', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT key, value FROM site_settings');
    const settings = Object.fromEntries(rows.map(r => [r.key, r.value]));
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Health check ─────────────────────────────────────────────
app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', message: 'HalfRobo API is running 🚀' })
);

// ─── Global error handler ─────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: 'Internal server error',
    message: err.message,
  });
});

// ─── Start ────────────────────────────────────────────────────
async function start() {
  try {
    await initializeDatabase();
    console.log('✅ Database initialized');
    app.listen(PORT, () =>
      console.log(`🚀 HalfRobo API running on http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
