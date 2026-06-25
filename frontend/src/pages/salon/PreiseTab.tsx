import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Wand2, Trash2, Tag } from 'lucide-react'
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
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [showWizard, setShowWizard]         = useState(false)

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

  function openWizard(svc?: Service) {
    setEditingService(svc ?? null)
    setShowWizard(true)
  }

  function closeWizard() {
    setShowWizard(false)
    setEditingService(null)
  }

  function onSaved() {
    qc.invalidateQueries({ queryKey: ['services', salonId] })
    qc.invalidateQueries({ queryKey: ['calc', salonId] })
    qc.invalidateQueries({ queryKey: ['salon', salonId] })
    closeWizard()
  }

  return (
    <div className="space-y-6">
      {!readOnly && (
        <div className="flex items-center justify-end">
          <button onClick={() => openWizard()}
            className="flex items-center gap-1.5 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800">
            <Wand2 className="w-4 h-4" /> Preiskalkulation
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
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden"><div className="overflow-x-auto">
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
                {!readOnly && <th className="px-5 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {services.map(svc => {
                const price = priceMap[svc.id]
                return (
                  <tr key={svc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{svc.name}</p>
                      <p className="text-xs text-gray-400">{CAT_LABEL[svc.category]}</p>
                    </td>
                    <td className="px-5 py-3 text-right text-gray-600 whitespace-nowrap">{svc.durationMinutes}'</td>
                    <td className="px-5 py-3 text-right text-gray-600 whitespace-nowrap">{fmt(svc.materialCost)} €</td>
                    <td className="px-5 py-3 text-right text-gray-600 whitespace-nowrap">{svc.utilizationPct} %</td>
                    <td className="px-5 py-3 text-right text-gray-700 whitespace-nowrap">
                      {price ? `${fmt(price.selbstkosten)} €` : '—'}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900 whitespace-nowrap">
                      {price ? `${fmt(price.nettopreis)} €` : '—'}
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-gray-900 whitespace-nowrap">
                      {price ? `${fmt(price.bruttopreis)} €` : '—'}
                    </td>
                    {!readOnly && (
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openWizard(svc)}
                            className="p-2 text-gray-400 hover:text-gray-700 text-xs font-medium">
                            Bearbeiten
                          </button>
                          <button onClick={() => deleteMutation.mutate(svc.id)}
                            className="p-2 text-gray-400 hover:text-red-500">
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {showWizard && (
        <PreisWizardModal
          salonId={salonId}
          calc={calc}
          initial={editingService}
          onClose={closeWizard}
          onSaved={onSaved}
        />
      )}
    </div>
  )
}
