import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('../lib/prisma', async () => await import('../lib/__mocks__/prisma'))

import request from 'supertest'
import app from './app'
import { prisma } from '../lib/prisma'
import { makeToken, mockUser } from './helpers'

const prismaMock = prisma as any

// ─── Known-values fixture ────────────────────────────────────────────────────
// 1 employee (FRISEUR): grossSalary=2000, activeMonths=12, all bonuses=0
// No opening hours → defaults: 5 days/week, 8 hours/day
// vacationWeeks = 5 → weeksPerYear = 47, workDaysPerYear = 235
// totalMinutesPerYear = 235 * 8 * 60 = 112800
//
// totalPersonalkosten = (2000*12) * (1 + 0.2075) = 24000 * 1.2075 = 29,004
//
// costItems:
//   MIETE: 12 * 500 = 6000
//   UNTERNEHMERLOHN: 12 * 2000 = 24000
//   WARENEINSATZ: 0.12 (as fraction)
//
// totalGemeinkosten = 6000
// fixedCosts = 29004 + 6000 + 24000 = 59004
// mindestumsatzNet = 59004 / (1 - 0.12) = 59004 / 0.88 ≈ 67050
// bruttolohnsumme = 2000 * 12 = 24000
// lohnfaktor = 67050 / 24000 ≈ 2.79
//
// pkProMinute = 29004 / 112800 ≈ 0.2571
// gkProMinute = 6000  / 112800 ≈ 0.0532

const mockEmployee = {
  id: 'emp-1',
  name: 'Anna',
  role: 'FRISEUR',
  grossSalary: 2000,
  activeMonths: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  christmasBonus: 0,
  holidayBonus: 0,
  capitalFormation: 0,
  taxFreeBonus: 0,
}

