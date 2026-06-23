import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Receipt } from 'lucide-react'
import api from '../../api'
import type { Salon, CostItem, CostCategory, CalculationResult } from '../../types'

const CATEGORY_GROUPS: { label: string; categories: CostCategory[] }[] = [
  { label: 'Raumkosten',      categories: ['MIETE', 'NEBENKOSTEN', 'STROM', 'WASSER'] },
  { label: 'Kommunikation',   categories: ['TELEFON', 'INTERNET'] },
  { label: 'Betrieb',         categories: ['VERSICHERUNG', 'STEUERBERATUNG', 'BANKGEBUEHREN', 'LEASING', 'REPARATUREN'] },
  { label: 'Marketing',       categories: ['WERBUNG', 'WEITERBILDUNG'] },
  { label: 'Sonstiges',       categories: ['SONSTIGE', 'ZINSEN', 'TILGUNG'] },
  { label: 'Waren & Entnahme',categories: ['WARENEINSATZ', 'UNTERNEHMERLOHN'] },
]

const CATEGORY_LABEL: Record<CostCategory, string> = {
  MIETE: 'Miete', NEBENKOSTEN: 'Nebenkosten', STROM: 'Strom', WASSER: 'Wasser',
  TELEFON: 'Telefon', INTERNET: 'Internet', VERSICHERUNG: 'Versicherung',
  STEUERBERATUNG: 'Steuerberatung', BANKGEBUEHREN: 'Bankgebühren', LEASING: 'Leasing',
  REPARATUREN: 'Reparaturen', WERBUNG: 'Werbung', WEITERBILDUNG: 'Weiterbildung',
  SONSTIGE: 'Sonstige', ZINSEN: 'Zinsen', TILGUNG: 'Tilgung',
  WARENEINSATZ: 'Wareneinsatz (%)', UNTERNEHMERLOHN: 'Unternehmerlohn',
}

function fmt(n: number) { return n.toLocaleString('de-DE') }
function annual(amounts: number[]) { return amounts.reduce((s, v) => s + v, 0) }

export default function KostenTab({ salonId, salon, readOnly = false }: { salonId: string; salon: Salon; readOnly?: boolean }) {
  const qc = useQueryClient()
  const [editing, setEditing]   = useState<CostItem | null>(null)
  const [showForm, setShowForm] = useState(false)

  const { data: calc } = useQuery<CalculationResult>({
    queryKey: ['calc', salonId],
    queryFn: () => api.get(`/salons/${salonId}/calculation`).then(r => r.data),
  })

  const { data: costs = [] } = useQuery<CostItem[]>({
    queryKey: ['costs', salonId],
    queryFn: () => api.get(`/salons/${salonId}/costs`).then(r => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/salons/${salonId}/costs/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['costs', salonId] })
      qc.invalidateQueries({ queryKey: ['calc', salonId] })
    },
  })

  const totalJahr = costs
    .filter(c => c.category !== 'WARENEINSATZ')
    .reduce((s, c) => s + annual(c.amounts), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="bg-white border border-gray-200 rounded-xl px-5 py-3">
          <p className="text-xs text-gray-500">Gesamtkosten / Jahr</p>
          <p className="text-xl font-bold text-gray-900">{fmt(totalJahr)} €</p>
        </div>
        {!readOnly && (
          <button onClick={() => { setEditing(null); setShowForm(true) }}
            className="flex items-center gap-1.5 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800">
            <Plus className="w-4 h-4" /> Kostenposition hinzufügen
          </button>
        )}
      </div>

      {costs.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center">
          <Receipt className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-900">Noch keine Kosten erfasst</p>
          <p className="text-sm text-gray-500 mt-1">Füge Miete, Strom, Versicherungen und weitere Kosten hinzu.</p>
        </div>
      ) : (
        CATEGORY_GROUPS.map(group => {
          const items = costs.filter(c => group.categories.includes(c.category))
          if (items.length === 0) return null
          const groupTotal = items.filter(c => c.category !== 'WARENEINSATZ').reduce((s, c) => s + annual(c.amounts), 0)
          return (
            <div key={group.label} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700">{group.label}</span>
                {groupTotal > 0 && <span className="text-xs text-gray-500">{fmt(groupTotal)} € / Jahr</span>}
              </div>
              <div className="overflow-x-auto"><table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 border-b border-gray-100">
                    <th className="text-left px-5 py-2 font-medium">Bezeichnung</th>
                    <th className="text-right px-5 py-2 font-medium">/ Monat</th>
                    <th className="text-right px-5 py-2 font-medium">/ Jahr</th>
                    <th className="px-5 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map(cost => (
                    <tr key={cost.id}>
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-900">{cost.label}</p>
                        <p className="text-xs text-gray-400">{CATEGORY_LABEL[cost.category]}</p>
                      </td>
                      <td className="px-5 py-3 text-right text-gray-700">
                        {cost.category === 'WARENEINSATZ'
                          ? `${((cost.amounts[0] ?? 0) * 100).toFixed(0)} %`
                          : `${fmt(annual(cost.amounts) / 12)} €`}
                      </td>
                      <td className="px-5 py-3 text-right text-gray-500">
                        {cost.category === 'WARENEINSATZ'
                          ? calc ? `${fmt(Math.round(calc.mindestumsatzNet * calc.wareneinsatzRate))} €` : '—'
                          : `${fmt(annual(cost.amounts))} €`}
                      </td>
                      {!readOnly && (
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => { setEditing(cost); setShowForm(true) }}
                              className="p-2 text-gray-400 hover:text-gray-700"><Pencil className="w-4 h-4" /></button>
                            <button onClick={() => deleteMutation.mutate(cost.id)}
                              className="p-2 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table></div>
            </div>
          )
        })
      )}

      {showForm && (
        <CostModal
          salonId={salonId}
          initial={editing}
          onClose={() => { setShowForm(false); setEditing(null) }}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ['costs', salonId] })
            qc.invalidateQueries({ queryKey: ['calc', salonId] })
            setShowForm(false); setEditing(null)
          }}
        />
      )}
    </div>
  )
}

