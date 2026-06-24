import { Router, Response } from 'express'
import { authenticate } from '../middleware/auth'
import { prisma } from '../lib/prisma'

export const calculationRouter = Router()

const EMPLOYER_RATE: Record<string, number> = { DE: 0.2075, AT: 0.304, CH: 0.125 }
const VAT_RATE: Record<string, number>      = { DE: 0.19,   AT: 0.20,  CH: 0.077 }

calculationRouter.get('/:salonId/calculation', authenticate, async (req: any, res: Response) => {
  const salon = await prisma.salon.findFirst({
    where: { id: req.params.salonId, userId: req.user.id },
    include: { employees: true, openingHours: true, costItems: true, services: true },
  })
  if (!salon) return res.status(404).json({ error: 'Salon nicht gefunden' })

  const employerRate = EMPLOYER_RATE[salon.country] ?? 0.2075
  const vatRate      = VAT_RATE[salon.country]      ?? 0.19

  // ── Öffnungszeiten ──────────────────────────────────────────────────
  const hours = salon.openingHours.filter(h => h.variant === 1)
  const workDaysPerWeek  = hours.filter(h => h.openHours > 0).length || 5
  const workHoursPerDay  = hours.length > 0
    ? hours.reduce((s, h) => s + h.openHours, 0) / hours.filter(h => h.openHours > 0).length
    : 8
  const weeksPerYear     = 52 - salon.vacationWeeks
  const workDaysPerYear  = workDaysPerWeek * weeksPerYear

  // ── Personalkosten ──────────────────────────────────────────────────
  let totalPersonalkosten = 0
  for (const emp of salon.employees) {
    const activeSum     = emp.activeMonths.reduce((s, m) => s + m, 0)
    const annualGross   = emp.grossSalary * activeSum
    const bonuses       = emp.christmasBonus + emp.holidayBonus + emp.capitalFormation + emp.taxFreeBonus
    const annualTotal   = annualGross + bonuses
    totalPersonalkosten += annualTotal * (1 + employerRate)
  }

  // ── Gemeinkosten ────────────────────────────────────────────────────
  let totalGemeinkosten = 0
  let unternehmerlohn   = 0
  let wareneinsatzRate  = 0.12

  for (const item of salon.costItems) {
    const annual = item.amounts.reduce((s, v) => s + v, 0)
    if (item.category === 'UNTERNEHMERLOHN') {
      unternehmerlohn += annual
    } else if (item.category === 'WARENEINSATZ') {
      // WARENEINSATZ als Anteil vom Umsatz — Rate steht in amounts[0] (z.B. 0.12 = 12%)
      const raw = item.amounts[0] ?? 0
      wareneinsatzRate = raw > 0 && raw <= 1 ? raw : raw / 100
    } else {
      totalGemeinkosten += annual
    }
  }

  // ── Mindestumsatz ───────────────────────────────────────────────────
  const fixedCosts             = totalPersonalkosten + totalGemeinkosten + unternehmerlohn
  const mindestumsatzNet       = fixedCosts / (1 - wareneinsatzRate)

  // ── Lohnfaktor ──────────────────────────────────────────────────────
  const productiveEmployees    = salon.employees.filter(e => e.role === 'FRISEUR' || e.role === 'CHEF')
  const bruttolohnsumme        = productiveEmployees.reduce((s, e) => {
    return s + e.grossSalary * e.activeMonths.reduce((a, m) => a + m, 0)
  }, 0)
  const lohnfaktor             = bruttolohnsumme > 0 ? mindestumsatzNet / bruttolohnsumme : 0

  // ── Sollumsatz je MA ────────────────────────────────────────────────
  const sollUmsatzPerEmployee = productiveEmployees.map(emp => {
    const activeMonths     = emp.activeMonths.reduce((s, m) => s + m, 0)
    const sollMonat        = emp.grossSalary * lohnfaktor
    const arbeitstageMonat = workDaysPerYear / 12
    const sollTag          = sollMonat / arbeitstageMonat
    const sollStunde       = sollTag / workHoursPerDay
    return { id: emp.id, name: emp.name, sollMonat, sollTag, sollStunde, activeMonths }
  })

  // ── Kosten pro Minute ───────────────────────────────────────────────
  const totalMinutesPerYear = workDaysPerYear * workHoursPerDay * 60
  // Auf 8 Stellen runden — gleiche Präzision wie im Response, damit
  // Frontend-Schätzung und Backend-Berechnung identisch sind
  const pkProMinute = Math.round((totalPersonalkosten / totalMinutesPerYear) * 1e8) / 1e8
  const gkProMinute = Math.round((totalGemeinkosten   / totalMinutesPerYear) * 1e8) / 1e8

  // ── Preise je Dienstleistung ─────────────────────────────────────────
  const servicePrices = salon.services.map(svc => {
    const utilizationFactor = (svc.utilizationPct / 100) || 0.8
    const pkKosten   = pkProMinute * svc.durationMinutes
    const gkKosten   = (gkProMinute / utilizationFactor) * svc.durationMinutes
    const selbstkosten = svc.materialCost + pkKosten + gkKosten
    const nettopreis   = selbstkosten * (1 + svc.profitMarkup / 100)
    const bruttopreis  = nettopreis * (1 + vatRate)
    return {
      id: svc.id, name: svc.name, category: svc.category,
      selbstkosten: Math.round(selbstkosten * 100) / 100,
      nettopreis:   Math.round(nettopreis   * 100) / 100,
      bruttopreis:  Math.round(bruttopreis  * 100) / 100,
    }
  })

  res.json({
    country: salon.country,
    employerRate,
    vatRate,
    workDaysPerYear,
    workHoursPerDay,
    totalPersonalkosten:  Math.round(totalPersonalkosten),
    totalGemeinkosten:    Math.round(totalGemeinkosten),
    unternehmerlohn:      Math.round(unternehmerlohn),
    wareneinsatzRate,
    fixedCosts:           Math.round(fixedCosts),
    mindestumsatzNet:     Math.round(mindestumsatzNet),
    bruttolohnsumme:      Math.round(bruttolohnsumme),
    lohnfaktor:           Math.round(lohnfaktor * 100) / 100,
    pkProMinute:          Math.round(pkProMinute * 1e8) / 1e8,
    gkProMinute:          Math.round(gkProMinute * 1e8) / 1e8,
    sollUmsatzPerEmployee,
    servicePrices,
  })
})
