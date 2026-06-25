import { useQuery } from '@tanstack/react-query'
import { TrendingUp, Info } from 'lucide-react'
import api from '../../api'
import type { Salon, CalculationResult, Employee } from '../../types'

function fmt(n: number) { return n.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) }

interface LFVariant {
  label: string
  desc: string
  lohnfaktor: number
  bruttolohnsumme: number
}

function calcVariants(employees: Employee[], mindestumsatz: number, employerRate: number): LFVariant[] {
  const productive = employees.filter(e => e.role === 'FRISEUR' || e.role === 'CHEF')
  if (productive.length === 0) return []

  const activeSum = (emp: Employee) => emp.activeMonths.reduce((s, m) => s + m, 0)

  // Variante 1: Grundlohn (nur Bruttogehalt, keine Boni)
  const grundlohn = productive.reduce((s, e) => s + e.grossSalary * activeSum(e), 0)

  // Variante 2: inkl. Sonderzahlungen
  const mitBoni = productive.reduce((s, e) =>
    s + e.grossSalary * activeSum(e) + e.christmasBonus + e.holidayBonus + e.capitalFormation + e.taxFreeBonus, 0)

  // Variante 3: Durchschnittslohn (Mittelwert der MA × 12)
  const avgSalary  = productive.reduce((s, e) => s + e.grossSalary, 0) / productive.length
  const durchschnitt = avgSalary * 12 * productive.length

  // Variante 4: Höchstlohn (höchstes Gehalt als Basis)
  const maxSalary  = Math.max(...productive.map(e => e.grossSalary))
  const hoechstlohn = maxSalary * 12 * productive.length

  return [
    { label: 'Grundlohn',              desc: 'Nur Bruttogehalt',              lohnfaktor: grundlohn   > 0 ? mindestumsatz / grundlohn    : 0, bruttolohnsumme: grundlohn },
    { label: 'Inkl. Sonderzahlungen',  desc: 'Brutto + Weihnachts-/Urlaubsgeld', lohnfaktor: mitBoni  > 0 ? mindestumsatz / mitBoni      : 0, bruttolohnsumme: mitBoni },
    { label: 'Durchschnittslohn',      desc: 'Ø Gehalt aller produktiven MA', lohnfaktor: durchschnitt > 0 ? mindestumsatz / durchschnitt : 0, bruttolohnsumme: durchschnitt },
    { label: 'Höchstlohn',             desc: 'Höchstes Gehalt als Basis',     lohnfaktor: hoechstlohn  > 0 ? mindestumsatz / hoechstlohn  : 0, bruttolohnsumme: hoechstlohn },
  ]
}

export default function LohnfaktorTab({ salonId, salon }: { salonId: string; salon: Salon }) {
  const { data: calc, isLoading } = useQuery<CalculationResult>({
    queryKey: ['calc', salonId],
    queryFn: () => api.get(`/salons/${salonId}/calculation`).then(r => r.data),
  })

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ['employees', salonId],
    queryFn: () => api.get(`/salons/${salonId}/employees`).then(r => r.data),
  })

  if (isLoading) return <p className="text-sm text-gray-400">Berechne…</p>

  if (!calc || calc.bruttolohnsumme === 0) return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex gap-3">
      <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-medium text-amber-900">Keine Daten vorhanden</p>
        <p className="text-sm text-amber-700 mt-1">
          Gib zuerst Mitarbeiter (Friseure / Inhaber) und Kosten ein.
        </p>
      </div>
    </div>
  )

  const variants = calcVariants(employees, calc.mindestumsatzNet, calc.employerRate)
  const lohnfaktorColor = (lf: number) =>
    lf < 2.5 ? 'text-green-700' : lf < 3.5 ? 'text-amber-600' : 'text-red-600'

  return (
    <div className="space-y-6">
      {/* Lohnfaktor Hero */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Lohnfaktor (Grundlohn)</p>
            <p className={`text-3xl sm:text-5xl font-bold mt-1 ${lohnfaktorColor(calc.lohnfaktor)}`}>
              {calc.lohnfaktor.toFixed(2)}
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Gesamtkosten {fmt(calc.mindestumsatzNet)} € ÷ Bruttolöhne {fmt(calc.bruttolohnsumme)} €
            </p>
          </div>
          <TrendingUp className={`w-8 h-8 ${lohnfaktorColor(calc.lohnfaktor)}`} />
        </div>
        <div className="mt-4 p-3 bg-gray-50 rounded-xl text-xs text-gray-600">
          <strong>Bedeutung:</strong> Ein Mitarbeiter mit 2.500 € Bruttolohn muss{' '}
          <strong>{fmt(2500 * calc.lohnfaktor)} €</strong> Umsatz / Monat machen, damit der Salon kostendeckend arbeitet.
        </div>
      </div>

      {/* 4 Lohnfaktor-Varianten */}
      {variants.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700">Lohnfaktor-Varianten</h2>
            <p className="text-xs text-gray-400 mt-0.5">4 Berechnungsbasen — wie in der Original-Kalkulation</p>
          </div>
          <div className="divide-y divide-gray-50">
            {variants.map((v, i) => (
              <div key={i} className={`flex items-center justify-between px-5 py-4 ${i === 0 ? 'bg-gray-50/50' : ''}`}>
                <div>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    {v.label}
                    {i === 0 && <span className="text-xs bg-gray-900 text-white px-2 py-0.5 rounded-full font-medium">Standard</span>}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{v.desc} · Basis: {fmt(v.bruttolohnsumme)} €</p>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${lohnfaktorColor(v.lohnfaktor)}`}>
                    {v.lohnfaktor.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    2.500 € → {fmt(2500 * v.lohnfaktor)} € / Mo.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sollumsatz je MA */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-700">Sollumsatz je produktivem Mitarbeiter</h2>
        </div>
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-400 border-b border-gray-100">
              <th className="text-left px-5 py-2 font-medium">Name</th>
              <th className="text-right px-5 py-2 font-medium">Brutto / Mo.</th>
              <th className="text-right px-5 py-2 font-medium">Soll / Monat</th>
              <th className="text-right px-5 py-2 font-medium">Soll / Tag</th>
              <th className="text-right px-5 py-2 font-medium">Soll / Stunde</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {calc.sollUmsatzPerEmployee.map(emp => {
              const employee = employees.find(e => e.id === emp.id)
              return (
                <tr key={emp.id}>
                  <td className="px-5 py-3 font-medium text-gray-900">{emp.name}</td>
                  <td className="px-5 py-3 text-right text-gray-500">
                    {employee ? `${fmt(employee.grossSalary)} €` : '—'}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="font-semibold text-gray-900">{fmt(emp.sollMonat)} €</span>
                  </td>
                  <td className="px-5 py-3 text-right text-gray-600">{fmt(emp.sollTag)} €</td>
                  <td className="px-5 py-3 text-right text-gray-600">{fmt(emp.sollStunde)} €</td>
                </tr>
              )
            })}
          </tbody>
        </table></div>
      </div>

      {/* Kosten pro Minute */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">PK / Minute</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{(calc.pkProMinute * 100).toFixed(2)} Ct.</p>
          <p className="text-xs text-gray-400 mt-0.5">Personalkosten pro Arbeitsminute</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">GK / Minute</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{(calc.gkProMinute * 100).toFixed(2)} Ct.</p>
          <p className="text-xs text-gray-400 mt-0.5">Gemeinkosten pro Arbeitsminute</p>
        </div>
      </div>
    </div>
  )
}
