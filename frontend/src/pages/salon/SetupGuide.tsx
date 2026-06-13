import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, ChevronRight } from 'lucide-react'
import api from '../../api'
import type { Salon } from '../../types'

type StepId = 'mitarbeiter' | 'kosten' | 'oeffnungszeiten' | 'preise' | 'controlling'

type Step = {
  id: StepId
  tab: string
  label: string
  countLabel: (n: number) => string
  required: boolean
  dependsOn?: StepId[]
}

const STEPS: Step[] = [
  {
    id: 'mitarbeiter',
    tab: 'mitarbeiter',
    label: 'Mitarbeiter',
    countLabel: n => `${n} erfasst`,
    required: true,
  },
  {
    id: 'kosten',
    tab: 'kosten',
    label: 'Kosten',
    countLabel: n => `${n} Positionen`,
    required: true,
  },
  {
    id: 'oeffnungszeiten',
    tab: 'einstellungen',
    label: 'Öffnungszeiten',
    countLabel: n => `${n} Tage`,
    required: false,
  },
  {
    id: 'preise',
    tab: 'preise',
    label: 'Preise',
    countLabel: n => `${n} Leistungen`,
    required: true,
    dependsOn: ['mitarbeiter', 'kosten'],
  },
  {
    id: 'controlling',
    tab: 'controlling',
    label: 'Controlling',
    countLabel: n => `${n} Monate`,
    required: false,
    dependsOn: ['preise'],
  },
]

function useData(salon: Salon, salonId: string) {
  const { data: openingHours = [] } = useQuery<any[]>({
    queryKey: ['opening-hours', salonId],
    queryFn: () => api.get(`/salons/${salonId}/opening-hours`).then(r => r.data),
  })
  const { data: actuals = [] } = useQuery<any[]>({
    queryKey: ['actuals', salonId, new Date().getFullYear()],
    queryFn: () => api.get(`/salons/${salonId}/actuals?year=${new Date().getFullYear()}`).then(r => r.data),
  })

  const counts: Record<StepId, number> = {
    mitarbeiter:     salon.employees?.length ?? 0,
    kosten:          salon.costItems?.length ?? 0,
    oeffnungszeiten: openingHours.length,
    preise:          salon.services?.length ?? 0,
    controlling:     actuals.length,
  }
  const done: Record<StepId, boolean> = {
    mitarbeiter:     counts.mitarbeiter     > 0,
    kosten:          counts.kosten          > 0,
    oeffnungszeiten: counts.oeffnungszeiten > 0,
    preise:          counts.preise          > 0,
    controlling:     counts.controlling     > 0,
  }
  return { counts, done }
}

export default function SetupGuide({
  salon, salonId, onNavigate,
}: {
  salon: Salon
  salonId: string
  onNavigate: (tab: string) => void
}) {
  const { counts, done } = useData(salon, salonId)

  const allDone = STEPS.every(s => done[s.id])

  function isLocked(step: Step) {
    return step.dependsOn?.some(d => !done[d]) ?? false
  }

  const reqTotal = STEPS.filter(s => s.required).length
  const reqDone  = STEPS.filter(s => s.required && done[s.id]).length

  return (
    <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 mb-6">
      {/* Title row */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Einrichtung</p>
        <p className="text-xs text-gray-400">
          {reqDone}/{reqTotal} Pflichtschritte
          {STEPS.filter(s => !s.required && done[s.id]).length > 0 &&
            ` · ${STEPS.filter(s => !s.required && done[s.id]).length} optional`}
        </p>
      </div>

      {/* Horizontal flow */}
      <div className="overflow-x-auto -mx-1 px-1"><div className="flex items-stretch gap-0">
        {STEPS.map((step, i) => {
          const isDone   = done[step.id]
          const locked   = !isDone && isLocked(step)
          const count    = counts[step.id]
          const isLast   = i === STEPS.length - 1

          return (
            <div key={step.id} className="flex items-center flex-1 min-w-0">
              {/* Step card */}
              <button
                onClick={() => !locked && onNavigate(step.tab)}
                disabled={locked}
                className={`flex-1 min-w-0 flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-center transition-all
                  ${isDone
                    ? 'bg-green-50 border border-green-200 cursor-pointer hover:bg-green-100'
                    : locked
                      ? 'bg-gray-50 border border-gray-100 cursor-not-allowed opacity-50'
                      : 'bg-white border border-gray-200 cursor-pointer hover:border-gray-900 hover:shadow-sm'
                  }`}
              >
                {/* Icon / number */}
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                ) : (
                  <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center text-[9px] font-bold shrink-0
                    ${step.required
                      ? locked ? 'border-gray-300 text-gray-300' : 'border-gray-400 text-gray-500'
                      : 'border-gray-300 text-gray-400'
                    }`}>
                    {i + 1}
                  </span>
                )}

                {/* Label */}
                <p className={`text-xs font-semibold leading-tight truncate w-full
                  ${isDone ? 'text-green-700' : locked ? 'text-gray-400' : 'text-gray-900'}`}>
                  {step.label}
                </p>

                {/* Count or hint */}
                <p className={`text-[10px] leading-tight truncate w-full
                  ${isDone ? 'text-green-600' : locked ? 'text-gray-300' : 'text-gray-400'}`}>
                  {isDone && count > 0
                    ? step.countLabel(count)
                    : locked
                      ? 'gesperrt'
                      : step.required ? 'Pflicht' : 'optional'
                  }
                </p>
              </button>

              {/* Arrow between steps */}
              {!isLast && (
                <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0 mx-1" />
              )}
            </div>
          )
        })}
      </div></div>
    </div>
  )
}
