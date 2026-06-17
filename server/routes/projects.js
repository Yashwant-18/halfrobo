import express from 'express';
import { pool } from '../config/database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { uploadMultiple, processImage } from '../middleware/upload.js';

const router = express.Router();

// ── Ensure projects table exists ────────────────────────────────
const initProjects = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      tech_stack JSONB DEFAULT '[]',
      images JSONB DEFAULT '[]',
      github_url TEXT,
      live_url TEXT,
      code_download_url TEXT,
      category VARCHAR(100),
      is_featured BOOLEAN DEFAULT false,
      is_active BOOLEAN DEFAULT true,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    -- add images column if table already existed with old schema
    ALTER TABLE projects ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]';
  `);
};
initProjects().catch(console.error);

// ── GET /api/projects — Public: all active projects ─────────────
router.get('/', async (req, res) => {
  try {
    const { category, featured } = req.query;
    let query = `SELECT * FROM projects WHERE is_active = true`;
    const params = [];

    if (category) {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }
    if (featured === 'true') {
      query += ` AND is_featured = true`;
    }

    query += ` ORDER BY is_featured DESC, sort_order ASC, created_at DESC`;

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/projects/:id — Public: single project ──────────────
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM projects WHERE id = $1 AND is_active = true`,
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ success: false, error: 'Project not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/projects — Admin: create project ──────────────────
router.post('/', authenticateToken, requireAdmin, uploadMultiple, processImage, async (req, res) => {
  try {
    const { name, description, tech_stack, github_url, live_url, code_download_url, category, is_featured, sort_order } = req.body;

    // Collect uploaded image paths (max 6)
    const imagePaths = (req.files || [])
      .slice(0, 6)
      .map(f => `/uploads/products/${f.filename}`);

    const techArr = typeof tech_stack === 'string'
      ? tech_stack.split(',').map(t => t.trim()).filter(Boolean)
      : (tech_stack || []);

    const result = await pool.query(
      `INSERT INTO projects (name, description, tech_stack, images, github_url, live_url, code_download_url, category, is_featured, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [name, description, JSON.stringify(techArr), JSON.stringify(imagePaths),
       github_url, live_url, code_download_url,
       category, is_featured === 'true', parseInt(sort_order) || 0]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PUT /api/projects/:id — Admin: update project ───────────────
router.put('/:id', authenticateToken, requireAdmin, uploadMultiple, processImage, async (req, res) => {
  try {
    const { name, description, tech_stack, github_url, live_url, category,
            is_featured, is_active, sort_order, code_download_url, keep_images } = req.body;

    const techArr = typeof tech_stack === 'string'
      ? tech_stack.split(',').map(t => t.trim()).filter(Boolean)
      : (tech_stack || []);

    // Merge kept existing images + new uploads (max 6 total)
    let existingImages = [];
    try { existingImages = JSON.parse(keep_images || '[]'); } catch {}
    const newImages = (req.files || []).map(f => `/uploads/products/${f.filename}`);
    const allImages = [...existingImages, ...newImages].slice(0, 6);

    const result = await pool.query(
      `UPDATE projects SET
        name=$1, description=$2, tech_stack=$3, images=$4, github_url=$5, live_url=$6,
        category=$7, is_featured=$8, is_active=$9, sort_order=$10, code_download_url=$11,
        updated_at=CURRENT_TIMESTAMP
       WHERE id=$12 RETURNING *`,
      [name, description, JSON.stringify(techArr), JSON.stringify(allImages),
       github_url, live_url, category,
       is_featured === 'true' || is_featured === true,
       is_active !== 'false' && is_active !== false,
       parseInt(sort_order) || 0, code_download_url, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── DELETE /api/projects/:id — Admin: delete project ───────────
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await pool.query(`DELETE FROM projects WHERE id = $1`, [req.params.id]);
    res.json({ success: true, message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
