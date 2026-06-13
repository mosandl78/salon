import { Router, Response } from 'express'
import { authenticate } from '../middleware/auth'
import { prisma } from '../lib/prisma'

export const servicesRouter = Router()

async function getSalon(salonId: string, userId: string) {
  return prisma.salon.findFirst({ where: { id: salonId, userId } })
}

servicesRouter.post('/:salonId/services', authenticate, async (req: any, res: Response) => {
  const salon = await getSalon(req.params.salonId, req.user.id)
  if (!salon) return res.status(404).json({ error: 'Salon nicht gefunden' })

  const { category, name, durationMinutes, materialCost, utilizationPct, profitMarkup } = req.body
  if (!category || !name || !durationMinutes) return res.status(400).json({ error: 'Kategorie, Name und Dauer sind Pflichtfelder' })

  const service = await prisma.service.create({
    data: {
      salonId: salon.id, category, name,
      durationMinutes: parseFloat(durationMinutes),
      materialCost:    materialCost   ? parseFloat(materialCost)   : 0,
      utilizationPct:  utilizationPct ? parseFloat(utilizationPct) : 80,
      profitMarkup:    profitMarkup   ? parseFloat(profitMarkup)   : 10,
    },
  })
  res.status(201).json(service)
})

servicesRouter.patch('/:salonId/services/:id', authenticate, async (req: any, res: Response) => {
  const salon = await getSalon(req.params.salonId, req.user.id)
  if (!salon) return res.status(404).json({ error: 'Salon nicht gefunden' })

  const existing = await prisma.service.findFirst({ where: { id: req.params.id, salonId: salon.id } })
  if (!existing) return res.status(404).json({ error: 'Nicht gefunden' })

  const { category, name, durationMinutes, materialCost, utilizationPct, profitMarkup } = req.body
  const service = await prisma.service.update({
    where: { id: existing.id },
    data: {
      ...(category       ? { category }                              : {}),
      ...(name           ? { name }                                  : {}),
      ...(durationMinutes != null ? { durationMinutes: parseFloat(durationMinutes) } : {}),
      ...(materialCost   != null ? { materialCost:   parseFloat(materialCost) }   : {}),
      ...(utilizationPct != null ? { utilizationPct: parseFloat(utilizationPct) } : {}),
      ...(profitMarkup   != null ? { profitMarkup:   parseFloat(profitMarkup) }   : {}),
    },
  })
  res.json(service)
})

servicesRouter.delete('/:salonId/services/:id', authenticate, async (req: any, res: Response) => {
  const salon = await getSalon(req.params.salonId, req.user.id)
  if (!salon) return res.status(404).json({ error: 'Salon nicht gefunden' })

  const existing = await prisma.service.findFirst({ where: { id: req.params.id, salonId: salon.id } })
  if (!existing) return res.status(404).json({ error: 'Nicht gefunden' })

  await prisma.service.delete({ where: { id: existing.id } })
  res.status(204).end()
})
