/* eslint-disable no-unused-vars */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest, BASE_URL, getToken, getCurrentUser } from '../api'

export default function ReportGeneration() {
  const navigate = useNavigate()
  const currentUser = getCurrentUser()
  const [approved, setApproved] = useState([])
  const [loading, setLoading] = useState(false)

  // Redirect admin to dashboard
  useEffect(() => {
    if (currentUser?.department === 'admin') {
      navigate('/admin/dashboard', { replace: true })
    }
  }, [currentUser, navigate])

  useEffect(() => {
    loadApproved()
  }, [])

  const loadApproved = async () => {
    setLoading(true)
    try {
      const all = await apiRequest('/dv/')
      const approvedList = (all || []).filter(d => String(d.status).toLowerCase() === 'approved')
      setApproved(approvedList)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const downloadJSON = (data) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'approved-disbursements.json'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const downloadPDF = async () => {
    setLoading(true)
    try {
      const token = getToken()
      const res = await fetch(`${BASE_URL}/dv/approved/report/pdf/`, {
        method: 'GET',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })

      if (!res.ok) throw new Error('Failed to generate PDF')

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'approved-disbursements.pdf'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2><ion-icon name="document-text-outline"></ion-icon> Report Generation</h2>
          <p>Generate reports for approved disbursement vouchers after workflow completion.</p>
        </div>
      </div>

      <section className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ color: '#2c5dff' }}>Approved Disbursement Vouchers</h3>
            <p style={{ margin: 0, color: '#4b5563' }}>{approved.length} approved records</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn-primary" onClick={() => downloadJSON(approved)} disabled={approved.length === 0 || loading}>
              ⤓ Export JSON
            </button>
            <button className="btn-primary" onClick={downloadPDF} disabled={approved.length === 0 || loading}>
              ⤓ Export PDF
            </button>
            <button className="btn-archive" onClick={loadApproved} disabled={loading}>
              🔄 Refresh
            </button>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tracking #</th>
                <th>DV Number</th>
                <th>Amount</th>
                <th>Approved Date</th>
                <th>Prepared By</th>
              </tr>
            </thead>
            <tbody>
              {approved.map((d) => (
                <tr key={d.id}>
                  <td style={{ fontWeight: 600 }}>{d.tracking_no}</td>
                  <td>{d.dv_no ?? '-'}</td>
                  <td>{d.amount ?? '-'}</td>
                  <td>{d.approved_date ?? d.created_date ?? '-'}</td>
                  <td>{d.accounting_name ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {approved.length === 0 && <p className="empty" style={{ textAlign: 'center', padding: '2rem', color: '#4b5563' }}>{loading ? 'Loading...' : 'No approved disbursements yet.'}</p>}
        </div>
      </section>
    </div>
  )
}
