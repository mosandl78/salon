import { Router, Response } from 'express'
import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export const demoRouter = Router()

const DEMO_EMAIL = 'demo@salon-app.de'
const DEMO_NAME  = 'Demo Salon — Haarsalon Müller'

// GET /api/demo — gibt Demo-Salon-Daten zurück (kein Auth nötig)
demoRouter.get('/', async (_req, res: Response) => {
  let demoUser = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } })

  if (!demoUser) {
    // Demo-User + Salon einmalig anlegen
    demoUser = await prisma.user.create({
      data: {
        email:        DEMO_EMAIL,
        passwordHash: await bcrypt.hash('demo-readonly', 10),
        name:         'Demo',
        isActive:     true,
        plan:         'PRO',
      },
    })
    await seedDemoSalon(demoUser.id)
  }

  // Demo-Salon laden
  const salon = await prisma.salon.findFirst({
    where: { userId: demoUser.id },
    include: { employees: true, openingHours: true, costItems: true, services: true },
  })

  if (!salon) return res.status(404).json({ error: 'Demo-Daten nicht gefunden' })

  // Demo-Token — isDemo:true im Payload → requireNotDemo blockiert alle Mutations
  const token = jwt.sign(
    { userId: demoUser.id, isDemo: true },
    process.env.JWT_SECRET!,
    { expiresIn: '2h' },
  )

  res.json({ salon, token })
})

