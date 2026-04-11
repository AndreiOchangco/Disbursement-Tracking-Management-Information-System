/* eslint-disable no-unused-vars */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiRequest, getCurrentUser } from '../api'

const user = JSON.parse(localStorage.getItem("user"))
const statusOptions = ['Pending', 'Approved', 'Rejected']

export default function Journals() {
  const [journals, setJournals] = useState([])
  const [search, setSearch] = useState('')

  // 🔥 Load data from Django backend
  useEffect(() => {
    async function load() {
      const data = await apiRequest('/journals/')
      if (data) setJournals(data)
    }
    load()
  }, [])

  // 🔍 Search filter
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return journals

    return journals.filter((j) =>
      (
        String(j.trackingno) +
        j.status +
        j.officer
      )
        .toLowerCase()
        .includes(query)
    )
  }, [search, journals])

  // 🔄 Update Status (persisted)
  const updateStatus = async (item, newStatus) => {
  try {
    const updated = await apiRequest(`/journals/${item.id}/`, 'PUT', {
      ...item,
      status: newStatus,
    })

    setJournals((prev) =>
      prev.map((j) => (j.id === item.id ? updated : j))
    )
  } catch (err) {
    console.error(err)
    alert("Action not allowed")
  }
}

  // ❌ Delete
  const deleteItem = async (id) => {
    if (!confirm('Delete this journal?')) return

    try {
      await apiRequest(`/journals/${id}/`, 'DELETE')
      setJournals((prev) => prev.filter((j) => j.id !== id))
    } catch (err) {
      console.error('Delete failed', err)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>📖 Journal Entry Management</h2>
          <p>Track journal entries, approvals, and posting statuses.</p>
        </div>
      </div>

      {/* 📊 JOURNAL ENTRIES TABLE */}
      <section className="panel">
        <div className="table-toolbar">
          <div>
            <h3 style={{ color: '#2c5dff' }}>📋 All Journal Entries</h3>
            <p style={{ color: '#4b5563', marginTop: '0.3rem' }}>{filtered.length} records found</p>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Search by tracking #, JE #, status, or officer..."
            className="search"
          />
        </div>

        <div className="table-wrap">
          <table>
            <thead style={{ background: 'linear-gradient(90deg, #f0f7ff 0%, #fef3c7 50%, #f0f7ff 100%)', borderBottom: '2px solid #fbbf24' }}>
              <tr>
                <th style={{ color: '#2c5dff' }}>📌 Tracking #</th>
                <th style={{ color: '#2c5dff' }}>🔖 Journal Entry #</th>
                <th style={{ color: '#2c5dff' }}>📊 Status</th>
                <th style={{ color: '#2c5dff' }}>👤 Officer</th>
                <th style={{ color: '#2c5dff' }}>⚙️ Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((j) => (
                <tr 
                  key={j.id} 
                  style={{ 
                    borderBottom: '1px solid #fef3c7', 
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }} 
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(90deg, #fffbeb 0%, #fef3c7 100%)'
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(251, 191, 36, 0.15)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <td style={{ fontWeight: '600', color: '#2c5dff' }}>
                    <span style={{ background: 'rgba(44, 93, 255, 0.1)', padding: '0.4rem 0.8rem', borderRadius: '6px' }}>
                      {j.trackingno}
                    </span>
                  </td>
                  <td style={{ fontWeight: '500', color: '#1f2937' }}>
                    <span style={{ background: 'rgba(251, 191, 36, 0.1)', padding: '0.4rem 0.8rem', borderRadius: '6px' }}>
                      {j.jeno}
                    </span>
                  </td>

                  <td>
                    <span 
                      className={'status-badge status-' + (j.status || '').toLowerCase()}
                      style={{ 
                        display: 'inline-block',
                        padding: '0.4rem 0.85rem',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        textTransform: 'capitalize',
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      {j.status}
                    </span>
                  </td>

                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>👤</span>
                      <span style={{ fontWeight: '500' }}>{j.officer}</span>
                    </div>
                  </td>

                  <td>
                    <button
                      className="btn-primary"
                      style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', marginRight: '0.5rem' }}
                      onClick={() => {
                        let newStatus = j.status
                        if (j.status === 'Pending') newStatus = 'Approved'
                        else if (j.status === 'Approved') newStatus = 'Posted'
                        else if (j.status === 'Posted') newStatus = 'Completed'
                        updateStatus(j, newStatus)
                      }}
                    >
                      {j.status === 'Pending' && '✅ Approve'}
                      {j.status === 'Approved' && '🚀 Post'}
                      {j.status === 'Posted' && '✔️ Complete'}
                      {j.status === 'Completed' && '🔒 Lock'}
                      {j.status === 'Rejected' && '❌ Rejected'}
                    </button>
                    <button
                      className="btn-danger"
                      style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                      onClick={() => deleteItem(j.id)}
                    >
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#4b5563' }}>
              <p style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>📭</p>
              <p style={{ margin: 0, fontStyle: 'italic' }}>No journal entries found.</p>
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem' }}>Try adjusting your search filters.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}