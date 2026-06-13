import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, UserCircle2 } from 'lucide-react'
import api from '../../api'
import type { Salon, Employee, EmployeeRole } from '../../types'

const ROLE_LABEL: Record<EmployeeRole, string> = {
  CHEF: 'Inhaber/in', FRISEUR: 'Friseur/in', ORGA: 'Organisationskraft', AZUBI: 'Azubi',
}
const ROLE_COLOR: Record<EmployeeRole, string> = {
  CHEF: 'bg-gray-900 text-white', FRISEUR: 'bg-blue-100 text-blue-800',
  ORGA: 'bg-purple-100 text-purple-800', AZUBI: 'bg-green-100 text-green-800',
}

function fmt(n: number) { return n.toLocaleString('de-DE') }

const MONTH_NAMES = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez']

export default function MitarbeiterTab({ salonId, salon, readOnly = false }: { salonId: string; salon: Salon; readOnly?: boolean }) {
  const qc = useQueryClient()
  const [editing, setEditing]   = useState<Employee | null>(null)
  const [showForm, setShowForm] = useState(false)

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ['employees', salonId],
    queryFn: () => api.get(`/salons/${salonId}/employees`).then(r => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/salons/${salonId}/employees/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees', salonId] }),
  })

  const groups: EmployeeRole[] = ['CHEF', 'FRISEUR', 'ORGA', 'AZUBI']

  return (
    <div className="space-y-6">
      {!readOnly && (
        <div className="flex justify-end">
          <button onClick={() => { setEditing(null); setShowForm(true) }}
            className="flex items-center gap-1.5 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800">
            <Plus className="w-4 h-4" /> Mitarbeiter hinzufügen
          </button>
        </div>
      )}

      {employees.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center">
          <UserCircle2 className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-900">Noch keine Mitarbeiter</p>
          <p className="text-sm text-gray-500 mt-1">Füge Friseure, Organisationskräfte und Azubis hinzu.</p>
        </div>
      ) : (
        groups.map(role => {
          const group = employees.filter(e => e.role === role)
          if (group.length === 0) return null
          return (
            <div key={role} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_COLOR[role]}`}>
                  {ROLE_LABEL[role]}
                </span>
                <span className="text-xs text-gray-400">{group.length} Person{group.length > 1 ? 'en' : ''}</span>
              </div>
              <div className="overflow-x-auto"><table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 border-b border-gray-100">
                    <th className="text-left px-5 py-2 font-medium">Name</th>
                    <th className="text-right px-5 py-2 font-medium">Brutto/Monat</th>
                    <th className="text-right px-5 py-2 font-medium">Std./Wo</th>
                    <th className="text-right px-5 py-2 font-medium">Monate</th>
                    <th className="px-5 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {group.map(emp => (
                    <tr key={emp.id}>
                      <td className="px-5 py-3 font-medium text-gray-900">{emp.name}</td>
                      <td className="px-5 py-3 text-right text-gray-700">{fmt(emp.grossSalary)} €</td>
                      <td className="px-5 py-3 text-right text-gray-500">{emp.weeklyHours}</td>
                      <td className="px-5 py-3 text-right text-gray-500">
                        {emp.activeMonths.reduce((s, m) => s + m, 0).toFixed(1)}
                      </td>
                      {!readOnly && (
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => { setEditing(emp); setShowForm(true) }}
                              className="p-2 text-gray-400 hover:text-gray-700"><Pencil className="w-4 h-4" /></button>
                            <button onClick={() => deleteMutation.mutate(emp.id)}
                              className="p-2 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table></div>
            </div>
          )
        })
      )}

      {showForm && (
        <EmployeeModal
          salonId={salonId}
          initial={editing}
          fullTimeHours={salon.fullTimeHours}
          onClose={() => { setShowForm(false); setEditing(null) }}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ['employees', salonId] })
            qc.invalidateQueries({ queryKey: ['calc', salonId] })
            setShowForm(false); setEditing(null)
          }}
        />
      )}
    </div>
  )
}

function EmployeeModal({ salonId, initial, fullTimeHours, onClose, onSaved }:
  { salonId: string; initial: Employee | null; fullTimeHours: number; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!initial
  const [name, setName]                   = useState(initial?.name ?? '')
  const [role, setRole]                   = useState<EmployeeRole>(initial?.role ?? 'FRISEUR')
  const [grossSalary, setGross]           = useState(initial?.grossSalary?.toString() ?? '')
  const [weeklyHours, setWeekly]          = useState(initial?.weeklyHours?.toString() ?? fullTimeHours.toString())
  const [activeMonths, setActive]         = useState<number[]>(initial?.activeMonths ?? Array(12).fill(1))
  const [christmasBonus, setXmas]         = useState(initial?.christmasBonus?.toString() ?? '0')
  const [holidayBonus, setHoliday]        = useState(initial?.holidayBonus?.toString() ?? '0')
  const [error, setError]                 = useState('')

  const mutation = useMutation({
    mutationFn: (data: any) => isEdit
      ? api.patch(`/salons/${salonId}/employees/${initial!.id}`, data)
      : api.post(`/salons/${salonId}/employees`, data),
    onSuccess: onSaved,
    onError: (e: any) => setError(e.response?.data?.error ?? 'Fehler'),
  })

  function toggleMonth(i: number) {
    setActive(prev => prev.map((v, idx) => idx === i ? (v === 1 ? 0 : 1) : v))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    mutation.mutate({ name, role, grossSalary, weeklyHours, activeMonths, christmasBonus, holidayBonus })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 my-8">
        <h2 className="text-lg font-bold text-gray-900 mb-5">
          {isEdit ? 'Mitarbeiter bearbeiten' : 'Mitarbeiter hinzufügen'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
              <input value={name} onChange={e => setName(e.target.value)} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Rolle</label>
              <select value={role} onChange={e => setRole(e.target.value as EmployeeRole)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
                {(Object.keys(ROLE_LABEL) as EmployeeRole[]).map(r => (
                  <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Brutto / Monat (€)</label>
              <input type="number" value={grossSalary} onChange={e => setGross(e.target.value)} required min="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Stunden / Woche</label>
              <input type="number" value={weeklyHours} onChange={e => setWeekly(e.target.value)} min="1" max="50"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Weihnachtsgeld (€)</label>
              <input type="number" value={christmasBonus} onChange={e => setXmas(e.target.value)} min="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Urlaubsgeld (€)</label>
              <input type="number" value={holidayBonus} onChange={e => setHoliday(e.target.value)} min="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Arbeitsmonate</label>
            <div className="flex gap-1.5 flex-wrap">
              {MONTH_NAMES.map((m, i) => (
                <button key={i} type="button" onClick={() => toggleMonth(i)}
                  className={`px-2.5 py-1 text-xs rounded-lg border font-medium transition-colors ${
                    activeMonths[i] === 1
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-400 border-gray-200'
                  }`}>
                  {m}
                </button>
              ))}
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
              {mutation.isPending ? 'Speichern…' : 'Speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