async function seedDemoSalon(userId: string) {
  const salon = await prisma.salon.create({
    data: {
      userId,
      name:          'Haarsalon Müller',
      country:       'DE',
      businessType:  'SOLO',
      planStart:     new Date('2026-01-01'),
      planEnd:       new Date('2026-12-31'),
      fullTimeHours: 38,
      vacationWeeks: 4,
    },
  })

  // Öffnungszeiten
  await prisma.openingHours.createMany({
    data: [
      { salonId: salon.id, weekday: 0, openHours: 8.5, variant: 1 },
      { salonId: salon.id, weekday: 1, openHours: 8.5, variant: 1 },
      { salonId: salon.id, weekday: 2, openHours: 8.5, variant: 1 },
      { salonId: salon.id, weekday: 3, openHours: 9,   variant: 1 },
      { salonId: salon.id, weekday: 4, openHours: 9,   variant: 1 },
      { salonId: salon.id, weekday: 5, openHours: 7,   variant: 1 },
    ],
  })

  // Mitarbeiter einzeln anlegen um IDs für Actuals zu haben
  const anja = await prisma.employee.create({ data: {
    salonId: salon.id, name: 'Anja Müller', role: 'CHEF',
    grossSalary: 2800, weeklyHours: 38,
    activeMonths: [1,1,1,1,1,1,1,1,1,1,1,1],
    christmasBonus: 1400, holidayBonus: 500, capitalFormation: 40, taxFreeBonus: 0,
    vacationDays: 28, sickDays: 5, trainingDays: 2,
  }})
  const sarah = await prisma.employee.create({ data: {
    salonId: salon.id, name: 'Sarah Klein', role: 'FRISEUR',
    grossSalary: 2200, weeklyHours: 38,
    activeMonths: [1,1,1,1,1,1,1,1,1,1,1,1],
    christmasBonus: 800, holidayBonus: 400, capitalFormation: 40, taxFreeBonus: 0,
    vacationDays: 25, sickDays: 8, trainingDays: 0,
  }})
  const lena = await prisma.employee.create({ data: {
    salonId: salon.id, name: 'Lena Schmidt', role: 'FRISEUR',
    grossSalary: 2000, weeklyHours: 30,
    activeMonths: [1,1,1,1,1,1,1,1,1,1,1,1],
    christmasBonus: 600, holidayBonus: 300, capitalFormation: 0, taxFreeBonus: 0,
    vacationDays: 20, sickDays: 0, trainingDays: 0,
  }})
  await prisma.employee.create({ data: {
    salonId: salon.id, name: 'Max Brauer', role: 'AZUBI',
    grossSalary: 650, weeklyHours: 38,
    activeMonths: [1,1,1,1,1,1,1,1,1,1,1,1],
    christmasBonus: 0, holidayBonus: 0, capitalFormation: 0, taxFreeBonus: 0,
    vacationDays: 25, sickDays: 0, trainingDays: 5,
  }})

  // Kosten
  await prisma.costItem.createMany({
    data: [
      { salonId: salon.id, category: 'MIETE',          label: 'Ladenmiete',          amounts: Array(12).fill(1800) },
      { salonId: salon.id, category: 'NEBENKOSTEN',    label: 'Nebenkosten',          amounts: Array(12).fill(220) },
      { salonId: salon.id, category: 'STROM',          label: 'Strom',                amounts: Array(12).fill(180) },
      { salonId: salon.id, category: 'TELEFON',        label: 'Telefon & Internet',   amounts: Array(12).fill(60) },
      { salonId: salon.id, category: 'VERSICHERUNG',   label: 'Betriebsversicherung', amounts: Array(12).fill(120) },
      { salonId: salon.id, category: 'STEUERBERATUNG', label: 'Steuerberater',        amounts: [0,0,0,300,0,0,0,0,0,300,0,0] },
      { salonId: salon.id, category: 'BANKGEBUEHREN',  label: 'Kontoführung',         amounts: Array(12).fill(15) },
      { salonId: salon.id, category: 'WERBUNG',        label: 'Online-Marketing',     amounts: Array(12).fill(150) },
      { salonId: salon.id, category: 'WEITERBILDUNG',  label: 'Seminare & Kurse',     amounts: [0,0,200,0,0,200,0,0,200,0,0,0] },
      { salonId: salon.id, category: 'REPARATUREN',    label: 'Instandhaltung',       amounts: Array(12).fill(80) },
      { salonId: salon.id, category: 'LEASING',        label: 'Geräte-Leasing',       amounts: Array(12).fill(250) },
      { salonId: salon.id, category: 'WARENEINSATZ',   label: 'Wareneinsatz',         amounts: Array(12).fill(0.12) },
      { salonId: salon.id, category: 'UNTERNEHMERLOHN',label: 'Unternehmerlohn Anja', amounts: Array(12).fill(2500) },
    ],
  })

  // Dienstleistungen
  await prisma.service.createMany({
    data: [
      { salonId: salon.id, category: 'WASCHEN_SCHNEIDEN_FOENEN', name: 'Damen — Waschen, Schneiden, Fönen', durationMinutes: 60, materialCost: 3.50, utilizationPct: 80, profitMarkup: 10 },
      { salonId: salon.id, category: 'HERRENHAARSCHNITT',        name: 'Herrenhaarschnitt',                  durationMinutes: 30, materialCost: 1.50, utilizationPct: 85, profitMarkup: 10 },
      { salonId: salon.id, category: 'FARBE',                    name: 'Ansatzfarbe',                        durationMinutes: 90, materialCost: 12,   utilizationPct: 75, profitMarkup: 15 },
      { salonId: salon.id, category: 'FARBE',                    name: 'Vollfarbe',                          durationMinutes: 120, materialCost: 18,  utilizationPct: 70, profitMarkup: 15 },
      { salonId: salon.id, category: 'STRAEHNEN',                name: 'Strähnen (Folie)',                   durationMinutes: 150, materialCost: 20,  utilizationPct: 65, profitMarkup: 15 },
      { salonId: salon.id, category: 'BALAYAGE',                 name: 'Balayage',                           durationMinutes: 180, materialCost: 25,  utilizationPct: 60, profitMarkup: 20 },
      { salonId: salon.id, category: 'CUSTOM',                   name: 'Kinder-Haarschnitt (bis 12 J.)',    durationMinutes: 25,  materialCost: 1,   utilizationPct: 90, profitMarkup: 5  },
      { salonId: salon.id, category: 'CUSTOM',                   name: 'Pflegebehandlung Olaplex',           durationMinutes: 45,  materialCost: 8,   utilizationPct: 70, profitMarkup: 20 },
    ],
  })

  // IST-Umsätze für Controlling (realistisch, leichte Schwankungen um Soll)
  const year = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1 // nur vergangene Monate befüllen

  type ActualData = { salonId: string; employeeId: string; year: number; month: number; actual: number }
  const actuals: ActualData[] = []

  // Anja: Soll ~2800 * Lohnfaktor ≈ 7000–8000 €/Monat, leicht schwankend
  const anjaMonthly = [7200, 6800, 7400, 7100, 7600, 7300, 5800, 7500, 7200, 7800, 7100, 8200]
  // Sarah: Soll ~2200 * Lohnfaktor ≈ 5500–6500 €/Monat
  const sarahMonthly = [5600, 5200, 5800, 5500, 6100, 5900, 4600, 6000, 5700, 6200, 5500, 6400]
  // Lena (Teilzeit): Soll ~2000 * Lohnfaktor ≈ 4500–5500 €/Monat
  const lenaMonthly = [4800, 4500, 4900, 4700, 5100, 4900, 3900, 5000, 4800, 5200, 4600, 5300]

  for (let m = 1; m <= Math.min(currentMonth - 1, 12); m++) {
    actuals.push({ salonId: salon.id, employeeId: anja.id,  year, month: m, actual: anjaMonthly[m-1]  })
    actuals.push({ salonId: salon.id, employeeId: sarah.id, year, month: m, actual: sarahMonthly[m-1] })
    actuals.push({ salonId: salon.id, employeeId: lena.id,  year, month: m, actual: lenaMonthly[m-1]  })
  }

  if (actuals.length > 0) {
    await prisma.actualRevenue.createMany({ data: actuals })
  }

  return salon
}

