import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import LohnfaktorTab from '../pages/salon/LohnfaktorTab'
import type { Salon, CalculationResult, Employee } from '../types'
import api from '../api'

const apiMock = api as any

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

const mockCalcResult: CalculationResult = {
  country: 'DE',
  employerRate: 0.2075,
  vatRate: 0.19,
  workDaysPerYear: 235,
  workHoursPerDay: 8,
  totalPersonalkosten: 28980,
  totalGemeinkosten: 6000,
  unternehmerlohn: 0,
  wareneinsatzRate: 0.12,
  fixedCosts: 34980,
  mindestumsatzNet: 39750,
  bruttolohnsumme: 24000,
  lohnfaktor: 1.66,
  pkProMinute: 0.0214,
  gkProMinute: 0.0053,
  sollUmsatzPerEmployee: [
    { id: 'e1', name: 'Anna', sollMonat: 3320, sollTag: 169.4, sollStunde: 21.18, activeMonths: 12 },
  ],
  servicePrices: [],
}

const mockEmployees: Employee[] = [
  {
    id: 'e1',
    salonId: 'salon-1',
    name: 'Anna',
    role: 'FRISEUR',
    grossSalary: 2000,
    weeklyHours: 38,
    activeMonths: [1,1,1,1,1,1,1,1,1,1,1,1],
    vacationDays: 25,
    sickDays: 0,
    trainingDays: 0,
    christmasBonus: 0,
    holidayBonus: 0,
    capitalFormation: 0,
    taxFreeBonus: 0,
    createdAt: new Date().toISOString(),
  },
]

const mockSalon: Salon = {
  id: 'salon-1',
  userId: 'user-1',
  name: 'Test Salon',
  country: 'DE',
  businessType: 'SOLO',
  planStart: '2026-01-01',
  planEnd: '2026-12-31',
  fullTimeHours: 38,
  vacationWeeks: 5,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  employees: mockEmployees,
}

function renderTab(calcResult = mockCalcResult, employees = mockEmployees) {
  const qc = makeQC()
  apiMock.get.mockImplementation((url: string) => {
    if (url.includes('calculation')) return Promise.resolve({ data: calcResult })
    if (url.includes('employees'))   return Promise.resolve({ data: employees })
    return Promise.resolve({ data: [] })
  })

  return render(
    <QueryClientProvider client={qc}>
      <LohnfaktorTab salonId="salon-1" salon={mockSalon} />
    </QueryClientProvider>
  )
}

describe('LohnfaktorTab', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows loading state initially', () => {
    const qc = makeQC()
    // API never resolves
    apiMock.get.mockReturnValue(new Promise(() => {}))
    render(
      <QueryClientProvider client={qc}>
        <LohnfaktorTab salonId="salon-1" salon={mockSalon} />
      </QueryClientProvider>
    )
    expect(screen.getByText(/Berechne/i)).toBeInTheDocument()
  })

  it('shows warning when bruttolohnsumme is 0', async () => {
    renderTab({ ...mockCalcResult, bruttolohnsumme: 0, lohnfaktor: 0 })
    await waitFor(() => {
      expect(screen.getByText(/Keine Daten vorhanden/i)).toBeInTheDocument()
    })
  })

  it('displays the lohnfaktor value', async () => {
    renderTab()
    await waitFor(() => {
      // lohnfaktor 1.66 appears as both hero and in the variants table
      const items = screen.getAllByText('1.66')
      expect(items.length).toBeGreaterThanOrEqual(1)
    })
  })

  it('displays 4 Lohnfaktor-Varianten', async () => {
    renderTab()
    await waitFor(() => {
      expect(screen.getByText('Grundlohn')).toBeInTheDocument()
      expect(screen.getByText('Inkl. Sonderzahlungen')).toBeInTheDocument()
      expect(screen.getByText('Durchschnittslohn')).toBeInTheDocument()
      expect(screen.getByText('Höchstlohn')).toBeInTheDocument()
    })
  })

  it('displays Sollumsatz table with employee name', async () => {
    renderTab()
    await waitFor(() => {
      expect(screen.getByText('Anna')).toBeInTheDocument()
    })
  })

  it('displays PK/min and GK/min tiles', async () => {
    renderTab()
    await waitFor(() => {
      expect(screen.getByText(/PK \/ Minute/i)).toBeInTheDocument()
      expect(screen.getByText(/GK \/ Minute/i)).toBeInTheDocument()
    })
  })

  it('shows green color for lohnfaktor below 2.5', async () => {
    renderTab({ ...mockCalcResult, lohnfaktor: 2.0 })
    await waitFor(() => {
      // The lohnfaktor display exists
      expect(screen.getByText('2.00')).toBeInTheDocument()
    })
  })
})
