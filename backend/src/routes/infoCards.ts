import { Router, Response } from 'express'
import { authenticate } from '../middleware/auth'
import { prisma } from '../lib/prisma'

export const infoCardsRouter = Router()

// Public: alle Karten einer Seite abrufen
infoCardsRouter.get('/', authenticate, async (req: any, res: Response) => {
  const { page } = req.query
  const cards = await prisma.infoCard.findMany({
    where: page ? { page: String(page) } : undefined,
    orderBy: [{ page: 'asc' }, { sortOrder: 'asc' }],
  })
  res.json(cards)
})

// Admin: neue Karte anlegen
infoCardsRouter.post('/', authenticate, async (req: any, res: Response) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Nur für Admins' })
  const { page, title, body, sortOrder } = req.body
  if (!page || !title || !body) return res.status(400).json({ error: 'page, title und body sind Pflicht' })
  const card = await prisma.infoCard.create({
    data: { page, title, body, sortOrder: sortOrder ?? 0 },
  })
  res.status(201).json(card)
})

// Admin: Karte bearbeiten
infoCardsRouter.patch('/:id', authenticate, async (req: any, res: Response) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Nur für Admins' })
  const { title, body, sortOrder, page } = req.body
  const card = await prisma.infoCard.update({
    where: { id: req.params.id },
    data: {
      ...(title     != null ? { title }                        : {}),
      ...(body      != null ? { body }                         : {}),
      ...(page      != null ? { page }                         : {}),
      ...(sortOrder != null ? { sortOrder: Number(sortOrder) } : {}),
    },
  })
  res.json(card)
})

// Admin: Karte löschen
infoCardsRouter.delete('/:id', authenticate, async (req: any, res: Response) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Nur für Admins' })
  await prisma.infoCard.delete({ where: { id: req.params.id } })
  res.status(204).end()
})
