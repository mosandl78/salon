import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Scissors } from 'lucide-react'
import api from '../api'
import type { Salon } from '../types'
import UebersichtTab    from './salon/UebersichtTab'
import MitarbeiterTab   from './salon/MitarbeiterTab'
import KostenTab        from './salon/KostenTab'
import LohnfaktorTab    from './salon/LohnfaktorTab'
import PreiseTab        from './salon/PreiseTab'
import ControllingTab   from './salon/ControllingTab'
import EinstellungenTab from './salon/EinstellungenTab'
import SimulatorTab     from './salon/SimulatorTab'
import LiquiditaetTab   from './salon/LiquiditaetTab'
import BwaTab           from './salon/BwaTab'
import SetupGuide       from './salon/SetupGuide'

const TABS = [
  { id: 'uebersicht',    label: 'Übersicht' },
  { id: 'mitarbeiter',   label: 'Mitarbeiter' },
  { id: 'kosten',        label: 'Kosten' },
  { id: 'lohnfaktor',    label: 'Lohnfaktor' },
  { id: 'preise',        label: 'Preise' },
  { id: 'controlling',   label: 'Controlling' },
  { id: 'bwa',           label: 'BWA' },
  { id: 'liquiditaet',   label: 'Liquidität' },
  { id: 'simulator',     label: 'Simulator' },
  { id: 'einstellungen', label: 'Einstellungen' },
]

export default function SalonPage() {
  const { id }        = useParams<{ id: string }>()
  const navigate      = useNavigate()
  const [tab, setTab] = useState('uebersicht')

  const { data: salon, isLoading } = useQuery<Salon>({
    queryKey: ['salon', id],
    queryFn: () => api.get(`/salons/${id}`).then(r => r.data),
    enabled: !!id,
  })

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-sm text-gray-400">Lädt…</p>
    </div>
  )

  if (!salon) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-sm text-red-500">Salon nicht gefunden</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate('/')} className="text-gray-400 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Scissors className="w-4 h-4 text-gray-400" />
          <div>
            <h1 className="text-base font-bold text-gray-900 leading-tight">{salon.name}</h1>
            <p className="text-xs text-gray-400">{salon.country} · {salon.businessType}</p>
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <nav className="flex gap-0 overflow-x-auto">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  tab === t.id
                    ? 'accent-underline accent-text border-b-2'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}>
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {tab === 'uebersicht' && (
          <SetupGuide salon={salon} salonId={id!} onNavigate={setTab} />
        )}
        {tab === 'uebersicht'    && <UebersichtTab    salonId={id!} salon={salon} />}
        {tab === 'mitarbeiter'   && <MitarbeiterTab   salonId={id!} salon={salon} />}
        {tab === 'kosten'        && <KostenTab        salonId={id!} salon={salon} />}
        {tab === 'lohnfaktor'    && <LohnfaktorTab    salonId={id!} salon={salon} />}
        {tab === 'preise'        && <PreiseTab        salonId={id!} salon={salon} />}
        {tab === 'controlling'   && <ControllingTab   salonId={id!} salon={salon} />}
        {tab === 'bwa'           && <BwaTab           salonId={id!} salon={salon} />}
        {tab === 'liquiditaet'   && <LiquiditaetTab   salonId={id!} salon={salon} />}
        {tab === 'simulator'     && <SimulatorTab     salonId={id!} salon={salon} />}
        {tab === 'einstellungen' && <EinstellungenTab salonId={id!} salon={salon} />}
      </div>
    </div>
  )
}
