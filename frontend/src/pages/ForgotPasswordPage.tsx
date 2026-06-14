import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Scissors } from 'lucide-react'
import api from '../api'

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('')
  const [sent, setSent]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
    } catch {
      setError('Es ist ein Fehler aufgetreten. Bitte versuche es später erneut.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <Scissors className="w-5 h-5 text-gray-400" />
          <span className="font-bold text-gray-900 tracking-tight">SALON</span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          {sent ? (
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✉️</span>
              </div>
              <h1 className="text-lg font-bold text-gray-900 mb-2">E-Mail gesendet</h1>
              <p className="text-sm text-gray-500">
                Falls ein Account mit <strong>{email}</strong> existiert, hast du eine E-Mail mit einem Reset-Link erhalten.
                Der Link ist 1 Stunde gültig.
              </p>
              <Link to="/login" className="mt-6 block text-sm text-gray-500 hover:text-gray-900">
                Zurück zum Login
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-lg font-bold text-gray-900 mb-1">Passwort vergessen</h1>
              <p className="text-sm text-gray-500 mb-6">
                Gib deine E-Mail-Adresse ein. Wir schicken dir einen Link zum Zurücksetzen.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">E-Mail</label>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    placeholder="deine@email.de"
                  />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button type="submit" disabled={loading}
                  className="w-full bg-gray-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-800 disabled:opacity-50">
                  {loading ? 'Senden…' : 'Reset-Link senden'}
                </button>
              </form>
              <p className="mt-4 text-center text-sm text-gray-500">
                <Link to="/login" className="hover:text-gray-900">Zurück zum Login</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
