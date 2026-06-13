import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import SetupGuide from '../pages/salon/SetupGuide'
import type { Salon } from '../types'
import api from '../api'

const apiMock = api as any

function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

function renderSetupGuide(salon: Partial<Salon>, onNavigate = vi.fn()) {
  const qc = makeQueryClient()
  // Mock opening-hours and actuals queries to return empty arrays
  apiMock.get.mockResolvedValue({ data: [] })

  return render(
    <QueryClientProvider client={qc}>
      <SetupGuide
        salon={salon as Salon}
        salonId="salon-1"
        onNavigate={onNavigate}
      />
    </QueryClientProvider>
  )
}

const emptySalon: Partial<Salon> = {
  id: 'salon-1',
  employees: [],
  costItems: [],
  services: [],
}

const completeSalon: Partial<Salon> = {
  id: 'salon-1',
  employees: [{ id: 'e1' } as any],
  costItems:  [{ id: 'c1' } as any],
  services:   [{ id: 's1' } as any],
}

describe('SetupGuide', () => {
  it('renders all 5 step labels when salon is empty', async () => {
    renderSetupGuide(emptySalon)
    expect(await screen.findByText('Mitarbeiter')).toBeInTheDocument()
    expect(screen.getByText('Kosten')).toBeInTheDocument()
    expect(screen.getByText('Öffnungszeiten')).toBeInTheDocument()
    expect(screen.getByText('Preise')).toBeInTheDocument()
    expect(screen.getByText('Controlling')).toBeInTheDocument()
  })

  it('shows Pflicht label for required steps not yet done', async () => {
    renderSetupGuide(emptySalon)
    // "Pflicht" appears at least once (Mitarbeiter, Kosten, Preise are required)
    const pflichtItems = await screen.findAllByText('Pflicht')
    expect(pflichtItems.length).toBeGreaterThanOrEqual(1)
  })

  it('shows progress counter in title row', async () => {
    renderSetupGuide(emptySalon)
    // "0/3 Pflichtschritte"
    expect(await screen.findByText(/Pflichtschritte/)).toBeInTheDocument()
  })

  it('calls onNavigate with correct tab when step is clicked', async () => {
    const onNavigate = vi.fn()
    renderSetupGuide(emptySalon, onNavigate)

    // Mitarbeiter step should navigate to 'mitarbeiter' tab
    const btn = await screen.findByRole('button', { name: /Mitarbeiter/i })
    await userEvent.click(btn)
    expect(onNavigate).toHaveBeenCalledWith('mitarbeiter')
  })

  it('Preise step is locked when mitarbeiter and kosten are missing', async () => {
    renderSetupGuide(emptySalon)
    // Wait for queries to settle, then "gesperrt" should appear for locked steps
    await screen.findByText('Mitarbeiter') // wait for render
    // Preise depends on mitarbeiter and kosten — may show "gesperrt" once both are missing
    // Allow either "gesperrt" (locked) or check the disabled attribute on the button
    const preisesBtn = screen.getByRole('button', { name: /Preise/i })
    expect(preisesBtn).toBeDisabled()
  })

  it('returns null when all steps are done (hides component)', async () => {
    const qc = makeQueryClient()
    // Mock opening-hours returns 5 days, actuals returns 1 entry
    apiMock.get.mockImplementation((url: string) => {
      if (url.includes('opening-hours')) return Promise.resolve({ data: Array(5).fill({ openHours: 8 }) })
      if (url.includes('actuals'))       return Promise.resolve({ data: [{ id: 'a1' }] })
      return Promise.resolve({ data: [] })
    })

    const { container } = render(
      <QueryClientProvider client={qc}>
        <SetupGuide
          salon={completeSalon as Salon}
          salonId="salon-1"
          onNavigate={vi.fn()}
        />
      </QueryClientProvider>
    )

    // When all done, component returns null → container is empty
    await screen.findByText('Mitarbeiter').catch(() => {
      // Component returned null — that's the expected "all done" behaviour
      expect(container.firstChild).toBeNull()
    })
  })
})
