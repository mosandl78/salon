import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Save, Clock, Store } from 'lucide-react'
import api from '../../api'
import type { Salon, Country, BusinessType } from '../../types'

const DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']
const HOUR_OPTIONS = [0, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 12]

interface OHEntry { weekday: number; openHours: number; variant: number }

function defaultWeek(hours: number): OHEntry[] {
  return DAYS.map((_, i) => ({ weekday: i, openHours: i < 5 ? hours : 0, variant: 1 }))
}

export default function EinstellungenTab({ salonId, salon }: { salonId: string; salon: Salon }) {
  const qc = useQueryClient()
  const [saved, setSaved] = useState(false)

  // Öffnungszeiten
  const { data: ohData = [] } = useQuery<OHEntry[]>({
    queryKey: ['opening-hours', salonId],
    queryFn: () => api.get(`/salons/${salonId}/opening-hours`).then(r => r.data),
  })

  const [hours, setHours] = useState<OHEntry[]>(defaultWeek(8))

  useEffect(() => {
    if (ohData.length > 0) {
      // Merge mit default (falls nicht alle Wochentage vorhanden)
      const map = Object.fromEntries(ohData.filter(h => h.variant === 1).map(h => [h.weekday, h]))
      setHours(DAYS.map((_, i) => map[i] ?? { weekday: i, openHours: i < 5 ? 8 : 0, variant: 1 }))
    }
  }, [ohData])

  // Salon-Stammdaten
  const [salonName, setSalonName]     = useState(salon.name)
  const [country, setCountry]         = useState<Country>(salon.country)
  const [businessType, setBusiness]   = useState<BusinessType>(salon.businessType)
  const [planStart, setPlanStart]     = useState(salon.planStart?.slice(0, 10) ?? '')
  const [planEnd, setPlanEnd]         = useState(salon.planEnd?.slice(0, 10) ?? '')

  // Betriebseinstellungen
  const [fullTimeHours, setFullTime] = useState(salon.fullTimeHours.toString())
  const [vacationWeeks, setVacation] = useState(salon.vacationWeeks.toString())

  const ohMutation = useMutation({
    mutationFn: (data: OHEntry[]) => api.put(`/salons/${salonId}/opening-hours`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['opening-hours', salonId] })
      qc.invalidateQueries({ queryKey: ['calc', salonId] })
    },
  })

  const salonMutation = useMutation({
    mutationFn: (data: any) => api.patch(`/salons/${salonId}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['salon', salonId] })
      qc.invalidateQueries({ queryKey: ['calc', salonId] })
    },
  })

  async function handleSave() {
    await Promise.all([
      ohMutation.mutateAsync(hours),
      salonMutation.mutateAsync({ name: salonName, country, businessType, planStart, planEnd, fullTimeHours, vacationWeeks }),
    ])
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function setDayHours(weekday: number, openHours: number) {
    setHours(prev => prev.map(h => h.weekday === weekday ? { ...h, openHours } : h))
  }

  const workDaysPerWeek = hours.filter(h => h.openHours > 0).length
  const avgHoursPerDay  = workDaysPerWeek > 0
    ? hours.reduce((s, h) => s + h.openHours, 0) / workDaysPerWeek
    : 0
  const workDaysPerYear = workDaysPerWeek * (52 - parseInt(vacationWeeks || '5'))

  return (
    <div className="space-y-6">
      {/* Salon-Stammdaten */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-5 flex items-center gap-2">
          <Store className="w-4 h-4 text-gray-400" /> Salon-Daten
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Salonname</label>
            <input value={salonName} onChange={e => setSalonName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Land</label>
              <select value={country} onChange={e => setCountry(e.target.value as Country)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
                <option value="DE">Deutschland</option>
                <option value="AT">Österreich</option>
                <option value="CH">Schweiz</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Betriebsform</label>
              <select value={businessType} onChange={e => setBusiness(e.target.value as BusinessType)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
                <option value="SOLO">Solo / Einzelunternehmen</option>
                <option value="GBR">GbR</option>
                <option value="GMBH">GmbH / UG</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Planungsbeginn</label>
              <input type="date" value={planStart} onChange={e => setPlanStart(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Planungsende</label>
              <input type="date" value={planEnd} onChange={e => setPlanEnd(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
          </div>
        </div>
      </div>

      {/* Öffnungszeiten */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" /> Öffnungszeiten
        </h2>
        <p className="text-xs text-gray-400 mb-5">Wie viele Arbeitsstunden pro Wochentag?</p>

        <div className="space-y-3">
          {DAYS.map((day, i) => {
            const entry = hours.find(h => h.weekday === i)
            const val   = entry?.openHours ?? 0
            return (
              <div key={i} className="flex items-center gap-4">
                <span className="text-sm text-gray-700 w-24 shrink-0">{day}</span>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setDayHours(i, 0)}
                    className={`px-3 py-1 text-xs rounded-lg border font-medium transition-colors ${
                      val === 0 ? 'bg-gray-200 text-gray-700 border-gray-300' : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                    }`}>
                    Ruhetag
                  </button>
                  {HOUR_OPTIONS.filter(h => h > 0).map(h => (
                    <button key={h} onClick={() => setDayHours(i, h)}
                      className={`px-3 py-1 text-xs rounded-lg border font-medium transition-colors ${
                        val === h ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400'
                      }`}>
                      {h}h
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Vorschau */}
        <div className="mt-5 grid grid-cols-3 gap-3 p-4 bg-gray-50 rounded-xl text-xs text-gray-600">
          <div>
            <p className="text-gray-400">Arbeitstage / Woche</p>
            <p className="font-semibold text-gray-900 text-base">{workDaysPerWeek}</p>
          </div>
          <div>
            <p className="text-gray-400">Ø Stunden / Tag</p>
            <p className="font-semibold text-gray-900 text-base">{avgHoursPerDay.toFixed(1)}</p>
          </div>
          <div>
            <p className="text-gray-400">Arbeitstage / Jahr</p>
            <p className="font-semibold text-gray-900 text-base">{workDaysPerYear}</p>
          </div>
        </div>
      </div>

      {/* Betriebseinstellungen */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-5">Betriebseinstellungen</h2>
        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Vollzeit-Stunden / Woche (Tarif)
            </label>
            <select value={fullTimeHours} onChange={e => setFullTime(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
              {[35, 37.5, 38, 38.5, 39, 40].map(h => (
                <option key={h} value={h}>{h} Stunden</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">Wirkt auf Teilzeit-Umrechnung (PSF)</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Betriebsferien (Wochen / Jahr)
            </label>
            <select value={vacationWeeks} onChange={e => setVacation(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(w => (
                <option key={w} value={w}>{w} {w === 1 ? 'Woche' : 'Wochen'}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">Wochen in denen der Salon geschlossen ist</p>
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button onClick={handleSave} disabled={ohMutation.isPending || salonMutation.isPending}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            saved
              ? 'bg-green-600 text-white'
              : 'bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50'
          }`}>
          <Save className="w-4 h-4" />
          {saved ? 'Gespeichert ✓' : ohMutation.isPending ? 'Speichern…' : 'Einstellungen speichern'}
        </button>
      </div>
    </div>
  )
}
