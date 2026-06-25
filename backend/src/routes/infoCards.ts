import { Router, Response } from 'express'
import { authenticate } from '../middleware/auth'
import { prisma } from '../lib/prisma'

export const infoCardsRouter = Router()

// ─── System Card Seed ─────────────────────────────────────────────────────────

const SYSTEM_CARDS = [
  // Mitarbeiter
  {
    page: 'mitarbeiter',
    computedKey: 'neuer_ma',
    title: 'Weiterer Mitarbeiter (Ø-Gehalt)',
    body: 'Bei Ø {avgGross} € Brutto/Monat — Mindestumsatz steigt entsprechend.',
    sortOrder: 0,
  },
  {
    page: 'mitarbeiter',
    computedKey: 'lohnerhoehung_10',
    title: '10 % Lohnerhöhung für alle',
    body: 'Wirkung auf Personalkosten inkl. AG-Anteil. Preise müssten entsprechend angepasst werden.',
    sortOrder: 1,
  },
  {
    page: 'mitarbeiter',
    computedKey: 'krankenquote_5',
    title: '5 % Krankenquote (Produktivkräfte)',
    body: 'Produktive Stunden fallen weg — der Mindestumsatz muss trotzdem erwirtschaftet werden.',
    sortOrder: 2,
  },
  // Kosten
  {
    page: 'kosten',
    computedKey: 'kostensteigerung_3',
    title: '3 % Kostensteigerung',
    body: 'Erhöht den Mindestumsatz entsprechend. Preise sollten regelmäßig angepasst werden.',
    sortOrder: 0,
  },
  {
    page: 'kosten',
    computedKey: 'raumkosten_anteil',
    title: 'Anteil Raumkosten',
    body: 'Branchenüblich sind 10–15 % der Gesamtkosten.',
    sortOrder: 1,
  },
  {
    page: 'kosten',
    computedKey: 'fixkosten_euro',
    title: '1 € Fixkosten braucht…',
    body: 'Musst du entsprechend mehr einnehmen um 1 € Fixkosten zu decken.',
    sortOrder: 2,
  },
]

export async function seedSystemInfoCards() {
  for (const card of SYSTEM_CARDS) {
    const existing = await prisma.infoCard.findFirst({ where: { computedKey: card.computedKey } })
    if (!existing) {
      await prisma.infoCard.create({ data: card })
      console.log(`[InfoCards] System card created: ${card.computedKey}`)
    }
  }
}

// ─── Routes ───────────────────────────────────────────────────────────────────

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

// Admin: Karte löschen (Systemkarten können nicht gelöscht werden)
infoCardsRouter.delete('/:id', authenticate, async (req: any, res: Response) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Nur für Admins' })
  const card = await prisma.infoCard.findUnique({ where: { id: req.params.id } })
  if (!card) return res.status(404).json({ error: 'Karte nicht gefunden' })
  if (card.computedKey) return res.status(403).json({ error: 'Systemkarten können nicht gelöscht werden' })
  await prisma.infoCard.delete({ where: { id: req.params.id } })
  res.status(204).end()
})
