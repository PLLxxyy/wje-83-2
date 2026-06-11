import express from 'express';
import { upload } from '../middleware/upload';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.post('/image', authenticateToken, upload.array('images', 9), (req, res) => {
  try {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return res.status(400).json({ error: '没有上传文件' });
    }

    const files = (req.files as Express.Multer.File[]).map(file => ({
      url: `/uploads/${file.filename}`,
      filename: file.filename,
      originalname: file.originalname,
      size: file.size
    }));

    res.json({ files });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/video', authenticateToken, upload.array('videos', 3), (req, res) => {
  try {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return res.status(400).json({ error: '没有上传文件' });
    }

    const files = (req.files as Express.Multer.File[]).map(file => ({
      url: `/uploads/${file.filename}`,
      filename: file.filename,
      originalname: file.originalname,
      size: file.size
    }));

    res.json({ files });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
