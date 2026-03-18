import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCurrentUser } from '../auth'

const STORAGE_KEY = 'dtmis.disbursements'

const statusOptions = ['Pending', 'Approved', 'Released', 'Rejected']
const statusCycle = ['Pending', 'Approved', 'Released', 'Locked']


function readSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const data = JSON.parse(raw)
    // Normalize older entries that used `project` instead of `trackingno`
    return data.map((item) => {
      if (item.trackingno !== undefined) return item
      if (item.project !== undefined) return { ...item, trackingno: item.project }
      return item
    })
  } catch {
    return []
  }
}

export default function Disbursements() {
  const [disbursements, setDisbursements] = useState(() => readSaved())
  const [search, setSearch] = useState('')
  const [trackingno, setTrackingNo] = useState('')
  const [dvno, setDVno] = useState('')
  const [status, setStatus] = useState('Pending')
  const [officer, setOfficer] = useState(() => {
    const u = getCurrentUser()
    return (u && u.role) || ''
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(disbursements))
  }, [disbursements])

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

  const addDisbursement = (e) => {
    e.preventDefault()
    if (!trackingno || !dvno || !officer) return

    setDisbursements((prev) => [
      ...prev,
      {
        id: prev.length ? Math.max(...prev.map((d) => d.id)) + 1 : 1,
        trackingno: Number(trackingno),
        dvno: Number(dvno),
        status,
        date: new Date().toISOString().slice(0, 10),
        officer,
      },
    ])

    setTrackingNo('')
    setDVno('')
    setStatus('Pending')
    setOfficer('')
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
