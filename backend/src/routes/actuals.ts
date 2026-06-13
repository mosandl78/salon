import { Router, Response } from 'express'
import { authenticate } from '../middleware/auth'
import { prisma } from '../lib/prisma'

export const actualsRouter = Router()

async function getSalon(salonId: string, userId: string) {
  return prisma.salon.findFirst({ where: { id: salonId, userId } })
}

actualsRouter.get('/:salonId/actuals', authenticate, async (req: any, res: Response) => {
  const salon = await getSalon(req.params.salonId, req.user.id)
  if (!salon) return res.status(404).json({ error: 'Salon nicht gefunden' })

  const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear()
  const actuals = await prisma.actualRevenue.findMany({
    where: { salonId: salon.id, year },
    orderBy: [{ month: 'asc' }],
  })
  res.json(actuals)
})

actualsRouter.put('/:salonId/actuals', authenticate, async (req: any, res: Response) => {
  const salon = await getSalon(req.params.salonId, req.user.id)
  if (!salon) return res.status(404).json({ error: 'Salon nicht gefunden' })

  const { employeeId, month, year, actual } = req.body
  if (!employeeId || !month || !year) return res.status(400).json({ error: 'employeeId, month, year erforderlich' })

  const record = await prisma.actualRevenue.upsert({
    where: { employeeId_month_year: { employeeId, month: parseInt(month), year: parseInt(year) } },
    create: { salonId: salon.id, employeeId, month: parseInt(month), year: parseInt(year), actual: parseFloat(actual) || 0 },
    update: { actual: parseFloat(actual) || 0 },
  })
  res.json(record)
})
