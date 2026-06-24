import { useQuery } from '@tanstack/react-query'
import { Users, Receipt, Scissors, TrendingUp, Target, Droplets, Euro, AlertCircle, Sparkles, ChevronRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import api from '../../api'
import type { Salon, CalculationResult, ActualRevenue } from '../../types'

const MONTHS = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez']

function fmt(n: number) {
  return n.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-900 mb-2">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {fmt(p.value)} €</p>
      ))}
    </div>
  )
}

interface Props {
  salonId: string
  salon: Salon
  onNavigate: (tab: string) => void
  onStartWizard: () => void
}

export default function UebersichtTab({ salonId, salon, onNavigate, onStartWizard }: Props) {
  const year = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1

  const { data: calc, isLoading } = useQuery<CalculationResult>({
    queryKey: ['calc', salonId],
    queryFn: () => api.get(`/salons/${salonId}/calculation`).then(r => r.data),
  })

  const { data: actuals = [] } = useQuery<ActualRevenue[]>({
    queryKey: ['actuals', salonId, year],
    queryFn: () => api.get(`/salons/${salonId}/actuals?year=${year}`).then(r => r.data),
  })

  if (isLoading) return <p className="text-sm text-gray-400">Berechne…</p>

  if (!calc) return (
    <div className="flex items-center gap-2 text-sm text-red-500">
      <AlertCircle className="w-4 h-4" /> Berechnung nicht verfügbar
    </div>
  )

  // Daten für Kacheln
  const maCount = salon.employees?.length ?? 0
  const kostenCount = salon.costItems?.length ?? 0
  const preiseCount = salon.services?.length ?? 0

  // Ø Bruttopreis über alle kalkulierten Dienstleistungen
  const avgBruttoPreis = preiseCount > 0 && salon.services
    ? salon.services.reduce((sum, s) => {
        const util  = (s.utilizationPct ?? 80) / 100
        const pkK   = calc.pkProMinute * s.durationMinutes
        const gkK   = (calc.gkProMinute / util) * s.durationMinutes
        const netto = (pkK + gkK + s.materialCost) * (1 + (s.profitMarkup ?? 0) / 100)
        return sum + netto * (1 + calc.vatRate)
      }, 0) / preiseCount
    : null

  // Controlling: aktueller Monat
  const istAktuell  = actuals.filter(a => a.month === currentMonth).reduce((s, a) => s + a.actual, 0)
  const sollMonat   = calc.mindestumsatzNet / 12
  const zielpct     = sollMonat > 0 ? Math.min((istAktuell / sollMonat) * 100, 100) : 0
  const hasActuals  = actuals.length > 0

  // Chart
  const monthlyIst = MONTHS.map((_, i) =>
    actuals.filter(a => a.month === i + 1).reduce((s, a) => s + a.actual, 0)
  )
  const chartData = MONTHS.map((name, i) => ({
    name,
    Sollumsatz: Math.round(sollMonat),
    'IST-Umsatz': monthlyIst[i] || 0,
  }))

  const hasCalcData = calc.bruttolohnsumme > 0 || calc.totalGemeinkosten > 0

  return (
    <div className="space-y-8">

      {/* ═══ SECTION 1: PREISKALKULATION ═══ */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Preiskalkulation</h2>
            <p className="text-sm text-gray-500 mt-0.5">Mitarbeiter, Kosten & Preise erfassen</p>
          </div>
          <button onClick={onStartWizard}
            className="flex items-center gap-1.5 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">In 3 Schritten zur Preiskalkulation</span>
            <span className="sm:hidden">3 Schritte</span>
          </button>
        </div>

        {/* 3 Setup-Kacheln */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            {
              id: 'mitarbeiter',
              icon: Users,
              label: 'Mitarbeiter',
              sub: 'Löhne & Arbeitszeiten',
              count: maCount,
              countLabel: maCount === 1 ? '1 Mitarbeiter' : `${maCount} Mitarbeiter`,
              metricLabel: maCount > 0 ? `Personalkosten / Jahr inkl. ${(calc.employerRate * 100).toFixed(1)} % AG-Anteil` : null,
              metric: maCount > 0 ? `${fmt(calc.totalPersonalkosten)} €` : null,
              done: maCount > 0,
            },
            {
              id: 'kosten',
              icon: Receipt,
              label: 'Kosten',
              sub: 'Miete, Strom, Versicherung …',
              count: kostenCount,
              countLabel: kostenCount === 1 ? '1 Position' : `${kostenCount} Positionen`,
              metricLabel: kostenCount > 0 ? 'Fixkosten / Jahr' : null,
              metric: kostenCount > 0 ? `${fmt(calc.totalGemeinkosten + calc.unternehmerlohn)} €` : null,
              done: kostenCount > 0,
            },
            {
              id: 'preise',
              icon: Scissors,
              label: 'Preise',
              sub: 'Dienstleistungen kalkulieren',
              count: preiseCount,
              countLabel: preiseCount === 1 ? '1 Leistung' : `${preiseCount} Leistungen`,
              metricLabel: avgBruttoPreis ? 'Ø Preis (brutto)' : null,
              metric: avgBruttoPreis ? `${fmt(Math.round(avgBruttoPreis))} €` : null,
              done: preiseCount > 0,
            },
          ].map(tile => {
            const Icon = tile.icon
            return (
              <button key={tile.id} onClick={() => onNavigate(tile.id)}
                className="bg-white border border-gray-200 rounded-2xl p-5 text-left hover:border-gray-400 hover:shadow-sm transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-xl ${tile.done ? 'bg-green-50' : 'bg-gray-50'}`}>
                    <Icon className={`w-5 h-5 ${tile.done ? 'text-green-600' : 'text-gray-400'}`} />
                  </div>
                  <div className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    tile.done ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {tile.done ? '✓ Erfasst' : '! Ausstehend'}
                  </div>
                </div>
                <p className="text-sm font-bold text-gray-900">{tile.label}</p>
                <p className="text-xs text-gray-400 mt-0.5 mb-3">{tile.sub}</p>
                <p className="text-xs text-gray-500 font-medium mb-1">{tile.countLabel}</p>
                {tile.done && tile.metricLabel && tile.metric && (
                  <div>
                    <p className="text-xs text-gray-400">{tile.metricLabel}</p>
                    <p className="text-base font-bold text-gray-900">{tile.metric}</p>
                  </div>
                )}
                <div className="flex items-center gap-1 mt-3 text-xs text-gray-400 group-hover:text-gray-700 transition-colors">
                  <span>{tile.done ? 'Bearbeiten' : 'Jetzt anlegen'}</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </button>
            )
          })}
        </div>

        {/* Mindestumsatz-Formel */}
        {hasCalcData && (
          <>
            <div className="flex items-center gap-1 flex-wrap mb-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-5 flex-1 min-w-[140px]">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Personalkosten / Jahr</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{fmt(calc.totalPersonalkosten)} €</p>
                <p className="text-xs text-gray-400 mt-0.5">inkl. {(calc.employerRate * 100).toFixed(1)} % AG-Anteil</p>
              </div>
              <span className="text-xl font-bold text-gray-400 px-1">+</span>
              <div className="bg-white border border-gray-200 rounded-2xl p-5 flex-1 min-w-[140px]">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Fixkosten / Jahr</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{fmt(calc.totalGemeinkosten + calc.unternehmerlohn)} €</p>
                <p className="text-xs text-gray-400 mt-0.5">GK + Unternehmerlohn</p>
              </div>
              <span className="text-xl font-bold text-gray-400 px-1">+</span>
              <div className="bg-white border border-gray-200 rounded-2xl p-5 flex-1 min-w-[140px]">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Wareneinsatz / Jahr</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{fmt(Math.round(calc.mindestumsatzNet * calc.wareneinsatzRate))} €</p>
                <p className="text-xs text-gray-400 mt-0.5">{(calc.wareneinsatzRate * 100).toFixed(0)} % vom Mindestumsatz</p>
              </div>
              <span className="text-xl font-bold text-gray-400 px-1">=</span>
              <div className="bg-gray-900 text-white rounded-2xl p-5 flex-1 min-w-[140px]">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Mindestumsatz / Jahr</p>
                <p className="text-2xl font-bold mt-1">{fmt(calc.mindestumsatzNet)} €</p>
                <p className="text-xs text-gray-500 mt-0.5">netto</p>
              </div>
            </div>

            {/* Kostenstruktur */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Kostenstruktur</h3>
              <div className="space-y-3">
                {[
                  { label: 'Personalkosten',  value: calc.totalPersonalkosten,                       color: 'bg-gray-800', sub: `inkl. ${(calc.employerRate * 100).toFixed(1)} % AG-Anteil` },
                  { label: 'Gemeinkosten',    value: calc.totalGemeinkosten,                          color: 'bg-gray-500', sub: 'Miete, Strom, Versicherung …' },
                  { label: 'Unternehmerlohn', value: calc.unternehmerlohn,                            color: 'bg-gray-300', sub: 'Lohn des Inhabers' },
                  { label: `Wareneinsatz (${(calc.wareneinsatzRate * 100).toFixed(0)} % vom Umsatz)`,
                                              value: calc.mindestumsatzNet * calc.wareneinsatzRate,   color: 'bg-amber-300', sub: 'Produkte & Material' },
                ].map(item => {
                  const pct = calc.mindestumsatzNet > 0 ? (item.value / calc.mindestumsatzNet) * 100 : 0
                  return (
                    <div key={item.label}>
                      <div className="flex justify-between text-xs text-gray-600 mb-0.5">
                        <span>{item.label}</span>
                        <span className="font-medium">{fmt(item.value)} € · {pct.toFixed(1)} %</span>
                      </div>
                      {item.sub && <p className="text-xs text-gray-400 mb-1">{item.sub}</p>}
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
                <div className="flex justify-between text-sm font-semibold text-gray-900 pt-2 border-t border-gray-100">
                  <span>= Mindestumsatz / Jahr (netto)</span>
                  <span>{fmt(calc.mindestumsatzNet)} €</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ═══ SECTION 2: SALON CONTROLLING ═══ */}
      <div>
        <div className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Salon Controlling</h2>
          <p className="text-sm text-gray-500 mt-0.5">Umsatz, Zielerreichung & Liquidität im Blick</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {/* Ist-Umsatz */}
          <button onClick={() => onNavigate('controlling')}
            className="bg-white border border-gray-200 rounded-2xl p-5 text-left hover:border-gray-400 hover:shadow-sm transition-all group">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-xl bg-gray-50">
                <TrendingUp className="w-5 h-5 text-gray-500" />
              </div>
            </div>
            <p className="text-sm font-bold text-gray-900">Ist-Umsatz</p>
            <p className="text-xs text-gray-400 mt-0.5 mb-3">{MONTHS[currentMonth - 1]} {year}</p>
            {hasActuals ? (
              <div>
                <p className="text-xl font-bold text-gray-900">{fmt(istAktuell)} €</p>
                <p className="text-xs text-gray-400 mt-0.5">Soll: {fmt(Math.round(sollMonat))} €</p>
              </div>
            ) : (
              <p className="text-xs text-gray-400">Noch keine IST-Daten erfasst</p>
            )}
            <div className="flex items-center gap-1 mt-3 text-xs text-gray-400 group-hover:text-gray-700 transition-colors">
              <span>Zum Controlling</span><ChevronRight className="w-3 h-3" />
            </div>
          </button>

          {/* Zielerreichung */}
          <button onClick={() => onNavigate('controlling')}
            className="bg-white border border-gray-200 rounded-2xl p-5 text-left hover:border-gray-400 hover:shadow-sm transition-all group">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-xl bg-gray-50">
                <Target className="w-5 h-5 text-gray-500" />
              </div>
            </div>
            <p className="text-sm font-bold text-gray-900">Zielerreichung</p>
            <p className="text-xs text-gray-400 mt-0.5 mb-3">{MONTHS[currentMonth - 1]} {year}</p>
            {hasActuals ? (
              <div>
                <p className="text-xl font-bold text-gray-900">{zielpct.toFixed(0)} %</p>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-2">
                  <div
                    className={`h-full rounded-full transition-all ${zielpct >= 100 ? 'bg-green-500' : zielpct >= 70 ? 'bg-amber-400' : 'bg-red-400'}`}
                    style={{ width: `${zielpct}%` }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400">IST-Umsätze eintragen</p>
            )}
            <div className="flex items-center gap-1 mt-3 text-xs text-gray-400 group-hover:text-gray-700 transition-colors">
              <span>Zum Controlling</span><ChevronRight className="w-3 h-3" />
            </div>
          </button>

          {/* Liquidität */}
          <button onClick={() => onNavigate('liquiditaet')}
            className="bg-white border border-gray-200 rounded-2xl p-5 text-left hover:border-gray-400 hover:shadow-sm transition-all group">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-xl bg-gray-50">
                <Droplets className="w-5 h-5 text-gray-500" />
              </div>
            </div>
            <p className="text-sm font-bold text-gray-900">Liquidität</p>
            <p className="text-xs text-gray-400 mt-0.5 mb-3">Monatliche Kosten</p>
            {hasCalcData ? (
              <div>
                <p className="text-xl font-bold text-gray-900">{fmt(Math.round(sollMonat))} €</p>
                <p className="text-xs text-gray-400 mt-0.5">Ø Sollumsatz / Monat</p>
              </div>
            ) : (
              <p className="text-xs text-gray-400">Kosten noch nicht erfasst</p>
            )}
            <div className="flex items-center gap-1 mt-3 text-xs text-gray-400 group-hover:text-gray-700 transition-colors">
              <span>Zum Liquiditätsplan</span><ChevronRight className="w-3 h-3" />
            </div>
          </button>
        </div>

        {/* Jahresverlauf */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Jahresverlauf {year}</h3>
          <p className="text-xs text-gray-400 mb-5">Sollumsatz vs. IST-Umsatz je Monat</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barGap={4} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Sollumsatz" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
              <Bar dataKey="IST-Umsatz" fill="#111827" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Berechnungsgrundlage */}
        {hasCalcData && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Euro className="w-4 h-4 text-gray-400" /> Berechnungsgrundlage
            </h3>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              {[
                ['Arbeitstage / Jahr',   `${calc.workDaysPerYear} Tage`],
                ['Arbeitsstunden / Tag', `${calc.workHoursPerDay.toFixed(1)} Std.`],
                ['PK / Minute',          `${(calc.pkProMinute * 100).toFixed(2)} Ct.`],
                ['GK / Minute',          `${(calc.gkProMinute * 100).toFixed(2)} Ct.`],
                ['Wareneinsatz',         `${(calc.wareneinsatzRate * 100).toFixed(0)} %`],
                ['MwSt.',                `${(calc.vatRate * 100).toFixed(0)} %`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-1 border-b border-gray-50">
                  <dt className="text-gray-500">{k}</dt>
                  <dd className="font-medium text-gray-900">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </div>
  )
}
