import { Request, Response, NextFunction } from 'express';

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated && req.isAuthenticated() && req.user) {
    return next();
  }
  return res.status(401).json({ message: 'Bạn cần đăng nhập để thực hiện hành động này' });
}

export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated && req.isAuthenticated() && req.user && (req.user as any).isAdmin) {
    return next();
  }
  return res.status(403).json({ message: 'Bạn không có quyền thực hiện hành động này' });
}