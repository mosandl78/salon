import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Users, Scissors, Shield, Search,
  CheckCircle, XCircle, Pencil, Trash2, ChevronDown
} from 'lucide-react'
import api from '../api'
import type { AdminStats, AdminUser, PricingPlan } from '../types'

const PLAN_LABEL: Record<PricingPlan, string> = {
  FREE: 'Free', STARTER: 'Starter', PRO: 'Pro', STUDIO: 'Studio',
}
const PLAN_COLOR: Record<PricingPlan, string> = {
  FREE:    'bg-gray-100 text-gray-600',
  STARTER: 'bg-blue-100 text-blue-700',
  PRO:     'bg-purple-100 text-purple-700',
  STUDIO:  'bg-amber-100 text-amber-700',
}

const TABS = [
  { id: 'dashboard',  label: 'Dashboard' },
  { id: 'users',      label: 'Benutzer' },
  { id: 'infocards',  label: 'Hinweise' },
]

export default function AdminPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('dashboard')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate('/')} className="text-gray-400 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Scissors className="w-5 h-5 text-gray-800" />
            <span className="text-lg font-bold text-gray-900">SALON</span>
            <span className="text-base accent-text" style={{ fontFamily: "'Kaushan Script', cursive" }}>by Peter Lehmann</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 border border-gray-200 rounded-lg px-2.5 py-1">
            <Shield className="w-3.5 h-3.5" /> Admin
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6">
          <nav className="flex gap-1">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  tab === t.id ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}>
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {tab === 'dashboard' && <AdminDashboard />}
        {tab === 'users'     && <AdminUsers />}
        {tab === 'infocards' && <AdminInfoCards />}
      </div>
    </div>
  )
}

// ─── Dashboard ──────────────────────────────────────────────────────────────

function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats').then(r => r.data),
  })

  if (isLoading) return <p className="text-sm text-gray-400">Lädt…</p>
  if (!stats)    return <p className="text-sm text-red-500">Fehler beim Laden</p>

  const kpis = [
    { icon: Users,    label: 'Benutzer gesamt',   value: stats.totalUsers,    sub: `+${stats.newUsersThisMonth} diesen Monat` },
    { icon: Scissors, label: 'Salons gesamt',      value: stats.totalSalons,   sub: `+${stats.newSalonsThisMonth} diesen Monat` },
    { icon: Users,    label: 'Mitarbeiter (DB)',   value: stats.totalEmployees, sub: 'über alle Salons' },
    { icon: Shield,   label: 'Aktive Benutzer',    value: stats.activeUsers,   sub: `von ${stats.totalUsers} gesamt` },
  ]

  const plans: PricingPlan[] = ['FREE', 'STARTER', 'PRO', 'STUDIO']

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map(({ icon: Icon, label, value, sub }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
              <Icon className="w-4 h-4 text-gray-300" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-400 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Plan-Verteilung */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-5">Plan-Verteilung</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {plans.map(plan => {
            const count = stats.planCounts[plan] ?? 0
            const pct   = stats.totalUsers > 0 ? (count / stats.totalUsers) * 100 : 0
            return (
              <div key={plan} className="text-center">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold mb-2 ${PLAN_COLOR[plan]}`}>
                  {PLAN_LABEL[plan]}
                </div>
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-400">{pct.toFixed(0)} %</p>
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gray-700 rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Users ──────────────────────────────────────────────────────────────────

function AdminUsers() {
  const qc = useQueryClient()
  const [search, setSearch]     = useState('')
  const [planFilter, setPlan]   = useState<PricingPlan | ''>('')
  const [editing, setEditing]   = useState<AdminUser | null>(null)

  const { data: users = [], isLoading } = useQuery<AdminUser[]>({
    queryKey: ['admin-users', search, planFilter],
    queryFn: () => api.get('/admin/users', { params: { search: search || undefined, plan: planFilter || undefined } }).then(r => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/users/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  return (
    <div className="space-y-4">
      {/* Suche + Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name oder E-Mail…"
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
        </div>
        <select value={planFilter} onChange={e => setPlan(e.target.value as any)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
          <option value="">Alle Pläne</option>
          {(['FREE','STARTER','PRO','STUDIO'] as PricingPlan[]).map(p => (
            <option key={p} value={p}>{PLAN_LABEL[p]}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-400">Lädt…</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 font-medium">Benutzer</th>
                <th className="text-center px-4 py-3 font-medium">Plan</th>
                <th className="text-center px-4 py-3 font-medium">Salons</th>
                <th className="text-center px-4 py-3 font-medium">Admin</th>
                <th className="text-center px-4 py-3 font-medium">Demo</th>
                <th className="text-center px-4 py-3 font-medium">Aktiv</th>
                <th className="text-left px-4 py-3 font-medium">Registriert</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(user => (
                <tr key={user.id} className={!user.isActive ? 'opacity-50' : ''}>
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900 flex items-center gap-1.5">
                      {user.name}
                      {user.isAdmin && <Shield className="w-3 h-3 text-gray-500" />}
                    </p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PLAN_COLOR[user.plan]}`}>
                      {PLAN_LABEL[user.plan]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">{user.salonCount}</td>
                  <td className="px-4 py-3 text-center">
                    {user.isAdmin
                      ? <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                      : <XCircle    className="w-4 h-4 text-gray-200 mx-auto" />}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {user.isDemo
                      ? <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">Demo</span>
                      : <span className="text-gray-200 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {user.isActive
                      ? <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                      : <XCircle    className="w-4 h-4 text-red-400 mx-auto" />}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString('de-DE')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setEditing(user)}
                        className="text-gray-400 hover:text-gray-700"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => { if (confirm(`${user.name} wirklich löschen?`)) deleteMutation.mutate(user.id) }}
                        className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-sm text-gray-400">Keine Benutzer gefunden</td></tr>
              )}
            </tbody>
          </table></div>
        </div>
      )}

      {editing && (
        <EditUserModal
          user={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ['admin-users'] })
            qc.invalidateQueries({ queryKey: ['admin-stats'] })
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}

