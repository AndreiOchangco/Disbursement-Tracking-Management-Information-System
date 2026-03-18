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
    <div>
      <div className="page-header">
        <div>
          <h2>Disbursement Tracking</h2>
          <p>
            Track requests, approvals, and release statuses in Disbursement MIS.
          </p>
        </div>
      </div>

      <section className="panel">
        <h3>New Disbursement Voucher Entry</h3>
        <form className="form-grid" onSubmit={addDisbursement}>
          <label>
            Tracking Number
            <input
              type="number"
              value={trackingno}
              onChange={(e) => setTrackingNo(e.target.value)}
              placeholder="Tracking number"
            />
          </label>
          <label>
            DV Number
            <input
              type="number"
              value={dvno}
              onChange={(e) => setDVno(e.target.value)}
              placeholder="DV Number"
            />
          </label>
          <label>
            Role
            <input
              value={officer}
              onChange={(e) => setOfficer(e.target.value)}
              placeholder="Role"
            />
          </label>
          <label>
            Status
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {statusOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="btn-primary">
            Add Voucher Entry
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="table-toolbar">
          <div>
            <h3>Open Disbursement Voucher Entry Requests</h3>
            <p>{filtered.length} records</p>
          </div>
          <div>
            <Link to="/disbursements/archived" className="btn-secondary">
              Archived Voucher Entry
            </Link>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by tracking number, status, or officer"
            className="search"
          />
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tracking Number</th>
                <th>DV Number</th>
                <th>Status</th>
                <th>Request Date</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id}>
                  <td>{d.trackingno ?? d.project}</td>
                  <td>
                    {d.dvno !== undefined && d.dvno !== null && d.dvno !== ''
                      ? Number(d.dvno).toString()
                      : ''}
                  </td>
                  <td>
                    <span
                      className={
                        'status-badge status-' +
                        String(d.status || '')
                          .toLowerCase()
                          .replace(/\s+/g, '-')
                      }
                    >
                      {d.status}
                    </span>
                  </td>
                  <td>{d.date}</td>
                  <td>{d.officer}</td>
                  <td>
                    <button className="btn-primary" onClick={() => updateStatus(d.id)}>
                      {d.status === 'Pending' && 'Approve'}
                      {d.status === 'Approved' && 'Release'}
                      {d.status === 'Released' && 'Lock'}
                      {d.status === 'Locked' && 'Reopen'}
                      {d.status === 'Rejected' && 'Rejected'}
                    </button>
                    <button
                      className="btn-danger"
                      style={{ marginLeft: 8 }}
                      onClick={async () => {
                        if (!confirm('Delete this disbursement?')) return
                        try {
                          const res = await fetch(`http://localhost:5000/api/disbursements/${d.id}`, { method: 'DELETE' })
                          const json = await res.json()
                          if (res.ok && json.success) {
                            // reload from backend to ensure DB/UI sync
                            try {
                              console.log('Deleted', d.id)
                              const r = await fetch('http://localhost:5000/api/disbursements')
                              const j = await r.json()
                              if (j && j.success) setDisbursements(j.disbursements || [])
                              alert('Disbursement deleted')
                            } catch (e) {
                              // fallback to local filter
                              setDisbursements((prev) => prev.filter((x) => x.id !== d.id))
                              alert('Deleted locally (could not reload)')
                            }
                            } else {
                              console.error('Delete failed', json)
                            }
                            } catch (e) {
                              console.error('Delete error', e)
                            }
                        }}
                      >
                        Delete
                      </button>
                    <button
                      className="btn-archive"
                      style={{ marginLeft: 8 }}
                      onClick={async () => {
                        if (!confirm('Archive this disbursement?')) return
                        try {
                          const res = await fetch(`http://localhost:5000/api/disbursements/${d.id}/archive`, { method: 'POST' })
                          const json = await res.json()
                          if (res.ok && json.success) {
                            // reload list from backend
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
                      }}
                    >
                      Archive
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="empty">No disbursements found.</p>}
        </div>
      </section>
    </div>
  )
}
