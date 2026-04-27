/* eslint-disable no-unused-vars */
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { apiRequest, getCurrentUser } from '../api'
import ReactModal from '../components/ReactModal'
import Swal from 'sweetalert2'

const statusOptions = ['Pending', 'Approved', 'Rejected']

const formatDateMMDDYYYY = (date) => {
   if (!date) return '-';
   const parts = date.split('-'); 
   const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
   return dateObj.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
   });
}

export default function Disbursements() {
  const navigate = useNavigate()
  const currentUser = getCurrentUser()

  // Redirect admin to dashboard
  useEffect(() => {
    if (currentUser?.department === 'admin') {
      navigate('/admin/dashboard', { replace: true })
    }
  }, [currentUser, navigate])

  const [disbursements, setDisbursements] = useState([])
  const [search, setSearch] = useState('')
  
  // CREATE STATES (Accounting Only)
  const [trackingno, setTrackingNo] = useState('')
  const [payee, setPayee] = useState('')
  const [fundSource, setFundSource] = useState('GF')
  const [tin, setTin] = useState('')
  const [createdDate, setCreatedDate] = useState(new Date().toISOString().split('T')[0])
  const [status, setStatus] = useState('Pending')
  const [adviceNo, setAdviceNo] = useState('')
  const [adviceDate, setAdviceDate] = useState('')
  const [transactionNo, setTransactionNo] = useState('')
  const [transactionDate, setTransactionDate] = useState('')

  const [particularDescription, setParticularDescription] = useState('')
  const [particularJevNo, setParticularJevNo] = useState('')
  const [particularDate, setParticularDate] = useState(new Date().toISOString().split('T')[0])
  const [particulars, setParticulars] = useState([
    { category: 'ORGANIC', np: '', ft: '', tf: '' },
    { category: 'DEVOLVED', np: '', ft: '', tf: '' },
    { category: 'VM & SB', np: '', ft: '', tf: '' },
    { category: 'Adjustment', np: '', ft: '', tf: '' },
  ])
  const [jeRows, setJeRows] = useState([
    { account_code: '', particulars: '', debit: '', credit: '' }
  ]);
  
  // EDIT STATES (Separated by Department)
  // Accounting Fields
  const [editTrackingNo, setEditTrackingNo] = useState('');
  const [editPayee, setEditPayee] = useState('');
  const [editTin, setEditTin] = useState('');
  const [editFundSource, setEditFundSource] = useState('GF');
  const [editCreatedDate, setEditCreatedDate] = useState('');
  const [editOffice, setEditOffice] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editAdviceNo, setEditAdviceNo] = useState('');
  const [editAdviceDate, setEditAdviceDate] = useState('');
  const [editTransactionNo, setEditTransactionNo] = useState('');
  const [editTransactionDate, setEditTransactionDate] = useState('');
  const [editParticulars, setEditParticulars] = useState([]);
  const [editJeRows, setEditJeRows] = useState([]);

  // Budget Fields
  const [editCafoaNo, setEditCafoaNo] = useState('');
  const [editResponsibilityCenter, setEditResponsibilityCenter] = useState('');

  // Treasurer Fields
  const [editDVNo, setEditDVNo] = useState('');
  const [editDVDate, setEditDVDate] = useState('');
  const [editModeOfPayment, setEditModeOfPayment] = useState('CASH');
  const [editMopOthers, setEditMopOthers] = useState('');
  const [editAtmNo, setEditAtmNo] = useState('');
  const [editBank, setEditBank] = useState('');
  const [editPaymentDate, setEditPaymentDate] = useState('');

  const initialOfficer = (() => {
    const u = getCurrentUser()
    return (u && u.full_name) || ''
  })()
  const [officer, setOfficer] = useState(initialOfficer)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [dvCurrentPage, setDVCurrentPage] = useState(1)
  const dvItemsPerPage = 5

  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedDV, setSelectedDV] = useState(null);

  // Normalize department keys to match backend choices
  const normalizeDept = (d) => {
    if (!d) return null
    const v = String(d).toLowerCase().trim()
    if (v === 'admin' || v.includes('system')) return 'admin'
    if (v === 'accounting' || v === 'accountant') return 'accounting'
    if (v.includes('budget')) return 'budget'
    if (v.includes('treasurer')) return 'treasurer'
    if (v.includes('bac') || v.includes('technical')) return 'bac_gso'
    if (v.includes('mayor') || v.includes('secretary')) return 'mayors_office'
    return v.replace(/\s+/g, '_')
  }

  const currentUserDeptKey = normalizeDept(currentUser?.department)
  const isAccountant = currentUserDeptKey === 'accounting'
  const DEPT_STEP = {
    accounting: 1,
    budget: 2,
    treasurer: 3,
    bac_gso: 4,
    mayors_office: 5,
  }
  const currentUserStep = DEPT_STEP[currentUserDeptKey] || null

  // Authorization Flags For Modal Interactivity
  const isPending = selectedDV?.status?.toLowerCase() === 'pending';
  const isDisapproved = selectedDV?.status?.toLowerCase() === 'disapproved';
  const currentStep = selectedDV?.current_step;

  const canEditAccounting = currentUserDeptKey === 'accounting' && isDisapproved;
  const canEditBudget = currentUserDeptKey === 'budget' && isPending && currentStep === 2;
  const canEditTreasurer = currentUserDeptKey === 'treasurer' && isPending && currentStep === 3;
  const canSave = canEditAccounting || canEditBudget || canEditTreasurer;

  useEffect(() => {
    async function load() {
      const data = await apiRequest('/dv/')
      if (data) setDisbursements(data)
    }
    load()
  }, [])

  const reload = async () => {
    try {
      const data = await apiRequest('/dv/')
      if (data) setDisbursements(data)
    } catch (e) {
      console.error('Failed to reload disbursements', e)
    }
  }

  const handleParticularChange = (index, field, value) => {
    setParticulars((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    )
  }

  const addParticularRow = () => {
    setParticulars((prev) => [...prev, { category: '', np: '', ft: '', tf: '' }])
  }

  const removeParticularRow = (index) => {
    setParticulars((prev) => prev.filter((_, i) => i !== index))
  }

  const filtered = useMemo(() => {
    const activeDisbursements = disbursements.filter(
      (d) => String(d.status || '').toLowerCase() !== 'archived'
    );
    const query = search.trim().toLowerCase();
    
    if (!query) return activeDisbursements;

    return activeDisbursements.filter((d) =>
      (
        String(d.tracking_no || '') +
        String(d.dv_no || '') +
        String(d.status || '') +
        String(d.payee || '') +
        String(d.office || '') +
        String(d.fund_source || '')
      )
        .toLowerCase()
        .includes(query)
    );
  }, [search, disbursements]);

  const addDisbursement = async (e) => {
    e.preventDefault()

    if (!trackingno || !officer || !payee || !fundSource || !tin || !createdDate) {
      toast.error('Please fill required fields: Tracking#, Payee, Fund Source, ID #/TIN, Date')
      return
    }

    try {
      const payload = {
        tracking_no: String(trackingno),
        payee,
        office: officer,
        created_date: createdDate,
        current_step: 2,
        fund_source: fundSource,
        tin,
        advice_no: adviceNo || null,
        advice_date: adviceDate || null,
        transaction_no: transactionNo || null,
        transaction_date: transactionDate || null,
        payments: [
          {
            mop: "CASH",
            mop_specify: "",
            atm_no: "",
            bank: "",
            date: null,
          },
        ],
        particulars: [
          {
            description: particularDescription,
            jev_no: particularJevNo,
            date: particularDate,
            category_values: particulars.map((item) => ({
              category: item.category,
              np: parseFloat(item.np) || 0,
              ft: parseFloat(item.ft) || 0,
              tf: parseFloat(item.tf) || 0,
            })),
          },
        ],
        journal_entries: jeRows.map(je => ({
          account_code: je.account_code,
          particulars: je.particulars,
          debit: parseFloat(je.debit) || 0,
          credit: parseFloat(je.credit) || 0
        })),
      }

      const newItem = await apiRequest('/dv/', 'POST', payload)

      if (newItem) {
        toast.success('Disbursement voucher entry added successfully!')
        setDisbursements((prev) => [newItem, ...prev])
        setShowCreateModal(false)
      } else {
        toast.error('Failed to add entry. Please check your inputs.');
      }

      // Reset form states
      setTrackingNo('')
      setStatus('Pending')
      setPayee('')
      setFundSource('GF')
      setTin('')
      setAdviceNo('')
      setAdviceDate('')
      setTransactionNo('')
      setTransactionDate('')
      setCreatedDate(new Date().toISOString().split('T')[0])
      
      setParticularDescription('')
      setParticularJevNo('')
      setParticularDate(new Date().toISOString().split('T')[0])
      setParticulars([{ category: '', np: '', ft: '', tf: '' }])
      setJeRows([{ account_code: '', particulars: '', debit: 0, credit: 0 }]);
      setOfficer(initialOfficer)
    } catch (err) {
      console.error('Create failed', err)
      toast.error(err?.message || 'Failed to create disbursement')
    }
  }

  const approveItem = async (item) => {
    const result = await Swal.fire({
      title: 'Approve Disbursement?',
      text: `Are you sure you want to approve this disbursement voucher?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Approve',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#059669',
      cancelButtonColor: '#6b7280',
      background: '#F0F4FF',
      color: '#1f2937',
    })
    
    if (!result.isConfirmed) return
    
    try {
      await apiRequest(`/dv/${item.id}/approve/`, 'POST')
      await Swal.fire({
        title: 'Success!',
        text: 'Disbursement approved successfully.',
        icon: 'success',
        confirmButtonColor: '#0052CC',
        background: '#F0F4FF',
        color: '#1f2937',
      })
      await reload()
    } catch (err) {
      console.error('Approve failed', err)
      await Swal.fire({
        title: 'Error!',
        text: err?.message || 'Approve failed',
        icon: 'error',
        confirmButtonColor: '#e11d48',
      })
    }
  }

  const rejectItem = async (item) => {
    const result = await Swal.fire({
      title: 'Reject Disbursement?',
      input: 'textarea',
      inputLabel: 'Rejection Remarks',
      inputPlaceholder: 'Enter your remarks for rejection...',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Reject',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#6b7280',
      background: '#F0F4FF',
      color: '#1f2937',
    })
    
    if (!result.isConfirmed) return
    if (!result.value?.trim()) {
      await Swal.fire({
        title: 'Required!',
        text: 'Rejection remarks are required',
        icon: 'warning',
        confirmButtonColor: '#f97316',
      })
      return
    }
    
    try {
      await apiRequest(`/dv/${item.id}/disapprove/`, 'POST', { remarks: result.value || 'No remarks provided.' })
      await Swal.fire({
        title: 'Rejected!',
        text: 'Disbursement rejected successfully.',
        icon: 'success',
        confirmButtonColor: '#0052CC',
      })
      if(showViewModal) setShowViewModal(false)
      await reload()
    } catch (err) {
      console.error('Reject failed', err)
      await Swal.fire({
        title: 'Error!',
        text: err?.message || 'Reject failed',
        icon: 'error',
        confirmButtonColor: '#e11d48',
      })
    }
  }

  const isActionable = (d) => {
    const statusLower = String(d.status || '').toLowerCase()
    if (currentUserDeptKey === 'accounting') return false
    return statusLower === 'pending' && d.current_step === currentUserStep
  }

  const canArchive = (d) => {
    const statusLower = String(d.status || '').toLowerCase();
    if (statusLower === 'archived') return false;
    if (statusLower !== 'completed') return false;
    return true;
  };

  const handleJeRowChange = (index, field, value) => {
    const updated = [...jeRows];
    updated[index][field] = value;
    setJeRows(updated);
  };

  const addJeRow = () => {
    setJeRows([...jeRows, { account_code: '', particulars: '', debit: '', credit: '' }]);
  };

  const removeJeRow = (index) => {
    if (jeRows.length > 1) {
      setJeRows(jeRows.filter((_, i) => i !== index));
    }
  };

  // --- EDIT HANDLERS FOR VIEW MODAL ---
  const handleEditParticularDescription = (pIdx, value) => {
    const updated = [...editParticulars];
    updated[pIdx] = { ...updated[pIdx], description: value };
    setEditParticulars(updated);
  };

  const handleEditParticularJevNo = (pIdx, value) => {
    const updated = [...editParticulars];
    updated[pIdx] = { ...updated[pIdx], jev_no: value };
    setEditParticulars(updated);
  };

  const handleEditParticularValue = (pIdx, vIdx, field, value) => {
    const updated = [...editParticulars];
    const updatedVals = [...updated[pIdx].category_values];
    updatedVals[vIdx] = { ...updatedVals[vIdx], [field]: value };
    updated[pIdx] = { ...updated[pIdx], category_values: updatedVals };
    setEditParticulars(updated);
  };

  const handleAddEditParticularValue = (pIdx) => {
    const updated = [...editParticulars];
    if (!updated[pIdx].category_values) {
      updated[pIdx].category_values = [];
    }
    updated[pIdx].category_values.push({ category: '', np: '', ft: '', tf: '' });
    setEditParticulars(updated);
  };

  const handleRemoveEditParticularValue = (pIdx, vIdx) => {
    const updated = [...editParticulars];
    updated[pIdx].category_values = updated[pIdx].category_values.filter((_, i) => i !== vIdx);
    setEditParticulars(updated);
  };

  const handleEditJeRowChange = (index, field, value) => {
    const updated = [...editJeRows];
    updated[index] = { ...updated[index], [field]: value };
    setEditJeRows(updated);
  };

  const handleAddEditJeRow = () => {
    setEditJeRows([...editJeRows, { account_code: '', particulars: '', debit: 0, credit: 0 }]);
  };

  const handleRemoveEditJeRow = (index) => {
    setEditJeRows(editJeRows.filter((_, i) => i !== index));
  };

  const handleView = (dv) => {
    setSelectedDV(dv);

    // Populate Accounting States
    setEditTrackingNo(dv.tracking_no || '');
    setEditPayee(dv.payee || '');
    setEditTin(dv.tin || '');
    setEditFundSource(dv.fund_source || 'GF');
    setEditCreatedDate(dv.created_date || '');
    setEditOffice(dv.office || '');
    setEditStatus(dv.status || '');
    setEditAdviceNo(dv.advice_no || '');
    setEditAdviceDate(dv.advice_date || '');
    setEditTransactionNo(dv.transaction_no || '');
    setEditTransactionDate(dv.transaction_date || '');
    
    // Populate Budget States
    setEditCafoaNo(dv.cafoa_no || '');
    setEditResponsibilityCenter(dv.responsibility_center || '');

    // Populate Treasurer States
    setEditDVNo(dv.dv_no || '');
    setEditDVDate(dv.dv_date || '');
    setEditModeOfPayment(dv.payments?.[0]?.mop || 'CASH');
    setEditMopOthers(dv.payments?.[0]?.mop_specify || '');
    setEditAtmNo(dv.payments?.[0]?.atm_no || '');
    setEditBank(dv.payments?.[0]?.bank || '');
    setEditPaymentDate(dv.payments?.[0]?.date || '');
    
    // Arrays
    setEditParticulars(dv.particulars ? JSON.parse(JSON.stringify(dv.particulars)) : []);
    setEditJeRows(dv.journal_entries ? JSON.parse(JSON.stringify(dv.journal_entries)) : []);
    
    setShowViewModal(true);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!canSave) return;

    try {
      const payload = {
        tracking_no: editTrackingNo,
        payee: editPayee,
        tin: editTin,
        fund_source: editFundSource,
        created_date: editCreatedDate,
        advice_no: editAdviceNo || null,
        advice_date: editAdviceDate || null,
        transaction_no: editTransactionNo || null,
        transaction_date: editTransactionDate || null,
        
        cafoa_no: editCafoaNo || null,
        responsibility_center: editResponsibilityCenter || null,
        
        dv_no: editDVNo || null,
        dv_date: editDVDate || null,

        particulars: editParticulars,
        journal_entries: editJeRows,
        payments: [
          {
            ...(selectedDV.payments?.[0] || {}),
            mop: editModeOfPayment,
            mop_specify: editMopOthers,
            atm_no: editAtmNo,
            bank: editBank,
            date: editPaymentDate || null,
          }
        ]
      };

      const updated = await apiRequest(`/dv/${selectedDV.id}/`, 'PUT', payload);
      
      if (updated) {
        if (canEditAccounting) {
          await apiRequest(`/dv/${selectedDV.id}/resubmit/`, 'POST', {
            remarks: 'Corrected and resubmitted by Accounting.'
          });
          toast.success('Disbursement Voucher updated and resubmitted successfully!');
        } else if (canEditBudget || canEditTreasurer) {
          await apiRequest(`/dv/${selectedDV.id}/approve/`, 'POST');
          toast.success('Disbursement Voucher updated and approved successfully!');
        }
        setShowViewModal(false);
        reload();
      }
    } catch (err) {
      console.error("Submission error:", err);
      toast.error(err?.message || 'Failed to update the Disbursement Voucher');
    }
  };
  
  return (
    <div className='noselect'>
      <div className="page-header">
        <div>
          <h2><ion-icon name="card-outline"></ion-icon> Disbursement Voucher Tracking</h2>
          <p>Track requests, approvals, and release statuses in Disbursement MIS.</p>
        </div>
      </div>

      {/* ➕ NEW ENTRY FORM MODAL (Accounting Specific) */}
      {isAccountant && (
        <ReactModal 
          isOpen={showCreateModal} 
          onClose={() => setShowCreateModal(false)} 
          title="New Disbursement Voucher Entry"
        >
          <section className="panel panel-alt noselect">
            <form onSubmit={addDisbursement}>
              {/* TOP FORM GRID - ACCOUNTING */}
              <div className="form-grid form-grid--split noselect">
                <label>
                  <span>Tracking Number<span style={{ color: 'red' }}>*</span></span>
                  <input type="number" value={trackingno} onChange={(e) => setTrackingNo(e.target.value)} placeholder="Enter tracking number" />
                </label>
                <label>
                  <span>Payee<span style={{ color: 'red' }}>*</span></span>
                  <input type="text" value={payee} onChange={(e) => setPayee(e.target.value)} placeholder="Enter payee name" />
                </label>
                <label>
                  <span>ID # / TIN<span style={{ color: 'red' }}>*</span></span>
                  <input type="text" value={tin} onChange={(e) => setTin(e.target.value)} placeholder="Enter TIN or ID number" />
                </label>
                <label>
                  <span>Fund Source<span style={{ color: 'red' }}>*</span></span>
                  <select value={fundSource} onChange={(e) => setFundSource(e.target.value)}>
                    <option value="GF">GF</option>
                    <option value="20% DF">20% DF</option>
                    <option value="5% DRRM">5% DRRM</option>
                    <option value="GAD">GAD</option>
                    <option value="RA7171">RA7171</option>
                    <option value="SEF">SEF</option>
                    <option value="TF">TF</option>
                    <option value="PHILHEALTH">PHILHEALTH</option>
                    <option value="CALAMITY">CALAMITY</option>
                  </select>
                </label>
                <label>
                  <span>Advice No</span>
                  <input type="text" value={adviceNo} onChange={(e) => setAdviceNo(e.target.value)} placeholder="Enter Advice No" />
                </label>
                <label>
                  <span>Advice Date</span>
                  <input type="date" value={adviceDate} onChange={(e) => setAdviceDate(e.target.value)} />
                </label>
                <label>
                  <span>Transaction No</span>
                  <input type="text" value={transactionNo} onChange={(e) => setTransactionNo(e.target.value)} placeholder="Enter Transaction No" />
                </label>
                <label>
                  <span>Transaction Date</span>
                  <input type="date" value={transactionDate} onChange={(e) => setTransactionDate(e.target.value)} />
                </label>
                <label>
                  <span>Created Date</span>
                  <input type="date" value={createdDate} readOnly disabled onChange={(e) => setCreatedDate(e.target.value)} />
                </label>
                <label>
                  <span>Created By</span>
                  <input value={officer} readOnly disabled placeholder="Auto-filled by your account" />
                </label>
                <label>
                  <span>Status</span>
                  <input value={status} readOnly disabled />
                </label>
              </div>

              {/* --- PARTICULARS SECTION --- */}
              <section className="panel-section" style={{ marginTop: '2rem' }}>
                <h4 className="section-title"><ion-icon name="list-circle-outline"></ion-icon> Particulars</h4>
                  <div className="general-description-wrapper">
                    <label className="general-label">
                      <span>JEV Number</span>
                    </label>
                    <input
                      type="text"
                      className="general-description"
                      value={particularJevNo}
                      onChange={(e) => setParticularJevNo(e.target.value)}
                      placeholder="Enter JEV Number"
                      style={{ marginBottom: '1rem', minHeight: '40px' }}
                    />
                    
                    <label className="general-label">
                      <span>General Description</span>
                    </label>
                    <textarea
                      className="general-description"
                      value={particularDescription}
                      onChange={(e) => setParticularDescription(e.target.value)}
                      placeholder="Enter overall description of the voucher..."
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
                        <th style={{ width: '50px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {particulars.map((item, idx) => (
                        <tr key={idx}>
                          <td>
                            <input className="particulars-input" type="text" value={item.category} onChange={(e) => handleParticularChange(idx, 'category', e.target.value)} placeholder="Category name" />
                          </td>
                          <td><input className="particulars-input" type="number" value={item.np} onChange={(e) => handleParticularChange(idx, 'np', e.target.value)} placeholder="0.00" /></td>
                          <td><input className="particulars-input" type="number" value={item.ft} onChange={(e) => handleParticularChange(idx, 'ft', e.target.value)} placeholder="0.00" /></td>
                          <td><input className="particulars-input" type="number" value={item.tf} onChange={(e) => handleParticularChange(idx, 'tf', e.target.value)} placeholder="0.00" /></td>
                          <td className="table-column-center">
                            {idx > 0 && (
                              <button type="button" className="btn-danger btn-small" onClick={() => removeParticularRow(idx)}>
                                <ion-icon name="trash"></ion-icon>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* --- ACCOUNTING ENTRY SECTION --- */}
              <section className="panel-section" style={{ marginTop: '2.5rem', borderTop: '2px solid var(--border-color)', paddingTop: '1.5rem' }}>
                <h4 className="section-title"><ion-icon name="journal-outline"></ion-icon> Accounting Entries</h4>
                <div className="table-wrap">
                  <table className="particulars-table">
                    <thead>
                      <tr>
                        <th>Particulars</th>
                        <th>Account</th>
                        <th>Debit</th>
                        <th>Credit</th>
                        <th style={{ width: '50px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {jeRows.map((row, index) => (
                        <tr key={index}>
                          <td>
                            <input className="particulars-input" type="text" value={row.particulars} onChange={(e) => handleJeRowChange(index, 'particulars', e.target.value)} placeholder="Description" />
                          </td>
                          <td>
                            <input className="particulars-input" type="text" value={row.account_code} onChange={(e) => handleJeRowChange(index, 'account_code', e.target.value)} placeholder="Code" />
                          </td>
                          <td><input className="particulars-input" type="number" value={row.debit} onChange={(e) => handleJeRowChange(index, 'debit', e.target.value)} placeholder="0.00" /></td>
                          <td><input className="particulars-input" type="number" value={row.credit} onChange={(e) => handleJeRowChange(index, 'credit', e.target.value)} placeholder="0.00" /></td>
                          <td className="table-column-center">
                            {index > 0 && (
                              <button type="button" className="btn-danger btn-small" onClick={() => removeJeRow(index)}>
                                <ion-icon name="trash"></ion-icon>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button type="button" className="btn-primary btn-small" onClick={addJeRow} style={{ marginTop: '1rem' }}>
                    + Add Journal Row
                  </button>
                </div>
              </section>

              {/* --- MODAL FOOTER --- */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid #eee' }}>
                <button type="submit" className="btn-archive py-0.5 px-1 flex items-center gap-1">
                  <ion-icon name="add-circle-outline"></ion-icon>
                  Submit DV
                </button>
              </div>
            </form>
          </section>
        </ReactModal>
      )}

      {/* 📋 VOUCHERS TABLE */}
      <section className="panel">
        <div className="table-toolbar">
          <div>
            <h3 className="panel-title"><ion-icon name="clipboard"></ion-icon> Open Disbursement Voucher Entries</h3>
            <p className="panel-subtitle">{filtered.length} active records</p>
          </div>
          <div className="toolbar-actions">
            {isAccountant && (
              <button
                className="btn-archive btn-small"
                style={{display: 'flex', alignItems: 'center', gap: '0.3rem'}}
                onClick={() => setShowCreateModal(true)}
              >
                <ion-icon name="add"></ion-icon> Create DV
              </button>
            )}
            <Link to="/disbursements/archived" className="btn-archive btn-small" style={{display: 'flex', alignItems: 'center', gap: '0.3rem'}}>
              <ion-icon name="archive"></ion-icon> Archived
            </Link>
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setDVCurrentPage(1)
              }}
              placeholder="Search by tracking, DV number, or officer..."
              className="search search--wide"
            />
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead className="table-head">
              <tr>
                <th className="table-column-center table-column-border table-pin-column"><ion-icon name="pin"></ion-icon> Tracking #</th>
                <th className="table-column-center table-column-border table-bookmark-column"><ion-icon name="bookmark"></ion-icon> DV Number</th>
                <th className="table-column-center table-column-border"><ion-icon name="bar-chart"></ion-icon> Status</th>
                <th className="table-column-center table-column-border table-calendar-column"><ion-icon name="calendar"></ion-icon> Request Date</th>
                <th className="table-column-center table-column-border"><ion-icon name="person"></ion-icon> Created By</th>
                <th className="table-column-center table-column-border"><ion-icon name="settings"></ion-icon> Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered
                .slice((dvCurrentPage - 1) * dvItemsPerPage, dvCurrentPage * dvItemsPerPage)
                .map((d) => (
                <tr key={d.id} className="table-row">
                  <td className="table-strong">{d.tracking_no}</td>
                  <td>{d.dv_no !== undefined && d.dv_no !== null && d.dv_no !== '' ? Number(d.dv_no).toString() : '-'}</td>
                  <td className="table-column-center">
                    <span className={'status-badge status-' + String(d.status || '').toLowerCase().replace(/\s+/g, '-') }>
                      {d.status === 'completed' ? d.status : `${d.status} (${d.current_step})`}
                    </span>
                  </td>
                  <td className='table-column-center'>{formatDateMMDDYYYY(d.created_date)}</td>
                  <td>{d.accounting_name || d.office || 'N/A'}</td>
                  <td className="table-column-center">
                    <div className="action-buttons">
                      <button className="btn-archive btn-small flex justify-center items-center gap-1" onClick={() => handleView(d)}>
                          <ion-icon name="eye-outline"></ion-icon> {isActionable(d) && (currentUserDeptKey === 'budget' || currentUserDeptKey === 'treasurer') ? 'View/Modify' : 'View'}
                      </button>
                      
                      {isActionable(d) && (
                        <>
                          {/* BAC/GSO and Others just approve without needing to modify first */}
                          {(currentUserDeptKey !== 'budget' && currentUserDeptKey !== 'treasurer') && (
                            <button className="btn-primary btn-small flex justify-center items-center gap-1" onClick={() => approveItem(d)}>
                              <ion-icon name="checkmark-circle"></ion-icon> Approve
                            </button>
                          )}
                          <button className="btn-danger btn-small flex justify-center items-center gap-1" onClick={() => rejectItem(d)}>
                            <ion-icon name="close-circle"></ion-icon> Reject
                          </button>
                        </>
                      )}

                      {canArchive(d) && (
                        <button
                          className="btn-archive btn-small flex justify-center items-center gap-1"
                          onClick={async () => {
                            const result = await Swal.fire({
                              title: 'Archive disbursement?',
                              text: 'Please enter a reason for archiving.',
                              input: 'text',
                              inputPlaceholder: 'Enter reason...',
                              showCancelButton: true,
                              confirmButtonText: 'Archive',
                              cancelButtonText: 'Cancel',
                              inputValidator: (value) => {
                                if (!value) return 'Reason is required';
                              }
                            });
                            
                            if (!result.isConfirmed) return;
                            
                            try {
                              await apiRequest(`/dv/${d.id}/archive/`, 'POST', { reason: result.value });
                              await Swal.fire({ icon: 'success', title: 'Archived!' });
                              await reload();
                            } catch (e) {
                              Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to archive.' });
                            }
                          }}
                        >
                          <ion-icon name="archive"></ion-icon> Archive
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="empty empty--center"><ion-icon name="mail-unread"></ion-icon> No disbursements found.</p>}
        </div>
        
        {/* 📄 Pagination Controls */}
        {filtered.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
            <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>
              Showing {(dvCurrentPage - 1) * dvItemsPerPage + 1} to {Math.min(dvCurrentPage * dvItemsPerPage, filtered.length)} of {filtered.length} records | Page {dvCurrentPage} of {Math.ceil(filtered.length / dvItemsPerPage)}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setDVCurrentPage(p => Math.max(1, p - 1))}
                disabled={dvCurrentPage === 1}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db',
                  background: dvCurrentPage === 1 ? '#f3f4f6' : '#fff',
                  color: dvCurrentPage === 1 ? '#9ca3af' : '#2c5dff',
                  cursor: dvCurrentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                }}
              >
                <ion-icon name="chevron-back"></ion-icon> Previous
              </button>
              <button
                onClick={() => setDVCurrentPage(p => Math.min(Math.ceil(filtered.length / dvItemsPerPage), p + 1))}
                disabled={dvCurrentPage >= Math.ceil(filtered.length / dvItemsPerPage)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db',
                  background: dvCurrentPage >= Math.ceil(filtered.length / dvItemsPerPage) ? '#f3f4f6' : '#fff',
                  color: dvCurrentPage >= Math.ceil(filtered.length / dvItemsPerPage) ? '#9ca3af' : '#2c5dff',
                  cursor: dvCurrentPage >= Math.ceil(filtered.length / dvItemsPerPage) ? 'not-allowed' : 'pointer',
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

       {/* 👀 VIEW / MODIFY DISBURSEMENT MODAL */}
      <ReactModal 
        isOpen={showViewModal} 
        onClose={() => setShowViewModal(false)} 
        title="Disbursement Voucher Details"
      >
        {selectedDV && (
          <section className="panel panel-alt noselect">
            <form onSubmit={handleUpdateSubmit}>
              
              {/* --- ACCOUNTING INFORMATION --- */}
              <h4 className="section-title"><ion-icon name="calculator-outline"></ion-icon> Accounting Information</h4>
              <div className="form-grid form-grid--split noselect">
                <label>
                  <span>Tracking Number</span>
                  <input type="text" value={editTrackingNo} onChange={(e) => setEditTrackingNo(e.target.value)} disabled={!canEditAccounting} />
                </label>
                <label>
                  <span>Payee</span>
                  <input type="text" value={editPayee} onChange={(e) => setEditPayee(e.target.value)} disabled={!canEditAccounting} />
                </label>
                <label>
                  <span>ID # / TIN</span>
                  <input type="text" value={editTin} onChange={(e) => setEditTin(e.target.value)} disabled={!canEditAccounting} />
                </label>
                <label>
                  <span>Fund Source</span>
                  <select value={editFundSource} onChange={(e) => setEditFundSource(e.target.value)} disabled={!canEditAccounting}>
                    <option value="GF">GF</option>
                    <option value="20% DF">20% DF</option>
                    <option value="5% DRRM">5% DRRM</option>
                    <option value="GAD">GAD</option>
                    <option value="RA7171">RA7171</option>
                    <option value="SEF">SEF</option>
                    <option value="TF">TF</option>
                    <option value="PHILHEALTH">PHILHEALTH</option>
                    <option value="CALAMITY">CALAMITY</option>
                  </select>
                </label>
                <label>
                  <span>Advice No</span>
                  <input type="text" value={editAdviceNo} onChange={(e) => setEditAdviceNo(e.target.value)} disabled={!canEditAccounting} />
                </label>
                <label>
                  <span>Advice Date</span>
                  <input type="date" value={editAdviceDate} onChange={(e) => setEditAdviceDate(e.target.value)} disabled={!canEditAccounting} />
                </label>
                <label>
                  <span>Transaction No</span>
                  <input type="text" value={editTransactionNo} onChange={(e) => setEditTransactionNo(e.target.value)} disabled={!canEditAccounting} />
                </label>
                <label>
                  <span>Transaction Date</span>
                  <input type="date" value={editTransactionDate} onChange={(e) => setEditTransactionDate(e.target.value)} disabled={!canEditAccounting} />
                </label>
                <label>
                  <span>Date Created</span>
                  <input type="date" value={editCreatedDate} onChange={(e) => setEditCreatedDate(e.target.value)} disabled={!canEditAccounting} />
                </label>
                <label>
                  <span>Created By</span>
                  <input value={editOffice} disabled={true} />
                </label>
                <label>
                  <span>Status</span>
                  <input value={editStatus} disabled={true} />
                </label>
              </div>

              {/* --- BUDGET INFORMATION --- */}
              <h4 className="section-title" style={{ marginTop: '2.5rem' }}><ion-icon name="wallet-outline"></ion-icon> Budget Information</h4>
              <div className="form-grid form-grid--split noselect">
                <label>
                  <span>CAFOA No.</span>
                  <input type="text" value={editCafoaNo} onChange={(e) => setEditCafoaNo(e.target.value)} disabled={!canEditBudget} />
                </label>
                <label>
                  <span>Responsibility Center</span>
                  <select value={editResponsibilityCenter} onChange={(e) => setEditResponsibilityCenter(e.target.value)} disabled={!canEditBudget}>
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
                  <input type="text" value={editDVNo} onChange={(e) => setEditDVNo(e.target.value)} disabled={!canEditTreasurer} />
                </label>
                <label>
                  <span>DV Date</span>
                  <input type="date" value={editDVDate} onChange={(e) => setEditDVDate(e.target.value)} disabled={!canEditTreasurer} />
                </label>
                <label>
                  <span>Mode of Payment</span>
                  <select value={editModeOfPayment} onChange={(e) => setEditModeOfPayment(e.target.value)} disabled={!canEditTreasurer}>
                    <option value="CASH">Cash</option>
                    <option value="CHECK">Check</option>
                    <option value="OTHERS">Others</option>
                  </select>
                </label>
                {editModeOfPayment === 'OTHERS' && (
                  <label>
                    <span>Specify Payment Mode</span>
                    <input type="text" value={editMopOthers} onChange={(e) => setEditMopOthers(e.target.value)} disabled={!canEditTreasurer} />
                  </label>
                )}
                <label>
                  <span>ATM Number</span>
                  <input type="text" value={editAtmNo} onChange={(e) => setEditAtmNo(e.target.value)} disabled={!canEditTreasurer} />
                </label>
                <label>
                  <span>Bank</span>
                  <input type="text" value={editBank} onChange={(e) => setEditBank(e.target.value)} disabled={!canEditTreasurer} />
                </label>
                <label>
                  <span>Date of Payment</span>
                  <input type="date" value={editPaymentDate} onChange={(e) => setEditPaymentDate(e.target.value)} disabled={!canEditTreasurer} />
                </label>
              </div>

              {/* --- PARTICULARS SECTION --- */}
              <section className="panel-section" style={{ marginTop: '2.5rem', borderTop: '2px solid var(--border-color)', paddingTop: '1.5rem' }}>
                <h4 className="section-title"><ion-icon name="list-circle-outline"></ion-icon> Particulars Section</h4>
                
                {editParticulars && editParticulars.length > 0 ? (
                  editParticulars.map((part, pIdx) => (
                    <div key={pIdx} style={{ marginBottom: '1.5rem' }}>
                      <div className="general-description-wrapper">
                        <label className="general-label">
                          <span>JEV Number</span>
                        </label>
                        <input
                          type="text"
                          className="general-description"
                          value={part.jev_no || ''}
                          onChange={(e) => handleEditParticularJevNo(pIdx, e.target.value)}
                          disabled={!canEditAccounting}
                          style={{ 
                            marginBottom: '1rem',
                            minHeight: '40px',
                            backgroundColor: canEditAccounting ? '#fff' : '#f9fafb', 
                          }}
                        />

                        <label className="general-label">
                          <span>General Description</span>
                        </label>
                        <textarea
                          className="general-description"
                          value={part.description || ''}
                          onChange={(e) => handleEditParticularDescription(pIdx, e.target.value)}
                          disabled={!canEditAccounting}
                          style={{ 
                            backgroundColor: canEditAccounting ? '#fff' : '#f9fafb', 
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
                              {canEditAccounting && <th style={{ width: '50px' }}></th>}
                            </tr>
                          </thead>
                          <tbody>
                            {part.category_values && part.category_values.length > 0 ? (
                              part.category_values.map((val, vIdx) => (
                                <tr key={vIdx}>
                                  <td><input className="particulars-input" value={val.category || ''} onChange={(e) => handleEditParticularValue(pIdx, vIdx, 'category', e.target.value)} disabled={!canEditAccounting} /></td>
                                  <td><input className="particulars-input" type="number" value={val.np !== undefined ? val.np : ''} onChange={(e) => handleEditParticularValue(pIdx, vIdx, 'np', e.target.value)} disabled={!canEditAccounting} /></td>
                                  <td><input className="particulars-input" type="number" value={val.ft !== undefined ? val.ft : ''} onChange={(e) => handleEditParticularValue(pIdx, vIdx, 'ft', e.target.value)} disabled={!canEditAccounting} /></td>
                                  <td><input className="particulars-input" type="number" value={val.tf !== undefined ? val.tf : ''} onChange={(e) => handleEditParticularValue(pIdx, vIdx, 'tf', e.target.value)} disabled={!canEditAccounting} /></td>
                                  {canEditAccounting && (
                                    <td className="table-column-center">
                                      <button type="button" className="btn-danger btn-small" onClick={() => handleRemoveEditParticularValue(pIdx, vIdx)}>
                                        <ion-icon name="trash"></ion-icon>
                                      </button>
                                    </td>
                                  )}
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={canEditAccounting ? "5" : "4"} style={{ textAlign: 'center', padding: '1.5rem', color: '#9ca3af', fontStyle: 'italic' }}>
                                  <ion-icon name="information-circle-outline"></ion-icon> No Particular Categories provided.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                        {canEditAccounting && (
                          <button type="button" className="btn-primary btn-small" onClick={() => handleAddEditParticularValue(pIdx)} style={{ marginTop: '1rem' }}>
                            + Add Category Row
                          </button>
                        )}
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
                
                {editJeRows && editJeRows.length > 0 ? (
                  <div className="table-wrap">
                    <table className="particulars-table">
                      <thead>
                        <tr>
                          <th>Account Code</th>
                          <th>Particulars</th>
                          <th>Debit</th>
                          <th>Credit</th>
                          {canEditAccounting && <th style={{ width: '50px' }}></th>}
                        </tr>
                      </thead>
                      <tbody>
                        {editJeRows.map((row, index) => (
                          <tr key={index}>
                            <td><input className="particulars-input" value={row.account_code || ''} onChange={(e) => handleEditJeRowChange(index, 'account_code', e.target.value)} disabled={!canEditAccounting} /></td>
                            <td><input className="particulars-input" value={row.particulars || ''} onChange={(e) => handleEditJeRowChange(index, 'particulars', e.target.value)} disabled={!canEditAccounting} /></td>
                            <td><input className="particulars-input" type="number" value={row.debit !== undefined ? row.debit : ''} onChange={(e) => handleEditJeRowChange(index, 'debit', e.target.value)} disabled={!canEditAccounting} /></td>
                            <td><input className="particulars-input" type="number" value={row.credit !== undefined ? row.credit : ''} onChange={(e) => handleEditJeRowChange(index, 'credit', e.target.value)} disabled={!canEditAccounting} /></td>
                            {canEditAccounting && (
                              <td className="table-column-center">
                                <button type="button" className="btn-danger btn-small" onClick={() => handleRemoveEditJeRow(index)}>
                                  <ion-icon name="trash"></ion-icon>
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {canEditAccounting && (
                      <button type="button" className="btn-primary btn-small" onClick={handleAddEditJeRow} style={{ marginTop: '1rem' }}>
                        + Add Journal Row
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <p className="empty empty--center" style={{ padding: '20px 22rem', border: '1px dashed var(--border-color)', borderRadius: '8px'}}>
                      <ion-icon name="information-circle-outline"></ion-icon> No journal entries provided.
                    </p>
                    {canEditAccounting && (
                      <button type="button" className="btn-primary btn-small" onClick={handleAddEditJeRow} style={{ marginTop: '1rem' }}>
                        + Add Journal Row
                      </button>
                    )}
                  </>
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

              {/* --- DYNAMIC ACTIONS BASED ON DEPARTMENT --- */}
              {canSave && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid #eee', gap: '10px' }}>
                  {canEditAccounting ? (
                    <button type="submit" className="btn-archive py-0.5 px-1 flex items-center gap-1">
                      <ion-icon name="send-outline"></ion-icon> Save & Resubmit DV
                    </button>
                  ) : (
                    <>
                      <button type="submit" className="btn-archive py-0.5 px-1 flex items-center gap-1">
                        <ion-icon name="checkmark-circle"></ion-icon> Submit & Approve
                      </button>
                    </>
                  )}
                </div>
              )}
            </form>
          </section>
        )}
      </ReactModal>
    </div>
  )
}