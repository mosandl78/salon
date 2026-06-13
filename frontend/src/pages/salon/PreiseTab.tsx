import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Tag, Wand2 } from 'lucide-react'
import api from '../../api'
import type { Salon, Service, ServiceCategory, CalculationResult } from '../../types'
import PreisWizardModal from './PreisWizardModal'

const CAT_LABEL: Record<ServiceCategory, string> = {
  WASCHEN_SCHNEIDEN_FOENEN: 'Waschen / Schneiden / Fönen',
  HERRENHAARSCHNITT: 'Herrenhaarschnitt',
  FARBE: 'Farbe',
  STRAEHNEN: 'Strähnen',
  BALAYAGE: 'Balayage',
  VERLAENGERUNG: 'Verlängerung / Zweithaar',
  CUSTOM: 'Eigene Dienstleistung',
}

function fmt(n: number) {
  return n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function PreiseTab({ salonId, salon, readOnly = false }: { salonId: string; salon: Salon; readOnly?: boolean }) {
  const qc = useQueryClient()
  const [editing, setEditing]     = useState<Service | null>(null)
  const [showForm, setShowForm]   = useState(false)
  const [showWizard, setShowWizard] = useState(false)

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ['services', salonId],
    queryFn: () => api.get(`/salons/${salonId}`).then(r => r.data.services ?? []),
  })

  const { data: calc } = useQuery<CalculationResult>({
    queryKey: ['calc', salonId],
    queryFn: () => api.get(`/salons/${salonId}/calculation`).then(r => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/salons/${salonId}/services/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services', salonId] })
      qc.invalidateQueries({ queryKey: ['calc', salonId] })
      qc.invalidateQueries({ queryKey: ['salon', salonId] })
    },
  })

  const priceMap = Object.fromEntries((calc?.servicePrices ?? []).map(p => [p.id, p]))

  return (
    <div className="space-y-6">
      {!readOnly && (
        <div className="flex items-center justify-end gap-2">
          <button onClick={() => { setEditing(null); setShowForm(true) }}
            className="flex items-center gap-1.5 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
            <Plus className="w-4 h-4" /> Schnell-Erfassung
          </button>
          <button onClick={() => setShowWizard(true)}
            className="flex items-center gap-1.5 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800">
            <Wand2 className="w-4 h-4" /> Geführte Kalkulation
          </button>
        </div>
      )}

      {services.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center">
          <Tag className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-900">Noch keine Dienstleistungen</p>
          <p className="text-sm text-gray-500 mt-1">Füge Dienstleistungen hinzu um Preise zu kalkulieren.</p>
        </div>
      ) : (
        <div className="overflow-x-auto"><div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 font-medium">Dienstleistung</th>
                <th className="text-right px-5 py-3 font-medium">Minuten</th>
                <th className="text-right px-5 py-3 font-medium">Material</th>
                <th className="text-right px-5 py-3 font-medium">Auslastung</th>
                <th className="text-right px-5 py-3 font-medium">Selbstkosten</th>
                <th className="text-right px-5 py-3 font-medium">Netto</th>
                <th className="text-right px-5 py-3 font-medium">Brutto</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {services.map(svc => {
                const price = priceMap[svc.id]
                return (
                  <tr key={svc.id}>
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{svc.name}</p>
                      <p className="text-xs text-gray-400">{CAT_LABEL[svc.category]}</p>
                    </td>
                    <td className="px-5 py-3 text-right text-gray-600">{svc.durationMinutes}'</td>
                    <td className="px-5 py-3 text-right text-gray-600">{fmt(svc.materialCost)} €</td>
                    <td className="px-5 py-3 text-right text-gray-600">{svc.utilizationPct} %</td>
                    <td className="px-5 py-3 text-right text-gray-700">
                      {price ? `${fmt(price.selbstkosten)} €` : '—'}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900">
                      {price ? `${fmt(price.nettopreis)} €` : '—'}
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-gray-900">
                      {price ? `${fmt(price.bruttopreis)} €` : '—'}
                    </td>
                    {!readOnly && (
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => { setEditing(svc); setShowForm(true) }}
                            className="p-2 text-gray-400 hover:text-gray-700"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => deleteMutation.mutate(svc.id)}
                            className="p-2 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div></div>
      )}

      {showForm && (
        <ServiceModal
          salonId={salonId}
          initial={editing}
          onClose={() => { setShowForm(false); setEditing(null) }}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ['services', salonId] })
            qc.invalidateQueries({ queryKey: ['calc', salonId] })
            qc.invalidateQueries({ queryKey: ['salon', salonId] })
            setShowForm(false); setEditing(null)
          }}
        />
      )}

      {showWizard && (
        <PreisWizardModal
          salonId={salonId}
          calc={calc}
          onClose={() => setShowWizard(false)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ['services', salonId] })
            qc.invalidateQueries({ queryKey: ['calc', salonId] })
            qc.invalidateQueries({ queryKey: ['salon', salonId] })
            setShowWizard(false)
          }}
        />
      )}
    </div>
  )
}

function ServiceModal({ salonId, initial, onClose, onSaved }:
  { salonId: string; initial: Service | null; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!initial
  const [category, setCategory]     = useState<ServiceCategory>(initial?.category ?? 'CUSTOM')
  const [name, setName]             = useState(initial?.name ?? '')
  const [duration, setDuration]     = useState(initial?.durationMinutes?.toString() ?? '30')
  const [material, setMaterial]     = useState(initial?.materialCost?.toString() ?? '0')
  const [utilization, setUtil]      = useState(initial?.utilizationPct?.toString() ?? '80')
  const [profitMarkup, setProfit]   = useState(initial?.profitMarkup?.toString() ?? '10')
  const [error, setError]           = useState('')

  const mutation = useMutation({
    mutationFn: (data: any) => isEdit
      ? api.patch(`/salons/${salonId}/services/${initial!.id}`, data)
      : api.post(`/salons/${salonId}/services`, data),
    onSuccess: onSaved,
    onError: (e: any) => setError(e.response?.data?.error ?? 'Fehler'),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    mutation.mutate({ category, name, durationMinutes: duration, materialCost: material, utilizationPct: utilization, profitMarkup })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-5">
          {isEdit ? 'Dienstleistung bearbeiten' : 'Dienstleistung hinzufügen'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Kategorie</label>
            <select value={category} onChange={e => setCategory(e.target.value as ServiceCategory)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
              {(Object.keys(CAT_LABEL) as ServiceCategory[]).map(c => (
                <option key={c} value={c}>{CAT_LABEL[c]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Bezeichnung</label>
            <input value={name} onChange={e => setName(e.target.value)} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Dauer (Minuten)</label>
              <input type="number" value={duration} onChange={e => setDuration(e.target.value)} required min="1"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Materialkosten (€)</label>
              <input type="number" value={material} onChange={e => setMaterial(e.target.value)} min="0" step="0.01"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Auslastung (%)</label>
              <input type="number" value={utilization} onChange={e => setUtil(e.target.value)} min="10" max="100"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Gewinnaufschlag (%)</label>
              <input type="number" value={profitMarkup} onChange={e => setProfit(e.target.value)} min="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
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
