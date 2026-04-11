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

  const initialOfficer = (() => {
    const u = getCurrentUser()
    return (u && (u.department || u.name)) || ''
  })()

  const [officer, setOfficer] = useState(initialOfficer)

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
      setOfficer(initialOfficer)
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
    <div className='noselect'>
      <div className="page-header">
        <div>
          <h2><ion-icon name="card"></ion-icon> Disbursement Voucher Tracking</h2>
          <p>Track requests, approvals, and release statuses in Disbursement MIS.</p>
        </div>
      </div>

      {/* ➕ NEW ENTRY FORM */}
      <section className="panel noselect" style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', borderLeft: '4px solid #fbbf24' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ color: '#2c5dff', marginBottom: '0.5rem' }}><ion-icon name="add"></ion-icon> New Disbursement Voucher Entry</h3>
          <p style={{ color: '#4b5563', fontSize: '0.9rem', margin: 0 }}>Add a new voucher to track in the system</p>
        </div>
        <form className="form-grid noselect" onSubmit={addDisbursement}>
          <label>
            <span style={{ color: '#2c5dff', fontWeight: '600' }}>Tracking Number</span>
            <input
              type="number"
              value={trackingno}
              onChange={(e) => setTrackingNo(e.target.value)}
              placeholder="Enter tracking number"
            />
          </label>
          <label>
            <span style={{ color: '#2c5dff', fontWeight: '600' }}>DV Number</span>
            <input
              type="number"
              value={dvno}
              onChange={(e) => setDVno(e.target.value)}
              placeholder="Enter DV number"
            />
          </label>
          <label>
            <span style={{ color: '#2c5dff', fontWeight: '600' }}>Department</span>
            <input
              value={officer}
              readOnly
              disabled
              placeholder=""
            />
          </label>
          <label>
            <span style={{ color: '#2c5dff', fontWeight: '600' }}>Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {statusOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="btn-primary" style={{ marginTop: '1.75rem' }}>
            + Add Voucher Entry
          </button>
        </form>
      </section>

      {/* 📋 VOUCHERS TABLE */}
      <section className="panel">
        <div className="table-toolbar">
          <div>
            <h3 style={{ color: '#2c5dff' }}><ion-icon name="clipboard"></ion-icon> Open Disbursement Voucher Entries</h3>
            <p style={{ color: '#4b5563', marginTop: '0.3rem' }}>{filtered.length} active records</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Link to="/disbursements/archived" className="btn-archive" style={{ fontSize: '0.9rem', padding: '0.65rem 1rem' }}>
              <ion-icon name="archive"></ion-icon> Archived
            </Link>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by tracking, DV number, or officer..."
              className="search"
            />
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead style={{ background: 'linear-gradient(90deg, #f0f7ff 0%, #fef3c7 50%, #f0f7ff 100%)', borderBottom: '2px solid #fbbf24' }}>
              <tr>
                <th style={{ color: '#2c5dff' }}><ion-icon name="pin"></ion-icon> Tracking #</th>
                <th style={{ color: '#2c5dff' }}><ion-icon name="bookmark"></ion-icon> DV Number</th>
                <th style={{ color: '#2c5dff' }}><ion-icon name="bar-chart"></ion-icon> Status</th>
                <th style={{ color: '#2c5dff' }}><ion-icon name="calendar"></ion-icon> Request Date</th>
                <th style={{ color: '#2c5dff' }}><ion-icon name="person"></ion-icon> Created By</th>
                <th style={{ color: '#2c5dff' }}><ion-icon name="settings"></ion-icon> Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id} style={{ borderBottom: '1px solid #fef3c7', transition: 'all 0.3s ease' }} onMouseEnter={(e) => e.currentTarget.style.background = '#fffbeb'} onMouseLeave={(e) => e.currentTarget.style.background = 'white'}>
                  <td style={{ fontWeight: '600', color: '#2c5dff' }}>{d.tracking_no}</td>
                  <td>{d.dv_no !== undefined && d.dv_no !== null && d.dv_no !== '' ? Number(d.dv_no).toString() : '-'}</td>
                  <td>
                    <span className={'status-badge status-' + String(d.status || '').toLowerCase().replace(/\s+/g, '-')} style={{ textTransform: 'capitalize' }}>
                      {d.status}
                    </span>
                  </td>
                  <td>{formatDateMMDDYYYY(d.created_date)}</td>
                  <td>{d.accounting_name}</td>
                  <td>
                    <button className="btn-primary" style={{ fontSize: '0.85rem', padding: '0.5rem 0.85rem', marginRight: '0.5rem' }} onClick={() => {
                      let newStatus = d.status
                      if (d.status === 'Pending') newStatus = 'Approved'
                      else if (d.status === 'Approved') newStatus = 'Completed'
                      else if (d.status === 'Draft') newStatus = 'Pending'
                      updateStatus(d, newStatus)
                    }}>
                      {d.status === 'Pending' && <><ion-icon name="checkmark-circle"></ion-icon> Approve</> }
                      {d.status === 'Approved' && <><ion-icon name="airplane"></ion-icon> Release</> }
                      {d.status === 'Completed' && <><ion-icon name="lock-closed"></ion-icon> Lock</> }
                      {d.status === 'Draft' && <><ion-icon name="return-up-back"></ion-icon> Reopen</> }
                      {d.status === 'Rejected' && <><ion-icon name="close-circle"></ion-icon> Rejected</> }
                    </button>
                    <button className="btn-danger" style={{ fontSize: '0.85rem', padding: '0.5rem 0.85rem', marginRight: '0.5rem' }} onClick={async () => {
                        if (!confirm('Delete this disbursement?')) return
                        try {
                          const res = await fetch(`http://localhost:5000/api/disbursements/${d.id}`, { method: 'DELETE' })
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
                              console.error('Delete failed', json)
                            }
                            } catch (e) {
                              console.error('Delete error', e)
                            }
                        }}>
                      <ion-icon name="trash"></ion-icon> Delete
                    </button>
                    <button className="btn-archive" style={{ fontSize: '0.85rem', padding: '0.5rem 0.85rem' }} onClick={async () => {
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
                      }}>
                      <ion-icon name="archive"></ion-icon> Archive
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="empty" style={{ textAlign: 'center', padding: '2rem', color: '#4b5563' }}><ion-icon name="mail-unread"></ion-icon> No disbursements found.</p>}
        </div>
      </section>
    </div>
  )
}