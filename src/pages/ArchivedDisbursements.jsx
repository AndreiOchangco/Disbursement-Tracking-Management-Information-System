/* eslint-disable no-unused-vars */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export default function ArchivedDisbursements() {
  const [archived, setArchived] = useState([])

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const res = await fetch('http://localhost:5000/api/disbursements/archived')
        const json = await res.json()
        if (mounted && json && json.success) setArchived(json.disbursements || [])
      } catch (e) {
        console.error('Failed to load archived disbursements', e)
      }
    }
    load()
    return () => (mounted = false)
  }, [])

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Archived Voucher Entry</h2>
          <p>Previously archived voucher entries.</p>
        </div>
        <div>
          <Link to="/disbursements" className="btn-primary">
            Back to Voucher Entry
          </Link>
        </div>
      </div>

      <section className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Tracking Number</th>
                <th>DV Number</th>
                <th>Status</th>
                <th>Request Date</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {archived.map((d) => (
                <tr key={d.id}>
                  <td>#{d.orig_id || d.id}</td>
                  <td>{d.trackingno}</td>
                  <td>
                    {d.dvno !== undefined && d.dvno !== null && d.dvno !== ''
                      ? String(d.dvno)
                      : ''}
                  </td>
                  <td>{d.status}</td>
                  <td>{d.date}</td>
                  <td>{d.officer}</td>
                  <td>
                    <button
                      className="btn-danger"
                      style={{ marginLeft: 8 }}
                      onClick={async () => {
                        if (!confirm('Delete this archived disbursement?')) return
                        try {
                          const res = await fetch(`http://localhost:5000/api/disbursements/archived/${d.id}`, { method: 'DELETE' })
                          const json = await res.json()
                          if (res.ok && json.success) {
                            // reload from backend to ensure DB/UI sync
                            try {
                              console.log('Deleted', d.id)
                              const r = await fetch('http://localhost:5000/api/disbursements/archived')
                              const j = await r.json()
                              if (j && j.success) setArchived(j.disbursements || [])
                              alert('Archived disbursement deleted')
                            } catch (e) {
                              // fallback to local filter
                              setArchived   ((prev) => prev.filter((x) => x.id !== d.id))
                              alert('Archived disbursement deleted locally (could not reload)')
                            }
                            } else {
                              console.error('Archived disbursement delete failed', json)
                            }
                            } catch (e) {
                              console.error('Archived disbursement delete error', e)
                            }
                        }}
                      >
                        Delete
                      </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {archived.length === 0 && <p className="empty">No archived disbursements found.</p>}
        </div>
      </section>
    </div>
  )
}
