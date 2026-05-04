/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest, BASE_URL, getCurrentUser } from '../api'
import ReactModal from '../components/ReactModal'
import {toast} from 'react-toastify'

export default function ReportGeneration() {
  // 🔥 State controls modal visibility
  const [isOpen, setIsOpen] = useState(false);

  // Open modal
  const openModal = () => setIsOpen(true);

  // Close modal
  const closeModal = () => setIsOpen(false);



  const navigate = useNavigate()
  const currentUser = getCurrentUser()
  const [approved, setApproved] = useState([])
  const [loading, setLoading] = useState(false)
  const [reports, setReports] = useState([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [totalPages, setTotalPages] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [filterDvNo, setFilterDvNo] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [pdfUrl, setPdfUrl] = useState(null)
  const [selectedReport, setSelectedReport] = useState(null)

  // Redirect admin to dashboard
  useEffect(() => {
    if (currentUser?.department === 'admin') {
      navigate('/admin/dashboard', { replace: true })
    }
  }, [currentUser, navigate])

  useEffect(() => {
    fetchReports()
  }, [])

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl)
    }
  }, [pdfUrl])

  const fetchReports = async (p = 1) => {
    setLoading(true)
    try {
      const qs = new URLSearchParams()
      qs.set('page', p)
      qs.set('page_size', pageSize)
      if (filterDvNo) qs.set('dv_no', filterDvNo)
      if (filterFrom) qs.set('date_from', filterFrom)
      if (filterTo) qs.set('date_to', filterTo)

      const res = await apiRequest(`/dv/reports/?${qs.toString()}`)
      if (res) {
        setReports(res.results || [])
        setTotalCount(res.count || 0)
        setPage(res.page || p)
        setTotalPages(res.total_pages || 0)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getApprovedDate = (p, r) => {
    try {
      // Prefer the report snapshot creation time as the "completed/forwarded" date
      if (r && r.created_at) return formatDate(r.created_at)

      if (p.workflow_steps && Array.isArray(p.workflow_steps)) {
        const approved = p.workflow_steps.filter(s => (s.status || '').toLowerCase() === 'approved')
        if (approved.length) {
          // find latest by action_date
          const latest = approved.reduce((a, b) => new Date(a.action_date) > new Date(b.action_date) ? a : b)
          return formatDate(latest.action_date)
        }
      }
    } catch (e) {
      // ignore and fallback
    }
    return formatDate(p.approved_date ?? p.created_date ?? (r.created_at ?? '-'))
  }

  const formatDate = (val) => {
    if (!val) return '-'
    try {
      const d = new Date(val)
      if (isNaN(d)) return val
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      const yyyy = d.getFullYear()
      return `${mm}/${dd}/${yyyy}`
    } catch (e) {
      return val
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
        <div className="table-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ color: '#2c5dff' }}><ion-icon style={{fontSize: '1.25rem'}} name="newspaper-sharp"></ion-icon> Generated Reports</h3>
            <p style={{ margin: 0, color: '#4b5563' }}>{totalCount} generated reports</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn-archive" onClick={() => fetchReports(1)} disabled={loading}>
              🔄 Refresh
            </button>

            {/* ===== MODAL ===== */}
            <ReactModal
              isOpen={isOpen}
              onClose={closeModal}
              title="PDF Preview"
              contentStyle={{
                width: '98vw',
                height: '95vh',
                maxWidth: 'none',
                margin: '0 auto',
                padding: '1rem',
                borderRadius: '8px'
              }}
              overlayStyle={{
                backgroundColor: 'rgba(0,0,0,0.7)'
              }}
              footer={
                <>
                  {pdfUrl && (
                    <a href={pdfUrl} download={`dv_report_${selectedReport?.id}.pdf`}>
                      <button>Download</button>
                    </a>
                  )}
                </>
              }
            >
              {/* BODY CONTENT */}
              <div style={{
                width: '88vw',
                height: '63vh',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '8px',
                overflow: 'hidden',
              }}>

                {/* PDF */}
                <iframe
                  src={pdfUrl}
                  title="PDF Preview"
                  style={{
                    flex: 1,
                    width: '100%',
                    border: 'none'
                  }}
                />
              </div>
            </ReactModal>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginLeft: '1rem' }}>
              <input placeholder="Filter DV#" value={filterDvNo} className="search search--wide" onChange={e => setFilterDvNo(e.target.value)} />
              <input type="date" value={filterFrom} className="search search--wide" onChange={e => setFilterFrom(e.target.value)} />
              <input type="date" value={filterTo} className="search search--wide" onChange={e => setFilterTo(e.target.value)} />
              <button className="btn-primary" onClick={() => fetchReports(1)} disabled={loading}>Apply</button>
            </div>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th className="table-column-center table-column-border">Tracking #</th>
                <th className="table-column-center table-column-border">DV Number</th>
                <th className="table-column-center table-column-border">Date Submitted</th>
                <th className="table-column-center table-column-border">Approved Date</th>
                <th className="table-column-center table-column-border">Prepared By</th>
                  <th className="table-column-center table-column-border">Actions</th>
              </tr>
            </thead>
            <tbody>
                {reports.map((r) => {
                const p = r.payload || {}
                // Try to compute amount if present (fallback '-')
                let amount = '-'
                if (p.amount) amount = p.amount
                else if (p.particulars && Array.isArray(p.particulars)) {
                  try {
                    const sum = p.particulars.reduce((acc, part) => {
                      if (!part.category_values) return acc
                      return acc + part.category_values.reduce((s, v) => s + (parseFloat(v.np || 0) || 0) + (parseFloat(v.ft || 0) || 0) + (parseFloat(v.tf || 0) || 0), 0)
                    }, 0)
                    amount = sum ? sum.toFixed(2) : '-'
                  } catch (e) { amount = '-' }
                }

                return (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{p.tracking_no ?? '-'}</td>
                    <td>{r.dv_no ?? (p.dv_no ?? '-')}</td>
                    <td className="table-column-center">{formatDate(p.created_date ?? (r.created_at ?? '-'))}</td>
                    <td className="table-column-center">{getApprovedDate(p, r)}</td>
                      <td>{p.accounting_name ?? '-'}</td>
                      <td className='table-column-center'>
                        <button className="btn-primary" onClick={async () => {
                          try {
                            const res = await fetch(`${BASE_URL}/dv/reports/${r.dv}/pdf/`, {
                              method: 'GET',
                              credentials: 'include',
                            })
                            if (!res.ok) throw new Error('Failed to generate PDF')
                            const blob = await res.blob()
                            const url = URL.createObjectURL(blob)

                            // store URL instead of downloading
                            setPdfUrl(url)
                            setSelectedReport(r)
                            openModal()
                          } catch (err) {
                            console.error(err)
                            toast.error('Failed to download report PDF')
                          }
                        }}>👁 Preview PDF</button>
                      </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {reports.length === 0 && <p className="empty" style={{ textAlign: 'center', padding: '2rem', color: '#4b5563' }}>{loading ? 'Loading...' : 'No generated reports yet.'}</p>}
        </div>
        {/* 📄 Pagination Controls */}
        {totalCount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
            <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} records | Page {page} of {totalPages}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => fetchReports(page - 1)}
                disabled={page === 1 || loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db',
                  background: (page === 1 || loading) ? '#f3f4f6' : '#fff',
                  color: (page === 1 || loading) ? '#9ca3af' : '#2c5dff',
                  cursor: (page === 1 || loading) ? 'not-allowed' : 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                }}
              >
                <ion-icon name="chevron-back"></ion-icon> Previous
              </button>
              <button
                onClick={() => fetchReports(page + 1)}
                disabled={page >= totalPages || loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db',
                  background: (page >= totalPages || loading) ? '#f3f4f6' : '#fff',
                  color: (page >= totalPages || loading) ? '#9ca3af' : '#2c5dff',
                  cursor: (page >= totalPages || loading) ? 'not-allowed' : 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                }}
              >
                Next <ion-icon name="chevron-forward"></ion-icon>
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
