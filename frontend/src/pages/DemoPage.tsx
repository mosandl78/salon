import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Scissors, ArrowLeft, Play } from 'lucide-react'
import api from '../api'
import type { Salon } from '../types'
import UebersichtTab    from './salon/UebersichtTab'
import SetupGuide       from './salon/SetupGuide'
import MitarbeiterTab   from './salon/MitarbeiterTab'
import KostenTab        from './salon/KostenTab'
import LohnfaktorTab    from './salon/LohnfaktorTab'
import PreiseTab        from './salon/PreiseTab'
import ControllingTab   from './salon/ControllingTab'
import BwaTab           from './salon/BwaTab'
import LiquiditaetTab   from './salon/LiquiditaetTab'
import SimulatorTab     from './salon/SimulatorTab'

const TABS = [
  { id: 'uebersicht',  label: 'Übersicht' },
  { id: 'mitarbeiter', label: 'Mitarbeiter' },
  { id: 'kosten',      label: 'Kosten' },
  { id: 'lohnfaktor',  label: 'Lohnfaktor' },
  { id: 'preise',      label: 'Preise' },
  { id: 'controlling', label: 'Controlling' },
  { id: 'bwa',         label: 'BWA' },
  { id: 'liquiditaet', label: 'Liquidität' },
  { id: 'simulator',   label: 'Simulator' },
]

export default function DemoPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('uebersicht')
  const prevToken = useRef<string | null>(null)

  const { data, isLoading, error } = useQuery<{ salon: Salon; token: string }>({
    queryKey: ['demo'],
    queryFn: () => api.get('/demo').then(r => r.data),
  })

  // Swap in the demo token for API calls, restore on unmount
  useEffect(() => {
    if (!data?.token) return
    prevToken.current = api.defaults.headers.common['Authorization'] as string ?? null
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
    return () => {
      if (prevToken.current) {
        api.defaults.headers.common['Authorization'] = prevToken.current
      } else {
        delete api.defaults.headers.common['Authorization']
      }
    }
  }, [data?.token])

  const salon = data?.salon

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Scissors className="w-6 h-6 text-gray-300 mx-auto mb-3 animate-pulse" />
        <p className="text-sm text-gray-400">Demo wird geladen…</p>
      </div>
    </div>
  )

  if (error || !salon) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-sm text-red-500">Demo konnte nicht geladen werden.</p>
    </div>
  )

  const salonId = salon.id

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo-Banner */}
      <div className="bg-gray-900 text-white px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Play className="w-3.5 h-3.5 text-green-400" />
          <span className="text-gray-300">Demo-Ansicht</span>
          <span className="text-gray-500">·</span>
          <span className="text-gray-300">{salon.name} — alle Daten sind Beispieldaten</span>
        </div>
        <button onClick={() => navigate('/register')}
          className="bg-white text-gray-900 text-xs font-semibold px-4 py-1.5 rounded-lg hover:bg-gray-100">
          Jetzt kaufen →
        </button>
      </div>

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate('/start')} className="text-gray-400 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Scissors className="w-4 h-4 text-gray-400" />
          <div>
            <h1 className="text-base font-bold text-gray-900 leading-tight">{salon.name}</h1>
            <p className="text-xs text-gray-400">{salon.country} · {salon.businessType} · Demo</p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6">
          <nav className="flex gap-0 overflow-x-auto">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  tab === t.id
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}>
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {tab === 'uebersicht' && (
          <SetupGuide salon={salon} salonId={salonId} onNavigate={setTab} />
        )}
        {tab === 'uebersicht'  && <UebersichtTab  salonId={salonId} salon={salon} />}
        {tab === 'mitarbeiter' && <MitarbeiterTab salonId={salonId} salon={salon} readOnly />}
        {tab === 'kosten'      && <KostenTab      salonId={salonId} salon={salon} readOnly />}
        {tab === 'lohnfaktor'  && <LohnfaktorTab  salonId={salonId} salon={salon} />}
        {tab === 'preise'      && <PreiseTab      salonId={salonId} salon={salon} readOnly />}
        {tab === 'controlling' && <ControllingTab salonId={salonId} salon={salon} readOnly />}
        {tab === 'bwa'         && <BwaTab         salonId={salonId} salon={salon} />}
        {tab === 'liquiditaet' && <LiquiditaetTab salonId={salonId} salon={salon} />}
        {tab === 'simulator'   && <SimulatorTab   salonId={salonId} salon={salon} />}
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-4 text-sm">
          <span className="text-gray-300">Gefällt dir was du siehst?</span>
          <button onClick={() => navigate('/register')}
            className="bg-white text-gray-900 font-semibold px-4 py-1.5 rounded-lg hover:bg-gray-100 whitespace-nowrap">
            Jetzt kaufen — 129 € / Jahr →
          </button>
        </div>
      </div>
    </div>
  )
}
