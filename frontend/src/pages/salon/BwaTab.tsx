import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import api from '../../api'
import type { Salon, CalculationResult } from '../../types'

const MONTHS = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez']

function fmt(n: number) { return n.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) }

export default function BwaTab({ salonId, salon }: { salonId: string; salon: Salon }) {
  const currentYear = new Date().getFullYear()
  const [year, setYear]   = useState(currentYear)
  const [view, setView]   = useState<'monatlich' | 'kumuliert'>('monatlich')
  const [showVJ, setShowVJ] = useState(false)

  const { data: calc } = useQuery<CalculationResult>({
    queryKey: ['calc', salonId],
    queryFn: () => api.get(`/salons/${salonId}/calculation`).then(r => r.data),
  })

  const { data: actuals = [] } = useQuery<any[]>({
    queryKey: ['actuals', salonId, year],
    queryFn: () => api.get(`/salons/${salonId}/actuals?year=${year}`).then(r => r.data),
  })

  // Vorjahr
  const { data: actualsVJ = [] } = useQuery<any[]>({
    queryKey: ['actuals', salonId, year - 1],
    queryFn: () => api.get(`/salons/${salonId}/actuals?year=${year - 1}`).then(r => r.data),
    enabled: showVJ,
  })

  if (!calc) return <p className="text-sm text-gray-400">Lädt…</p>

  const sollMonat   = calc.mindestumsatzNet / 12
  const kostenMonat = (calc.totalPersonalkosten + calc.totalGemeinkosten + calc.unternehmerlohn) / 12

  function istMonatlich(data: any[]) {
    return MONTHS.map((_, i) => data.filter((a: any) => a.month === i + 1).reduce((s: number, a: any) => s + a.actual, 0))
  }

  const istAktuell = istMonatlich(actuals)
  const istVJ      = istMonatlich(actualsVJ)

  const rows = MONTHS.map((name, i) => {
    const ist     = istAktuell[i]
    const vj      = istVJ[i]
    const db      = ist - kostenMonat
    const dbPct   = ist > 0 ? (db / ist) * 100 : 0
    const vjDiff  = vj > 0 ? ((ist - vj) / vj) * 100 : null
    return { name, sollUmsatz: Math.round(sollMonat), istUmsatz: Math.round(ist), istKosten: Math.round(kostenMonat), deckungsbeitrag: Math.round(db), dbPct, vj: Math.round(vj), vjDiff }
  })

  // Kumuliert
  let kumSoll = 0, kumIst = 0, kumKosten = 0, kumVJ = 0
  const kumuliertRows = rows.map(r => {
    kumSoll   += r.sollUmsatz
    kumIst    += r.istUmsatz
    kumKosten += r.istKosten
    kumVJ     += r.vj
    const kumDB   = kumIst - kumKosten
    const kumVJDiff = kumVJ > 0 ? ((kumIst - kumVJ) / kumVJ) * 100 : null
    return { ...r, kumSoll, kumIst, kumKosten, kumDB, kumVJ, kumVJDiff }
  })

  const display = view === 'kumuliert' ? kumuliertRows : rows

  const jahresIst   = rows.reduce((s, r) => s + r.istUmsatz, 0)
  const jahresSoll  = calc.mindestumsatzNet
  const jahresVJ    = rows.reduce((s, r) => s + r.vj, 0)
  const jahresDB    = rows.reduce((s, r) => s + r.deckungsbeitrag, 0)
  const erreichung  = jahresSoll > 0 ? (jahresIst / jahresSoll) * 100 : 0
  const vjGesamt    = jahresVJ > 0 ? ((jahresIst - jahresVJ) / jahresVJ) * 100 : null

  const chartData = rows.map((r, i) => ({
    name: r.name,
    'Plan-Kosten':    r.istKosten,
    'IST-Umsatz':     r.istUmsatz,
    ...(showVJ ? { 'Vorjahr': r.vj } : {}),
    Deckungsbeitrag:  r.deckungsbeitrag,
  }))

  return (
    <div className="space-y-6">
      {/* Jahr + Steuerung */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <select value={year} onChange={e => setYear(parseInt(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
            {[currentYear - 1, currentYear, currentYear + 1].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button onClick={() => setShowVJ(!showVJ)}
            className={`text-sm px-4 py-2 rounded-lg border transition-colors ${showVJ ? 'bg-gray-900 text-white border-gray-900' : 'text-gray-500 border-gray-200 hover:border-gray-400'}`}>
            Vorjahresvergleich {showVJ ? 'an' : 'aus'}
          </button>
        </div>
        <div className="flex gap-2">
          {(['monatlich', 'kumuliert'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`text-xs px-3 py-1 rounded-lg border capitalize ${view === v ? 'bg-gray-900 text-white border-gray-900' : 'text-gray-500 border-gray-200'}`}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">IST-Umsatz</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{fmt(jahresIst)} €</p>
          {showVJ && vjGesamt !== null && (
            <p className={`text-xs mt-1 font-medium ${vjGesamt >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {vjGesamt >= 0 ? '↑' : '↓'} {Math.abs(vjGesamt).toFixed(1)} % vs. VJ
            </p>
          )}
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Plan-Erreichung</p>
          <p className={`text-2xl font-bold mt-1 ${erreichung >= 100 ? 'text-green-600' : erreichung >= 80 ? 'text-amber-600' : 'text-red-600'}`}>
            {erreichung.toFixed(1)} %
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Deckungsbeitrag</p>
          <div className="flex items-center gap-1 mt-1">
            {jahresDB >= 0
              ? <TrendingUp className="w-5 h-5 text-green-600" />
              : <TrendingDown className="w-5 h-5 text-red-500" />}
            <p className={`text-2xl font-bold ${jahresDB >= 0 ? 'text-green-700' : 'text-red-600'}`}>
              {fmt(jahresDB)} €
            </p>
          </div>
        </div>
        {showVJ ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Vorjahr {year - 1}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{fmt(jahresVJ)} €</p>
            {vjGesamt !== null && (
              <p className={`text-xs mt-1 font-medium ${vjGesamt >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {vjGesamt >= 0 ? '+' : ''}{vjGesamt.toFixed(1)} % Wachstum
              </p>
            )}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">DB-Quote</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {jahresIst > 0 ? `${((jahresDB / jahresIst) * 100).toFixed(1)} %` : '—'}
            </p>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-5">
          Plan vs. IST {year} {showVJ ? `vs. VJ ${year - 1}` : ''}
        </h2>
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v: any) => `${fmt(Number(v))} €`} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Plan-Kosten" fill="#e5e7eb" radius={[3,3,0,0]} />
            <Bar dataKey="IST-Umsatz"  fill="#374151" radius={[3,3,0,0]} />
            {showVJ && <Bar dataKey="Vorjahr" fill="#93c5fd" radius={[3,3,0,0]} />}
            <Line type="monotone" dataKey="Deckungsbeitrag" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Tabelle */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-700">BWA-Detailtabelle</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400 border-b border-gray-100">
                <th className="text-left px-4 py-2 font-medium">Monat</th>
                <th className="text-right px-4 py-2 font-medium">Soll</th>
                <th className="text-right px-4 py-2 font-medium">IST</th>
                <th className="text-right px-4 py-2 font-medium">Kosten</th>
                <th className="text-right px-4 py-2 font-medium">DB</th>
                <th className="text-right px-4 py-2 font-medium">DB %</th>
                <th className="text-right px-4 py-2 font-medium">Erreich.</th>
                {showVJ && <th className="text-right px-4 py-2 font-medium">VJ</th>}
                {showVJ && <th className="text-right px-4 py-2 font-medium">+/- VJ</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {display.map((r: any, i) => {
                const ist    = view === 'kumuliert' ? r.kumIst    : r.istUmsatz
                const soll   = view === 'kumuliert' ? r.kumSoll   : r.sollUmsatz
                const kosten = view === 'kumuliert' ? r.kumKosten : r.istKosten
                const db     = view === 'kumuliert' ? r.kumDB     : r.deckungsbeitrag
                const dbQ    = ist > 0 ? (db / ist) * 100 : 0
                const erre   = soll > 0 ? (ist / soll) * 100 : 0
                const vjVal  = view === 'kumuliert' ? r.kumVJ     : r.vj
                const vjDiff = view === 'kumuliert' ? r.kumVJDiff : r.vjDiff
                return (
                  <tr key={i}>
                    <td className="px-4 py-2 font-medium text-gray-900">{r.name}</td>
                    <td className="px-4 py-2 text-right text-gray-400">{fmt(soll)} €</td>
                    <td className="px-4 py-2 text-right font-semibold text-gray-900">{fmt(ist)} €</td>
                    <td className="px-4 py-2 text-right text-gray-400">{fmt(kosten)} €</td>
                    <td className={`px-4 py-2 text-right font-semibold ${db >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {db >= 0 ? '+' : ''}{fmt(db)} €
                    </td>
                    <td className="px-4 py-2 text-right text-gray-600">{dbQ.toFixed(1)} %</td>
                    <td className={`px-4 py-2 text-right font-semibold ${erre >= 100 ? 'text-green-600' : erre >= 80 ? 'text-amber-500' : 'text-red-500'}`}>
                      {erre.toFixed(1)} %
                    </td>
                    {showVJ && <td className="px-4 py-2 text-right text-blue-600">{fmt(vjVal)} €</td>}
                    {showVJ && (
                      <td className={`px-4 py-2 text-right font-semibold ${vjDiff === null ? 'text-gray-300' : vjDiff >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {vjDiff === null ? '—' : `${vjDiff >= 0 ? '+' : ''}${vjDiff.toFixed(1)} %`}
                      </td>
                    )}
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
