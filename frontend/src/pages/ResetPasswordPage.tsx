import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Scissors } from 'lucide-react'
import api from '../api'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const navigate = useNavigate()

  const [password, setPassword]   = useState('')
  const [password2, setPassword2] = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [done, setDone]           = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== password2) return setError('Passwörter stimmen nicht überein')
    if (password.length < 8) return setError('Mindestens 8 Zeichen erforderlich')
    setLoading(true); setError('')
    try {
      await api.post('/auth/reset-password', { token, password })
      setDone(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Ungültiger oder abgelaufener Link')
    } finally {
      setLoading(false)
    }
  }

  if (!token) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-sm text-red-500">Ungültiger Link.</p>
        <Link to="/login" className="mt-2 block text-sm text-gray-500 hover:text-gray-900">Zum Login</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <Scissors className="w-5 h-5 text-gray-800" />
          <span className="text-lg font-bold text-gray-900">SALON</span>
          <span className="text-base accent-text" style={{ fontFamily: "'Kaushan Script', cursive" }}>by Peter Lehmann</span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          {done ? (
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✅</span>
              </div>
              <h1 className="text-lg font-bold text-gray-900 mb-2">Passwort geändert</h1>
              <p className="text-sm text-gray-500">Du wirst automatisch zum Login weitergeleitet…</p>
            </div>
          ) : (
            <>
              <h1 className="text-lg font-bold text-gray-900 mb-1">Neues Passwort</h1>
              <p className="text-sm text-gray-500 mb-6">Vergib jetzt dein neues Passwort.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Neues Passwort</label>
                  <input
                    type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
                    placeholder="Mindestens 8 Zeichen"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Passwort wiederholen</label>
                  <input
                    type="password" value={password2} onChange={e => setPassword2(e.target.value)} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button type="submit" disabled={loading}
                  className="w-full bg-gray-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-800 disabled:opacity-50">
                  {loading ? 'Speichern…' : 'Passwort speichern'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