const mockSalonWithData = {
  id: 'salon-1',
  userId: 'user-1',
  country: 'DE',
  vacationWeeks: 5,
  employees: [mockEmployee],
  openingHours: [], // → defaults: 5 days/week, 8h/day
  costItems: [
    { category: 'MIETE',          amounts: Array(12).fill(500) },
    { category: 'UNTERNEHMERLOHN', amounts: Array(12).fill(2000) },
    { category: 'WARENEINSATZ',   amounts: [0.12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  ],
  services: [],
}

describe('GET /api/salons/:id/calculation', () => {
  const token = makeToken('user-1')

  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.user.findUnique.mockResolvedValue(mockUser)
  })

  it('returns 401 without auth token', async () => {
    const res = await request(app).get('/api/salons/salon-1/calculation')
    expect(res.status).toBe(401)
  })

  it('returns 404 when salon not found', async () => {
    prismaMock.salon.findFirst.mockResolvedValue(null)
    const res = await request(app)
      .get('/api/salons/salon-1/calculation')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })

  it('returns correct calculation shape', async () => {
    prismaMock.salon.findFirst.mockResolvedValue(mockSalonWithData)
    const res = await request(app)
      .get('/api/salons/salon-1/calculation')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      country: 'DE',
      employerRate: 0.2075,
      vatRate: 0.19,
    })
  })

  it('calculates workDaysPerYear correctly with no opening hours (defaults)', async () => {
    prismaMock.salon.findFirst.mockResolvedValue(mockSalonWithData)
    const res = await request(app)
      .get('/api/salons/salon-1/calculation')
      .set('Authorization', `Bearer ${token}`)

    // 5 days * (52-5) weeks = 235
    expect(res.body.workDaysPerYear).toBe(235)
    expect(res.body.workHoursPerDay).toBe(8)
  })

  it('calculates workDaysPerYear from opening hours when provided', async () => {
    const salonWithHours = {
      ...mockSalonWithData,
      openingHours: [
        { weekday: 0, openHours: 8, variant: 1 },
        { weekday: 1, openHours: 8, variant: 1 },
        { weekday: 2, openHours: 8, variant: 1 },
        { weekday: 3, openHours: 8, variant: 1 },
        { weekday: 4, openHours: 8, variant: 1 },
        { weekday: 5, openHours: 0, variant: 1 }, // closed Saturday
      ],
    }
    prismaMock.salon.findFirst.mockResolvedValue(salonWithHours)
    const res = await request(app)
      .get('/api/salons/salon-1/calculation')
      .set('Authorization', `Bearer ${token}`)

    // 5 open days * 47 weeks = 235
    expect(res.body.workDaysPerYear).toBe(235)
  })

  it('calculates totalPersonalkosten correctly', async () => {
    prismaMock.salon.findFirst.mockResolvedValue(mockSalonWithData)
    const res = await request(app)
      .get('/api/salons/salon-1/calculation')
      .set('Authorization', `Bearer ${token}`)

    // grossSalary 2000 * 12 months * (1 + 0.2075) = 28980
    expect(res.body.totalPersonalkosten).toBe(28980)
  })

  it('calculates lohnfaktor with known inputs', async () => {
    prismaMock.salon.findFirst.mockResolvedValue(mockSalonWithData)
    const res = await request(app)
      .get('/api/salons/salon-1/calculation')
      .set('Authorization', `Bearer ${token}`)

    const { lohnfaktor, mindestumsatzNet, bruttolohnsumme } = res.body
    // lohnfaktor should be mindestumsatzNet / bruttolohnsumme, rounded to 2dp
    const expected = Math.round((mindestumsatzNet / bruttolohnsumme) * 100) / 100
    expect(lohnfaktor).toBe(expected)
    expect(bruttolohnsumme).toBe(24000)
  })

  it('calculates wareneinsatzRate as fraction when stored as fraction', async () => {
    prismaMock.salon.findFirst.mockResolvedValue(mockSalonWithData)
    const res = await request(app)
      .get('/api/salons/salon-1/calculation')
      .set('Authorization', `Bearer ${token}`)

    expect(res.body.wareneinsatzRate).toBe(0.12)
  })

  it('uses AT employer rate for Austrian salons', async () => {
    const atSalon = { ...mockSalonWithData, country: 'AT' }
    prismaMock.salon.findFirst.mockResolvedValue(atSalon)
    const res = await request(app)
      .get('/api/salons/salon-1/calculation')
      .set('Authorization', `Bearer ${token}`)

    expect(res.body.employerRate).toBe(0.304)
    expect(res.body.vatRate).toBe(0.20)
  })

  it('uses CH rates for Swiss salons', async () => {
    const chSalon = { ...mockSalonWithData, country: 'CH' }
    prismaMock.salon.findFirst.mockResolvedValue(chSalon)
    const res = await request(app)
      .get('/api/salons/salon-1/calculation')
      .set('Authorization', `Bearer ${token}`)

    expect(res.body.employerRate).toBe(0.125)
    expect(res.body.vatRate).toBe(0.077)
  })

  it('lohnfaktor is 0 when no productive employees', async () => {
    const salonNoProductiveEmps = {
      ...mockSalonWithData,
      employees: [{ ...mockEmployee, role: 'AZUBI' }],
    }
    prismaMock.salon.findFirst.mockResolvedValue(salonNoProductiveEmps)
    const res = await request(app)
      .get('/api/salons/salon-1/calculation')
      .set('Authorization', `Bearer ${token}`)

    expect(res.body.lohnfaktor).toBe(0)
    expect(res.body.bruttolohnsumme).toBe(0)
  })

  it('calculates service prices correctly', async () => {
    const salonWithService = {
      ...mockSalonWithData,
      services: [{
        id: 'svc-1',
        name: 'Haarschnitt',
        category: 'HERRENHAARSCHNITT',
        durationMinutes: 30,
        materialCost: 2,
        utilizationPct: 80,
        profitMarkup: 10,
      }],
    }
    prismaMock.salon.findFirst.mockResolvedValue(salonWithService)
    const res = await request(app)
      .get('/api/salons/salon-1/calculation')
      .set('Authorization', `Bearer ${token}`)

    expect(res.body.servicePrices).toHaveLength(1)
    const price = res.body.servicePrices[0]
    expect(price.selbstkosten).toBeGreaterThan(0)
    expect(price.nettopreis).toBeGreaterThan(price.selbstkosten)
    expect(price.bruttopreis).toBeGreaterThan(price.nettopreis)
    // bruttopreis should be nettopreis * 1.19 (DE VAT)
    expect(price.bruttopreis).toBeCloseTo(price.nettopreis * 1.19, 0)
  })

  it('CHEF employees count as productive for lohnfaktor', async () => {
    const salonWithChef = {
      ...mockSalonWithData,
      employees: [{ ...mockEmployee, role: 'CHEF' }],
    }
    prismaMock.salon.findFirst.mockResolvedValue(salonWithChef)
    const res = await request(app)
      .get('/api/salons/salon-1/calculation')
      .set('Authorization', `Bearer ${token}`)

    expect(res.body.bruttolohnsumme).toBe(24000)
    expect(res.body.lohnfaktor).toBeGreaterThan(0)
  })

  it('includes bonuses in totalPersonalkosten', async () => {
    const salonWithBonuses = {
      ...mockSalonWithData,
      employees: [{
        ...mockEmployee,
        christmasBonus: 1000,
        holidayBonus: 500,
        capitalFormation: 40,
        taxFreeBonus: 0,
      }],
    }
    prismaMock.salon.findFirst.mockResolvedValue(salonWithBonuses)
    const res = await request(app)
      .get('/api/salons/salon-1/calculation')
      .set('Authorization', `Bearer ${token}`)

    // base: 24000, bonuses: 1540, total before rate: 25540, * 1.2075 = 30839.85
    expect(res.body.totalPersonalkosten).toBeGreaterThan(29004)
  })
})
