import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Ensure upload directories exist
const uploadDir = path.join(__dirname, '..', 'uploads', 'products');
const categoryDir = path.join(__dirname, '..', 'uploads', 'categories');
fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(categoryDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = req.uploadDir || uploadDir;
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|gif/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext && mime) cb(null, true);
  else cb(new Error('Only image files are allowed!'));
};

export const uploadSingle = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } }).single('image');
export const uploadMultiple = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } }).array('images', 10);

// Process image - just returns the file path as-is (sharp optional)
export function processImage(req, res, next) {
  try {
    if (req.file) {
      req.file.processedPath = '/uploads/products/' + req.file.filename;
    }
    if (req.files && req.files.length > 0) {
      req.files.forEach(f => { f.processedPath = '/uploads/products/' + f.filename; });
    }
    next();
  } catch (err) {
    next(err);
  }
}
