import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        OR: [
          { assigneeId: req.userId },
          { project: { members: { some: { userId: req.userId } } } },
        ],
      },
      include: { project: true, assignee: true },
      orderBy: { dueDate: 'asc' },
    });
    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

router.post(
  '/',
  requireAdmin,
  body('title').isLength({ min: 3 }),
  body('projectId').isString(),
  body('status').optional().isIn(['TO_DO', 'IN_PROGRESS', 'COMPLETED']),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH']),
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { title, description, status, priority, dueDate, projectId, assigneeId } = req.body;
      const member = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: req.userId! } },
      });
      if (!member) return res.status(403).json({ message: 'Project access required' });

      const task = await prisma.task.create({
        data: {
          title,
          description,
          status: status || 'TO_DO',
          priority: priority || 'MEDIUM',
          dueDate: dueDate ? new Date(dueDate) : undefined,
          projectId,
          assigneeId,
        },
      });
      res.status(201).json(task);
    } catch (error) {
      next(error);
    }
  }
);

router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { title, description, status, priority, dueDate, assigneeId } = req.body;
    const task = await prisma.task.findUnique({ where: { id: req.params.id }, include: { project: { include: { members: true } } } });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const canEdit = req.user?.role === 'ADMIN' || task.assigneeId === req.userId || task.project.ownerId === req.userId || task.project.members.some((member) => member.userId === req.userId && member.role === 'ADMIN');
    if (!canEdit) return res.status(403).json({ message: 'Permission denied' });

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        title,
        description,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        assigneeId,
      },
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id }, include: { project: { include: { members: true } } } });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const canDelete = task.project.ownerId === req.userId || task.project.members.some((member) => member.userId === req.userId && member.role === 'ADMIN');
    if (!canDelete) return res.status(403).json({ message: 'Permission denied' });

    await prisma.task.delete({ where: { id: req.params.id } });
    res.json({ message: 'Task deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
