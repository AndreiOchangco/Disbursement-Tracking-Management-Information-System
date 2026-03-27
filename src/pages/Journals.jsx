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
          <h2>Journal Entry List</h2>
          <p>Track requests, approvals, and release statuses.</p>
        </div>
      </div>

      {/* 📊 TABLE */}
      <section className="panel">
        <div className="table-toolbar">
          <h3>Journal Entries ({filtered.length})</h3>

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
                <th>JE #</th>
                <th>Status</th>
                <th>Officer</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((j) => (
                <tr key={j.id}>
                  <td>{j.trackingno}</td>
                  <td>{j.jeno}</td>

                  <td>
                    <span className={'status-badge status-' + (j.status || '').toLowerCase()}>
                      {j.status}
                    </span>
                  </td>

                  <td>{j.officer}</td>
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