import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getQuery } from '../database';
import { User } from '../types';

const JWT_SECRET = 'concert-review-secret-key-2026';

export interface AuthRequest extends Request {
  user?: User;
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  jwt.verify(token, JWT_SECRET, async (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: '无效的认证令牌' });
    }

    const user = await getQuery<User>('SELECT id, username, email, avatar, role, created_at FROM users WHERE id = ?', [decoded.userId]);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    req.user = user;
    next();
  });
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  next();
}

export function generateToken(userId: number) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}
