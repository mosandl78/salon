import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { CheckCircle, Scissors } from 'lucide-react'
import api from '../api'

const INCLUDED = [
  'Unbegrenzte Mitarbeiter & Dienstleistungen',
  'Preiskalkulation, Lohnfaktor, Controlling',
  'Liquiditätsplan & BWA',
  'Was-wäre-wenn-Simulator',
  'Deutschland, Österreich, Schweiz',
]

export default function RegisterPage() {
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const navigate                = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const res = await api.post('/auth/register', { name, email, password })
      localStorage.setItem('salon_token', res.data.token)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Registrierung fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left — Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8">
            <Scissors className="w-5 h-5 text-gray-800" />
            <span className="text-lg font-bold text-gray-900">SALON</span>
            <span className="text-base text-gray-400" style={{ fontFamily: "'Kaushan Script', cursive" }}>by Peter Lehmann</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">Konto erstellen</h1>
          <p className="text-sm text-gray-500 mb-6">129 € / Jahr · netto zzgl. MwSt. · sofort aktiv</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dein Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required
                placeholder="Anja Müller"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="anja@mein-salon.de"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Passwort</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
                placeholder="Mindestens 8 Zeichen"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-gray-900 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors">
              {loading ? 'Konto wird erstellt…' : 'Jetzt anmelden & starten'}
            </button>
          </form>

          <p className="text-xs text-gray-400 mt-4 text-center leading-relaxed">
            Mit der Registrierung stimmst du unseren Nutzungsbedingungen zu.
            Die Lizenz gilt für ein Jahr ab Aktivierung.
          </p>

          <p className="text-sm text-gray-500 mt-6 text-center">
            Bereits registriert?{' '}
            <Link to="/login" className="text-gray-900 font-medium hover:underline">Anmelden</Link>
          </p>
        </div>
      </div>

      {/* Right — Pricing card */}
      <div className="hidden lg:flex flex-1 bg-gray-900 items-center justify-center p-12">
        <div className="max-w-sm text-white">
          <h2 className="text-3xl font-bold mb-2">SALON Pro</h2>
          <div className="flex items-end gap-1 mb-1">
            <span className="text-5xl font-bold">129</span>
            <span className="text-xl text-gray-400 pb-1">€ / Jahr</span>
          </div>
          <p className="text-sm text-gray-500 mb-8">netto zzgl. MwSt. · sofort aktiv</p>
          <ul className="space-y-3">
            {INCLUDED.map(item => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-gray-300">
                <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-10 p-4 bg-white/5 rounded-xl border border-white/10 text-sm text-gray-400">
            <p className="font-medium text-white mb-1">Noch unsicher?</p>
            <p>Schau dir den Demo-Salon an — vollständig ausgefüllt mit echten Beispieldaten.</p>
            <a href="/demo" className="text-white underline mt-2 inline-block text-xs">→ Demo ansehen</a>
          </div>
        </div>
      </div>
    </div>
  )
}
