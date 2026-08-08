const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { auth } = require('../middleware/auth');

const isVercel = !!process.env.VERCEL;
const uploadsDir = isVercel ? '/tmp/uploads' : path.join(__dirname, '../../uploads');
try { if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true }); } catch {}

if (!isVercel) {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${uuidv4()}${ext}`);
    },
  });
  const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const allowed = /jpeg|jpg|png|gif|svg|webp/;
      const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
      const mimeOk = allowed.test(file.mimetype.split('/')[1]);
      cb(null, extOk && mimeOk);
    },
  });

  router.use(auth);
  router.post('/image', (req, res) => {
    upload.single('image')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'Rasm hajmi 5MB dan katta!' });
        }
        return res.status(400).json({ error: 'Rasm yuklashda xato: ' + err.message });
      }
      if (err) return res.status(400).json({ error: 'Rasm yuklashda xato' });
      if (!req.file) return res.status(400).json({ error: 'Rasm tanlanmadi' });
      res.json({ url: `/uploads/${req.file.filename}`, filename: req.file.filename });
    });
  });
} else {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const allowed = /jpeg|jpg|png|gif|svg|webp/;
      const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
      const mimeOk = allowed.test(file.mimetype.split('/')[1]);
      if (extOk && mimeOk) return cb(null, true);
      cb(new Error('Faqat rasm fayllari: JPEG, PNG, GIF, SVG, WebP'));
    },
  });

  router.use(auth);
  router.post('/image', (req, res) => {
    upload.single('image')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'Rasm hajmi 5MB dan katta!' });
        }
        return res.status(400).json({ error: 'Rasm yuklashda xato: ' + err.message });
      }
      if (err) return res.status(400).json({ error: 'Rasm yuklashda xato' });
      if (!req.file) return res.status(400).json({ error: 'Rasm tanlanmadi' });
      try {
        const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        res.json({ url: base64, filename: req.file.originalname, isBase64: true });
      } catch (catchErr) {
        res.status(500).json({ error: 'Rasm saqlashda xato' });
      }
    });
  });
}

module.exports = router;