function CostModal({ salonId, initial, onClose, onSaved }:
  { salonId: string; initial: CostItem | null; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!initial
  const [category, setCategory] = useState<CostCategory>(initial?.category ?? 'MIETE')
  const [label, setLabel]       = useState(initial?.label ?? '')
  const [monthly, setMonthly]   = useState(
    initial ? (initial.category === 'WARENEINSATZ'
      ? (initial.amounts[0] * 100).toString()
      : (initial.amounts.reduce((s, v) => s + v, 0) / 12).toString())
    : ''
  )
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: (data: any) => isEdit
      ? api.patch(`/salons/${salonId}/costs/${initial!.id}`, data)
      : api.post(`/salons/${salonId}/costs`, data),
    onSuccess: onSaved,
    onError: (e: any) => setError(e.response?.data?.error ?? 'Fehler'),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const val = parseFloat(monthly) || 0
    const amounts = category === 'WARENEINSATZ'
      ? Array(12).fill(val / 100)
      : Array(12).fill(val)
    mutation.mutate({ category, label, amounts })
  }

  const allCategories = CATEGORY_GROUPS.flatMap(g => g.categories)

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-5">
          {isEdit ? 'Kosten bearbeiten' : 'Kosten hinzufügen'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Kategorie</label>
            <select value={category} onChange={e => setCategory(e.target.value as CostCategory)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
              {allCategories.map(c => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
            </select>
            {category === 'UNTERNEHMERLOHN' && (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
                💡 Tipp: Wenn der Inhaber auch aktiv im Salon arbeitet, kann er zusätzlich unter <strong>Mitarbeiter → Inhaber/in</strong> erfasst werden — damit fließt er in den Lohnfaktor ein.
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Bezeichnung</label>
            <input value={label} onChange={e => setLabel(e.target.value)} required
              placeholder={CATEGORY_LABEL[category]}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {category === 'WARENEINSATZ' ? 'Wareneinsatz (% vom Umsatz)' : 'Betrag / Monat (€)'}
            </label>
            <input type="number" value={monthly} onChange={e => setMonthly(e.target.value)} required min="0" step="0.01"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            {category !== 'WARENEINSATZ' && monthly && (
              <p className="text-xs text-gray-400 mt-1">= {((parseFloat(monthly) || 0) * 12).toLocaleString('de-DE')} € / Jahr</p>
            )}
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm hover:bg-gray-50">
              Abbrechen
            </button>
            <button type="submit" disabled={mutation.isPending}
              className="flex-1 bg-gray-900 text-white rounded-lg py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50">
              {mutation.isPending ? 'Speichern…' : 'Speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
