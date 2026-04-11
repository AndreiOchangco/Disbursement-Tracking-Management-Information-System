/* eslint-disable no-unused-vars */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiRequest } from '../api'

const formatDateMMDDYYYY = (date) => {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function AdminDisbursements() {
  const [disbursements, setDisbursements] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      const data = await apiRequest('/dv/')
      if (data) setDisbursements(data)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return disbursements
    return disbursements.filter(d => (
      String(d.tracking_no) + (d.dv_no || '') + (d.status || '') + (d.accounting_name || '')
    ).toLowerCase().includes(q))
  }, [search, disbursements])

  const updateStatus = async (item, newStatus) => {
    try {
      const updated = await apiRequest(`/dv/${item.id}/`, 'PUT', { ...item, status: newStatus })
      setDisbursements(prev => prev.map(p => p.id === item.id ? updated : p))
    } catch (err) {
      console.error(err)
      alert('Action failed')
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>🔧 Disbursement Voucher Management</h2>
          <p>Admin list view: manage and review all disbursement vouchers</p>
        </div>
      </div>

      <section className="panel">
        <div className="table-toolbar">
          <div>
            <h3 style={{ color: '#2c5dff' }}>📋 All Disbursement Vouchers</h3>
            <p style={{ color: '#4b5563', marginTop: '0.3rem' }}>{filtered.length} records</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Link to="/disbursements/archived" className="btn-archive" style={{ fontSize: '0.9rem', padding: '0.65rem 1rem' }}>
              📦 Archived
            </Link>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Search by tracking, DV, status or user..." className="search" />
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead style={{ background: 'linear-gradient(90deg, #f0f7ff 0%, #fef3c7 50%, #f0f7ff 100%)', borderBottom: '2px solid #fbbf24' }}>
              <tr>
                <th style={{ color: '#2c5dff' }}>📌 Tracking #</th>
                <th style={{ color: '#2c5dff' }}>🔖 DV Number</th>
                <th style={{ color: '#2c5dff' }}>📊 Status</th>
                <th style={{ color: '#2c5dff' }}>📅 Request Date</th>
                <th style={{ color: '#2c5dff' }}>👤 Created By</th>
                <th style={{ color: '#2c5dff' }}>⚙️ Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id} style={{ borderBottom: '1px solid #fef3c7' }}>
                  <td style={{ fontWeight: '600', color: '#2c5dff' }}>{d.tracking_no}</td>
                  <td>{d.dv_no ?? '-'}</td>
                  <td>
                    <span className={'status-badge status-' + String(d.status || '').toLowerCase().replace(/\s+/g, '-')} style={{ textTransform: 'capitalize' }}>
                      {d.status}
                    </span>
                  </td>
                  <td>{formatDateMMDDYYYY(d.created_date)}</td>
                  <td>{d.accounting_name || '-'}</td>
                  <td>
                    <Link to={`/disbursements/${d.id}`} className="btn-primary" style={{ marginRight: '0.5rem', fontSize: '0.85rem' }}>View</Link>
                    <button className="btn-primary" style={{ fontSize: '0.85rem', padding: '0.45rem 0.85rem', marginRight: '0.5rem' }} onClick={() => {
                      const next = d.status === 'Pending' ? 'Approved' : (d.status === 'Approved' ? 'Completed' : 'Pending')
                      updateStatus(d, next)
                    }}>{d.status === 'Pending' ? '✅ Approve' : (d.status === 'Approved' ? '🚀 Release' : '↩️ Toggle')}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="empty" style={{ textAlign: 'center', padding: '2rem', color: '#4b5563' }}>📭 No disbursements found.</p>}
        </div>
      </section>
    </div>
  )
}
