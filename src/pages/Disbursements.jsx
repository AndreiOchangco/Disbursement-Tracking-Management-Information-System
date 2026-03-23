/* eslint-disable no-unused-vars */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCurrentUser } from '../auth'
import { apiRequest } from '../api'

const user = JSON.parse(localStorage.getItem("user"))
const statusOptions = ['Pending', 'Approved', 'Rejected']

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
      const data = await apiRequest('/disbursements/')
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
      const newItem = await apiRequest('/disbursements/', 'POST', {
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
    const updated = await apiRequest(`/disbursements/${item.id}/`, 'PUT', {
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
      await apiRequest(`/disbursements/${id}/`, 'DELETE')
      setDisbursements((prev) => prev.filter((d) => d.id !== id))
    } catch (err) {
      console.error('Delete failed', err)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Disbursement Tracking</h2>
          <p>Track requests, approvals, and release statuses.</p>
        </div>
      </div>

      {/* ➕ CREATE FORM */}
      {(user?.role === 'accountant' || user?.is_admin) && (
        <section className="panel">
          <h3>New Disbursement</h3>

          <form className="form-grid" onSubmit={addDisbursement}>
            <label>
              Tracking Number
              <input
                value={trackingno}
                onChange={(e) => setTrackingNo(e.target.value)}
              />
            </label>

            <label>
              DV Number
              <input
                type="number"
                value={dvno}
                onChange={(e) => setDVno(e.target.value)}
              />
            </label>

            <label>
              Officer
              <input
                value={officer}
                onChange={(e) => setOfficer(e.target.value)}
              />
            </label>

            <label>
              Status
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                {statusOptions.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>

            <button className="btn-primary">Add</button>
          </form>
        </section>
      )}

      {/* 📊 TABLE */}
      <section className="panel">
        <div className="table-toolbar">
          <h3>Disbursements ({filtered.length})</h3>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
          />
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tracking #</th>
                <th>DV #</th>
                <th>Status</th>
                <th>Officer</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((d) => (
                <tr key={d.id}>
                  <td>{d.trackingno}</td>
                  <td>{d.dvno}</td>

                  <td>
                    <span className={'status-badge status-' + (d.status || '').toLowerCase()}>
                      {d.status}
                    </span>
                  </td>

                  <td>{d.officer}</td>

                  <td>
                    {/* ONLY budget officer or admin can approve/reject */}
                    {(user?.role === 'budget_officer' || user?.is_admin) && d.status === 'Pending' && (
                      <>
                        <button
                          className="btn-primary"
                          onClick={() => updateStatus(d, 'Approved')}
                        >
                          Approve
                        </button>

                        <button
                          className="btn-danger"
                          style={{ marginLeft: 8 }}
                          onClick={() => updateStatus(d, 'Rejected')}
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {/* show status if already processed */}
                    {d.status !== 'Pending' && <span>{d.status}</span>}

                    {/* ONLY admin can delete */}
                    {user?.is_admin && (
                      <button
                        className="btn-danger"
                        onClick={() => deleteItem(d.id)}
                        style={{ marginLeft: 8 }}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <p className="empty">No records found.</p>
          )}
        </div>
      </section>
    </div>
  )
}