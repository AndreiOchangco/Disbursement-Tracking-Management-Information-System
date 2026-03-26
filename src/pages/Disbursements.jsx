/* eslint-disable no-unused-vars */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCurrentUser } from '../auth'

const STORAGE_KEY = 'dtmis.disbursements'

const statusOptions = ['Pending', 'Approved', 'Released', 'Rejected']
const statusCycle = ['Pending', 'Approved', 'Released', 'Locked']


// Data is now persisted on the backend; frontend will fetch from API.

export default function Disbursements() {
  const [disbursements, setDisbursements] = useState([])
  const [search, setSearch] = useState('')
  const [trackingno, setTrackingNo] = useState('')
  const [dvno, setDVno] = useState('')
  const [status, setStatus] = useState('Pending')
  const [officer, setOfficer] = useState(() => {
    const u = getCurrentUser()
    return (u && u.role) || ''
  })

  // Load disbursements from backend on mount
  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const res = await fetch('http://localhost:5000/api/disbursements')
        const json = await res.json()
        if (mounted && json && json.success) {
          // normalize older entries (project -> trackingno)
          const data = (json.disbursements || []).map((item) => {
            if (item.trackingno !== undefined) return item
            if (item.project !== undefined) return { ...item, trackingno: item.project }
            return item
          })
          setDisbursements(data)
        }
      } catch (e) {
        console.error('Failed to load disbursements', e)
      }
    }
    // expose loader to other handlers by attaching to component scope
    // call once on mount
    load()
    // store loader reference
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ;(function attach() {
      // noop; loader is closed over
    })()
    return () => {
      mounted = false
    }
  }, [])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return disbursements
    return disbursements.filter((d) => {
      const tn = d.trackingno ?? d.project
      return (
        String(tn).toLowerCase().includes(query) ||
        d.status.toLowerCase().includes(query) ||
        d.officer.toLowerCase().includes(query)
      )
    })
  }, [search, disbursements])

  const addDisbursement = async (e) => {
    e.preventDefault()
    if (!trackingno || !dvno || !officer) return

    const payload = {
      trackingno: trackingno,
      dvno: Number(dvno),
      status,
      date: new Date().toISOString().slice(0, 10),
      officer,
    }

    try {
      const res = await fetch('http://localhost:5000/api/disbursements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setDisbursements((prev) => [json.disbursement, ...prev])
        setTrackingNo('')
        setDVno('')
        setStatus('Pending')
        setOfficer('')
      } else {
        console.error('Failed to add disbursement', json)
      }
    } catch (err) {
      console.error('Error adding disbursement', err)
    }
  }

  const updateStatus = (id) => {
    setDisbursements((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        // Cycle through the normal lifecycle (Pending -> Approved -> Released -> Locked -> Pending ...)
        const idx = statusCycle.indexOf(item.status)
        const nextStatus = idx === -1 ? 'Pending' : statusCycle[(idx + 1) % statusCycle.length]
        return { ...item, status: nextStatus }
      }),
    )
  }

  return (
    <div className="space-y-6">
      <header className="border-b border-slate-200 pb-4">
        <h2 className="text-2xl font-bold text-slate-800">Disbursement Voucher Entry Management</h2>
        <p className="text-sm text-slate-600">Add new disbursement voucher entries, provide details, and track requests, approvals, and release statuses in the Disbursement MIS.</p>
      </header>

      <section className="border border-slate-200 bg-white p-4">
        <h3 className="text-lg font-semibold text-slate-800">New Disbursement Voucher Entry</h3>
        <form onSubmit={addDisbursement} className="grid gap-3 md:grid-cols-2">
          <div className="flex flex-col gap-1 text-sm text-slate-700">
            <label className="font-medium">Tracking Number</label>
            <input type="number" value={trackingno} onChange={(e) => setTrackingNo(e.target.value)} placeholder="Tracking number" className="border border-slate-300 p-2" />
          </div>
          <div className="flex flex-col gap-1 text-sm text-slate-700">
            <label className="font-medium">DV Number</label>
            <input type="number" value={dvno} onChange={(e) => setDVno(e.target.value)} placeholder="DV Number" className="border border-slate-300 p-2" />
          </div>
          
        
          <div className="md:col-span-2">
            <button type="submit" className="border border-blue-600 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">Add Voucher Entry</button>
          </div>
        </form>
      </section>

      <section className="border border-slate-200 bg-white p-4">
        <div className="mb-3 grid gap-3 md:grid-cols-2 md:items-center">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Disbursement Tracking</h3>
            <p className="text-sm text-slate-600">{filtered.length} records</p>
          </div>
          <div className="flex items-center gap-2 justify-end">
            <Link to="/disbursements/archived" className="border border-slate-300 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">Archived Voucher Entry</Link>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by tracking number, status, or officer" className="border border-slate-300 p-2 text-sm" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Tracking Number</th>
                <th className="px-3 py-2 text-left font-semibold">DV Number</th>
                <th className="px-3 py-2 text-left font-semibold">Status</th>
                <th className="px-3 py-2 text-left font-semibold">Request Date</th>
                <th className="px-3 py-2 text-left font-semibold">Role</th>
                <th className="px-3 py-2 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.map((d) => (
                <tr key={d.id}>
                  <td className="px-3 py-2">{d.trackingno ?? d.project}</td>
                  <td className="px-3 py-2">{d.dvno !== undefined && d.dvno !== null && d.dvno !== '' ? Number(d.dvno).toString() : ''}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-1 text-xs font-bold ${d.status === 'Pending' ? 'bg-amber-100 text-amber-700' : d.status === 'Approved' ? 'bg-blue-100 text-blue-700' : d.status === 'Released' ? 'bg-green-100 text-green-700' : d.status === 'Locked' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>{d.status}</span>
                  </td>
                  <td className="px-3 py-2">{d.date}</td>
                  <td className="px-3 py-2">{d.officer}</td>
                  <td className="px-3 py-2 space-x-1">
                    <button onClick={() => updateStatus(d.id)} className="border border-blue-300 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                      {d.status === 'Pending' && 'Approve'}
                      {d.status === 'Approved' && 'Release'}
                      {d.status === 'Released' && 'Lock'}
                      {d.status === 'Locked' && 'Reopen'}
                      {d.status === 'Rejected' && 'Rejected'}
                    </button>
                    <button onClick={async () => {
                      if (!confirm('Delete this disbursement?')) return
                      try {
                        const res = await fetch(`http://localhost:5000/api/disbursements/${d.id}`, { method: 'DELETE' })
                        const json = await res.json()
                        if (res.ok && json.success) {
                          try {
                            const r = await fetch('http://localhost:5000/api/disbursements')
                            const j = await r.json()
                            if (j && j.success) setDisbursements(j.disbursements || [])
                            alert('Disbursement deleted')
                          } catch (e) {
                            setDisbursements((prev) => prev.filter((x) => x.id !== d.id))
                            alert('Deleted locally (could not reload)')
                          }
                        } else {
                          console.error('Delete failed', json)
                        }
                      } catch (e) {
                        console.error('Delete error', e)
                      }
                    }} className="border border-red-300 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
                      Delete
                    </button>
                    <button onClick={async () => {
                      if (!confirm('Archive this disbursement?')) return
                      try {
                        const res = await fetch(`http://localhost:5000/api/disbursements/${d.id}/archive`, { method: 'POST' })
                        const json = await res.json()
                        if (res.ok && json.success) {
                          try {
                            const r = await fetch('http://localhost:5000/api/disbursements')
                            const j = await r.json()
                            if (j && j.success) setDisbursements(j.disbursements || [])
                          } catch (e) {
                            setDisbursements((prev) => prev.filter((x) => x.id !== d.id))
                          }
                        } else {
                          console.error('Archive failed', json)
                        }
                      } catch (e) {
                        console.error('Archive error', e)
                      }
                    }} className="border border-purple-300 bg-purple-50 px-2 py-1 text-xs font-semibold text-purple-700">
                      Archive
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="mt-3 text-sm text-slate-600">No disbursements found.</p>}
        </div>
      </section>
    </div>
  )
}
