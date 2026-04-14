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
  const [payee, setPayee] = useState('')
  const [fundSource, setFundSource] = useState('GF')

  const initialOfficer = (() => {
    const u = getCurrentUser()
    return (u && u.full_name) || ''
  })()

  const [officer, setOfficer] = useState(initialOfficer)
  const currentUser = getCurrentUser()
  // Normalize department keys to match backend choices (be tolerant of label variants)
  const normalizeDept = (d) => {
    if (!d) return null
    const v = String(d).toLowerCase().trim()
    if (v === 'admin' || v.includes('system')) return 'admin'
    if (v === 'accounting' || v === 'accountant') return 'accounting'
    if (v.includes('budget')) return 'budget'
    if (v.includes('treasurer')) return 'treasurer'
    if (v.includes('bac') || v.includes('technical')) return 'bac_gso'
    if (v.includes('mayor') || v.includes('secretary')) return 'mayors_office'
    return v.replace(/\s+/g, '_')
  }

  const currentUserDeptKey = normalizeDept(currentUser?.department)
  const isAccountant = currentUserDeptKey === 'accounting'
  const DEPT_STEP = {
    accounting: 1,
    budget: 2,
    treasurer: 3,
    bac_gso: 4,
    mayors_office: 5,
  }
  const currentUserStep = DEPT_STEP[currentUserDeptKey] || null

  // 🔥 Load data from Django backend
  useEffect(() => {
    async function load() {
      const data = await apiRequest('/dv/')
      if (data) setDisbursements(data)
    }
    load()
  }, [])

  const reload = async () => {
    try {
      const data = await apiRequest('/dv/')
      if (data) setDisbursements(data)
    } catch (e) {
      console.error('Failed to reload disbursements', e)
    }
  }

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

    if (!trackingno || !dvno || !officer || !payee || !fundSource) {
      return alert('Please fill required fields: Tracking, DV, Payee, Fund Source')
    }

    try {
      const payload = {
        dv_no: String(dvno),
        tracking_no: String(trackingno),
        payee: payee,
        office: officer,
        created_date: new Date().toISOString().split('T')[0],
        fund_source: fundSource,
      }

      const newItem = await apiRequest('/dv/', 'POST', payload)

      if (newItem) {
        setDisbursements((prev) => [newItem, ...prev])
      } else {
        await reload()
      }

      // reset form
      setTrackingNo('')
      setDVno('')
      setStatus('Pending')
      setPayee('')
      setFundSource('GF')
      setOfficer(initialOfficer)
    } catch (err) {
      console.error('Create failed', err)
      alert(err?.message || 'Failed to create disbursement')
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

  const approveItem = async (item) => {
    if (!confirm('Approve this disbursement?')) return
    try {
      await apiRequest(`/dv/${item.id}/approve/`, 'POST')
      await reload()
    } catch (err) {
      console.error('Approve failed', err)
      alert(err?.message || 'Approve failed')
    }
  }

  const rejectItem = async (item) => {
    const remarks = prompt('Enter remarks for rejection:')
    if (!remarks) return alert('Rejection remarks are required')
    try {
      await apiRequest(`/dv/${item.id}/disapprove/`, 'POST', { remarks })
      await reload()
    } catch (err) {
      console.error('Reject failed', err)
      alert(err?.message || 'Reject failed')
    }
  }

  const handleDecision = async (item) => {
    const input = prompt('Type A to approve, or enter rejection remarks to reject:')
    if (!input) return
    if (input.trim().toLowerCase() === 'a') {
      await approveItem(item)
    } else {
      try {
        await apiRequest(`/dv/${item.id}/disapprove/`, 'POST', { remarks: input })
        await reload()
      } catch (err) {
        console.error('Reject failed', err)
        alert('Reject failed')
      }
    }
  }

  const isActionable = (d) => {
    const statusLower = String(d.status || '').toLowerCase()
    // Allow accountants to act regardless of workflow stage (but not on archived/completed)
    if (currentUserDeptKey === 'accounting') {
      return statusLower !== 'archived' && statusLower !== 'completed'
    }
    const allowed = statusLower === 'pending'
    return allowed && d.current_step === currentUserStep
  }

  const toggleDecision = async (item) => {
    const isApproved = String(item.status || '').toLowerCase() === 'approved'

    // Client-side guard: allow when pending, or for Accounting allow draft at step 1
    const statusLower = String(item.status || '').toLowerCase()
    const allowed = statusLower === 'pending' || (currentUser?.department === 'accounting' && statusLower === 'draft')
    if (!allowed || item.current_step !== currentUserStep) {
      return alert('You cannot approve this Disbursement Voucher at this stage.')
    }

    if (!isApproved) {
      // Approve
      if (!confirm('Approve this disbursement?')) return
      try {
        const updated = await apiRequest(`/dv/${item.id}/approve/`, 'POST')
        if (updated) {
          setDisbursements((prev) => prev.map((d) => (d.id === item.id ? updated : d)))
        } else {
          await reload()
        }
      } catch (err) {
        console.error('Approve failed', err)
        alert(err?.message || 'Approve failed')
      }
    } else {
      // Reject (disapprove) — require remarks
      const remarks = prompt('Enter remarks for rejection:')
      if (!remarks) return alert('Rejection remarks are required')
      try {
        const updated = await apiRequest(`/dv/${item.id}/disapprove/`, 'POST', { remarks })
        if (updated) {
          setDisbursements((prev) => prev.map((d) => (d.id === item.id ? updated : d)))
        } else {
          await reload()
        }
      } catch (err) {
        console.error('Reject failed', err)
        alert(err?.message || 'Reject failed')
      }
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
            <span style={{ color: '#2c5dff', fontWeight: '600' }}>Payee</span>
            <input
              type="text"
              value={payee}
              onChange={(e) => setPayee(e.target.value)}
              placeholder="Enter payee name"
            />
          </label>
          <label>
            <span style={{ color: '#2c5dff', fontWeight: '600' }}>Fund Source</span>
            <select value={fundSource} onChange={(e) => setFundSource(e.target.value)}>
              <option value="GF">GF</option>
              <option value="20% DF">20% DF</option>
              <option value="5% DRRM">5% DRRM</option>
              <option value="GAD">GAD</option>
              <option value="RA7171">RA7171</option>
              <option value="SEF">SEF</option>
              <option value="TF">TF</option>
              <option value="PHILHEALTH">PHILHEALTH</option>
              <option value="CALAMITY">CALAMITY</option>
            </select>
          </label>
          <label>
            <span style={{ color: '#2c5dff', fontWeight: '600' }}>Created By</span>
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
                    {/* Actions: Approve/Reject for non-admin users; Delete/Archive for Accounting */}
                    {currentUser?.department !== 'admin' && (
                      <>
                        {/* Separate Approve and Reject buttons */}
                        <>
                          <button
                            className="btn-primary"
                            style={{ fontSize: '0.85rem', padding: '0.5rem 0.85rem', marginRight: '0.5rem' }}
                            onClick={() => approveItem(d)}
                            disabled={!isActionable(d)}
                            title={!isActionable(d) ? 'Not actionable at your stage' : 'Approve'}
                          >
                            <ion-icon name="checkmark-circle"></ion-icon> Approve
                          </button>

                          <button
                            className="btn-danger"
                            style={{ fontSize: '0.85rem', padding: '0.5rem 0.85rem', marginRight: '0.5rem' }}
                            onClick={() => rejectItem(d)}
                            disabled={!isActionable(d)}
                            title={!isActionable(d) ? 'Not actionable at your stage' : 'Reject'}
                          >
                            <ion-icon name="close-circle"></ion-icon> Reject
                          </button>

                          {!isActionable(d) && (
                            <small style={{ color: '#6b7280' }}>
                              ({String(d.status || '')}, step {d.current_step ?? 'N/A'}, your step {currentUserStep ?? 'N/A'})
                            </small>
                          )}
                        </>
                      </>
                    )}

                    {isAccountant && (
                      <>
                        <button className="btn-danger" style={{ fontSize: '0.85rem', padding: '0.5rem 0.85rem', marginRight: '0.5rem' }} onClick={async () => {
                          if (!confirm('Delete this disbursement?')) return
                          try {
                            await deleteItem(d.id)
                          } catch (e) {
                            console.error('Delete error', e)
                          }
                        }}>
                          <ion-icon name="trash"></ion-icon> Delete
                        </button>

                        <button className="btn-archive" style={{ fontSize: '0.85rem', padding: '0.5rem 0.85rem' }} onClick={async () => {
                          if (!confirm('Archive this disbursement?')) return
                          const reason = prompt('Reason for archiving:')
                          if (!reason) return alert('Reason is required')
                          try {
                            await apiRequest(`/dv/${d.id}/archive/`, 'POST', { reason })
                            await reload()
                          } catch (e) {
                            console.error('Archive error', e)
                          }
                        }}>
                          <ion-icon name="archive"></ion-icon> Archive
                        </button>
                      </>
                    )}
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