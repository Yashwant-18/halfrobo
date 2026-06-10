import jwt from 'jsonwebtoken';
import { pool } from '../config/database.js';

export async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, error: 'Access token required' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await pool.query('SELECT id, name, email, role, avatar, is_blocked FROM users WHERE id = $1', [decoded.userId]);
    if (!result.rows.length) return res.status(401).json({ success: false, error: 'User not found' });
    if (result.rows[0].is_blocked) return res.status(403).json({ success: false, error: 'Account is blocked' });
    req.user = result.rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  next();
}
