import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { BarChart2, TrendingUp } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import api from '../../api'
import type { Salon, Employee, ActualRevenue, CalculationResult } from '../../types'

const MONTHS = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez']

function fmt(n: number) { return n.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) }

// Provision: 10 % auf Mehrleistung über Sollumsatz (konfigurierbar)
const PROVISION_RATE = 0.10

export default function ControllingTab({ salonId, salon, readOnly = false }: { salonId: string; salon: Salon; readOnly?: boolean }) {
  const [selectedYear] = useState(new Date().getFullYear())
  const [activeEmployee, setActiveEmployee] = useState<string | null>(null)
  const qc = useQueryClient()

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ['employees', salonId],
    queryFn: () => api.get(`/salons/${salonId}/employees`).then(r => r.data),
  })

  const { data: calc } = useQuery<CalculationResult>({
    queryKey: ['calc', salonId],
    queryFn: () => api.get(`/salons/${salonId}/calculation`).then(r => r.data),
  })

  const { data: actuals = [] } = useQuery<ActualRevenue[]>({
    queryKey: ['actuals', salonId, selectedYear],
    queryFn: () => api.get(`/salons/${salonId}/actuals?year=${selectedYear}`).then(r => r.data),
  })

  const updateActual = useMutation({
    mutationFn: (data: { employeeId: string; month: number; year: number; actual: number }) =>
      api.put(`/salons/${salonId}/actuals`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['actuals', salonId, selectedYear] }),
  })

  const productive  = employees.filter(e => e.role === 'FRISEUR' || e.role === 'CHEF')
  const sollMap     = Object.fromEntries((calc?.sollUmsatzPerEmployee ?? []).map(e => [e.id, e.sollMonat]))

  function getActual(employeeId: string, month: number) {
    return actuals.find(a => a.employeeId === employeeId && a.month === month)?.actual ?? 0
  }

  function handleActualChange(employeeId: string, month: number, value: string) {
    updateActual.mutate({ employeeId, month, year: selectedYear, actual: parseFloat(value) || 0 })
  }

  // Monatliche Gesamtauswertung — Soll nur für aktive MAs im jeweiligen Monat
  const monthlyTotals = MONTHS.map((_, i) => {
    const soll = productive.reduce((s, e) => {
      const isActive = e.activeMonths?.[i] === 1
      return s + (isActive ? (sollMap[e.id] ?? 0) : 0)
    }, 0)
    const ist  = productive.reduce((s, e) => s + getActual(e.id, i + 1), 0)
    return { name: MONTHS[i], Soll: Math.round(soll), IST: Math.round(ist), diff: Math.round(ist - soll) }
  })

  // Provision je MA (Jahressumme) — Soll nur für aktive Monate
  const provisionData = productive.map(emp => {
    const soll        = sollMap[emp.id] ?? 0
    const istJahr     = MONTHS.reduce((s, _, i) => s + getActual(emp.id, i + 1), 0)
    const sollJahr    = MONTHS.reduce((s, _, i) => s + (emp.activeMonths?.[i] === 1 ? soll : 0), 0)
    const mehrleistung = Math.max(0, istJahr - sollJahr)
    const provision    = Math.round(mehrleistung * PROVISION_RATE)
    return { name: emp.name, sollJahr, istJahr, mehrleistung, provision }
  })

  if (productive.length === 0) return (
    <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center">
      <BarChart2 className="w-8 h-8 text-gray-300 mx-auto mb-3" />
      <p className="text-sm font-medium text-gray-900">Keine produktiven Mitarbeiter</p>
      <p className="text-sm text-gray-500 mt-1">Lege zuerst Friseure oder Inhaber an.</p>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Jahresverlauf Linie */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Soll-Ist-Verlauf {selectedYear}</h2>
        <p className="text-xs text-gray-400 mb-5">Gesamt-Umsatz aller produktiven Mitarbeiter</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={monthlyTotals}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v: any) => `${fmt(Number(v))} €`} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="Soll" stroke="#d1d5db" strokeWidth={2} dot={false} strokeDasharray="5 5" />
            <Line type="monotone" dataKey="IST"  stroke="#111827" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Monats-Tabelle */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-700">Monatsübersicht</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400 border-b border-gray-100">
                <th className="text-left px-4 py-2 font-medium">Monat</th>
                <th className="text-right px-4 py-2 font-medium">Soll</th>
                <th className="text-right px-4 py-2 font-medium">IST</th>
                <th className="text-right px-4 py-2 font-medium">+/−</th>
                <th className="px-4 py-2 font-medium text-center w-32">Erreichung</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {monthlyTotals.map(({ name, Soll, IST, diff }) => {
                const pct = Soll > 0 ? Math.min((IST / Soll) * 100, 150) : 0
                return (
                  <tr key={name}>
                    <td className="px-4 py-2 font-medium text-gray-900">{name}</td>
                    <td className="px-4 py-2 text-right text-gray-500">{fmt(Soll)} €</td>
                    <td className="px-4 py-2 text-right font-semibold text-gray-900">{fmt(IST)} €</td>
                    <td className={`px-4 py-2 text-right font-semibold ${diff >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {diff >= 0 ? '+' : ''}{fmt(diff)} €
                    </td>
                    <td className="px-4 py-2 w-32">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${pct >= 100 ? 'bg-green-500' : pct >= 80 ? 'bg-amber-400' : 'bg-red-400'}`}
                            style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-gray-500 w-8 text-right">{pct.toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold text-sm">
                <td className="px-4 py-3 text-gray-900">Gesamt</td>
                <td className="px-4 py-3 text-right text-gray-600">{fmt(monthlyTotals.reduce((s, r) => s + r.Soll, 0))} €</td>
                <td className="px-4 py-3 text-right text-gray-900">{fmt(monthlyTotals.reduce((s, r) => s + r.IST, 0))} €</td>
                {(() => {
                  const totalDiff = monthlyTotals.reduce((s, r) => s + r.diff, 0)
                  return (
                    <td className={`px-4 py-3 text-right ${totalDiff >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {totalDiff >= 0 ? '+' : ''}{fmt(totalDiff)} €
                    </td>
                  )
                })()}
                <td className="px-4 py-3" />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* IST-Eingabe je MA */}
      {!readOnly && <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">IST-Umsatz eingeben</h2>
          <div className="flex gap-2">
            <button onClick={() => setActiveEmployee(null)}
              className={`text-xs px-3 py-1 rounded-lg border ${!activeEmployee ? 'bg-gray-900 text-white border-gray-900' : 'text-gray-500 border-gray-200'}`}>
              Alle
            </button>
            {productive.map(e => (
              <button key={e.id} onClick={() => setActiveEmployee(e.id === activeEmployee ? null : e.id)}
                className={`text-xs px-3 py-1 rounded-lg border ${activeEmployee === e.id ? 'bg-gray-900 text-white border-gray-900' : 'text-gray-500 border-gray-200'}`}>
                {e.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-medium sticky left-0 bg-white">Mitarbeiter</th>
                {MONTHS.map(m => <th key={m} className="text-center px-2 py-3 font-medium min-w-[70px]">{m}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {productive
                .filter(e => !activeEmployee || e.id === activeEmployee)
                .map(emp => (
                  <tr key={emp.id}>
                    <td className="px-4 py-2 font-medium text-gray-900 sticky left-0 bg-white">
                      <div>{emp.name}</div>
                      <div className="text-gray-400 font-normal">Soll: {fmt(sollMap[emp.id] ?? 0)} €</div>
                    </td>
                    {MONTHS.map((_, i) => {
                      const actual = getActual(emp.id, i + 1)
                      const soll   = sollMap[emp.id] ?? 0
                      const over   = soll > 0 && actual >= soll
                      return (
                        <td key={i} className="px-2 py-2">
                          <input
                            type="number"
                            defaultValue={actual || ''}
                            placeholder="0"
                            onBlur={e => handleActualChange(emp.id, i + 1, e.target.value)}
                            className={`w-full text-center border rounded-md px-1 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-900 ${
                              over ? 'border-green-300 bg-green-50' : 'border-gray-200'
                            }`}
                          />
                        </td>
                      )
                    })}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>}

      {/* Provision */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-700">Provision {selectedYear}</h2>
          <span className="text-xs text-gray-400">({(PROVISION_RATE * 100).toFixed(0)} % auf Mehrleistung)</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-400 border-b border-gray-100">
              <th className="text-left px-5 py-2 font-medium">Mitarbeiter</th>
              <th className="text-right px-5 py-2 font-medium">Soll / Jahr</th>
              <th className="text-right px-5 py-2 font-medium">IST / Jahr</th>
              <th className="text-right px-5 py-2 font-medium">Mehrleistung</th>
              <th className="text-right px-5 py-2 font-medium">Provision</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {provisionData.map(p => (
              <tr key={p.name}>
                <td className="px-5 py-3 font-medium text-gray-900">{p.name}</td>
                <td className="px-5 py-3 text-right text-gray-500">{fmt(p.sollJahr)} €</td>
                <td className="px-5 py-3 text-right text-gray-700">{fmt(p.istJahr)} €</td>
                <td className={`px-5 py-3 text-right font-semibold ${p.mehrleistung > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                  {p.mehrleistung > 0 ? `+${fmt(p.mehrleistung)} €` : '—'}
                </td>
                <td className={`px-5 py-3 text-right font-bold ${p.provision > 0 ? 'text-green-700' : 'text-gray-400'}`}>
                  {p.provision > 0 ? `${fmt(p.provision)} €` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold text-sm">
              <td className="px-5 py-3 text-gray-900">Gesamt</td>
              <td className="px-5 py-3 text-right text-gray-600">{fmt(provisionData.reduce((s, p) => s + p.sollJahr, 0))} €</td>
              <td className="px-5 py-3 text-right text-gray-900">{fmt(provisionData.reduce((s, p) => s + p.istJahr, 0))} €</td>
              <td className="px-5 py-3 text-right text-green-600">+{fmt(provisionData.reduce((s, p) => s + p.mehrleistung, 0))} €</td>
              <td className="px-5 py-3 text-right text-green-700 font-bold">{fmt(provisionData.reduce((s, p) => s + p.provision, 0))} €</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
