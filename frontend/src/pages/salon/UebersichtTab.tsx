import { useQuery } from '@tanstack/react-query'
import { TrendingUp, Users, Euro, AlertCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import api from '../../api'
import type { Salon, CalculationResult, ActualRevenue } from '../../types'

const MONTHS = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez']

function fmt(n: number) {
  return n.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function KPI({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
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

export default function UebersichtTab({ salonId }: { salonId: string; salon: Salon }) {
  const year = new Date().getFullYear()

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

  const hasData = calc.bruttolohnsumme > 0 || calc.totalGemeinkosten > 0

  if (!hasData) return (
    <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center">
      <TrendingUp className="w-8 h-8 text-gray-300 mx-auto mb-3" />
      <p className="text-sm font-medium text-gray-900">Noch keine Daten vorhanden</p>
      <p className="text-sm text-gray-500 mt-1">
        Gib zuerst Mitarbeiter und Kosten ein — hier siehst du dann die Kennzahlen.
      </p>
    </div>
  )

  // Jahresverlauf-Daten
  const monthlyKosten = calc.mindestumsatzNet / 12
  const monthlyIst    = MONTHS.map((_, i) => {
    const total = actuals.filter(a => a.month === i + 1).reduce((s, a) => s + a.actual, 0)
    return total
  })
  const chartData = MONTHS.map((name, i) => ({
    name,
    Sollumsatz: Math.round(monthlyKosten),
    'IST-Umsatz': monthlyIst[i] || 0,
  }))

  return (
    <div className="space-y-6">
      {/* KPIs */}
      {/* KPI-Formel: Mindestumsatz = Personalkosten + Fixkosten + Wareneinsatz */}
      <div className="flex items-center gap-1 flex-wrap">
        {/* Mindestumsatz */}
        <div className="bg-gray-900 text-white rounded-2xl p-5 flex-1 min-w-[140px]">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Mindestumsatz / Jahr</p>
          <p className="text-2xl font-bold mt-1">{fmt(calc.mindestumsatzNet)} €</p>
          <p className="text-xs text-gray-500 mt-0.5">netto</p>
        </div>
        <span className="text-xl font-bold text-gray-400 px-1">=</span>
        {/* Personalkosten */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex-1 min-w-[140px]">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Personalkosten / Jahr</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{fmt(calc.totalPersonalkosten)} €</p>
          <p className="text-xs text-gray-400 mt-0.5">inkl. {(calc.employerRate * 100).toFixed(1)} % AG-Anteil</p>
        </div>
        <span className="text-xl font-bold text-gray-400 px-1">+</span>
        {/* Fixkosten */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex-1 min-w-[140px]">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Fixkosten / Jahr</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{fmt(calc.totalGemeinkosten + calc.unternehmerlohn)} €</p>
          <p className="text-xs text-gray-400 mt-0.5">GK + Unternehmerlohn</p>
        </div>
        <span className="text-xl font-bold text-gray-400 px-1">+</span>
        {/* Wareneinsatz */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex-1 min-w-[140px]">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Wareneinsatz / Jahr</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{fmt(Math.round(calc.mindestumsatzNet * calc.wareneinsatzRate))} €</p>
          <p className="text-xs text-gray-400 mt-0.5">{(calc.wareneinsatzRate * 100).toFixed(0)} % vom Mindestumsatz</p>
        </div>
      </div>

      {/* Jahresverlauf-Diagramm */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Jahresverlauf {year}</h2>
        <p className="text-xs text-gray-400 mb-5">Sollumsatz vs. IST-Umsatz je Monat</p>
        <ResponsiveContainer width="100%" height={240}>
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

      {/* Kostenstruktur */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Kostenstruktur</h2>
        <div className="space-y-3">
          {[
            { label: 'Personalkosten',  value: calc.totalPersonalkosten,                              color: 'bg-gray-800', sub: `inkl. ${(calc.employerRate * 100).toFixed(1)} % AG-Anteil` },
            { label: 'Gemeinkosten',    value: calc.totalGemeinkosten,                                color: 'bg-gray-500', sub: 'Miete, Strom, Versicherung …' },
            { label: 'Unternehmerlohn', value: calc.unternehmerlohn,                                  color: 'bg-gray-300', sub: 'Lohn des Inhabers' },
            { label: `Wareneinsatz (${(calc.wareneinsatzRate * 100).toFixed(0)} % vom Umsatz)`,
                                        value: calc.mindestumsatzNet * calc.wareneinsatzRate,          color: 'bg-amber-300', sub: 'Produkte & Material' },
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

      {/* Sollumsatz je MA */}
      {calc.sollUmsatzPerEmployee.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" /> Sollumsatz je Mitarbeiter
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100">
                  <th className="text-left pb-2 font-medium">Name</th>
                  <th className="text-right pb-2 font-medium">/ Monat</th>
                  <th className="text-right pb-2 font-medium">/ Tag</th>
                  <th className="text-right pb-2 font-medium">/ Stunde</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {calc.sollUmsatzPerEmployee.map(emp => (
                  <tr key={emp.id}>
                    <td className="py-2.5 font-medium text-gray-900">{emp.name}</td>
                    <td className="py-2.5 text-right text-gray-700">{fmt(emp.sollMonat)} €</td>
                    <td className="py-2.5 text-right text-gray-500">{fmt(emp.sollTag)} €</td>
                    <td className="py-2.5 text-right text-gray-500">{fmt(emp.sollStunde)} €</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Details */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Euro className="w-4 h-4 text-gray-400" /> Berechnungsgrundlage
        </h2>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
          {[
            ['Arbeitstage / Jahr', `${calc.workDaysPerYear} Tage`],
            ['Arbeitsstunden / Tag', `${calc.workHoursPerDay.toFixed(1)} Std.`],
            ['PK / Minute', `${(calc.pkProMinute * 100).toFixed(2)} Ct.`],
            ['GK / Minute', `${(calc.gkProMinute * 100).toFixed(2)} Ct.`],
            ['Wareneinsatz', `${(calc.wareneinsatzRate * 100).toFixed(0)} %`],
            ['MwSt.', `${(calc.vatRate * 100).toFixed(0)} %`],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between py-1 border-b border-gray-50">
              <dt className="text-gray-500">{k}</dt>
              <dd className="font-medium text-gray-900">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
