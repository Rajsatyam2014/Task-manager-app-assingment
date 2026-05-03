import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';

const secret = process.env.JWT_SECRET || 'defaultsecret';

export interface AuthRequest extends Request {
  userId?: string;
  user?: { id: string; name: string; email: string; role: string };
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, secret) as { userId: string };
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid authentication token' });
    }
    req.userId = user.id;
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid authentication token' });
  }
}

export async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}

export async function requireProjectAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  const project = await prisma.project.findUnique({
    where: { id: req.params.id },
    include: { members: true },
  });
  if (!project) return res.status(404).json({ message: 'Project not found' });
  const isAdmin = project.ownerId === req.userId || project.members.some(m => m.userId === req.userId && m.role === 'ADMIN');
  if (!isAdmin) return res.status(403).json({ message: 'Project admin access required' });
  next();
}
