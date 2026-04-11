/* eslint-disable no-unused-vars */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiRequest, getCurrentUser } from '../api'

const user = JSON.parse(localStorage.getItem("user"))
const statusOptions = ['Pending', 'Approved', 'Rejected']

const formatDateMMDDYYYY = (date) => {
   const parts = date.split('-'); 
   const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
   return dateObj.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
   });
}

export default function Disbursements() {
  const [disbursements, setDisbursements] = useState([])
  const [search, setSearch] = useState('')
  const [trackingno, setTrackingNo] = useState('')
  const [dvno, setDVno] = useState('')
  const [status, setStatus] = useState('Pending')
  const [officer, setOfficer] = useState(() => {
    const u = getCurrentUser()
    return (u && u.name) || ''
  })

  // 🔥 Load data from Django backend
  useEffect(() => {
    async function load() {
      const data = await apiRequest('/dv/')
      if (data) setDisbursements(data)
    }
    load()
  }, [])

  // 🔍 Search filter
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return disbursements

    return disbursements.filter((d) =>
      (
        String(d.trackingno) +
        d.status +
        d.officer
      )
        .toLowerCase()
        .includes(query)
    )
  }, [search, disbursements])

  // ➕ Create Disbursement
  const addDisbursement = async (e) => {
    e.preventDefault()

    if (!trackingno || !dvno || !officer) return

    try {
      const newItem = await apiRequest('/dv/', 'POST', {
        trackingno,
        dvno: Number(dvno),
        status,
        officer,
      })

      setDisbursements((prev) => [newItem, ...prev])

      // reset form
      setTrackingNo('')
      setDVno('')
      setStatus('Pending')
      setOfficer('')
    } catch (err) {
      console.error('Create failed', err)
    }
  }

  // 🔄 Update Status (persisted)
  const updateStatus = async (item, newStatus) => {
  try {
    const updated = await apiRequest(`/dv/${item.id}/`, 'PUT', {
      ...item,
      status: newStatus,
    })

    setDisbursements((prev) =>
      prev.map((d) => (d.id === item.id ? updated : d))
    )
  } catch (err) {
    console.error(err)
    alert("Action not allowed")
  }
}

  // ❌ Delete
  const deleteItem = async (id) => {
    if (!confirm('Delete this disbursement?')) return

    try {
      await apiRequest(`/dv/${id}/`, 'DELETE')
      setDisbursements((prev) => prev.filter((d) => d.id !== id))
    } catch (err) {
      console.error('Delete failed', err)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Disbursement Tracking</h2>
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

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th>Tracking Number</th>
                <th>DV Number</th>
                <th>Status</th>
                <th>Request Date</th>
                <th>Created By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id}>
                  <td>{d.tracking_no}</td>
                  <td>
                    {d.dv_no !== undefined && d.dv_no !== null && d.dv_no !== ''
                      ? Number(d.dv_no).toString()
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
                  <td>{formatDateMMDDYYYY(d.created_date)}</td>
                  <td>{d.accounting_name}</td>
                  <td>
                    <button className="btn-primary" onClick={() => updateStatus(d.id)}>
                      {d.status === 'Pending' && 'Approve'}
                      {d.status === 'Approved' && 'Release'}
                      {d.status === 'Completed' && 'Lock'}
                      {d.status === 'Draft' && 'Reopen'}
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