import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

// ─── Multer for 3D model files ─────────────────────────────────
const uploadDir = path.join(__dirname, '..', 'uploads', '3dmodels');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, uuidv4() + ext);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.stl', '.obj', '.3mf', '.step', '.iges', '.stp', '.igs'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error('Unsupported file type. Use STL, OBJ, 3MF, STEP, or IGES'));
};

const upload3D = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

// ─── POST /api/3dprint — Submit a print order (auth required) ──
router.post('/', authenticateToken, (req, res, next) => {
  upload3D.single('model')(req, res, err => {
    if (err) return res.status(400).json({ success: false, error: err.message });
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'Model file is required' });

    const {
      material = 'PLA',
      color = 'White',
      quality = 'Standard (0.2mm)',
      infill = '20%',
      quantity = 1,
      supports = false,
      special_instructions = '',
      phone = '',
    } = req.body;

    const fileUrl = '/uploads/3dmodels/' + req.file.filename;

    const result = await pool.query(
      `INSERT INTO print_orders
        (user_id, file_name, file_url, file_size, material, color, quality, infill, quantity, supports, special_instructions, phone, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'pending') RETURNING *`,
      [
        req.user.id,
        req.file.originalname,
        fileUrl,
        req.file.size,
        material,
        color,
        quality,
        infill,
        parseInt(quantity) || 1,
        supports === 'true' || supports === true,
        special_instructions,
        phone,
      ]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/3dprint/my-orders — User's own orders ───────────
router.get('/my-orders', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM print_orders WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
