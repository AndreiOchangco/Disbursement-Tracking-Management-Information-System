/* eslint-disable no-unused-vars */
import { useEffect, useMemo, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { apiRequest } from '../api'
import ReactModal from '../components/ReactModal'
import { toast } from 'react-toastify'

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
  const [loading, setLoading] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const [hasPrevious, setHasPrevious] = useState(false)
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  const searchTimeoutRef = useRef(null)

  // Load data from backend with pagination and search
  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        params.append('page', currentPage)
        params.append('page_size', itemsPerPage)
        params.append('status', 'archived')
        if (search) {
          params.append('search', search)
        }
        const response = await apiRequest(`/dv/?${params.toString()}`)
        if (response) {
          setDisbursements(response.results || [])
          setTotalCount(response.total_count || 0)
          setTotalPages(response.total_pages || 0)
          setHasNext(response.has_next || false)
          setHasPrevious(response.has_previous || false)
        }
      } catch (e) {
        console.error('Failed to load archived disbursements', e)
        toast.error('Failed to load archived disbursements')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [currentPage, search])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  const handleView = (dv) => {
    setSelectedDV(dv)
    setShowViewModal(true)
  }

  // Pagination Logic
  const itemsToDisplay = disbursements;

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
            <p className="panel-subtitle">{totalCount} records found</p>
          </div>
          <div className="toolbar-actions">
            <input
              value={search}
              onChange={(e) => {
                const value = e.target.value;
                setSearch(value);
                
                // Clear previous timeout
                if (searchTimeoutRef.current) {
                  clearTimeout(searchTimeoutRef.current);
                }
                
                // Set new timeout for debounced search
                searchTimeoutRef.current = setTimeout(() => {
                  setCurrentPage(1);
                }, 300);
              }}
              placeholder="Search by tracking number..."
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
              {disbursements.map((d) => (
                <tr key={d.id} className="table-row">
                  <td className="table-strong">{d.tracking_no}</td>
                  <td>{d.dv_no || '-'}</td>
                  <td className="table-column-center">
                    {/* Simplified badge logic since 'completed' is now impossible here */}
                    <span className={'status-badge status-' + String(d.status || '').toLowerCase().replace(/\s+/g, '-') }>
                      {`${d.status} (${d.current_step})`}
                    </span>
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
          {disbursements.length === 0 && (
            <p className="empty empty--center"><ion-icon name="file-tray-outline"></ion-icon> No archived records found.</p>
          )}
        </div>

        {/* 📄 PAGINATION CONTROLS (Backend-driven) */}
        {totalCount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
            <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} records | Page {currentPage} of {totalPages}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={!hasPrevious || loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db',
                  background: !hasPrevious || loading ? '#f3f4f6' : '#fff',
                  color: !hasPrevious || loading ? '#9ca3af' : '#2c5dff',
                  cursor: !hasPrevious || loading ? 'not-allowed' : 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                }}
              >
                <ion-icon name="chevron-back"></ion-icon> Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={!hasNext || loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db',
                  background: !hasNext || loading ? '#f3f4f6' : '#fff',
                  color: !hasNext || loading ? '#9ca3af' : '#2c5dff',
                  cursor: !hasNext || loading ? 'not-allowed' : 'pointer',
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
             {/* TOP FORM GRID - Payee */}
              <h4 className="section-title"><ion-icon name="person-outline"></ion-icon> Payee Information</h4>
              <div className="form-grid form-grid--split noselect">
                <label>
                  <span>Payee Name<span style={{ color: 'red' }}>*</span></span>
                  <input type="text" value={selectedDV.payee?.name || ""} disabled />
                </label>
                <label>
                  <span>Payee Email<span style={{ color: 'red' }}>*</span></span>
                  <input type="text" value={selectedDV.payee?.email || ""} disabled />
                </label>
                <label>
                  <span>Payee Phone Number<span style={{ color: 'red' }}>*</span></span>
                  <input type="text" value={selectedDV.payee?.phone_no || ""} disabled />
                </label>
                <label>
                  <span>Payee Address<span style={{ color: 'red' }}>*</span></span>
                  <input type="text" value={selectedDV.payee?.address || ""} disabled />
                </label>
                <label>
                  <span>ID # / TIN<span style={{ color: 'red' }}>*</span></span>
                  <input type="text" value={selectedDV.tin || ""} disabled />
                </label>
                <label>
                  <span>Position / Office</span>
                  <input 
                    type="text" 
                    value={selectedDV.position_office || ''} 
                    disabled
                  />
                </label>
                <label>
                  <span>Office / Unit / Project</span>
                  <input 
                    type="text" 
                    value={selectedDV.office_unit_project || ''} 
                    disabled
                  />
                </label>
              </div>
            {/* TOP FORM GRID - All Disabled */}
            <h4 className="section-title"><ion-icon name="calculator-outline"></ion-icon> Accounting Information</h4>
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
                <span>Fund Source</span>
                <select value={selectedDV.fund_source || ''} disabled>
                  <option value={selectedDV.fund_source}>{selectedDV.fund_source}</option>
                </select>
              </label>
              <label>
                  <span>Advice No</span>
                  <input type="text" value={selectedDV.advice_no || ''} disabled />
                </label>
                <label>
                  <span>Advice Date</span>
                  <input type="date" value={selectedDV.advice_date || ''} disabled />
                </label>
                <label>
                  <span>Transaction No</span>
                  <input type="text" value={selectedDV.transaction_no || ''} disabled />
                </label>
                <label>
                  <span>Transaction Date</span>
                  <input type="date" value={selectedDV.transaction_date || ''} disabled />
                </label>
                <label>
                  <span>Date Created</span>
                  <input type="date" value={selectedDV.created_date|| ''} disabled />
                </label>
                <label>
                  <span>Created By</span>
                  <input value={selectedDV.accounting_name || ''} disabled={true} />
                </label>
                <label>
                  <span>Status</span>
                  <input value={selectedDV.status || ''} disabled={true} />
                </label>
            </div>

            {/* --- BUDGET INFORMATION --- */}
              <h4 className="section-title" style={{ marginTop: '2.5rem' }}><ion-icon name="wallet-outline"></ion-icon> Budget Information</h4>
              <div className="form-grid form-grid--split noselect">
                <label>
                  <span>CAFOA No.</span>
                  <input type="text" value={selectedDV.cafoa_no || ''} disabled />
                </label>
                <label>
                  <span>Responsibility Center</span>
                  <select value={selectedDV.responsibility_center || ''} disabled>
                    <option value="">Select Option</option>
                    <option value="One">One</option>
                    <option value="Multiple">Multiple</option>
                  </select>
                </label>
            </div>

            {/* --- TREASURER INFORMATION --- */}
              <h4 className="section-title" style={{ marginTop: '2.5rem' }}><ion-icon name="cash-outline"></ion-icon> Treasurer Information</h4>
              <div className="form-grid form-grid--split noselect">
                <label>
                  <span>DV Number</span>
                  <input type="text" value={selectedDV.dv_no || ''} disabled />
                </label>
                <label>
                  <span>DV Date</span>
                  <input type="date" value={selectedDV.dv_date || ''} disabled/>
                </label>
                <label>
                  <span>Mode of Payment</span>
                  <select value={selectedDV?.payments[0]?.mop ?? ''} disabled>
                    <option value="CASH">Cash</option>
                    <option value="CHECK">Check</option>
                    <option value="OTHERS">Others</option>
                  </select>
                </label>
                {selectedDV?.payments[0]?.mop === 'OTHERS' && (
                  <label>
                    <span>Specify Payment Mode</span>
                    <input type="text" value={selectedDV?.payments[0]?.mop_specify ?? ''} disabled />
                  </label>
                )}
                <label>
                  <span>ATM Number</span>
                  <input type="text" value={selectedDV?.payments[0]?.atm_no ?? ''} disabled />
                </label>
                <label>
                  <span>Bank</span>
                  <input type="text" value={selectedDV?.payments[0]?.bank ?? ''} disabled />
                </label>
                <label>
                  <span>Date of Payment</span>
                  <input type="date" value={selectedDV?.payments[0]?.date ?? ''} disabled />
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