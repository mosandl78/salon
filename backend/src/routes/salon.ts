import { Router, Response } from 'express'
import { authenticate } from '../middleware/auth'
import { prisma } from '../lib/prisma'

export const salonRouter = Router()

salonRouter.get('/', authenticate, async (req: any, res: Response) => {
  const salons = await prisma.salon.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
  })
  res.json(salons)
})

salonRouter.post('/', authenticate, async (req: any, res: Response) => {
  const { name, country, businessType, planStart, planEnd, fullTimeHours, vacationWeeks } = req.body
  if (!name || !planStart || !planEnd) return res.status(400).json({ error: 'Name und Planungszeitraum sind Pflichtfelder' })

  const salon = await prisma.salon.create({
    data: {
      userId: req.user.id,
      name,
      country: country ?? 'DE',
      businessType: businessType ?? 'SOLO',
      planStart: new Date(planStart),
      planEnd: new Date(planEnd),
      fullTimeHours: fullTimeHours ? parseFloat(fullTimeHours) : 38,
      vacationWeeks: vacationWeeks ? parseInt(vacationWeeks) : 5,
    },
  })
  res.status(201).json(salon)
})

salonRouter.get('/:id', authenticate, async (req: any, res: Response) => {
  const salon = await prisma.salon.findFirst({
    where: { id: req.params.id, userId: req.user.id },
    include: { employees: true, openingHours: true, costItems: true, services: true },
  })
  if (!salon) return res.status(404).json({ error: 'Nicht gefunden' })
  res.json(salon)
})

salonRouter.patch('/:id', authenticate, async (req: any, res: Response) => {
  const existing = await prisma.salon.findFirst({ where: { id: req.params.id, userId: req.user.id } })
  if (!existing) return res.status(404).json({ error: 'Nicht gefunden' })

  const { name, country, businessType, planStart, planEnd, fullTimeHours, vacationWeeks } = req.body
  const salon = await prisma.salon.update({
    where: { id: existing.id },
    data: {
      ...(name ? { name } : {}),
      ...(country ? { country } : {}),
      ...(businessType ? { businessType } : {}),
      ...(planStart ? { planStart: new Date(planStart) } : {}),
      ...(planEnd ? { planEnd: new Date(planEnd) } : {}),
      ...(fullTimeHours != null ? { fullTimeHours: parseFloat(fullTimeHours) } : {}),
      ...(vacationWeeks != null ? { vacationWeeks: parseInt(vacationWeeks) } : {}),
    },
  })
  res.json(salon)
})

salonRouter.post('/:id/duplicate', authenticate, async (req: any, res: Response) => {
  const source = await prisma.salon.findFirst({
    where: { id: req.params.id, userId: req.user.id },
    include: { employees: true, openingHours: true, costItems: true, services: true },
  })
  if (!source) return res.status(404).json({ error: 'Nicht gefunden' })

  const { name, planStart, planEnd } = req.body
  if (!planStart || !planEnd) return res.status(400).json({ error: 'Planungszeitraum ist Pflichtfeld' })

  const newSalon = await prisma.salon.create({
    data: {
      userId: req.user.id,
      name: name ?? `${source.name} (Kopie)`,
      country: source.country,
      businessType: source.businessType,
      planStart: new Date(planStart),
      planEnd: new Date(planEnd),
      fullTimeHours: source.fullTimeHours,
      vacationWeeks: source.vacationWeeks,
      employees: {
        create: source.employees.map(e => ({
          name: e.name, role: e.role, grossSalary: e.grossSalary,
          weeklyHours: e.weeklyHours, activeMonths: e.activeMonths,
          christmasBonus: e.christmasBonus, holidayBonus: e.holidayBonus,
          capitalFormation: e.capitalFormation, taxFreeBonus: e.taxFreeBonus,
        })),
      },
      openingHours: {
        create: source.openingHours.map(h => ({
          weekday: h.weekday, openHours: h.openHours, variant: h.variant,
        })),
      },
      costItems: {
        create: source.costItems.map(c => ({
          category: c.category, label: c.label, amounts: c.amounts,
        })),
      },
      services: {
        create: source.services.map(s => ({
          name: s.name, category: s.category, durationMinutes: s.durationMinutes,
          materialCost: s.materialCost, utilizationPct: s.utilizationPct, profitMarkup: s.profitMarkup,
        })),
      },
    },
  })
  res.status(201).json(newSalon)
})

salonRouter.delete('/:id', authenticate, async (req: any, res: Response) => {
  const existing = await prisma.salon.findFirst({ where: { id: req.params.id, userId: req.user.id } })
  if (!existing) return res.status(404).json({ error: 'Nicht gefunden' })
  await prisma.salon.delete({ where: { id: existing.id } })
  res.status(204).end()
})
