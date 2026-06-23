import { useState, useMemo } from 'react'
import { useMutation } from '@tanstack/react-query'
import { ChevronRight, ChevronLeft, Check, Wand2 } from 'lucide-react'
import api from '../../api'
import type { ServiceCategory, CalculationResult } from '../../types'

// ─── Presets ────────────────────────────────────────────────────────────────

type Preset = {
  category: ServiceCategory
  emoji: string
  label: string
  hint: string
  defaultDuration: number          // total minutes
  phases: { vorbereitung: number; technisch: number; einwirkzeit: number; finish: number }
  materialBenchmark: { low: number; mid: number; high: number }
  materialLabel: string
}

const PRESETS: Preset[] = [
  {
    category: 'WASCHEN_SCHNEIDEN_FOENEN',
    emoji: '✂️',
    label: 'Waschen / Schneiden / Fönen',
    hint: 'Klassische Damenfrisur',
    defaultDuration: 60,
    phases: { vorbereitung: 5, technisch: 30, einwirkzeit: 0, finish: 25 },
    materialBenchmark: { low: 2, mid: 4, high: 6 },
    materialLabel: 'Shampoo, Conditioner, Styling',
  },
  {
    category: 'HERRENHAARSCHNITT',
    emoji: '💈',
    label: 'Herrenhaarschnitt',
    hint: 'inkl. Waschen',
    defaultDuration: 30,
    phases: { vorbereitung: 3, technisch: 20, einwirkzeit: 0, finish: 7 },
    materialBenchmark: { low: 1, mid: 2, high: 3 },
    materialLabel: 'Shampoo, Styling',
  },
  {
    category: 'FARBE',
    emoji: '🎨',
    label: 'Farbe',
    hint: 'Ansatz oder Vollfarbe',
    defaultDuration: 90,
    phases: { vorbereitung: 10, technisch: 30, einwirkzeit: 30, finish: 20 },
    materialBenchmark: { low: 8, mid: 15, high: 25 },
    materialLabel: 'Farbe, Oxidationsmittel',
  },
  {
    category: 'STRAEHNEN',
    emoji: '🌟',
    label: 'Strähnen',
    hint: 'Folien oder Cap',
    defaultDuration: 120,
    phases: { vorbereitung: 10, technisch: 50, einwirkzeit: 35, finish: 25 },
    materialBenchmark: { low: 10, mid: 20, high: 35 },
    materialLabel: 'Blondiermittel, Folien, Toner',
  },
  {
    category: 'BALAYAGE',
    emoji: '✨',
    label: 'Balayage',
    hint: 'Freihand-Aufhellung',
    defaultDuration: 150,
    phases: { vorbereitung: 10, technisch: 70, einwirkzeit: 40, finish: 30 },
    materialBenchmark: { low: 15, mid: 28, high: 45 },
    materialLabel: 'Blondiermittel, Toner, Pflege',
  },
  {
    category: 'VERLAENGERUNG',
    emoji: '💎',
    label: 'Verlängerung / Zweithaar',
    hint: 'Extensions, Tape-in o.ä.',
    defaultDuration: 180,
    phases: { vorbereitung: 15, technisch: 130, einwirkzeit: 0, finish: 35 },
    materialBenchmark: { low: 50, mid: 120, high: 250 },
    materialLabel: 'Extensions / Zweithaar-Material',
  },
  {
    category: 'CUSTOM',
    emoji: '🪄',
    label: 'Eigene Dienstleistung',
    hint: 'Individuell konfigurieren',
    defaultDuration: 45,
    phases: { vorbereitung: 5, technisch: 30, einwirkzeit: 0, finish: 10 },
    materialBenchmark: { low: 2, mid: 6, high: 12 },
    materialLabel: 'Materialkosten',
  },
]

