import { useQuery } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import api from '../../api'
import type { Salon, CostItem, Employee, CalculationResult } from '../../types'

const MONTHS = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez']

function fmt(n: number) { return n.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) }

export default function LiquiditaetTab({ salonId, salon }: { salonId: string; salon: Salon }) {
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ['employees', salonId],
    queryFn: () => api.get(`/salons/${salonId}/employees`).then(r => r.data),
  })

  const { data: costs = [] } = useQuery<CostItem[]>({
    queryKey: ['costs', salonId],
    queryFn: () => api.get(`/salons/${salonId}/costs`).then(r => r.data),
  })

  const { data: calc } = useQuery<CalculationResult>({
    queryKey: ['calc', salonId],
    queryFn: () => api.get(`/salons/${salonId}/calculation`).then(r => r.data),
  })

  if (!calc) return <p className="text-sm text-gray-400">Lädt…</p>

  // Monatliche Kosten aufschlüsseln
  const monthlyData = MONTHS.map((name, i) => {
    // Personalkosten je Monat
    let pk = 0
    for (const emp of employees) {
      const active = emp.activeMonths[i] ?? 0
      if (active > 0) {
        const monatsPK = emp.grossSalary * (1 + calc.employerRate) * active
        const bonusM   = i === 11 ? emp.christmasBonus : i === 5 ? emp.holidayBonus : 0
        pk += monatsPK + bonusM
      }
    }

    // Gemeinkosten je Monat
    let gk = 0
    for (const cost of costs) {
      if (cost.category !== 'UNTERNEHMERLOHN' && cost.category !== 'WARENEINSATZ') {
        gk += cost.amounts[i] ?? 0
      }
    }

    // Unternehmerlohn
    let ul = 0
    for (const cost of costs.filter(c => c.category === 'UNTERNEHMERLOHN')) {
      ul += cost.amounts[i] ?? 0
    }

    const gesamt     = pk + gk + ul
    // Sollumsatz je Monat = tatsächliche Kosten des Monats / (1 - Wareneinsatzrate)
    // So deckt der Sollumsatz exakt die monatlichen Kosten + den Wareneinsatz-Puffer
    const wareneinsatzRate = calc.wareneinsatzRate ?? 0.12
    const sollumsatz = wareneinsatzRate < 1 ? gesamt / (1 - wareneinsatzRate) : gesamt
    const wareneinsatzPuffer = sollumsatz - gesamt

    return { name, Personalkosten: Math.round(pk), Gemeinkosten: Math.round(gk), Unternehmerlohn: Math.round(ul), Gesamt: Math.round(gesamt), Sollumsatz: Math.round(sollumsatz), Wareneinsatz: Math.round(wareneinsatzPuffer) }
  })

  // Kumuliert
  let kumuliert = 0
  const kumuliertData = monthlyData.map(m => {
    kumuliert += m.Gesamt
    return { ...m, Kumuliert: kumuliert }
  })

  const jahresGesamt = monthlyData.reduce((s, m) => s + m.Gesamt, 0)

  return (
    <div className="space-y-6">
      {/* Header KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Gesamtkosten / Jahr</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{fmt(jahresGesamt)} €</p>
          <p className="text-xs text-gray-400 mt-1">Personalkosten + Gemeinkosten + Unternehmerlohn</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Ø Kosten / Monat</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{fmt(jahresGesamt / 12)} €</p>
          <p className="text-xs text-gray-400 mt-1">Jahresdurchschnitt — Monate variieren je nach MA-Aktivität</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Sollumsatz / Jahr</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{fmt(monthlyData.reduce((s, m) => s + m.Sollumsatz, 0))} €</p>
          <p className="text-xs text-gray-400 mt-1">Gesamtkosten ÷ (1 − {((calc.wareneinsatzRate ?? 0.12) * 100).toFixed(0)} % Wareneinsatz) — deckt alle Kosten inkl. Material</p>
        </div>
      </div>

      {/* Flächen-Diagramm */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-5">Kostenverteilung / Monat</h2>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v: any) => `${fmt(Number(v))} €`} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="Personalkosten"  stackId="1" stroke="#1f2937" fill="#1f2937" fillOpacity={0.8} />
            <Area type="monotone" dataKey="Gemeinkosten"    stackId="1" stroke="#6b7280" fill="#6b7280" fillOpacity={0.8} />
            <Area type="monotone" dataKey="Unternehmerlohn" stackId="1" stroke="#d1d5db" fill="#d1d5db" fillOpacity={0.8} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Tabelle */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Liquiditätsplan (bankfähig)</h2>
          <button onClick={() => window.print()}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900">
            <Download className="w-3.5 h-3.5" /> Drucken
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400 border-b border-gray-100">
                <th className="text-left px-4 py-2 font-medium sticky left-0 bg-white">Position</th>
                {MONTHS.map(m => <th key={m} className="text-right px-3 py-2 font-medium min-w-[80px]">{m}</th>)}
                <th className="text-right px-4 py-2 font-medium bg-gray-50">Gesamt</th>
              </tr>
            </thead>
            <tbody>
              {[
                { key: 'Personalkosten',  label: 'Personalkosten',                                                  bold: false, sub: 'inkl. AG-Anteil' },
                { key: 'Gemeinkosten',    label: 'Gemeinkosten',                                                    bold: false, sub: 'Miete, Strom, Versicherung …' },
                { key: 'Unternehmerlohn', label: 'Unternehmerlohn',                                                 bold: false, sub: 'Entnahme Inhaber' },
                { key: 'Gesamt',          label: 'FIXKOSTEN GESAMT',                                                bold: true,  sub: 'Summe der drei Positionen' },
                { key: 'Wareneinsatz',    label: `Wareneinsatz-Puffer (${((calc.wareneinsatzRate ?? 0.12) * 100).toFixed(0)} %)`, bold: false, sub: 'Produkte & Material — % vom Sollumsatz' },
                { key: 'Sollumsatz',      label: 'SOLLUMSATZ',                                                      bold: true,  sub: 'Fixkosten + Wareneinsatz-Puffer' },
              ].map(row => {
                const total = monthlyData.reduce((s, m) => s + (m as any)[row.key], 0)
                return (
                  <tr key={row.key} className={`border-b border-gray-50 ${row.bold ? 'bg-gray-50 font-semibold' : ''}`}>
                    <td className={`px-4 py-2 sticky left-0 ${row.bold ? 'bg-gray-50' : 'bg-white'} text-gray-700`}>
                      <div>{row.label}</div>
                      {row.sub && <div className="text-gray-400 font-normal text-[10px]">{row.sub}</div>}
                    </td>
                    {monthlyData.map((m, i) => (
                      <td key={i} className="px-3 py-2 text-right text-gray-700">
                        {fmt((m as any)[row.key])} €
                      </td>
                    ))}
                    <td className="px-4 py-2 text-right font-bold text-gray-900 bg-gray-50">{fmt(total)} €</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