// ─── Edit Modal ──────────────────────────────────────────────────────────────

function EditUserModal({ user, onClose, onSaved }: { user: AdminUser; onClose: () => void; onSaved: () => void }) {
  const [isAdmin, setIsAdmin]     = useState(user.isAdmin)
  const [isActive, setIsActive]   = useState(user.isActive)
  const [isDemo, setIsDemo]       = useState(user.isDemo)
  const [plan, setPlan]           = useState<PricingPlan>(user.plan)
  const [planExpires, setExpires] = useState(user.planExpiresAt ? user.planExpiresAt.slice(0, 10) : '')
  const [notes, setNotes]         = useState(user.notes ?? '')
  const [error, setError]         = useState('')

  const mutation = useMutation({
    mutationFn: (data: any) => api.patch(`/admin/users/${user.id}`, data),
    onSuccess: onSaved,
    onError: (e: any) => setError(e.response?.data?.error ?? 'Fehler'),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    mutation.mutate({ isAdmin, isActive, isDemo, plan, planExpiresAt: planExpires || null, notes })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Benutzer bearbeiten</h2>
        <p className="text-sm text-gray-400 mb-5">{user.name} · {user.email}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="flex items-start gap-2 cursor-pointer p-3 rounded-xl border border-gray-200 hover:border-gray-300">
              <input type="checkbox" checked={isAdmin} onChange={e => setIsAdmin(e.target.checked)}
                className="mt-0.5 rounded border-gray-300 text-gray-900 focus:ring-gray-900" />
              <div>
                <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" /> Admin
                </p>
                <p className="text-xs text-gray-400">Adminbereich</p>
              </div>
            </label>
            <label className="flex items-start gap-2 cursor-pointer p-3 rounded-xl border border-gray-200 hover:border-gray-300">
              <input type="checkbox" checked={isDemo} onChange={e => setIsDemo(e.target.checked)}
                className="mt-0.5 rounded border-gray-300 text-violet-600 focus:ring-violet-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">Demo</p>
                <p className="text-xs text-gray-400">Nur Lesezugriff</p>
              </div>
            </label>
            <label className="flex items-start gap-2 cursor-pointer p-3 rounded-xl border border-gray-200 hover:border-gray-300">
              <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)}
                className="mt-0.5 rounded border-gray-300 text-gray-900 focus:ring-gray-900" />
              <div>
                <p className="text-sm font-medium text-gray-900">Aktiv</p>
                <p className="text-xs text-gray-400">Gesperrt wenn aus</p>
              </div>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Plan</label>
              <select value={plan} onChange={e => setPlan(e.target.value as PricingPlan)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
                {(['FREE','STARTER','PRO','STUDIO'] as PricingPlan[]).map(p => (
                  <option key={p} value={p}>{PLAN_LABEL[p]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Plan läuft ab</label>
              <input type="date" value={planExpires} onChange={e => setExpires(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notizen (intern)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none" />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm hover:bg-gray-50">
              Abbrechen
            </button>
            <button type="submit" disabled={mutation.isPending}
              className="flex-1 bg-gray-900 text-white rounded-lg py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50">
              {mutation.isPending ? 'Speichern…' : 'Speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── InfoCards Admin ─────────────────────────────────────────────────────────

interface InfoCard {
  id: string
  page: string
  title: string
  body: string
  sortOrder: number
  computedKey?: string | null
}

function AdminInfoCards() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState<InfoCard | null>(null)
  const [showForm, setShowForm] = useState(false)

  const { data: cards = [] } = useQuery<InfoCard[]>({
    queryKey: ['info-cards'],
    queryFn: () => api.get('/info-cards').then(r => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/info-cards/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['info-cards'] }),
  })

  const pageLabel: Record<string, string> = { mitarbeiter: 'Mitarbeiter', kosten: 'Kosten' }
  const grouped = ['mitarbeiter', 'kosten'].map(page => ({
    page, label: pageLabel[page] ?? page,
    cards: cards.filter(c => c.page === page).sort((a, b) => a.sortOrder - b.sortOrder),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900">Hinweise & Insights</h2>
          <p className="text-sm text-gray-500 mt-0.5">Werden in der Sidebar bei Mitarbeiter und Kosten angezeigt</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true) }}
          className="flex items-center gap-1.5 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800">
          <Pencil className="w-4 h-4" /> Neuer Hinweis
        </button>
      </div>

      {grouped.map(group => (
        <div key={group.page}>
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">{group.label}</h3>
          {group.cards.length === 0 ? (
            <p className="text-sm text-gray-400 bg-white border border-dashed border-gray-200 rounded-xl p-4">
              Noch keine Hinweise für {group.label}
            </p>
          ) : (
            <div className="space-y-3">
              {group.cards.map(card => (
                <div key={card.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-gray-900">{card.title}</p>
                      {card.computedKey && (
                        <span className="text-xs font-medium bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">System</span>
                      )}
                    </div>
                    {card.computedKey && (
                      <p className="text-xs text-gray-400 font-mono mb-1">{card.computedKey}</p>
                    )}
                    <p className="text-xs text-gray-500 whitespace-pre-line">{card.body}</p>
                    <p className="text-xs text-gray-300 mt-1">Reihenfolge: {card.sortOrder}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => { setEditing(card); setShowForm(true) }}
                      className="p-2 text-gray-400 hover:text-gray-700"><Pencil className="w-4 h-4" /></button>
                    {card.computedKey ? (
                      <button disabled title="Systemkarten können nicht gelöscht werden"
                        className="p-2 text-gray-200 cursor-not-allowed"><Trash2 className="w-4 h-4" /></button>
                    ) : (
                      <button onClick={() => deleteMutation.mutate(card.id)}
                        className="p-2 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {showForm && (
        <InfoCardModal
          initial={editing}
          onClose={() => { setShowForm(false); setEditing(null) }}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ['info-cards'] })
            setShowForm(false); setEditing(null)
          }}
        />
      )}
    </div>
  )
}

function InfoCardModal({ initial, onClose, onSaved }:
  { initial: InfoCard | null; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!initial
  const isSystem = !!initial?.computedKey
  const [page, setPage]           = useState(initial?.page ?? 'mitarbeiter')
  const [title, setTitle]         = useState(initial?.title ?? '')
  const [body, setBody]           = useState(initial?.body ?? '')
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder?.toString() ?? '0')
  const [error, setError]         = useState('')

  const mutation = useMutation({
    mutationFn: (data: any) => isEdit
      ? api.patch(`/info-cards/${initial!.id}`, data)
      : api.post('/info-cards', data),
    onSuccess: onSaved,
    onError: (e: any) => setError(e.response?.data?.error ?? 'Fehler'),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    mutation.mutate({ page, title, body, sortOrder: parseInt(sortOrder) })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <h2 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
          {isEdit ? 'Hinweis bearbeiten' : 'Neuer Hinweis'}
          {isSystem && <span className="text-xs font-medium bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">System</span>}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSystem && initial?.computedKey && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Computed Key (schreibgeschützt)</label>
              <input value={initial.computedKey} readOnly
                className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm font-mono text-gray-500" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Seite</label>
              <select value={page} onChange={e => setPage(e.target.value)} disabled={isSystem}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:bg-gray-50 disabled:text-gray-500">
                <option value="mitarbeiter">Mitarbeiter</option>
                <option value="kosten">Kosten</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Reihenfolge</label>
              <input type="number" value={sortOrder} onChange={e => setSortOrder(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Titel</label>
            <input value={title} onChange={e => setTitle(e.target.value)} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Inhalt</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} required rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm hover:bg-gray-50">
              Abbrechen
            </button>
            <button type="submit" disabled={mutation.isPending}
              className="flex-1 bg-gray-900 text-white rounded-lg py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50">
              {mutation.isPending ? 'Speichern…' : 'Speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