const UTIL_OPTIONS = [
  { value: 40, label: 'Niedrig', sub: '40 % — ruhige Phasen, viel Spielraum', color: 'bg-orange-50 border-orange-200 text-orange-700' },
  { value: 70, label: 'Normal', sub: '70 % — typischer Salon-Alltag', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { value: 85, label: 'Gut', sub: '85 % — ausgelasteter Betrieb', color: 'bg-green-50 border-green-200 text-green-700' },
  { value: 95, label: 'Voll', sub: '95 % — kaum Leerlauf', color: 'bg-purple-50 border-purple-200 text-purple-700' },
]

// ─── Types ───────────────────────────────────────────────────────────────────

type WizardState = {
  category: ServiceCategory
  name: string
  phases: { vorbereitung: number; technisch: number; einwirkzeit: number; finish: number }
  materialMode: 'line' | 'flat'
  materialItems: { label: string; cost: number }[]
  materialFlat: number
  utilization: number
  profitMarkup: number
}

function totalDuration(phases: WizardState['phases']) {
  return phases.vorbereitung + phases.technisch + phases.einwirkzeit + phases.finish
}

function totalMaterial(state: WizardState) {
  if (state.materialMode === 'flat') return state.materialFlat
  return state.materialItems.reduce((s, i) => s + i.cost, 0)
}

// ─── Live price estimate (mirrors backend logic) ─────────────────────────────

function estimatePrice(
  calc: CalculationResult | undefined,
  durationMinutes: number,
  materialCost: number,
  utilizationPct: number,
  profitMarkup: number,
) {
  if (!calc) return null
  const pkMin = calc.pkProMinute ?? 0
  const gkMin = calc.gkProMinute ?? 0
  const utilizationFactor = Math.min(utilizationPct / 100, 1) || 1
  // Spiegelt exakt die Backend-Logik:
  // pk-Kosten ohne Auslastungskorrektur, gk-Kosten mit Auslastungskorrektur
  const pkKosten = pkMin * durationMinutes
  const gkKosten = (gkMin / utilizationFactor) * durationMinutes
  const selbstkosten = pkKosten + gkKosten + materialCost
  const nettopreis = selbstkosten * (1 + profitMarkup / 100)
  const vatRate = calc.vatRate ?? 0.19
  const bruttopreis = nettopreis * (1 + vatRate)
  return { selbstkosten, nettopreis, bruttopreis }
}

function roundSuggestions(brutto: number) {
  const cents = [0, 0.5, 0.9, 0.99]
  const base = Math.floor(brutto)
  const suggestions: number[] = []
  for (let b = base - 1; b <= base + 4; b++) {
    for (const c of cents) {
      const v = b + c
      if (v > 0 && Math.abs(v - brutto) < 8 && !suggestions.includes(v)) suggestions.push(v)
    }
  }
  return suggestions.sort((a, b) => Math.abs(a - brutto) - Math.abs(b - brutto)).slice(0, 4)
}

function fmt(n: number) {
  return n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function PreisWizardModal({
  salonId,
  calc,
  onClose,
  onSaved,
}: {
  salonId: string
  calc: CalculationResult | undefined
  onClose: () => void
  onSaved: () => void
}) {
  const [step, setStep] = useState(1)
  const TOTAL_STEPS = 5

  const [state, setState] = useState<WizardState>({
    category: 'WASCHEN_SCHNEIDEN_FOENEN',
    name: '',
    phases: { vorbereitung: 5, technisch: 30, einwirkzeit: 0, finish: 25 },
    materialMode: 'flat',
    materialItems: [{ label: 'Material', cost: 4 }],
    materialFlat: 4,
    utilization: 80,
    profitMarkup: 10,
  })

  const preset = PRESETS.find(p => p.category === state.category)!

  function applyPreset(p: Preset) {
    setState(s => ({
      ...s,
      category: p.category,
      name: s.name || p.label,
      phases: { ...p.phases },
      materialFlat: p.materialBenchmark.mid,
      materialItems: [{ label: p.materialLabel, cost: p.materialBenchmark.mid }],
    }))
  }

  const duration = totalDuration(state.phases)
  const material = totalMaterial(state)
  const estimate = useMemo(
    () => estimatePrice(calc, duration, material, state.utilization, state.profitMarkup),
    [calc, duration, material, state.utilization, state.profitMarkup],
  )
  const suggestions = useMemo(
    () => (estimate ? roundSuggestions(estimate.bruttopreis) : []),
    [estimate],
  )

  const mutation = useMutation({
    mutationFn: (data: any) => api.post(`/salons/${salonId}/services`, data),
    onSuccess: onSaved,
  })

  function save(finalMarkup?: number) {
    mutation.mutate({
      category: state.category,
      name: state.name || preset.label,
      durationMinutes: duration,
      materialCost: material,
      utilizationPct: state.utilization,
      profitMarkup: finalMarkup ?? state.profitMarkup,
    })
  }

  // ─── Step components ──────────────────────────────────────────────────────

  function Step1() {
    return (
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900">Welche Art von Dienstleistung?</h3>
        <div className="grid grid-cols-2 gap-3">
          {PRESETS.map(p => (
            <button
              key={p.category}
              onClick={() => { applyPreset(p); setStep(2) }}
              className={`text-left p-4 rounded-xl border-2 transition-all hover:shadow-sm ${
                state.category === p.category
                  ? 'border-gray-900 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <div className="text-2xl mb-1.5">{p.emoji}</div>
              <div className="text-sm font-semibold text-gray-900 leading-tight">{p.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{p.hint}</div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  function Step2() {
    const phases: { key: keyof WizardState['phases']; label: string; color: string }[] = [
      { key: 'vorbereitung', label: 'Vorbereitung', color: 'bg-blue-400' },
      { key: 'technisch',    label: 'Technisch',    color: 'bg-violet-500' },
      { key: 'einwirkzeit',  label: 'Einwirkzeit',  color: 'bg-amber-400' },
      { key: 'finish',       label: 'Finish / Fönen', color: 'bg-green-500' },
    ]
    return (
      <div className="space-y-5">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Zeit & Name</h3>
          <p className="text-sm text-gray-500 mt-0.5">Aufgeteilt in Arbeitsphasen. Einwirkzeit = Stuhlzeit ohne Arbeit.</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Bezeichnung</label>
          <input
            value={state.name}
            onChange={e => setState(s => ({ ...s, name: e.target.value }))}
            placeholder={preset.label}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {phases.map(ph => (
            <div key={ph.key}>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 mb-1">
                <span className={`w-2 h-2 rounded-full ${ph.color}`} />
                {ph.label}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={state.phases[ph.key]}
                  onChange={e => setState(s => ({ ...s, phases: { ...s.phases, [ph.key]: Number(e.target.value) } }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                <span className="text-xs text-gray-400 shrink-0">min</span>
              </div>
            </div>
          ))}
        </div>
        {/* Visual bar */}
        <div>
          <div className="flex h-3 rounded-full overflow-hidden gap-px">
            {phases.map(ph => {
              const w = duration > 0 ? (state.phases[ph.key] / duration) * 100 : 0
              return w > 0 ? <div key={ph.key} className={`${ph.color}`} style={{ width: `${w}%` }} /> : null
            })}
          </div>
          <p className="text-xs text-gray-400 mt-1 text-right">Gesamt: <span className="font-semibold text-gray-700">{duration} min</span></p>
        </div>
      </div>
    )
  }

  function Step3() {
    return (
      <div className="space-y-5">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Materialkosten</h3>
          <p className="text-sm text-gray-500 mt-0.5">Produkte, Farbe, Verbrauchsmaterial pro Behandlung.</p>
        </div>
        {/* Mode toggle */}
        <div className="flex gap-2">
          {(['flat', 'line'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setState(s => ({ ...s, materialMode: mode }))}
              className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${
                state.materialMode === mode
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'border-gray-300 text-gray-600 hover:border-gray-500'
              }`}
            >
              {mode === 'flat' ? 'Pauschal' : 'Einzelpositionen'}
            </button>
          ))}
        </div>

        {state.materialMode === 'flat' ? (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Gesamtkosten (€)</label>
            <input
              type="number" min="0" step="0.50"
              value={state.materialFlat}
              onChange={e => setState(s => ({ ...s, materialFlat: Number(e.target.value) }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <p className="text-xs text-gray-400 mt-1">
              Richtwert für {preset.label}: {fmt(preset.materialBenchmark.low)} – {fmt(preset.materialBenchmark.high)} €
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {state.materialItems.map((item, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  value={item.label}
                  onChange={e => setState(s => {
                    const items = [...s.materialItems]
                    items[i] = { ...items[i], label: e.target.value }
                    return { ...s, materialItems: items }
                  })}
                  placeholder="Bezeichnung"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                <div className="flex items-center gap-1">
                  <input
                    type="number" min="0" step="0.10"
                    value={item.cost}
                    onChange={e => setState(s => {
                      const items = [...s.materialItems]
                      items[i] = { ...items[i], cost: Number(e.target.value) }
                      return { ...s, materialItems: items }
                    })}
                    className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                  <span className="text-xs text-gray-400">€</span>
                </div>
                {state.materialItems.length > 1 && (
                  <button
                    onClick={() => setState(s => ({ ...s, materialItems: s.materialItems.filter((_, j) => j !== i) }))}
                    className="text-gray-300 hover:text-red-500 text-lg leading-none"
                  >×</button>
                )}
              </div>
            ))}
            <button
              onClick={() => setState(s => ({ ...s, materialItems: [...s.materialItems, { label: '', cost: 0 }] }))}
              className="text-xs text-gray-500 hover:text-gray-900 border border-dashed border-gray-300 rounded-lg px-3 py-1.5 w-full hover:border-gray-500"
            >
              + Position hinzufügen
            </button>
            <p className="text-xs text-gray-400 text-right">Summe: <span className="font-semibold text-gray-700">{fmt(material)} €</span></p>
          </div>
        )}
      </div>
    )
  }

  function Step4() {
    return (
      <div className="space-y-5">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Auslastung</h3>
          <p className="text-sm text-gray-500 mt-0.5">Wie voll ist dein Terminbuch für diese Leistung?</p>
        </div>
        <div className="space-y-2">
          {UTIL_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setState(s => ({ ...s, utilization: opt.value }))}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                state.utilization === opt.value
                  ? 'border-gray-900 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-gray-900">{opt.label}</span>
                  <span className="text-xs text-gray-500 ml-2">{opt.sub}</span>
                </div>
                {state.utilization === opt.value && <Check className="w-4 h-4 text-gray-900" />}
              </div>
            </button>
          ))}
        </div>
        {estimate && (
          <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm">
            <p className="text-xs text-gray-500 mb-1">Vorschau Selbstkosten</p>
            <p className="text-lg font-bold text-gray-900">{fmt(estimate.selbstkosten)} €</p>
            <p className="text-xs text-gray-400 mt-0.5">Auf Basis von {duration} min · {fmt(material)} € Material · {state.utilization} % Auslastung</p>
          </div>
        )}
      </div>
    )
  }

  function Step5() {
    return (
      <div className="space-y-5">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Gewinnaufschlag & Preis</h3>
          <p className="text-sm text-gray-500 mt-0.5">Wie viel Gewinn soll über den Selbstkosten liegen?</p>
        </div>

        {/* Slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-gray-700">Gewinnaufschlag</label>
            <span className="text-sm font-bold text-gray-900">{state.profitMarkup} %</span>
          </div>
          <input
            type="range" min="0" max="50" step="1"
            value={state.profitMarkup}
            onChange={e => setState(s => ({ ...s, profitMarkup: Number(e.target.value) }))}
            className="w-full accent-gray-900"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-0.5">
            <span>0 %</span><span>10 %</span><span>20 %</span><span>30 %</span><span>50 %</span>
          </div>
        </div>

        {/* Live result */}
        {estimate ? (
          <div className="bg-gray-900 text-white rounded-2xl p-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Selbstkosten</span>
              <span>{fmt(estimate.selbstkosten)} €</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Netto</span>
              <span>{fmt(estimate.nettopreis)} €</span>
            </div>
            <div className="border-t border-gray-700 pt-3 flex justify-between">
              <span className="text-gray-300 text-sm">Brutto (inkl. MwSt.)</span>
              <span className="text-2xl font-bold">{fmt(estimate.bruttopreis)} €</span>
            </div>
          </div>
        ) : (
          <div className="bg-gray-100 rounded-2xl p-5 text-center text-sm text-gray-400">
            Keine Kalkulationsdaten — bitte zuerst Mitarbeiter & Kosten erfassen.
          </div>
        )}

        {/* Rounding suggestions */}
        {suggestions.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-2">Runde Preisvorschläge — klicke zum Übernehmen:</p>
            <div className="flex gap-2 flex-wrap">
              {suggestions.map(v => (
                <button
                  key={v}
                  onClick={() => {
                    // back-calculate what profitMarkup would yield this brutto
                    if (estimate) {
                      const vatRate = calc?.vatRate ?? 0.19
                      const selbst = estimate.selbstkosten
                      const netto = v / (1 + vatRate)
                      const markup = selbst > 0 ? Math.round(((netto / selbst) - 1) * 100) : 0
                      setState(s => ({ ...s, profitMarkup: Math.max(0, markup) }))
                      save(Math.max(0, markup))
                    }
                  }}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-800 hover:border-gray-900 hover:bg-gray-50 transition-colors"
                >
                  {fmt(v)} €
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ─── Layout ───────────────────────────────────────────────────────────────

  const stepLabels = ['Kategorie', 'Zeit', 'Material', 'Auslastung', 'Preis']

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2 mb-4">
            <Wand2 className="w-5 h-5 text-gray-400" />
            <h2 className="text-base font-bold text-gray-900">Geführte Preiskalkulation</h2>
          </div>
          {/* Progress bar */}
          <div className="flex items-center gap-1">
            {stepLabels.map((label, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className={`h-1 w-full rounded-full transition-colors ${
                  i + 1 <= step ? 'bg-gray-900' : 'bg-gray-200'
                }`} />
                <span className={`text-[10px] ${i + 1 === step ? 'text-gray-900 font-semibold' : 'text-gray-400'}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto flex-1">
          {step === 1 && <Step1 />}
          {step === 2 && <Step2 />}
          {step === 3 && <Step3 />}
          {step === 4 && <Step4 />}
          {step === 5 && <Step5 />}
        </div>

        {/* Footer */}
        {step > 1 && (
          <div className="px-6 pb-6 pt-4 border-t border-gray-100 shrink-0 flex gap-3">
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-1.5 border border-gray-300 text-gray-700 rounded-xl px-4 py-2.5 text-sm hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4" /> Zurück
            </button>
            <div className="flex-1" />
            <button onClick={onClose} className="text-sm text-gray-400 hover:text-gray-700 px-3">
              Abbrechen
            </button>
            {step < TOTAL_STEPS ? (
              <button
                onClick={() => setStep(s => s + 1)}
                className="flex items-center gap-1.5 bg-gray-900 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-gray-800"
              >
                Weiter <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => save()}
                disabled={mutation.isPending}
                className="flex items-center gap-1.5 bg-gray-900 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
              >
                <Check className="w-4 h-4" /> Speichern
              </button>
            )}
          </div>
        )}

        {/* Step 1 has its own close button only */}
        {step === 1 && (
          <div className="px-6 pb-6 pt-2 shrink-0 flex justify-end">
            <button onClick={onClose} className="text-sm text-gray-400 hover:text-gray-700">
              Abbrechen
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
