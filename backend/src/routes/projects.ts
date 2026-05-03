import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../prisma';
import { authenticate, requireProjectAdmin, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: req.userId },
          { members: { some: { userId: req.userId } } },
        ],
      },
      include: { owner: true, members: { include: { user: true } }, tasks: true },
    });
    res.json(projects);
  } catch (error) {
    next(error);
  }
});

router.post(
  '/',
  requireAdmin,
  body('name').isLength({ min: 3 }),
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description } = req.body;
      const project = await prisma.project.create({
        data: {
          name,
          description,
          ownerId: req.userId!,
          members: {
            create: [{ userId: req.userId!, role: 'ADMIN' }],
          },
        },
        include: { owner: true, members: { include: { user: true } }, tasks: true },
      });
      res.status(201).json(project);
    } catch (error) {
      next(error);
    }
  }
);

router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: { owner: true, members: { include: { user: true } }, tasks: true },
    });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const isMember = project.ownerId === req.userId || project.members.some((m) => m.userId === req.userId);
    if (!isMember) return res.status(403).json({ message: 'Access denied' });
    res.json(project);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireProjectAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { name, description } = req.body;
    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: { name, description },
    });
    res.json(project);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireProjectAdmin, async (req: AuthRequest, res, next) => {
  try {
    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ message: 'Project deleted' });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/members', requireProjectAdmin, body('email').isEmail(), async (req: AuthRequest, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, role } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const member = await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: req.params.id, userId: user.id } },
      update: { role: role === 'ADMIN' ? 'ADMIN' : 'MEMBER' },
      create: { projectId: req.params.id, userId: user.id, role: role === 'ADMIN' ? 'ADMIN' : 'MEMBER' },
    });

    res.json(member);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id/members/:memberId', requireProjectAdmin, async (req: AuthRequest, res, next) => {
  try {
    await prisma.projectMember.delete({ where: { id: req.params.memberId } });
    res.json({ message: 'Member removed' });
  } catch (error) {
    next(error);
  }
});

export default router;
