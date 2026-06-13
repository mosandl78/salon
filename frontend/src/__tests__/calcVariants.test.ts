import { describe, it, expect } from 'vitest'
import type { Employee } from '../types'

// Re-implement the pure function from LohnfaktorTab for isolated testing.
// This mirrors the exact logic in frontend/src/pages/salon/LohnfaktorTab.tsx.
interface LFVariant {
  label: string
  desc: string
  lohnfaktor: number
  bruttolohnsumme: number
}

function calcVariants(employees: Employee[], mindestumsatz: number, employerRate: number): LFVariant[] {
  const productive = employees.filter(e => e.role === 'FRISEUR' || e.role === 'CHEF')
  if (productive.length === 0) return []

  const activeSum = (emp: Employee) => emp.activeMonths.reduce((s, m) => s + m, 0)

  const grundlohn    = productive.reduce((s, e) => s + e.grossSalary * activeSum(e), 0)
  const mitBoni      = productive.reduce((s, e) =>
    s + e.grossSalary * activeSum(e) + e.christmasBonus + e.holidayBonus + e.capitalFormation + e.taxFreeBonus, 0)
  const avgSalary    = productive.reduce((s, e) => s + e.grossSalary, 0) / productive.length
  const durchschnitt = avgSalary * 12 * productive.length
  const maxSalary    = Math.max(...productive.map(e => e.grossSalary))
  const hoechstlohn  = maxSalary * 12 * productive.length

  return [
    { label: 'Grundlohn',             desc: 'Nur Bruttogehalt',                 lohnfaktor: grundlohn    > 0 ? mindestumsatz / grundlohn    : 0, bruttolohnsumme: grundlohn },
    { label: 'Inkl. Sonderzahlungen', desc: 'Brutto + Weihnachts-/Urlaubsgeld', lohnfaktor: mitBoni      > 0 ? mindestumsatz / mitBoni      : 0, bruttolohnsumme: mitBoni },
    { label: 'Durchschnittslohn',     desc: 'Ø Gehalt aller produktiven MA',    lohnfaktor: durchschnitt > 0 ? mindestumsatz / durchschnitt : 0, bruttolohnsumme: durchschnitt },
    { label: 'Höchstlohn',            desc: 'Höchstes Gehalt als Basis',        lohnfaktor: hoechstlohn  > 0 ? mindestumsatz / hoechstlohn  : 0, bruttolohnsumme: hoechstlohn },
  ]
}

const makeEmployee = (overrides: Partial<Employee> = {}): Employee => ({
  id: 'emp-1',
  salonId: 'salon-1',
  name: 'Anna',
  role: 'FRISEUR',
  grossSalary: 2000,
  weeklyHours: 38,
  activeMonths: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  vacationDays: 25,
  sickDays: 0,
  trainingDays: 0,
  christmasBonus: 0,
  holidayBonus: 0,
  capitalFormation: 0,
  taxFreeBonus: 0,
  createdAt: new Date().toISOString(),
  ...overrides,
})

describe('calcVariants()', () => {
  it('returns empty array when no productive employees', () => {
    const azubi = makeEmployee({ role: 'AZUBI' })
    const result = calcVariants([azubi], 60000, 0.2075)
    expect(result).toHaveLength(0)
  })

  it('returns 4 variants for productive employees', () => {
    const emp = makeEmployee()
    const result = calcVariants([emp], 60000, 0.2075)
    expect(result).toHaveLength(4)
  })

  it('Grundlohn variant uses grossSalary * activeMonths', () => {
    const emp = makeEmployee({ grossSalary: 2000 })
    const result = calcVariants([emp], 60000, 0.2075)
    // bruttolohnsumme = 2000 * 12 = 24000
    expect(result[0].bruttolohnsumme).toBe(24000)
  })

  it('Inkl. Sonderzahlungen includes all bonuses', () => {
    const emp = makeEmployee({
      grossSalary: 2000,
      christmasBonus: 1000,
      holidayBonus: 500,
      capitalFormation: 40,
      taxFreeBonus: 100,
    })
    const result = calcVariants([emp], 60000, 0.2075)
    // grundlohn = 24000, bonuses = 1640 → total = 25640
    expect(result[1].bruttolohnsumme).toBe(25640)
  })

  it('lohnfaktor is mindestumsatz / bruttolohnsumme', () => {
    const emp = makeEmployee({ grossSalary: 2000 })
    const result = calcVariants([emp], 60000, 0.2075)
    // Grundlohn: 60000 / 24000 = 2.5
    expect(result[0].lohnfaktor).toBeCloseTo(2.5)
  })

  it('Durchschnittslohn uses average of all productive employees * 12', () => {
    const emp1 = makeEmployee({ id: 'e1', grossSalary: 2000 })
    const emp2 = makeEmployee({ id: 'e2', grossSalary: 3000 })
    const result = calcVariants([emp1, emp2], 60000, 0.2075)
    // avg = 2500, durchschnitt = 2500 * 12 * 2 = 60000
    expect(result[2].bruttolohnsumme).toBe(60000)
  })

  it('Höchstlohn uses highest salary * 12 * count', () => {
    const emp1 = makeEmployee({ id: 'e1', grossSalary: 2000 })
    const emp2 = makeEmployee({ id: 'e2', grossSalary: 3000 })
    const result = calcVariants([emp1, emp2], 60000, 0.2075)
    // max = 3000, hoechstlohn = 3000 * 12 * 2 = 72000
    expect(result[3].bruttolohnsumme).toBe(72000)
  })

  it('lohnfaktor is 0 when bruttolohnsumme is 0 (all inactive)', () => {
    const emp = makeEmployee({ activeMonths: Array(12).fill(0) })
    const result = calcVariants([emp], 60000, 0.2075)
    expect(result[0].lohnfaktor).toBe(0)
  })

  it('CHEF employees are counted as productive', () => {
    const chef = makeEmployee({ role: 'CHEF', grossSalary: 3000 })
    const result = calcVariants([chef], 90000, 0.2075)
    expect(result).toHaveLength(4)
    expect(result[0].bruttolohnsumme).toBe(36000)
  })

  it('partial active months reduce bruttolohnsumme', () => {
    const emp = makeEmployee({
      grossSalary: 2000,
      activeMonths: [1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0], // only 6 months
    })
    const result = calcVariants([emp], 60000, 0.2075)
    expect(result[0].bruttolohnsumme).toBe(12000)
  })
})
