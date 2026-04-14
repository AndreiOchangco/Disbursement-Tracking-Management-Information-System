/* eslint-disable no-unused-vars */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiRequest, getCurrentUser } from '../api'

const user = JSON.parse(localStorage.getItem("user"))
const fundSourceOptions = ['GF', '20% DF', '5% DRRM', 'GAD', 'RA7171', 'SEF', 'TF', 'PHILHEALTH', 'CALAMITY']
const mopOptions = ['CASH', 'CHECK', 'OTHERS']

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
  const [showModal, setShowModal] = useState(false)
  
  const [formData, setFormData] = useState({
    dv_no: '',
    tracking_no: '',
    payee: '',
    office: '',
    created_date: '',
    fund_source: 'GF',
    cafoa_no: '',
    advice_no: '',
    responsibility_center: '',
    tin: ''
  })
  
  const [payment, setPayment] = useState({ mop: 'CASH', mop_specify: '', atm_no: '', bank: '', date: '' })
  const [particular, setParticular] = useState({ description: '', jev_no: '', date: '', category_values: [] })
  const [journalEntries, setJournalEntries] = useState([])
  
  const [expandedSections, setExpandedSections] = useState({
    payments: true,
    particulars: true,
    journalEntries: true
  })
  
  const [submitting, setSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState({})
  const [categories, setCategories] = useState([])

  // 🔥 Load data from Django backend
  useEffect(() => {
    async function load() {
      const data = await apiRequest('/dv/')
      if (data) setDisbursements(data)
      
      const catData = await apiRequest('/categories/')
      if (catData) setCategories(catData)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return disbursements

    return disbursements.filter((d) =>
      (
        String(d.tracking_no || '') +
        (d.dv_no || '') +
        (d.status || '') +
        (d.accounting_name || '')
      )
        .toLowerCase()
        .includes(query)
    )
  }, [search, disbursements])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handlePaymentChange = (field, value) => {
    setPayment(prev => ({ ...prev, [field]: value }))
  }

  const handleResetPayment = () => {
    setPayment({ mop: 'CASH', mop_specify: '', atm_no: '', bank: '', date: '' })
  }

  const handleParticularChange = (field, value) => {
    setParticular(prev => ({ ...prev, [field]: value }))
  }

  const handleAddCategoryValue = () => {
    setParticular(prev => {
      const categoryValues = prev.category_values ? [...prev.category_values] : []
      categoryValues.push({ category: '', np: '', ft: '', tf: '' })
      return { ...prev, category_values: categoryValues }
    })
  }

  const handleRemoveCategoryValue = (valueIdx) => {
    setParticular(prev => {
      const categoryValues = (prev.category_values || []).filter((_, i) => i !== valueIdx)
      return { ...prev, category_values: categoryValues }
    })
  }

  const handleCategoryValueChange = (valueIdx, field, value) => {
    setParticular(prev => {
      const categoryValues = [...(prev.category_values || [])]
      if (categoryValues[valueIdx]) {
        categoryValues[valueIdx] = { ...categoryValues[valueIdx], [field]: value }
      }
      return { ...prev, category_values: categoryValues }
    })
  }

  const handleAddEntry = () => {
    setJournalEntries(prev => [...prev, { account_code: '', particulars: '', debit: '', credit: '' }])
  }

  const handleRemoveEntry = (index) => {
    setJournalEntries(prev => prev.filter((_, i) => i !== index))
  }

  const handleEntryChange = (index, field, value) => {
    setJournalEntries(prev => {
      const updated = [...prev]
      updated[index][field] = value
      return updated
    })
  }

  const validateForm = () => {
    const errors = {}
    
    if (!formData.dv_no.trim()) errors.dv_no = 'DV Number is required'
    if (!formData.tracking_no.trim()) errors.tracking_no = 'Tracking Number is required'
    if (!formData.payee.trim()) errors.payee = 'Payee is required'
    if (!formData.office.trim()) errors.office = 'Office is required'
    if (!formData.created_date) errors.created_date = 'Date is required'
    if (!payment.mop) errors.payments = 'Payment method is required'
    if (!particular.description.trim()) errors.particulars = 'Particular description is required'
    if (!particular.category_values || particular.category_values.length === 0) errors.particulars = 'At least one category value is required'
    if (journalEntries.length === 0) errors.journalEntries = 'At least one journal entry is required'

    const totalDebits = journalEntries.reduce((sum, je) => sum + (parseFloat(je.debit) || 0), 0)
    const totalCredits = journalEntries.reduce((sum, je) => sum + (parseFloat(je.credit) || 0), 0)
    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      errors.journalEntries = 'Total debits must equal total credits'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const resetForm = () => {
    setFormData({
      dv_no: '',
      tracking_no: '',
      payee: '',
      office: '',
      created_date: '',
      fund_source: 'GF',
      cafoa_no: '',
      advice_no: '',
      responsibility_center: '',
      tin: ''
    })
    setPayment({ mop: 'CASH', mop_specify: '', atm_no: '', bank: '', date: '' })
    setParticular({ description: '', jev_no: '', date: '', category_values: [] })
    setJournalEntries([])
    setFormErrors({})
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setSubmitting(true)
    try {
      const payload = {
        ...formData,
        payments: [payment],
        particulars: [particular],
        journal_entries: journalEntries
      }

      const newDV = await apiRequest('/dv/', 'POST', payload)
      
      if (newDV) {
        setDisbursements(prev => [newDV, ...prev])
        resetForm()
        setShowModal(false)
        alert('Disbursement Voucher created successfully!')
      }
    } catch (err) {
      console.error('Submit failed', err)
      alert('Error creating DV: ' + (err.message || 'Unknown error'))
    } finally {
      setSubmitting(false)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    resetForm()
    handleResetPayment()
  }

  return (
    <div className='noselect'>
      <div className="page-header">
        <div>
          <h2><ion-icon name="card"></ion-icon> Disbursement Voucher Tracking</h2>
          <p>Track requests, approvals, and release statuses in Disbursement MIS.</p>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={closeModal}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '2rem', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)', width: '100%', maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ color: '#2c5dff', margin: 0 }}><ion-icon name="add"></ion-icon> Create Disbursement Voucher</h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#4b5563' }}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
                <h4 style={{ color: '#2c5dff', fontSize: '1rem', marginBottom: '1rem' }}>Basic Information</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <label>
                    <span style={{ color: '#2c5dff', fontWeight: '600', fontSize: '0.9rem' }}>DV Number <span style={{ color: '#e11d48' }}>*</span></span>
                    <input type="text" name="dv_no" value={formData.dv_no} onChange={handleInputChange} placeholder="e.g., DV-2024-001" style={{ borderColor: formErrors.dv_no ? '#e11d48' : '' }} />
                    {formErrors.dv_no && <p style={{ color: '#e11d48', fontSize: '0.8rem', marginTop: '0.25rem', margin: 0 }}>{formErrors.dv_no}</p>}
                  </label>
                  <label>
                    <span style={{ color: '#2c5dff', fontWeight: '600', fontSize: '0.9rem' }}>Tracking Number <span style={{ color: '#e11d48' }}>*</span></span>
                    <input type="text" name="tracking_no" value={formData.tracking_no} onChange={handleInputChange} placeholder="e.g., TRK-2024-001" style={{ borderColor: formErrors.tracking_no ? '#e11d48' : '' }} />
                    {formErrors.tracking_no && <p style={{ color: '#e11d48', fontSize: '0.8rem', marginTop: '0.25rem', margin: 0 }}>{formErrors.tracking_no}</p>}
                  </label>
                  <label>
                    <span style={{ color: '#2c5dff', fontWeight: '600', fontSize: '0.9rem' }}>Payee <span style={{ color: '#e11d48' }}>*</span></span>
                    <input type="text" name="payee" value={formData.payee} onChange={handleInputChange} placeholder="Name of payee" style={{ borderColor: formErrors.payee ? '#e11d48' : '' }} />
                    {formErrors.payee && <p style={{ color: '#e11d48', fontSize: '0.8rem', marginTop: '0.25rem', margin: 0 }}>{formErrors.payee}</p>}
                  </label>
                  <label>
                    <span style={{ color: '#2c5dff', fontWeight: '600', fontSize: '0.9rem' }}>Office <span style={{ color: '#e11d48' }}>*</span></span>
                    <input type="text" name="office" value={formData.office} onChange={handleInputChange} placeholder="Department or office" style={{ borderColor: formErrors.office ? '#e11d48' : '' }} />
                    {formErrors.office && <p style={{ color: '#e11d48', fontSize: '0.8rem', marginTop: '0.25rem', margin: 0 }}>{formErrors.office}</p>}
                  </label>
                  <label>
                    <span style={{ color: '#2c5dff', fontWeight: '600', fontSize: '0.9rem' }}>Request Date <span style={{ color: '#e11d48' }}>*</span></span>
                    <input type="date" name="created_date" value={formData.created_date} onChange={handleInputChange} style={{ borderColor: formErrors.created_date ? '#e11d48' : '' }} />
                    {formErrors.created_date && <p style={{ color: '#e11d48', fontSize: '0.8rem', marginTop: '0.25rem', margin: 0 }}>{formErrors.created_date}</p>}
                  </label>
                  <label>
                    <span style={{ color: '#2c5dff', fontWeight: '600', fontSize: '0.9rem' }}>Fund Source</span>
                    <select name="fund_source" value={formData.fund_source} onChange={handleInputChange}>
                      {fundSourceOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </label>
                  <label>
                    <span style={{ color: '#2c5dff', fontWeight: '600', fontSize: '0.9rem' }}>CAFOA Number</span>
                    <input type="text" name="cafoa_no" value={formData.cafoa_no} onChange={handleInputChange} placeholder="Optional" />
                  </label>
                  <label>
                    <span style={{ color: '#2c5dff', fontWeight: '600', fontSize: '0.9rem' }}>Advice Number</span>
                    <input type="text" name="advice_no" value={formData.advice_no} onChange={handleInputChange} placeholder="Optional" />
                  </label>
                  <label>
                    <span style={{ color: '#2c5dff', fontWeight: '600', fontSize: '0.9rem' }}>Responsibility Center</span>
                    <input type="text" name="responsibility_center" value={formData.responsibility_center} onChange={handleInputChange} placeholder="Optional" />
                  </label>
                  <label>
                    <span style={{ color: '#2c5dff', fontWeight: '600', fontSize: '0.9rem' }}>TIN</span>
                    <input type="text" name="tin" value={formData.tin} onChange={handleInputChange} placeholder="Optional" />
                  </label>
                </div>
              </div>

              <div style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', cursor: 'pointer' }} onClick={() => setExpandedSections(prev => ({ ...prev, payments: !prev.payments }))}>
                  <h4 style={{ color: '#2c5dff', fontSize: '1rem', margin: 0 }}>Payments <span style={{ color: '#e11d48' }}>*</span></h4>
                  <span style={{ fontSize: '1.2rem', transition: 'transform 0.2s' }}>{expandedSections.payments ? '▼' : '▶'}</span>
                </div>
                {expandedSections.payments && (
                  <>
                    <div style={{ background: '#f9f9f9', padding: '1rem', marginBottom: '1rem', borderRadius: '8px', border: '1px solid #f0f0f0' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
                        <label>
                          <span style={{ color: '#2c5dff', fontWeight: '600', fontSize: '0.9rem' }}>Mode of Payment <span style={{ color: '#e11d48' }}>*</span></span>
                          <select value={payment.mop} onChange={(e) => handlePaymentChange('mop', e.target.value)} style={{ width: '100%' }}>
                            <option value="">Select</option>
                            {mopOptions.map(opt => <option key={opt} value={opt}>{opt === 'CASH' ? 'Cash' : opt === 'CHECK' ? 'Check' : 'Others'}</option>)}
                          </select>
                        </label>
                        {payment.mop === 'OTHERS' && (
                          <label>
                            <span style={{ color: '#2c5dff', fontWeight: '600', fontSize: '0.9rem' }}>Specify</span>
                            <input type="text" value={payment.mop_specify} onChange={(e) => handlePaymentChange('mop_specify', e.target.value)} placeholder="Specify payment method" style={{ width: '100%' }} />
                          </label>
                        )}
                        <label>
                          <span style={{ color: '#2c5dff', fontWeight: '600', fontSize: '0.9rem' }}>ATM No</span>
                          <input type="text" value={payment.atm_no} onChange={(e) => handlePaymentChange('atm_no', e.target.value)} placeholder="Optional" style={{ width: '100%' }} />
                        </label>
                        <label>
                          <span style={{ color: '#2c5dff', fontWeight: '600', fontSize: '0.9rem' }}>Bank</span>
                          <input type="text" value={payment.bank} onChange={(e) => handlePaymentChange('bank', e.target.value)} placeholder="Optional" style={{ width: '100%' }} />
                        </label>
                        <label>
                          <span style={{ color: '#2c5dff', fontWeight: '600', fontSize: '0.9rem' }}>Date</span>
                          <input type="date" value={payment.date} onChange={(e) => handlePaymentChange('date', e.target.value)} style={{ width: '100%' }} />
                        </label>
                      </div>
                    </div>
                    {formErrors.payments && <p style={{ color: '#e11d48', fontSize: '0.8rem', marginTop: '0.5rem', margin: 0 }}>{formErrors.payments}</p>}
                  </>
                )}
              </div>

              <div style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', cursor: 'pointer' }} onClick={() => setExpandedSections(prev => ({ ...prev, particulars: !prev.particulars }))}>
                  <h4 style={{ color: '#2c5dff', fontSize: '1rem', margin: 0 }}>Particulars <span style={{ color: '#e11d48' }}>*</span></h4>
                  <span style={{ fontSize: '1.2rem', transition: 'transform 0.2s' }}>{expandedSections.particulars ? '▼' : '▶'}</span>
                </div>
                {expandedSections.particulars && (
                  <>
                    <div style={{ background: '#f9f9f9', padding: '1rem', marginBottom: '1rem', borderRadius: '8px', border: '1px solid #f0f0f0' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <label style={{ gridColumn: '1 / -1' }}>
                          <span style={{ color: '#2c5dff', fontWeight: '600', fontSize: '0.9rem' }}>Description <span style={{ color: '#e11d48' }}>*</span></span>
                          <textarea value={particular.description} onChange={(e) => handleParticularChange('description', e.target.value)} placeholder="Description" style={{ width: '100%', minHeight: '60px' }} />
                        </label>
                        <label>
                          <span style={{ color: '#2c5dff', fontWeight: '600', fontSize: '0.9rem' }}>JEV No</span>
                          <input type="text" value={particular.jev_no} onChange={(e) => handleParticularChange('jev_no', e.target.value)} placeholder="Optional" style={{ width: '100%' }} />
                        </label>
                        <label>
                          <span style={{ color: '#2c5dff', fontWeight: '600', fontSize: '0.9rem' }}>Date</span>
                          <input type="date" value={particular.date} onChange={(e) => handleParticularChange('date', e.target.value)} style={{ width: '100%' }} />
                        </label>
                      </div>
                      <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: '1rem', marginTop: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                          <h5 style={{ color: '#2c5dff', fontSize: '0.9rem', margin: 0 }}>Category Values</h5>
                          <button type="button" onClick={() => handleAddCategoryValue()} className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem' }}>+ Add Category</button>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                              <tr style={{ background: '#f0f0f0', borderBottom: '1px solid #fbbf24' }}>
                                <th style={{ padding: '0.5rem', textAlign: 'left', color: '#2c5dff', fontWeight: '600' }}>Category <span style={{ color: '#e11d48' }}>*</span></th>
                                <th style={{ padding: '0.5rem', textAlign: 'right', color: '#2c5dff', fontWeight: '600' }}>NP</th>
                                <th style={{ padding: '0.5rem', textAlign: 'right', color: '#2c5dff', fontWeight: '600' }}>15th</th>
                                <th style={{ padding: '0.5rem', textAlign: 'right', color: '#2c5dff', fontWeight: '600' }}>31st</th>
                                <th style={{ padding: '0.5rem', textAlign: 'center', color: '#2c5dff', fontWeight: '600' }}>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {particular.category_values && particular.category_values.map((value, vidx) => (
                                <tr key={vidx} style={{ borderBottom: '1px solid #f0f0f0' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'} onMouseLeave={(e) => e.currentTarget.style.background = 'white'}>
                                  <td style={{ padding: '0.5rem' }}>
                                    <input type="text" value={value.category} onChange={(e) => handleCategoryValueChange(vidx, 'category', e.target.value)} placeholder="Category name" style={{ width: '100%' }} />
                                  </td>
                                  <td style={{ padding: '0.5rem' }}>
                                    <input type="number" step="0.01" value={value.np} onChange={(e) => handleCategoryValueChange(vidx, 'np', e.target.value)} placeholder="0.00" style={{ width: '100%', textAlign: 'right' }} />
                                  </td>
                                  <td style={{ padding: '0.5rem' }}>
                                    <input type="number" step="0.01" value={value.ft} onChange={(e) => handleCategoryValueChange(vidx, 'ft', e.target.value)} placeholder="0.00" style={{ width: '100%', textAlign: 'right' }} />
                                  </td>
                                  <td style={{ padding: '0.5rem' }}>
                                    <input type="number" step="0.01" value={value.tf} onChange={(e) => handleCategoryValueChange(vidx, 'tf', e.target.value)} placeholder="0.00" style={{ width: '100%', textAlign: 'right' }} />
                                  </td>
                                  <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                    <button type="button" onClick={() => handleRemoveCategoryValue(vidx)} className="btn-danger" style={{ fontSize: '0.7rem', padding: '0.3rem 0.5rem' }}>✕</button>
                                  </td>
                                </tr>
                              ))}
                              {(!particular.category_values || particular.category_values.length === 0) && (
                                <tr>
                                  <td colSpan="5" style={{ padding: '1rem', textAlign: 'center', color: '#999' }}>No category values added yet</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                    {formErrors.particulars && <p style={{ color: '#e11d48', fontSize: '0.8rem', marginTop: '0.5rem', margin: 0 }}>{formErrors.particulars}</p>}
                  </>
                )}
              </div>

              <div style={{ paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', cursor: 'pointer' }} onClick={() => setExpandedSections(prev => ({ ...prev, journalEntries: !prev.journalEntries }))}>
                  <h4 style={{ color: '#2c5dff', fontSize: '1rem', margin: 0 }}>Journal Entries <span style={{ color: '#e11d48' }}>*</span></h4>
                  <span style={{ fontSize: '1.2rem', transition: 'transform 0.2s' }}>{expandedSections.journalEntries ? '▼' : '▶'}</span>
                </div>
                {expandedSections.journalEntries && (
                  <>
                    <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                          <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #fbbf24' }}>
                            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#2c5dff', fontWeight: '600' }}>Account Code</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#2c5dff', fontWeight: '600' }}>Particulars</th>
                            <th style={{ padding: '0.75rem', textAlign: 'right', color: '#2c5dff', fontWeight: '600' }}>Debit</th>
                            <th style={{ padding: '0.75rem', textAlign: 'right', color: '#2c5dff', fontWeight: '600' }}>Credit</th>
                            <th style={{ padding: '0.75rem', textAlign: 'center', color: '#2c5dff', fontWeight: '600' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {journalEntries.map((je, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0' }} onMouseEnter={(e) => e.currentTarget.style.background = '#fffbeb'} onMouseLeave={(e) => e.currentTarget.style.background = 'white'}>
                              <td style={{ padding: '0.75rem' }}>
                                <input type="text" value={je.account_code} onChange={(e) => handleEntryChange(idx, 'account_code', e.target.value)} placeholder="Account code" style={{ width: '100%' }} />
                              </td>
                              <td style={{ padding: '0.75rem' }}>
                                <input type="text" value={je.particulars} onChange={(e) => handleEntryChange(idx, 'particulars', e.target.value)} placeholder="Particulars" style={{ width: '100%' }} />
                              </td>
                              <td style={{ padding: '0.75rem' }}>
                                <input type="number" step="0.01" value={je.debit} onChange={(e) => handleEntryChange(idx, 'debit', e.target.value)} placeholder="0.00" style={{ width: '100%', textAlign: 'right' }} />
                              </td>
                              <td style={{ padding: '0.75rem' }}>
                                <input type="number" step="0.01" value={je.credit} onChange={(e) => handleEntryChange(idx, 'credit', e.target.value)} placeholder="0.00" style={{ width: '100%', textAlign: 'right' }} />
                              </td>
                              <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                <button type="button" onClick={() => handleRemoveEntry(idx)} className="btn-danger" style={{ fontSize: '0.75rem', padding: '0.4rem 0.6rem' }}>✕</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <button type="button" onClick={handleAddEntry} className="btn-primary" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>+ Add Entry</button>
                    {formErrors.journalEntries && <p style={{ color: '#e11d48', fontSize: '0.8rem', marginTop: '0.5rem', margin: 0 }}>{formErrors.journalEntries}</p>}
                  </>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                <button type="button" onClick={closeModal} style={{ background: '#f5f5f5', border: '1px solid #e0e0e0', color: '#1f2937', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '500', transition: 'all 0.3s ease' }}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '0.95rem', fontWeight: '500', opacity: submitting ? 0.6 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}>
                  {submitting ? 'Creating...' : '✓ Create DV'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <section className="panel">
        <div className="table-toolbar">
          <div>
            <h3 style={{ color: '#2c5dff' }}><ion-icon name="clipboard"></ion-icon> Open Disbursement Voucher Entries</h3>
            <p style={{ color: '#4b5563', marginTop: '0.3rem' }}>{filtered.length} active records</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button onClick={() => setShowModal(true)} className="btn-primary" style={{ fontSize: '0.9rem', padding: '0.65rem 1rem' }}>
              <ion-icon name="add-circle"></ion-icon> Add DV
            </button>
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
                    <button className="btn-primary" style={{ fontSize: '0.85rem', padding: '0.5rem 0.85rem', marginRight: '0.5rem' }} onClick={() => {
                      let newStatus = d.status
                      if (d.status === 'Pending') newStatus = 'Approved'
                      else if (d.status === 'Approved') newStatus = 'Completed'
                      else if (d.status === 'Draft') newStatus = 'Pending'
                      updateStatus(d, newStatus)
                    }}>
                      {d.status === 'Pending' && <><ion-icon name="checkmark-circle"></ion-icon> Approve</> }
                      {d.status === 'Approved' && <><ion-icon name="airplane"></ion-icon> Release</> }
                      {d.status === 'Completed' && <><ion-icon name="lock-closed"></ion-icon> Lock</> }
                      {d.status === 'Draft' && <><ion-icon name="return-up-back"></ion-icon> Reopen</> }
                      {d.status === 'Rejected' && <><ion-icon name="close-circle"></ion-icon> Rejected</> }
                    </button>
                    <button className="btn-danger" style={{ fontSize: '0.85rem', padding: '0.5rem 0.85rem', marginRight: '0.5rem' }} onClick={() => deleteItem(d.id)}>
                      <ion-icon name="trash"></ion-icon> Delete
                    </button>
                    <button className="btn-archive" style={{ fontSize: '0.85rem', padding: '0.5rem 0.85rem' }} onClick={() => {
                      if (!confirm('Archive this disbursement?')) return
                      updateStatus(d, 'archived')
                    }}>
                      <ion-icon name="archive"></ion-icon> Archive
                    </button>
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