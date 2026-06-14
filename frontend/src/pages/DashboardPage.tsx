import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Scissors, LogOut, ChevronRight, Shield, UserCircle, Trash2 } from 'lucide-react'
import api from '../api'
import type { Salon, Country, BusinessType } from '../types'
import { useCurrentUser } from '../hooks/useCurrentUser'

const COUNTRY_LABEL: Record<Country, string> = { DE: '🇩🇪 Deutschland', AT: '🇦🇹 Österreich', CH: '🇨🇭 Schweiz' }

function fmt(d: string) {
  return new Date(d).toLocaleDateString('de-DE', { month: 'short', year: 'numeric' })
}

export default function DashboardPage() {
  const navigate     = useNavigate()
  const queryClient  = useQueryClient()
  const [showNew, setShowNew] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const { data: currentUser } = useCurrentUser()

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/salons/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salons'] })
      setDeleteId(null)
    },
  })

  const { data: salons = [], isLoading } = useQuery<Salon[]>({
    queryKey: ['salons'],
    queryFn: () => api.get('/salons').then(r => r.data),
  })

  function handleLogout() {
    localStorage.removeItem('salon_token')
    navigate('/start')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scissors className="w-5 h-5 text-gray-800" />
            <span className="text-lg font-bold text-gray-900">SALON</span>
            <span className="text-base accent-text" style={{ fontFamily: "'Kaushan Script', cursive" }}>by Peter Lehmann</span>
          </div>
          <div className="flex items-center gap-3">
            {currentUser?.isAdmin && (
              <button onClick={() => navigate('/admin')}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 hover:border-gray-400 transition-colors">
                <Shield className="w-4 h-4" /> Admin
              </button>
            )}
            <button onClick={() => navigate('/account')}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 hover:border-gray-400 transition-colors">
              <UserCircle className="w-4 h-4" /> Konto
            </button>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900">
              <LogOut className="w-4 h-4" /> Abmelden
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Meine Salons</h1>
            <p className="text-sm text-gray-500 mt-0.5">Wähle einen Salon oder lege einen neuen an</p>
          </div>
          <button onClick={() => setShowNew(true)}
            className="flex items-center gap-1.5 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800">
            <Plus className="w-4 h-4" /> Neuer Salon
          </button>
        </div>

        {isLoading ? (
          <div className="text-sm text-gray-400">Lädt…</div>
        ) : salons.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center">
            <Scissors className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-900">Noch kein Salon angelegt</p>
            <p className="text-sm text-gray-500 mt-1">Klicke auf „Neuer Salon" um zu starten</p>
          </div>
        ) : (
          <div className="space-y-3">
            {salons.map(salon => (
              <div key={salon.id} className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center justify-between group hover:border-gray-300 transition-colors">
                <button className="flex-1 text-left" onClick={() => navigate(`/salon/${salon.id}`)}>
                  <p className="font-semibold text-gray-900">{salon.name}</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {COUNTRY_LABEL[salon.country]} · {fmt(salon.planStart)} – {fmt(salon.planEnd)}
                  </p>
                </button>
                <div className="flex items-center gap-2">
                  <button onClick={() => setDeleteId(salon.id)}
                    className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-700" />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showNew && <NewSalonModal onClose={() => setShowNew(false)} onCreated={() => {
        queryClient.invalidateQueries({ queryKey: ['salons'] })
        setShowNew(false)
      }} />}

      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-base font-bold text-gray-900 mb-2">Salon löschen?</h2>
            <p className="text-sm text-gray-500 mb-6">
              Alle Daten dieses Salons werden unwiderruflich gelöscht — Mitarbeiter, Kosten, Preise, alles.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm hover:bg-gray-50">
                Abbrechen
              </button>
              <button onClick={() => deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}
                className="flex-1 bg-red-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                {deleteMutation.isPending ? 'Löschen…' : 'Endgültig löschen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function NewSalonModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName]               = useState('')
  const [country, setCountry]         = useState<Country>('DE')
  const [businessType, setBusiness]   = useState<BusinessType>('SOLO')
  const [planStart, setPlanStart]     = useState('')
  const [planEnd, setPlanEnd]         = useState('')
  const [error, setError]             = useState('')

  const mutation = useMutation({
    mutationFn: (data: any) => api.post('/salons', data),
    onSuccess: onCreated,
    onError: (err: any) => setError(err.response?.data?.error ?? 'Fehler beim Speichern'),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    mutation.mutate({ name, country, businessType, planStart, planEnd })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-5">Neuer Salon</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Salonname</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Land</label>
              <select value={country} onChange={e => setCountry(e.target.value as Country)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
                <option value="DE">Deutschland</option>
                <option value="AT">Österreich</option>
                <option value="CH">Schweiz</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Betriebsform</label>
              <select value={businessType} onChange={e => setBusiness(e.target.value as BusinessType)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
                <option value="SOLO">Solo</option>
                <option value="GBR">GbR</option>
                <option value="GMBH">GmbH/UG</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Planungsbeginn</label>
              <input type="date" value={planStart} onChange={e => setPlanStart(e.target.value)} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Planungsende</label>
              <input type="date" value={planEnd} onChange={e => setPlanEnd(e.target.value)} required
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
              {mutation.isPending ? 'Speichern…' : 'Salon anlegen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
