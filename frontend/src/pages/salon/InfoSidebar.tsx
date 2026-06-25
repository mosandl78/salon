import { useQuery } from '@tanstack/react-query'
import { Lightbulb } from 'lucide-react'
import api from '../../api'

interface InfoCard {
  id: string
  title: string
  body: string
  sortOrder: number
}

interface InsightCard {
  title: string
  value?: string
  body: string
  highlight?: boolean
}

interface Props {
  page: 'mitarbeiter' | 'kosten'
  insights: InsightCard[]
}

export default function InfoSidebar({ page, insights }: Props) {
  const { data: cards = [] } = useQuery<InfoCard[]>({
    queryKey: ['info-cards', page],
    queryFn: () => api.get(`/info-cards?page=${page}`).then(r => r.data),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Lightbulb className="w-4 h-4 text-amber-500" />
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Insights & Hinweise</h3>
      </div>

      {/* Dynamische Einblicke */}
      {insights.map((insight, i) => (
        <div key={i} className={`rounded-2xl p-4 border ${
          insight.highlight
            ? 'bg-gray-900 text-white border-gray-900'
            : 'bg-white border-gray-200'
        }`}>
          <p className={`text-xs font-semibold mb-1 ${insight.highlight ? 'text-gray-400' : 'text-gray-500'}`}>
            {insight.title}
          </p>
          {insight.value && (
            <p className={`text-lg font-bold mb-1 ${insight.highlight ? 'text-white' : 'text-gray-900'}`}>
              {insight.value}
            </p>
          )}
          <p className={`text-xs leading-relaxed ${insight.highlight ? 'text-gray-400' : 'text-gray-500'}`}>
            {insight.body}
          </p>
        </div>
      ))}

      {/* Admin-editierbare Karten */}
      {cards.map(card => (
        <div key={card.id} className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-xs font-semibold text-amber-800 mb-1">{card.title}</p>
          <p className="text-xs text-amber-700 leading-relaxed whitespace-pre-line">{card.body}</p>
        </div>
      ))}

      {insights.length === 0 && cards.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-4">
          Noch keine Hinweise vorhanden
        </p>
      )}
    </div>
  )
}
