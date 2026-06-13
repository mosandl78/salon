import { Router, Response } from 'express'
import { authenticate } from '../middleware/auth'
import { requireAdmin } from '../middleware/admin'
import { prisma } from '../lib/prisma'

export const adminRouter = Router()

adminRouter.use(authenticate, requireAdmin)

// GET /api/admin/stats
adminRouter.get('/stats', async (_req, res: Response) => {
  const [
    totalUsers,
    totalSalons,
    totalEmployees,
    totalServices,
    activeUsers,
    planCounts,
    newUsersThisMonth,
    newSalonsThisMonth,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.salon.count(),
    prisma.employee.count(),
    prisma.service.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.groupBy({ by: ['plan'], _count: { plan: true } }),
    prisma.user.count({
      where: { createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
    }),
    prisma.salon.count({
      where: { createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
    }),
  ])

  res.json({
    totalUsers,
    totalSalons,
    totalEmployees,
    totalServices,
    activeUsers,
    planCounts: Object.fromEntries(planCounts.map((p: { plan: string; _count: { plan: number } }) => [p.plan, p._count.plan])),
    newUsersThisMonth,
    newSalonsThisMonth,
  })
})

// GET /api/admin/users
adminRouter.get('/users', async (req: any, res: Response) => {
  const { search, plan } = req.query
  const users = await prisma.user.findMany({
    where: {
      ...(search ? {
        OR: [
          { name:  { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
        ]
      } : {}),
      ...(plan ? { plan: plan as any } : {}),
    },
    include: {
      _count: { select: { salons: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  res.json(users.map((u: typeof users[0]) => ({
    id:           u.id,
    name:         u.name,
    email:        u.email,
    isAdmin:      u.isAdmin,
    isActive:     u.isActive,
    isDemo:       u.isDemo,
    plan:         u.plan,
    planExpiresAt: u.planExpiresAt,
    notes:        u.notes,
    createdAt:    u.createdAt,
    salonCount:   u._count.salons,
  })))
})

// PATCH /api/admin/users/:id
adminRouter.patch('/users/:id', async (req: any, res: Response) => {
  const { id } = req.params
  // Admin darf sich nicht selbst degradieren
  if (id === req.user.id && req.body.isAdmin === false) {
    return res.status(400).json({ error: 'Du kannst dich nicht selbst zum Nicht-Admin machen' })
  }

  const { isAdmin, isActive, isDemo, plan, planExpiresAt, notes } = req.body

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(isAdmin       !== undefined ? { isAdmin }       : {}),
      ...(isActive      !== undefined ? { isActive }      : {}),
      ...(isDemo        !== undefined ? { isDemo }        : {}),
      ...(plan          !== undefined ? { plan }          : {}),
      ...(planExpiresAt !== undefined ? { planExpiresAt: planExpiresAt ? new Date(planExpiresAt) : null } : {}),
      ...(notes         !== undefined ? { notes: notes || null } : {}),
    },
    select: { id: true, name: true, email: true, isAdmin: true, isActive: true, isDemo: true, plan: true, planExpiresAt: true, notes: true, createdAt: true },
  })
  res.json(user)
})

// DELETE /api/admin/users/:id
adminRouter.delete('/users/:id', async (req: any, res: Response) => {
  const { id } = req.params
  if (id === req.user.id) return res.status(400).json({ error: 'Du kannst dein eigenes Konto nicht löschen' })
  await prisma.user.delete({ where: { id } })
  res.status(204).end()
})
