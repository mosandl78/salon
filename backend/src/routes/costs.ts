import { Router, Response } from 'express'
import { authenticate } from '../middleware/auth'
import { prisma } from '../lib/prisma'

export const costsRouter = Router()

async function getSalon(salonId: string, userId: string) {
  return prisma.salon.findFirst({ where: { id: salonId, userId } })
}

costsRouter.get('/:salonId/costs', authenticate, async (req: any, res: Response) => {
  const salon = await getSalon(req.params.salonId, req.user.id)
  if (!salon) return res.status(404).json({ error: 'Salon nicht gefunden' })

  const costs = await prisma.costItem.findMany({
    where: { salonId: salon.id },
    orderBy: { category: 'asc' },
  })
  res.json(costs)
})

costsRouter.post('/:salonId/costs', authenticate, async (req: any, res: Response) => {
  const salon = await getSalon(req.params.salonId, req.user.id)
  if (!salon) return res.status(404).json({ error: 'Salon nicht gefunden' })

  const { category, label, amounts } = req.body
  if (!category || !label) return res.status(400).json({ error: 'Kategorie und Bezeichnung sind Pflichtfelder' })

  const cost = await prisma.costItem.create({
    data: {
      salonId: salon.id,
      category,
      label,
      amounts: amounts ?? Array(12).fill(0),
    },
  })
  res.status(201).json(cost)
})

costsRouter.patch('/:salonId/costs/:id', authenticate, async (req: any, res: Response) => {
  const salon = await getSalon(req.params.salonId, req.user.id)
  if (!salon) return res.status(404).json({ error: 'Salon nicht gefunden' })

  const existing = await prisma.costItem.findFirst({ where: { id: req.params.id, salonId: salon.id } })
  if (!existing) return res.status(404).json({ error: 'Nicht gefunden' })

  const { category, label, amounts } = req.body
  const cost = await prisma.costItem.update({
    where: { id: existing.id },
    data: {
      ...(category ? { category } : {}),
      ...(label ? { label } : {}),
      ...(amounts ? { amounts } : {}),
    },
  })
  res.json(cost)
})

costsRouter.delete('/:salonId/costs/:id', authenticate, async (req: any, res: Response) => {
  const salon = await getSalon(req.params.salonId, req.user.id)
  if (!salon) return res.status(404).json({ error: 'Salon nicht gefunden' })

  const existing = await prisma.costItem.findFirst({ where: { id: req.params.id, salonId: salon.id } })
  if (!existing) return res.status(404).json({ error: 'Nicht gefunden' })

  await prisma.costItem.delete({ where: { id: existing.id } })
  res.status(204).end()
})
