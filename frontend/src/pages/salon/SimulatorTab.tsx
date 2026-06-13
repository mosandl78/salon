import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Sliders, RefreshCw } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import api from '../../api'
import type { Salon, CalculationResult } from '../../types'

function fmt(n: number) { return n.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) }

const DEFAULTS = {
  gehaltsAnpassung: 0,      // % Gehaltserhöhung
  gkAnpassung: 0,           // % GK-Änderung
  auslastung: 80,           // % Auslastung
  neueMitarbeiter: 0,       // Anzahl neue MA (2.500€ Brutto default)
  neuerMAGehalt: 2500,
  wareneinsatz: 12,         // %
  gewinnaufschlag: 10,      // %
}

export default function SimulatorTab({ salonId, salon }: { salonId: string; salon: Salon }) {
  const [params, setParams] = useState(DEFAULTS)

  const { data: calc } = useQuery<CalculationResult>({
    queryKey: ['calc', salonId],
    queryFn: () => api.get(`/salons/${salonId}/calculation`).then(r => r.data),
  })

  const sim = useMemo(() => {
    if (!calc) return null

    const pkAdjusted  = calc.totalPersonalkosten * (1 + params.gehaltsAnpassung / 100)
      + params.neueMitarbeiter * params.neuerMAGehalt * 12 * (1 + calc.employerRate)
    const gkAdjusted  = calc.totalGemeinkosten * (1 + params.gkAnpassung / 100)
    const weRate       = params.wareneinsatz / 100
    const fixed        = pkAdjusted + gkAdjusted + calc.unternehmerlohn
    const mindestumsatz = fixed / (1 - weRate)

    const brutto = calc.bruttolohnsumme
      * (1 + params.gehaltsAnpassung / 100)
      + params.neueMitarbeiter * params.neuerMAGehalt * 12
    const lohnfaktor = brutto > 0 ? mindestumsatz / brutto : 0

    // Beispiel-Preis für 45-min Dienstleistung
    const totalMin = calc.workDaysPerYear * calc.workHoursPerDay * 60
    const pkMin    = pkAdjusted / totalMin
    const gkMin    = gkAdjusted / totalMin
    const eff      = params.auslastung / 100
    const selbstkosten = 8 + (pkMin + gkMin / eff) * 45   // 8€ Material, 45 min
    const nettopreis   = selbstkosten * (1 + params.gewinnaufschlag / 100)
    const bruttopreis  = nettopreis * (1 + calc.vatRate)

    return { mindestumsatz, lohnfaktor, pkAdjusted, gkAdjusted, nettopreis, bruttopreis, selbstkosten }
  }, [calc, params])

  if (!calc) return <p className="text-sm text-gray-400">Berechnung lädt…</p>

  const chartData = [
    { name: 'Aktuell', Mindestumsatz: Math.round(calc.mindestumsatzNet) },
    { name: 'Simulation', Mindestumsatz: Math.round(sim?.mindestumsatz ?? 0) },
  ]

  const diff = (sim?.mindestumsatz ?? 0) - calc.mindestumsatzNet

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800">
        <strong>Simulator:</strong> Änderungen hier haben <em>keine</em> Auswirkung auf die Planung. Nur zum Durchrechnen von Szenarien.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stellschrauben */}
        <div className="space-y-5">
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-5 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-gray-400" /> Stellschrauben
            </h2>
            <div className="space-y-5">
              <Slider label="Gehaltserhöhung" value={params.gehaltsAnpassung} min={-20} max={50} unit="%"
                onChange={v => setParams(p => ({ ...p, gehaltsAnpassung: v }))} />
              <Slider label="Gemeinkostenänderung" value={params.gkAnpassung} min={-30} max={50} unit="%"
                onChange={v => setParams(p => ({ ...p, gkAnpassung: v }))} />
              <Slider label="Auslastung" value={params.auslastung} min={30} max={100} unit="%"
                onChange={v => setParams(p => ({ ...p, auslastung: v }))} />
              <Slider label="Wareneinsatz" value={params.wareneinsatz} min={5} max={35} unit="%"
                onChange={v => setParams(p => ({ ...p, wareneinsatz: v }))} />
              <Slider label="Gewinnaufschlag" value={params.gewinnaufschlag} min={0} max={50} unit="%"
                onChange={v => setParams(p => ({ ...p, gewinnaufschlag: v }))} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Neue MA</label>
                  <input type="number" min={0} max={20} value={params.neueMitarbeiter}
                    onChange={e => setParams(p => ({ ...p, neueMitarbeiter: parseInt(e.target.value) || 0 }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Brutto / Monat (€)</label>
                  <input type="number" min={0} value={params.neuerMAGehalt}
                    onChange={e => setParams(p => ({ ...p, neuerMAGehalt: parseFloat(e.target.value) || 0 }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
              </div>
            </div>
            <button onClick={() => setParams(DEFAULTS)}
              className="mt-5 flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700">
              <RefreshCw className="w-3 h-3" /> Zurücksetzen
            </button>
          </div>
        </div>

        {/* Ergebnisse */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Ergebnis</h2>
            <dl className="space-y-3">
              {[
                ['Mindestumsatz (Sim.)', `${fmt(sim?.mindestumsatz ?? 0)} €`],
                ['Lohnfaktor (Sim.)',    (sim?.lohnfaktor ?? 0).toFixed(2)],
                ['Personalkosten',       `${fmt(sim?.pkAdjusted ?? 0)} €`],
                ['Gemeinkosten',         `${fmt(sim?.gkAdjusted ?? 0)} €`],
                ['Beispielpreis Netto',  `${(sim?.nettopreis ?? 0).toFixed(2)} €`],
                ['Beispielpreis Brutto', `${(sim?.bruttopreis ?? 0).toFixed(2)} €`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm border-b border-gray-50 pb-2">
                  <dt className="text-gray-500">{k}</dt>
                  <dd className="font-semibold text-gray-900">{v}</dd>
                </div>
              ))}
            </dl>
            <div className={`mt-4 p-3 rounded-xl text-xs font-medium ${diff > 0 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              Mindestumsatz {diff >= 0 ? '+' : ''}{fmt(diff)} € vs. aktueller Plan
            </div>
          </div>

          {/* Mini-Chart */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={chartData} barCategoryGap="40%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => `${fmt(v)} €`} />
                <Bar dataKey="Mindestumsatz" fill="#111827" radius={[4,4,0,0]}
                  label={{ position: 'top', fontSize: 10, formatter: (v: number) => `${fmt(v)} €` }} />
                <ReferenceLine y={calc.mindestumsatzNet} stroke="#d1d5db" strokeDasharray="4 4" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

function Slider({ label, value, min, max, unit, onChange }:
  { label: string; value: number; min: number; max: number; unit: string; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600">{label}</span>
        <span className={`font-semibold ${value > 0 ? 'text-red-600' : value < 0 ? 'text-green-600' : 'text-gray-900'}`}>
          {value > 0 ? '+' : ''}{value}{unit}
        </span>
      </div>
      <input type="range" min={min} max={max} value={value}
        onChange={e => onChange(parseInt(e.target.value))}
        className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-gray-900" />
      <div className="flex justify-between text-[10px] text-gray-300 mt-0.5">
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  )
}
