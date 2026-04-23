/* eslint-disable no-unused-vars */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest, getCurrentUser } from '../api'
import ReactModal from '../components/ReactModal'
import Swal from 'sweetalert2'

export default function Journals() {
  const navigate = useNavigate()
  const currentUser = getCurrentUser()
  const [journals, setJournals] = useState([])
  const [search, setSearch] = useState('')
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [allDVs, setAllDVs] = useState([]) 
  const [dvSearch, setDvSearch] = useState('')
  const [selectedDV, setSelectedDV] = useState(null)
  const [jeRows, setJeRows] = useState([
    { account_code: '', particulars: '', debit: 0, credit: 0 }
  ])

  useEffect(() => {
    if (currentUser?.department === 'admin') {
      navigate('/admin/dashboard', { replace: true })
    }
  }, [currentUser, navigate])

  const load = async () => {
    const data = await apiRequest('/dv/')
    if (data) setJournals(data)
  }

  useEffect(() => { load() }, [])

  // Fetch all DVs when modal is opened for "Add" mode
  useEffect(() => {
    if (isModalOpen && !isEditMode) {
      const fetchDVs = async () => {
        const data = await apiRequest('/dv/')
        if (data) setAllDVs(data)
      }
      fetchDVs()
    }
  }, [isModalOpen, isEditMode])

  // Filter only DVs that HAVE journal entries for the main table
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    const withEntries = journals.filter(j => j.journal_entries && j.journal_entries.length > 0)

    if (!query) return withEntries

    return withEntries.filter((j) =>
      (String(j.tracking_no || '') + String(j.dv_no || '') + String(j.payee || '')).toLowerCase().includes(query)
    )
  }, [search, journals])

  // --- Logic for Edit/Add ---
  
  const handleOpenAdd = () => {
    setIsEditMode(false)
    resetForm()
    setIsModalOpen(true)
  }

  const handleEdit = (dv) => {
    setIsEditMode(true)
    setSelectedDV(dv)
    setDvSearch(dv.dv_no)
    // Populate rows with existing journal entries
    setJeRows(dv.journal_entries.map(je => ({
      account_code: je.account_code,
      particulars: je.particulars,
      debit: je.debit,
      credit: je.credit
    })))
    setIsModalOpen(true)
  }

  const handleAddRow = () => {
    setJeRows([...jeRows, { account_code: '', particulars: '', debit: 0, credit: 0 }])
  }

  const handleRemoveRow = (index) => {
    setJeRows(jeRows.filter((_, i) => i !== index))
  }

  const handleRowChange = (index, field, value) => {
    const updated = [...jeRows]
    updated[index][field] = value
    setJeRows(updated)
  }

  const resetForm = () => {
    setSelectedDV(null)
    setDvSearch('')
    setJeRows([{ account_code: '', particulars: '', debit: 0, credit: 0 }])
  }

  const handleSaveJE = async () => {
    if (!selectedDV) return Swal.fire('Error', 'Please select a Disbursement Voucher.', 'error')
    
    try {
      const payload = { journal_entries: jeRows }
      // Use PUT to update the specific DV's journal entries
      const response = await apiRequest(`/dv/${selectedDV.id}/`, 'PUT', payload)
      
      if (response) {
        Swal.fire('Success', `Journal entries ${isEditMode ? 'updated' : 'saved'} successfully.`, 'success')
        setIsModalOpen(false)
        resetForm()
        load() 
      }
    } catch (err) {
      Swal.fire('Error', err.message, 'error')
    }
  }

  const selectableDVs = allDVs.filter(dv => 
    (dv.dv_no || '').toLowerCase().includes(dvSearch.toLowerCase()) || 
    (dv.tracking_no || '').toLowerCase().includes(dvSearch.toLowerCase())
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <h2><ion-icon name="book-outline"></ion-icon> Journal Entries</h2>
          <p>Manage and edit disbursement journal sheets.</p>
        </div>
      </div>

      <section className="panel">
        <div className="table-toolbar">
          <div>
            <h3 style={{ color: '#2c5dff' }}><ion-icon name="list-outline"></ion-icon> Journal Sheet Records</h3>
            <p style={{ color: '#4b5563', marginTop: '0.3rem' }}>{filtered.length} records with existing entries</p>
          </div>
           <div className="toolbar-actions">
            <button className="btn-archive btn-small" onClick={handleOpenAdd} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ion-icon name="add-circle-outline"></ion-icon> Add Journal Entry
          </button>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by tracking no, DV no, or payee..."
            className="search"
          />
           </div>
          
        </div>

        <div className="table-wrap">
          <table>
            <thead>
               <tr>
                <th>Tracking #</th>
                <th>DV Number</th>
                <th>Payee</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(j => (
                <tr key={j.id}>
                  <td className="table-strong">{j.tracking_no}</td>
                  <td>{j.dv_no}</td>
                  <td>{j.payee || '-'}</td>
                  <td>
                    <span className={`status-badge status-${(j.status || 'pending').toLowerCase()}`}>
                      {j.status}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn-archive"
                      style={{display: 'flex', alignItems: 'center', gap: '0.3rem', margin: '0 auto'}}
                      onClick={() => handleEdit(j)}
                    >
                      <ion-icon name="create-outline"></ion-icon> Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
              <p>No records found.</p>
            </div>
          )}
        </div>
      </section>

      {/* REACT MODAL */}
      <ReactModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); resetForm(); }}
        title={isEditMode ? `Edit Journal Sheet: DV No. ${selectedDV?.dv_no}` : "New Journal Sheet Input"}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button className="btn-primary" onClick={handleSaveJE}>
              {isEditMode ? 'Update Entry' : 'Save Entry'}
            </button>
          </div>
        }
      >
        <div style={{ width: '850px', maxWidth: '100%'}}>
          {/* Searchable DV Selector - Only show in Add mode */}
          {!isEditMode && (
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Select Target DV Number</label>
              <input
                type="text"
                placeholder="Type DV Number to search..."
                className="search"
                style={{ width: '100%', marginBottom: '10px' }}
                value={dvSearch}
                onChange={(e) => setDvSearch(e.target.value)}
              />
              <div style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid #C5D3FF', borderRadius: '8px' }}>
                {selectableDVs.map(dv => (
                  <div 
                    key={dv.id}
                    onClick={() => { setSelectedDV(dv); setDvSearch(dv.dv_no); }}
                    style={{ 
                      padding: '10px', 
                      cursor: 'pointer', 
                      background: selectedDV?.id === dv.id ? '#E8F0FF' : 'white',
                      borderBottom: '1px solid #eee'
                    }}
                  >
                    <strong>{dv.dv_no}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          <h4 style={{ marginBottom: '12px', color: '#0052CC', borderBottom: '2px solid #E8F0FF', paddingBottom: '8px' }}>Journal Sheet</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', background: '#F0F4FF' }}>
                <th style={{ padding: '12px', border: '1px solid #C5D3FF' }}>Account Code</th>
                <th style={{ padding: '12px', border: '1px solid #C5D3FF' }}>Particulars</th>
                <th style={{ padding: '12px', border: '1px solid #C5D3FF' }}>Debit</th>
                <th style={{ padding: '12px', border: '1px solid #C5D3FF' }}>Credit</th>
                <th style={{ width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {jeRows.map((row, index) => (
                <tr key={index}>
                  <td style={{ border: '1px solid #ddd' }}><input type="text" value={row.account_code} onChange={(e) => handleRowChange(index, 'account_code', e.target.value)} style={{ width: '100%', border: 'none', padding: '8px' }} /></td>
                  <td style={{ border: '1px solid #ddd' }}><input type="text" value={row.particulars} onChange={(e) => handleRowChange(index, 'particulars', e.target.value)} style={{ width: '100%', border: 'none', padding: '8px' }} /></td>
                  <td style={{ border: '1px solid #ddd' }}><input type="number" value={row.debit} onChange={(e) => handleRowChange(index, 'debit', parseFloat(e.target.value) || 0)} style={{ width: '100%', border: 'none', padding: '8px' }} /></td>
                  <td style={{ border: '1px solid #ddd' }}><input type="number" value={row.credit} onChange={(e) => handleRowChange(index, 'credit', parseFloat(e.target.value) || 0)} style={{ width: '100%', border: 'none', padding: '8px' }} /></td>
                  <td style={{ textAlign: 'center' }}>
                    <button onClick={() => handleRemoveRow(index)} style={{ color: '#e11d48', background: 'none', border: 'none', cursor: 'pointer' }}>
                      <ion-icon name="trash-outline"></ion-icon>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="btn-primary" style={{ marginTop: '15px' }} onClick={handleAddRow}>+ Add Line Item</button>
        </div>
      </ReactModal>
    </div>
  )
}