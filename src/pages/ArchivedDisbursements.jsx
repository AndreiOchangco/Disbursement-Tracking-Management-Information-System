/* eslint-disable no-unused-vars */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiRequest } from '../api'
import ReactModal from '../components/ReactModal'

const formatDateMMDDYYYY = (date) => {
  if (!date) return '-'
  const parts = date.split('-')
  const dateObj = new Date(parts[0], parts[1] - 1, parts[2])
  return dateObj.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

export default function ArchivedDisbursements() {
  const [disbursements, setDisbursements] = useState([])
  const [search, setSearch] = useState('')
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedDV, setSelectedDV] = useState(null)
  
  // Pagination State - Set to 5 to match Disbursements.jsx
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // Load data from backend
  useEffect(() => {
    async function load() {
      const data = await apiRequest('/dv/')
      if (data) setDisbursements(data)
    }
    load()
  }, [])

  // Filter for ARCHIVED status and apply search
  const archivedFiltered = useMemo(() => {
    const query = search.trim().toLowerCase()
    
    const archivedItems = disbursements.filter(
      (d) => String(d.status || '').toLowerCase() === 'archived'
    )

    if (!query) return archivedItems

    return archivedItems.filter((d) =>
      (
        String(d.tracking_no || '') +
        String(d.dv_no || '') +
        String(d.payee || '') +
        String(d.office || '')
      )
        .toLowerCase()
        .includes(query)
    )
  }, [search, disbursements])

  const handleView = (dv) => {
    setSelectedDV(dv)
    setShowViewModal(true)
  }

  // Pagination Logic
  const paginatedItems = archivedFiltered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className='noselect'>
      <div className="page-header">
        <div>
          <h2><ion-icon name="archive-outline"></ion-icon> Archived Disbursement Vouchers</h2>
          <p>History of finalized and archived voucher records.</p>
        </div>
        <div>
          <Link to="/disbursements" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ion-icon name="arrow-back-outline"></ion-icon> Back to DV List
          </Link>
        </div>
      </div>

      <section className="panel">
        <div className="table-toolbar">
          <div>
            <h3 className="panel-title"><ion-icon name="folder-open-outline"></ion-icon> Archived Records</h3>
            <p className="panel-subtitle">{archivedFiltered.length} records found</p>
          </div>
          <div className="toolbar-actions">
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Search archived by tracking or DV#..."
              className="search search--wide"
            />
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead className="table-head">
              <tr>
                <th className="table-column-center table-column-border"><ion-icon name="pin"></ion-icon> Tracking #</th>
                <th className="table-column-center table-column-border"><ion-icon name="bookmark"></ion-icon> DV Number</th>
                <th className="table-column-center table-column-border"><ion-icon name="bar-chart"></ion-icon> Status</th>
                <th className="table-column-center table-column-border"><ion-icon name="calendar"></ion-icon> Request Date</th>
                <th className="table-column-center table-column-border"><ion-icon name="person"></ion-icon> Created By</th>
                <th className="table-column-center table-column-border"><ion-icon name="settings"></ion-icon> Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((d) => (
                <tr key={d.id} className="table-row">
                  <td className="table-strong">{d.tracking_no}</td>
                  <td>{d.dv_no || '-'}</td>
                  <td className="table-column-center">
                    <span className="status-badge status-archived">Archived</span>
                  </td>
                  <td className='table-column-center'>{formatDateMMDDYYYY(d.created_date)}</td>
                  <td>{d.accounting_name || d.office}</td>
                  <td className="table-column-center">
                    <button className="btn-archive btn-small flex justify-center items-center gap-1" onClick={() => handleView(d)}>
                        <ion-icon name="eye-outline"></ion-icon> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {archivedFiltered.length === 0 && (
            <p className="empty empty--center"><ion-icon name="file-tray-outline"></ion-icon> No archived records found.</p>
          )}
        </div>

        {/* 📄 PAGINATION CONTROLS (Matched with Disbursements.jsx) */}
        {archivedFiltered.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
            <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, archivedFiltered.length)} of {archivedFiltered.length} records | Page {currentPage} of {Math.ceil(archivedFiltered.length / itemsPerPage)}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db',
                  background: currentPage === 1 ? '#f3f4f6' : '#fff',
                  color: currentPage === 1 ? '#9ca3af' : '#2c5dff',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                }}
              >
                <ion-icon name="chevron-back"></ion-icon> Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(archivedFiltered.length / itemsPerPage), p + 1))}
                disabled={currentPage >= Math.ceil(archivedFiltered.length / itemsPerPage)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db',
                  background: currentPage >= Math.ceil(archivedFiltered.length / itemsPerPage) ? '#f3f4f6' : '#fff',
                  color: currentPage >= Math.ceil(archivedFiltered.length / itemsPerPage) ? '#9ca3af' : '#2c5dff',
                  cursor: currentPage >= Math.ceil(archivedFiltered.length / itemsPerPage) ? 'not-allowed' : 'pointer',
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

      {/* 👀 VIEW DISBURSEMENT MODAL */}
      <ReactModal 
        isOpen={showViewModal} 
        onClose={() => setShowViewModal(false)} 
        title="Disbursement Voucher Details"
      >
        {selectedDV && (
          <section className="panel panel-alt noselect">
            {/* TOP FORM GRID - All Disabled */}
            <div className="form-grid form-grid--split noselect">
              <label>
                <span>Tracking Number</span>
                <input type="text" value={selectedDV.tracking_no || ''} disabled />
              </label>
              <label>
                <span>DV Number</span>
                <input type="text" value={selectedDV.dv_no || ''} disabled />
              </label>
              <label>
                <span>Payee</span>
                <input type="text" value={selectedDV.payee || ''} disabled />
              </label>
              <label>
                <span>ID # / TIN</span>
                <input type="text" value={selectedDV.tin || ''} disabled />
              </label>
              <label>
                <span>Fund Source</span>
                <select value={selectedDV.fund_source || ''} disabled>
                  <option value={selectedDV.fund_source}>{selectedDV.fund_source}</option>
                </select>
              </label>
              <label>
                <span>Mode of Payment</span>
                <select value={selectedDV.mode_of_payment || ''} disabled>
                  <option value={selectedDV.mode_of_payment}>
                    {selectedDV.mode_of_payment}
                  </option>
                </select>
              </label>
              {selectedDV.mode_of_payment === 'OTHERS' && (
                <label>
                  <span>Specify Payment Mode</span>
                  <input type="text" value={selectedDV.mop_others || ''} disabled />
                </label>
              )}
              <label>
                <span>Date</span>
                <input type="text" value={selectedDV.created_date || ''} disabled />
              </label>
              <label>
                <span>Created By</span>
                <input value={selectedDV.office || ''} disabled />
              </label>
              <label>
                <span>Status</span>
                <input value={selectedDV.status || ''} disabled />
              </label>
            </div>

            {/* --- PARTICULARS SECTION --- */}
            <section className="panel-section" style={{ marginTop: '2rem' }}>
              <h4 className="section-title"><ion-icon name="list-circle-outline"></ion-icon> Particulars Section</h4>
              
              {selectedDV.particulars && selectedDV.particulars.length > 0 ? (
                selectedDV.particulars.map((part, pIdx) => (
                  <div key={pIdx} style={{ marginBottom: '1.5rem' }}>
                    {/* Matches creation form wrapper for General Description */}
                    <div className="general-description-wrapper">
                      <label className="general-label">
                        <span>General Description</span>
                      </label>

                      <textarea
                        className="general-description"
                        value={part.description || 'No particular description provided'}
                        disabled
                        style={{ 
                          backgroundColor: '#f9fafb', 
                          color: part.description ? 'inherit' : '#9ca3af',
                          fontStyle: part.description ? 'normal' : 'italic'
                        }}
                      />
                    </div>

                    <div className="table-wrap">
                      <table className="particulars-table">
                        <thead>
                          <tr>
                            <th>Category / Particulars</th>
                            <th>Net Pay</th>
                            <th>15th</th>
                            <th>31st</th>
                          </tr>
                        </thead>
                        <tbody>
                          {part.category_values && part.category_values.length > 0 ? (
                            part.category_values.map((val, vIdx) => (
                              <tr key={vIdx}>
                                <td><input className="particulars-input" value={val.category || ''} disabled /></td>
                                <td><input className="particulars-input" value={val.np || '0.00'} disabled /></td>
                                <td><input className="particulars-input" value={val.ft || '0.00'} disabled /></td>
                                <td><input className="particulars-input" value={val.tf || '0.00'} disabled /></td>
                              </tr>
                            ))
                          ) : (
                            /* Fallback for missing categories */
                            <tr>
                              <td colSpan="4" style={{ textAlign: 'center', padding: '1.5rem', color: '#9ca3af', fontStyle: 'italic' }}>
                                <ion-icon name="information-circle-outline"></ion-icon> No Particular Categories provided.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty empty--center" style={{ padding: '20px', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                  <ion-icon name="information-circle-outline"></ion-icon> No particulars provided.
                </p>
              )}
            </section>

            {/* --- JOURNAL ENTRY SECTION --- */}
            <section className="panel-section" style={{ marginTop: '2.5rem', borderTop: '2px solid var(--border-color)', paddingTop: '1.5rem' }}>
              <h4 className="section-title"><ion-icon name="journal-outline"></ion-icon> Journal Entry Section</h4>
              
              {selectedDV.journal_entries && selectedDV.journal_entries.length > 0 ? (
                <div className="table-wrap">
                  <table className="particulars-table">
                    <thead>
                      <tr>
                        <th>Account Code</th>
                        <th>Particulars</th>
                        <th>Debit</th>
                        <th>Credit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDV.journal_entries.map((row, index) => (
                        <tr key={index}>
                          <td><input className="particulars-input" value={row.account_code || ''} disabled /></td>
                          <td><input className="particulars-input" value={row.particulars || ''} disabled /></td>
                          <td><input className="particulars-input" value={row.debit || '0.00'} disabled /></td>
                          <td><input className="particulars-input" value={row.credit || '0.00'} disabled /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="empty empty--center" style={{ padding: '20px', border: '1px dashed var(--border-color)', borderRadius: '8px', width: '50rem'}}>
                  <ion-icon name="information-circle-outline"></ion-icon> No journal entries provided.
                </p>
              )}
            </section>
            {/* --- REMARKS HISTORY SECTION (READ-ONLY) --- */}
              <section className="panel-section" style={{ marginTop: '3rem', borderTop: '2px solid #eee', paddingTop: '1.5rem' }}>
                <h4 className="section-title" style={{ color: '#555' }}>
                  <ion-icon name="git-branch-outline" style={{ marginRight: '8px' }}></ion-icon>
                  Workflow History
                </h4>
                <div className="table-wrap">
                  <table className="particulars-table">
                    <thead style={{ backgroundColor: '#f9f9f9' }}>
                      <tr>
                        <th style={{ width: '20%' }}>Date</th>
                        <th style={{ width: '20%' }}>Department</th>
                        <th>Remarks / Observation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDV.workflow_steps && selectedDV.workflow_steps.length > 0 ? (
                        selectedDV.workflow_steps.map((step, i) => (
                          <tr key={i}>
                            <td style={{ fontSize: '0.85rem' }}>{new Date(step.action_date).toLocaleString()}</td>
                            <td style={{ textTransform: 'capitalize', fontWeight: 'bold' }}>{step.action_by_department?.replace('_', ' ')}</td>
                            <td style={{ color: step.status === 'disapproved' ? '#FF4D45' : 'black' }}>
                              {step.remarks || 'Approved by ' + step.action_by_department?.replace('_', ' ')}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" style={{ textAlign: 'center', padding: '15px' }}>No history recorded.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
          </section>
          
        )}
      </ReactModal>
    </div>
  )
}