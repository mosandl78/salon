import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Scissors, CheckCircle, BarChart2, Calculator, TrendingUp, Play, X } from 'lucide-react'
import api from '../api'

const FEATURES = [
  { icon: Calculator, title: 'Preiskalkulation',   desc: 'Berechne den richtigen Preis für jede Dienstleistung — auf Basis deiner echten Kosten.' },
  { icon: TrendingUp, title: 'Lohnfaktor',         desc: 'Wisse genau, was jeder Mitarbeiter pro Monat, Tag und Stunde umsetzen muss.' },
  { icon: BarChart2,  title: 'Controlling',        desc: 'Vergleiche Soll- und IST-Umsatz monatlich. Provision automatisch berechnet.' },
  { icon: Scissors,   title: 'Für Friseursalons',  desc: 'Entwickelt speziell für DE, AT und CH — mit den richtigen AG-Anteilen und MwSt.-Sätzen.' },
]

const INCLUDED = [
  'Unbegrenzte Mitarbeiter',
  'Alle Dienstleistungen kalkulieren',
  'Lohnfaktor & Sollumsatz',
  'Jahresverlauf & Controlling',
  'Liquiditätsplan (bankfähig)',
  'BWA mit Vorjahresvergleich',
  'Was-wäre-wenn-Simulator',
  'Deutschland, Österreich, Schweiz',
]

function LoginModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 mb-6">
          <Scissors className="w-4 h-4 text-gray-700" />
          <span className="font-bold text-gray-900">SALON</span>
          <span className="text-sm text-gray-400" style={{ fontFamily: "'Kaushan Script', cursive" }}>by Peter Lehmann</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-5">Anmelden</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">E-Mail</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus
              placeholder="deine@email.de"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Passwort</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-gray-900 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-gray-800 disabled:opacity-50">
            {loading ? 'Anmelden…' : 'Anmelden'}
          </button>
        </form>
        <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
          <a href="/forgot-password" className="hover:text-gray-700">Passwort vergessen?</a>
          <a href="/register" className="hover:text-gray-700">Noch kein Konto?</a>
        </div>
      </div>
    </div>
  )
}

export default function LandingPage() {
  const navigate = useNavigate()
  const [showLogin, setShowLogin] = useState(false)

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="border-b border-gray-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scissors className="w-5 h-5 text-gray-800" />
            <span className="text-lg font-bold text-gray-900">SALON</span>
            <span className="text-base text-gray-400" style={{ fontFamily: "'Kaushan Script', cursive" }}>by Peter Lehmann</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/demo')}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
              <Play className="w-3.5 h-3.5" /> Demo ansehen
            </button>
            <button onClick={() => setShowLogin(true)}
              className="text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg px-4 py-2 hover:border-gray-400 transition-colors">
              Login
            </button>
            <button onClick={() => navigate('/register')}
              className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800">
              Neuen Salon eröffnen
            </button>
          </div>
        </div>
      </header>

      {/* Hero + Video */}
      <section className="bg-gray-950 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-2xl font-bold px-6 py-3 rounded-full mb-6">
            <Scissors className="w-5 h-5" /> Preiskalkulation für Friseursalons
          </div>

          <p className="text-base text-gray-400 max-w-2xl mx-auto mb-10">
            SALON berechnet Lohnfaktor, Sollumsatz und Preise automatisch — auf Basis deiner echten
            Personalkosten und Gemeinkosten. Kein Excel, kein Rätselraten.
          </p>

          {/* Video placeholder */}
          <div className="relative rounded-2xl overflow-hidden bg-gray-900 border border-white/10 aspect-video flex items-center justify-center group cursor-pointer mb-10">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-950" />
            <div className="relative z-10 flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                <Play className="w-8 h-8 text-gray-900 ml-1" />
              </div>
              <p className="text-white/60 text-sm">Marketing-Video folgt</p>
            </div>
            <div className="absolute top-4 left-4 bg-white/10 text-white/80 text-xs font-medium px-3 py-1 rounded-full backdrop-blur-sm">
              SALON — Produktvideo
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button onClick={() => navigate('/register')}
              className="bg-white text-gray-900 px-8 py-3.5 rounded-xl text-base font-semibold hover:bg-gray-100 transition-colors">
              Neuen Salon eröffnen — 129 € / Jahr
            </button>
            <button onClick={() => navigate('/demo')}
              className="flex items-center gap-2 border border-white/20 text-white/80 px-8 py-3.5 rounded-xl text-base font-medium hover:border-white/50 transition-colors">
              <Play className="w-4 h-4" /> Demo ansehen
            </button>
          </div>
          <p className="text-xs text-white/30 mt-4">Einmalige Jahreslizenz · netto zzgl. MwSt. · sofort nutzbar</p>
        </div>
      </section>

      {/* Pricing + Register */}
      <section className="py-20" id="register">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">Ein Plan. Alles inklusive.</h2>
          <p className="text-gray-500 text-center mb-12">Kein Feature-Gating. Kein Abo-Chaos.</p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Pricing card */}
            <div className="bg-gray-900 text-white rounded-3xl p-8 shadow-xl">
              <p className="text-sm text-gray-400 font-medium mb-2">SALON Pro</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-5xl font-bold">129</span>
                <span className="text-xl font-medium text-gray-300 pb-1">€</span>
              </div>
              <p className="text-sm text-gray-400 mb-8">pro Jahr · netto zzgl. MwSt.</p>
              <ul className="space-y-3">
                {INCLUDED.map(item => (
                  <li key={item} className="flex items-center gap-2.5 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                    <span className="text-gray-200">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Register form */}
            <div className="bg-white border border-gray-200 rounded-3xl p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Neuen Salon eröffnen</h3>
              <p className="text-sm text-gray-400 mb-6">Einmalige Jahreslizenz · netto zzgl. MwSt. · sofort nutzbar</p>
              <RegisterForm />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">Alles was dein Salon braucht</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-6 border border-gray-200">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-gray-700" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo CTA */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Erst mal anschauen?</h2>
          <p className="text-gray-500 mb-8">
            Sieh dir einen fertig konfigurierten Beispiel-Salon mit echten Zahlen an — ohne Registrierung.
          </p>
          <button onClick={() => navigate('/demo')}
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-gray-800 transition-colors">
            <Play className="w-4 h-4" /> Demo starten
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-gray-400 flex-wrap gap-4">
          <div className="flex items-center gap-1.5">
            <Scissors className="w-3.5 h-3.5" />
            <span>SALON</span>
            <span style={{ fontFamily: "'Kaushan Script', cursive" }}>by Peter Lehmann</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/kontakt"     className="hover:text-gray-700 transition-colors">Kontakt</a>
            <a href="/impressum"   className="hover:text-gray-700 transition-colors">Impressum</a>
            <a href="/datenschutz" className="hover:text-gray-700 transition-colors">Datenschutz</a>
            <span>© {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  )
}

function RegisterForm() {
  const navigate = useNavigate()
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Dein Name</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} required
          placeholder="Anja Müller"
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">E-Mail</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
          placeholder="anja@mein-salon.de"
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Passwort</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
          placeholder="Mindestens 8 Zeichen"
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={loading}
        className="w-full bg-gray-900 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors">
        {loading ? 'Konto wird erstellt…' : 'Neuen Salon eröffnen →'}
      </button>
      <p className="text-xs text-gray-400 text-center leading-relaxed">
        Mit der Registrierung stimmst du unseren{' '}
        <a href="/impressum" className="underline">Nutzungsbedingungen</a> zu.
      </p>
    </form>
  )
}
