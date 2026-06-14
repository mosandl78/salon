import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, User, Lock, Trash2 } from 'lucide-react'
import api from '../api'

export default function AccountPage() {
  const navigate = useNavigate()

  // Profile
  const [name, setName]   = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    api.get('/auth/me').then(r => {
      setName(r.data.name ?? '')
      setEmail(r.data.email ?? '')
    }).catch(() => {})
  }, [])
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileError, setProfileError] = useState('')

  const profileMutation = useMutation({
    mutationFn: (data: any) => api.patch('/auth/me', data),
    onSuccess: (res) => {
      // Update token if returned
      if (res.data.token) localStorage.setItem('salon_token', res.data.token)
      setProfileSaved(true)
      setProfileError('')
      setTimeout(() => setProfileSaved(false), 2000)
    },
    onError: (e: any) => setProfileError(e.response?.data?.error ?? 'Fehler beim Speichern'),
  })

  // Password
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw]         = useState('')
  const [newPw2, setNewPw2]       = useState('')
  const [pwSaved, setPwSaved]     = useState(false)
  const [pwError, setPwError]     = useState('')

  const passwordMutation = useMutation({
    mutationFn: (data: any) => api.patch('/auth/me/password', data),
    onSuccess: () => {
      setCurrentPw(''); setNewPw(''); setNewPw2('')
      setPwSaved(true); setPwError('')
      setTimeout(() => setPwSaved(false), 2000)
    },
    onError: (e: any) => setPwError(e.response?.data?.error ?? 'Fehler beim Ändern'),
  })

  // Delete
  const [showDelete, setShowDelete] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')

  const deleteMutation = useMutation({
    mutationFn: () => api.delete('/auth/me'),
    onSuccess: () => {
      localStorage.removeItem('salon_token')
      navigate('/start')
    },
  })

  function handleProfile(e: React.FormEvent) {
    e.preventDefault()
    profileMutation.mutate({ name, email })
  }

  function handlePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPw !== newPw2) return setPwError('Passwörter stimmen nicht überein')
    if (newPw.length < 8) return setPwError('Mindestens 8 Zeichen erforderlich')
    passwordMutation.mutate({ currentPassword: currentPw, newPassword: newPw })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-bold text-gray-900">Mein Konto</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">

        {/* Profil */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" /> Profil
          </h2>
          <form onSubmit={handleProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
              <input value={name} onChange={e => setName(e.target.value)} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">E-Mail</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
            {profileError && <p className="text-sm text-red-600">{profileError}</p>}
            <div className="flex justify-end">
              <button type="submit" disabled={profileMutation.isPending}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  profileSaved ? 'bg-green-600 text-white' : 'bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50'
                }`}>
                {profileSaved ? 'Gespeichert ✓' : profileMutation.isPending ? 'Speichern…' : 'Speichern'}
              </button>
            </div>
          </form>
        </div>

        {/* Passwort */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <Lock className="w-4 h-4 text-gray-400" /> Passwort ändern
          </h2>
          <form onSubmit={handlePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Aktuelles Passwort</label>
              <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Neues Passwort</label>
                <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} required minLength={8}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Wiederholen</label>
                <input type="password" value={newPw2} onChange={e => setNewPw2(e.target.value)} required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
            </div>
            {pwError && <p className="text-sm text-red-600">{pwError}</p>}
            <div className="flex justify-end">
              <button type="submit" disabled={passwordMutation.isPending}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pwSaved ? 'bg-green-600 text-white' : 'bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50'
                }`}>
                {pwSaved ? 'Geändert ✓' : passwordMutation.isPending ? 'Speichern…' : 'Passwort ändern'}
              </button>
            </div>
          </form>
        </div>

        {/* Konto löschen */}
        <div className="bg-white border border-red-100 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-red-600 mb-2 flex items-center gap-2">
            <Trash2 className="w-4 h-4" /> Konto löschen
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            Alle Daten werden unwiderruflich gelöscht — Salons, Mitarbeiter, Kosten, Preise, alles.
          </p>
          {!showDelete ? (
            <button onClick={() => setShowDelete(true)}
              className="text-sm text-red-500 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50">
              Konto löschen
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-medium text-gray-700">Gib <strong>LÖSCHEN</strong> ein um zu bestätigen:</p>
              <input value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)}
                className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
              <div className="flex gap-3">
                <button onClick={() => { setShowDelete(false); setDeleteConfirm('') }}
                  className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm hover:bg-gray-50">
                  Abbrechen
                </button>
                <button
                  disabled={deleteConfirm !== 'LÖSCHEN' || deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate()}
                  className="flex-1 bg-red-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-red-700 disabled:opacity-40">
                  Endgültig löschen
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
