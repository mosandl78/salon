import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Scissors, ArrowLeft, Send, CheckCircle } from 'lucide-react'
import api from '../api'

const BETREFF_OPTIONS = [
  'Frage zur Preiskalkulation',
  'Technisches Problem',
  'Lizenz & Abrechnung',
  'Feedback & Verbesserungsvorschlag',
  'Partnerschaft / Kooperation',
  'Sonstiges',
  '– Eigene Eingabe –',
]

export default function KontaktPage() {
  const navigate = useNavigate()
  const [name, setName]           = useState('')
  const [email, setEmail]         = useState('')
  const [betreffSelect, setBetreffSelect] = useState(BETREFF_OPTIONS[0])
  const [betreffCustom, setBetreffCustom] = useState('')
  const [message, setMessage]     = useState('')
  const [loading, setLoading]     = useState(false)
  const [sent, setSent]           = useState(false)
  const [error, setError]         = useState('')

  const isCustom = betreffSelect === '– Eigene Eingabe –'
  const subject  = isCustom ? betreffCustom : betreffSelect

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim()) return setError('Bitte gib einen Betreff ein')
    setError(''); setLoading(true)
    try {
      await api.post('/contact', { name, email, subject, message })
      setSent(true)
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Fehler beim Senden. Bitte versuche es später erneut.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/start')} className="text-gray-400 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Scissors className="w-5 h-5 text-gray-800" />
            <span className="text-lg font-bold text-gray-900">SALON</span>
            <span className="text-base accent-text" style={{ fontFamily: "'Kaushan Script', cursive" }}>by Peter Lehmann</span>
          </div>
          <div className="w-5" />
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Kontakt</h1>
        <p className="text-gray-500 mb-8">
          Fragen, Feedback oder Probleme? Schreib uns — wir antworten schnell.
        </p>

        {sent ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
            <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-900 mb-2">Nachricht gesendet</h2>
            <p className="text-sm text-gray-500 mb-6">
              Danke, {name}! Wir melden uns so schnell wie möglich bei dir.
            </p>
            <button onClick={() => navigate('/start')}
              className="text-sm text-gray-500 hover:text-gray-900 underline">
              Zurück zur Startseite
            </button>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                  <input value={name} onChange={e => setName(e.target.value)} required
                    placeholder="Dein Name"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">E-Mail</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    placeholder="deine@email.de"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Betreff</label>
                <select value={betreffSelect} onChange={e => setBetreffSelect(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
                  {BETREFF_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                {isCustom && (
                  <input value={betreffCustom} onChange={e => setBetreffCustom(e.target.value)}
                    placeholder="Dein Betreff"
                    className="w-full mt-2 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nachricht</label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} required
                  rows={6} placeholder="Wie können wir helfen?"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none" />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors">
                <Send className="w-4 h-4" />
                {loading ? 'Wird gesendet…' : 'Nachricht senden'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  )
}
