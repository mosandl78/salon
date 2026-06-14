import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Scissors } from 'lucide-react'
import api from '../api'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const navigate                = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const res = await api.post('/auth/login', { email, password })
      localStorage.setItem('salon_token', res.data.token)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Anmeldung fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center gap-2 mb-6">
          <Scissors className="w-5 h-5 text-gray-800" />
          <span className="text-lg font-bold text-gray-900">SALON</span>
          <span className="text-base text-gray-400" style={{ fontFamily: "'Kaushan Script', cursive" }}>by Peter Lehmann</span>
        </div>
        <p className="text-sm text-gray-500 mb-6">Preiskalkulation für Friseursalons</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Passwort</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-xs text-gray-400 hover:text-gray-700">Passwort vergessen?</Link>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-gray-900 text-white rounded-lg py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50">
            {loading ? 'Anmelden…' : 'Anmelden'}
          </button>
        </form>
        <p className="text-sm text-gray-500 mt-4 text-center">
          Noch kein Konto?{' '}
          <Link to="/register" className="text-gray-900 font-medium hover:underline">Registrieren</Link>
        </p>
      </div>
    </div>
  )
}
