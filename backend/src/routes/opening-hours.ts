import { Router, Response } from 'express'
import { authenticate } from '../middleware/auth'
import { prisma } from '../lib/prisma'

export const openingHoursRouter = Router()

async function getSalon(salonId: string, userId: string) {
  return prisma.salon.findFirst({ where: { id: salonId, userId } })
}

// GET
openingHoursRouter.get('/:salonId/opening-hours', authenticate, async (req: any, res: Response) => {
  const salon = await getSalon(req.params.salonId, req.user.id)
  if (!salon) return res.status(404).json({ error: 'Nicht gefunden' })
  const hours = await prisma.openingHours.findMany({ where: { salonId: salon.id }, orderBy: [{ variant: 'asc' }, { weekday: 'asc' }] })
  res.json(hours)
})

// PUT — ersetzt alle Stunden für einen Salon (bulk save)
openingHoursRouter.put('/:salonId/opening-hours', authenticate, async (req: any, res: Response) => {
  const salon = await getSalon(req.params.salonId, req.user.id)
  if (!salon) return res.status(404).json({ error: 'Nicht gefunden' })

  // body: Array von { weekday, openHours, variant }
  const entries: { weekday: number; openHours: number; variant: number }[] = req.body
  if (!Array.isArray(entries)) return res.status(400).json({ error: 'Array erwartet' })

  await prisma.$transaction([
    prisma.openingHours.deleteMany({ where: { salonId: salon.id } }),
    prisma.openingHours.createMany({
      data: entries.map(e => ({
        salonId: salon.id,
        weekday: e.weekday,
        openHours: e.openHours,
        variant: e.variant ?? 1,
      })),
    }),
  ])

  const result = await prisma.openingHours.findMany({ where: { salonId: salon.id }, orderBy: [{ variant: 'asc' }, { weekday: 'asc' }] })
  res.json(result)
})
