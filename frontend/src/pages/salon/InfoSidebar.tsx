import { useQuery } from '@tanstack/react-query'
import api from '../../api'

interface InfoCard {
  id: string
  title: string
  body: string
  sortOrder: number
  computedKey?: string | null
}

interface Props {
  page: 'mitarbeiter' | 'kosten'
  computedValues: Record<string, string>
  onSimulation?: () => void
}

export default function InfoSidebar({ page, computedValues, onSimulation }: Props) {
  const { data: cards = [] } = useQuery<InfoCard[]>({
    queryKey: ['info-cards', page],
    queryFn: () => api.get(`/info-cards?page=${page}`).then(r => r.data),
  })

  const hasContent = cards.length > 0

  return (
    <div className="space-y-4">
      {onSimulation && (
        <button onClick={onSimulation}
          className="w-full text-left bg-white border border-gray-200 rounded-2xl px-4 py-3 hover:bg-gray-50 transition-colors">
          <p className="text-xs text-gray-500">Was wäre wenn …?</p>
          <p className="text-xl font-bold text-gray-900">Simulation →</p>
        </button>
      )}

      {cards.map(card => {
        const isComputed = card.computedKey && computedValues[card.computedKey] != null
        const computedVal = card.computedKey ? computedValues[card.computedKey] : undefined

        if (isComputed && computedVal !== undefined) {
          return (
            <div key={card.id} className="bg-white border border-gray-200 rounded-2xl p-4">
              <p className="text-xs font-semibold text-gray-500 mb-1">{card.title}</p>
              <p className="text-lg font-bold text-gray-900 mb-1">{computedVal}</p>
              <p className="text-xs leading-relaxed text-gray-500">{card.body}</p>
            </div>
          )
        }

        // Amber card: static admin-added card (no computedKey, or computedKey with no value available)
        return (
          <div key={card.id} className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <p className="text-xs font-semibold text-amber-800 mb-1">{card.title}</p>
            <p className="text-xs text-amber-700 leading-relaxed whitespace-pre-line">{card.body}</p>
          </div>
        )
      })}

      {!hasContent && (
        <p className="text-xs text-gray-400 text-center py-4">
          Noch keine Hinweise vorhanden
        </p>
      )}
    </div>
  )
}
