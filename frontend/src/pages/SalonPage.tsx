import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Scissors, Settings, X, ChevronRight } from 'lucide-react'
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

const PREISKALK_TABS = [
  { id: 'uebersicht',  label: 'Übersicht' },
  { id: 'mitarbeiter', label: 'Mitarbeiter' },
  { id: 'kosten',      label: 'Kosten' },
  { id: 'preise',      label: 'Preise' },
  { id: 'lohnfaktor',  label: 'Lohnfaktor' },
  { id: 'simulator',   label: 'Simulation' },
]

const CONTROLLING_TABS = [
  { id: 'controlling', label: 'Controlling' },
  { id: 'bwa',         label: 'BWA' },
  { id: 'liquiditaet', label: 'Liquidität' },
]

const WIZARD_STEPS = [
  { step: 1 as const, tab: 'mitarbeiter', label: 'Mitarbeiter' },
  { step: 2 as const, tab: 'kosten',      label: 'Kosten' },
  { step: 3 as const, tab: 'preise',      label: 'Preise' },
]

export default function SalonPage() {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [tab, setTab]                     = useState('uebersicht')
  const [showEinstellungen, setShowEins]  = useState(false)
  const [wizardStep, setWizardStep]       = useState<null | 1 | 2 | 3>(null)

  const segment = CONTROLLING_TABS.some(t => t.id === tab) ? 'controlling' : 'preiskalk'

  const { data: salon, isLoading } = useQuery<Salon>({
    queryKey: ['salon', id],
    queryFn: () => api.get(`/salons/${id}`).then(r => r.data),
    enabled: !!id,
  })

  function switchSegment(to: 'preiskalk' | 'controlling') {
    if (to === 'preiskalk')   setTab('uebersicht')
    if (to === 'controlling') setTab('controlling')
  }

  function startWizard() {
    setWizardStep(1)
    setTab('mitarbeiter')
  }

  function wizardNext() {
    if (wizardStep === 1) { setWizardStep(2); setTab('kosten') }
    else if (wizardStep === 2) { setWizardStep(3); setTab('preise') }
    else { setWizardStep(null); setTab('uebersicht') }
  }

  function wizardSkip() {
    wizardNext()
  }

  const currentTabs = segment === 'preiskalk' ? PREISKALK_TABS : CONTROLLING_TABS

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

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => navigate('/')} className="text-gray-400 hover:text-gray-700 shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Scissors className="w-4 h-4 text-gray-400 shrink-0" />
            <div className="min-w-0">
              <h1 className="text-base font-bold text-gray-900 leading-tight truncate">{salon.name}</h1>
              <p className="text-xs text-gray-400">{salon.country} · {salon.businessType}</p>
            </div>
          </div>
          <button
            onClick={() => setShowEins(true)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg px-2.5 py-1.5 hover:border-gray-400 transition-colors shrink-0">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Einstellungen</span>
          </button>
        </div>
      </header>

      {/* Wizard-Banner */}
      {wizardStep && (
        <div className="bg-gray-900 text-white px-4 sm:px-6 py-3">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-white hidden sm:inline">In 3 Schritten zur Preiskalkulation</span>
              <div className="w-px h-4 bg-gray-700 hidden sm:block" />
              <div className="flex items-center gap-3">
              {WIZARD_STEPS.map((s, i) => (
                <div key={s.step} className="flex items-center gap-2">
                  <button
                    onClick={() => { setWizardStep(s.step); setTab(s.tab) }}
                    className={`flex items-center gap-1.5 hover:opacity-80 transition-opacity ${wizardStep === s.step ? '' : 'cursor-pointer'}`}>
                    <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold border-2 transition-all ${
                      wizardStep === s.step
                        ? 'bg-white text-gray-900 border-white'
                        : wizardStep > s.step
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-600 text-gray-500'
                    }`}>
                      {wizardStep > s.step ? '✓' : s.step}
                    </div>
                    <span className={`text-sm hidden sm:inline ${wizardStep === s.step ? 'font-semibold text-white' : wizardStep > s.step ? 'text-green-400' : 'text-gray-500'}`}>
                      {s.label}
                    </span>
                  </button>
                  {i < WIZARD_STEPS.length - 1 && <ChevronRight className="w-4 h-4 text-gray-600" />}
                </div>
              ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {wizardStep > 1 && (
                <button onClick={() => {
                  const prev = wizardStep - 1 as 1 | 2 | 3
                  setWizardStep(prev)
                  setTab(WIZARD_STEPS[prev - 1].tab)
                }}
                  className="flex items-center gap-1 text-gray-400 hover:text-white text-sm transition-colors px-2 py-1.5">
                  <ChevronRight className="w-4 h-4 rotate-180" /> {WIZARD_STEPS[wizardStep - 2].label}
                </button>
              )}
              <button onClick={wizardNext}
                className="flex items-center gap-1.5 bg-white text-gray-900 px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors">
                {wizardStep < 3 ? (
                  <>{WIZARD_STEPS[wizardStep].label} <ChevronRight className="w-4 h-4" /></>
                ) : (
                  'Abschließen ✓'
                )}
              </button>
              <button onClick={() => setWizardStep(null)} className="text-gray-500 hover:text-white ml-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation — eine Leiste, zwei Gruppen */}
      {!wizardStep && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            {/* Mobile: optgroup select */}
            <div className="sm:hidden py-2">
              <select value={tab} onChange={e => setTab(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900">
                <optgroup label="✂️ Preiskalkulation">
                  {PREISKALK_TABS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </optgroup>
                <optgroup label="📊 Salon Controlling">
                  {CONTROLLING_TABS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </optgroup>
              </select>
            </div>
            {/* Desktop: inline mit Trennstrich */}
            <nav className="hidden sm:flex items-end gap-0 overflow-x-auto">
              {PREISKALK_TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    tab === t.id
                      ? 'border-gray-900 text-gray-900'
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}>
                  {t.label}
                </button>
              ))}
              {/* Trennstrich */}
              <div className="mx-2 mb-2 self-end h-5 w-px bg-gray-200 shrink-0" />
              {CONTROLLING_TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    tab === t.id
                      ? 'border-gray-900 text-gray-900'
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}>
                  {t.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {tab === 'uebersicht'  && !wizardStep && <UebersichtTab salonId={id!} salon={salon} onNavigate={setTab} onStartWizard={startWizard} />}
        {(tab === 'mitarbeiter' || wizardStep === 1) && <MitarbeiterTab salonId={id!} salon={salon} />}
        {(tab === 'kosten'      || wizardStep === 2) && <KostenTab      salonId={id!} salon={salon} />}
        {(tab === 'preise'      || wizardStep === 3) && <PreiseTab      salonId={id!} salon={salon} />}
        {tab === 'lohnfaktor'  && !wizardStep && <LohnfaktorTab  salonId={id!} salon={salon} />}
        {tab === 'simulator'   && !wizardStep && <SimulatorTab   salonId={id!} salon={salon} />}
        {tab === 'controlling' && !wizardStep && <ControllingTab salonId={id!} salon={salon} />}
        {tab === 'bwa'         && !wizardStep && <BwaTab         salonId={id!} salon={salon} />}
        {tab === 'liquiditaet' && !wizardStep && <LiquiditaetTab salonId={id!} salon={salon} />}

        {/* Wizard-Footer */}
        {wizardStep && (
          <div className="mt-8 flex items-center gap-6 border-t border-gray-200 pt-6">
            <button onClick={() => { setWizardStep(null); setTab('uebersicht') }}
              className="text-sm text-gray-400 hover:text-gray-700">
              ← Zur Übersicht
            </button>
            <button onClick={wizardSkip} className="text-sm text-gray-400 hover:text-gray-700">
              Diesen Schritt überspringen
            </button>
          </div>
        )}
      </div>

      {/* Einstellungen Drawer */}
      {showEinstellungen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setShowEins(false)} />
          <div className="w-full max-w-xl bg-white shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-base font-bold text-gray-900">Einstellungen</h2>
              <button onClick={() => setShowEins(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <EinstellungenTab salonId={id!} salon={salon} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