// GET /api/demo/calculation — Berechnung für Demo-Salon (kein Auth)
demoRouter.get('/calculation', async (_req, res: Response) => {
  const demoUser = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } })
  if (!demoUser) return res.status(404).json({ error: 'Demo nicht initialisiert' })

  const salon = await prisma.salon.findFirst({
    where: { userId: demoUser.id },
    include: { employees: true, openingHours: true, costItems: true, services: true },
  })
  if (!salon) return res.status(404).json({ error: 'Demo-Salon nicht gefunden' })

  // Dieselbe Berechnungslogik wie /calculation
  const EMPLOYER_RATE: Record<string, number> = { DE: 0.2075, AT: 0.304, CH: 0.125 }
  const VAT_RATE: Record<string, number>      = { DE: 0.19,   AT: 0.20,  CH: 0.077 }
  const employerRate = EMPLOYER_RATE[salon.country] ?? 0.2075
  const vatRate      = VAT_RATE[salon.country]      ?? 0.19

  const hours = salon.openingHours.filter((h: any) => h.variant === 1)
  const workDaysPerWeek  = hours.filter((h: any) => h.openHours > 0).length || 5
  const workHoursPerDay  = hours.length > 0
    ? hours.reduce((s: number, h: any) => s + h.openHours, 0) / hours.filter((h: any) => h.openHours > 0).length
    : 8
  const weeksPerYear     = 52 - salon.vacationWeeks
  const workDaysPerYear  = workDaysPerWeek * weeksPerYear

  let totalPersonalkosten = 0
  for (const emp of salon.employees) {
    const activeSum   = emp.activeMonths.reduce((s: number, m: number) => s + m, 0)
    const annualGross = emp.grossSalary * activeSum
    const bonuses     = emp.christmasBonus + emp.holidayBonus + emp.capitalFormation + emp.taxFreeBonus
    totalPersonalkosten += (annualGross + bonuses) * (1 + employerRate)
  }

  let totalGemeinkosten = 0, unternehmerlohn = 0, wareneinsatzRate = 0.12
  for (const item of salon.costItems) {
    const annual = item.amounts.reduce((s: number, v: number) => s + v, 0)
    if (item.category === 'UNTERNEHMERLOHN')  unternehmerlohn   += annual
    else if (item.category === 'WARENEINSATZ') wareneinsatzRate  = annual > 0 && annual <= 1 ? annual : annual / 100
    else                                       totalGemeinkosten += annual
  }

  const fixedCosts         = totalPersonalkosten + totalGemeinkosten + unternehmerlohn
  const mindestumsatzNet   = fixedCosts / (1 - wareneinsatzRate)
  const productiveEmps     = salon.employees.filter((e: any) => e.role === 'FRISEUR' || e.role === 'CHEF')
  const bruttolohnsumme    = productiveEmps.reduce((s: number, e: any) =>
    s + e.grossSalary * e.activeMonths.reduce((a: number, m: number) => a + m, 0), 0)
  const lohnfaktor         = bruttolohnsumme > 0 ? mindestumsatzNet / bruttolohnsumme : 0
  const totalMinutes       = workDaysPerYear * workHoursPerDay * 60
  const pkProMinute        = totalPersonalkosten / totalMinutes
  const gkProMinute        = totalGemeinkosten   / totalMinutes

  const sollUmsatzPerEmployee = productiveEmps.map((emp: any) => {
    const sollMonat = emp.grossSalary * lohnfaktor
    const sollTag   = sollMonat / (workDaysPerYear / 12)
    return { id: emp.id, name: emp.name, sollMonat, sollTag, sollStunde: sollTag / workHoursPerDay, activeMonths: emp.activeMonths.reduce((a: number, m: number) => a + m, 0) }
  })

  const servicePrices = salon.services.map((svc: any) => {
    const eff         = (svc.utilizationPct / 100) || 0.8
    const selbstkosten = svc.materialCost + (pkProMinute + gkProMinute / eff) * svc.durationMinutes
    const nettopreis  = selbstkosten * (1 + svc.profitMarkup / 100)
    const bruttopreis = nettopreis * (1 + vatRate)
    return { id: svc.id, name: svc.name, category: svc.category,
      selbstkosten: Math.round(selbstkosten * 100) / 100,
      nettopreis:   Math.round(nettopreis   * 100) / 100,
      bruttopreis:  Math.round(bruttopreis  * 100) / 100 }
  })

  res.json({
    country: salon.country, employerRate, vatRate,
    workDaysPerYear, workHoursPerDay,
    totalPersonalkosten: Math.round(totalPersonalkosten),
    totalGemeinkosten:   Math.round(totalGemeinkosten),
    unternehmerlohn:     Math.round(unternehmerlohn),
    wareneinsatzRate, fixedCosts: Math.round(fixedCosts),
    mindestumsatzNet:    Math.round(mindestumsatzNet),
    bruttolohnsumme:     Math.round(bruttolohnsumme),
    lohnfaktor:          Math.round(lohnfaktor * 100) / 100,
    pkProMinute:         Math.round(pkProMinute * 10000) / 10000,
    gkProMinute:         Math.round(gkProMinute * 10000) / 10000,
    sollUmsatzPerEmployee, servicePrices,
  })
})
