/* eslint-disable no-unused-vars */
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { apiRequest, getCurrentUser } from '../api'
import Modal from '../components/Modal'
import ReactModal from '../components/ReactModal'
import Swal from 'sweetalert2'


const user = JSON.parse(localStorage.getItem("user"))
const statusOptions = ['Pending', 'Approved', 'Rejected']

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
  const [trackingno, setTrackingNo] = useState('')
  const [dvno, setDVno] = useState('')
  const [status, setStatus] = useState('Pending')
  const [payee, setPayee] = useState('')
  const [fundSource, setFundSource] = useState('GF')
  const [modeOfPayment, setModeOfPayment] = useState('CASH')
  const [paymentMopSpecify, setPaymentMopSpecify] = useState('')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [atmNo, setAtmNo] = useState('')
  const [bank, setBank] = useState('')
  const [tin, setTin] = useState('')
  const [particularDescription, setParticularDescription] = useState('')
  const [particularJevNo, setParticularJevNo] = useState('')
  const [particularDate, setParticularDate] = useState(new Date().toISOString().split('T')[0])
  const [particulars, setParticulars] = useState([
    { category: '', np: '', ft: '', tf: '' },
  ])
  const [jeRows, setJeRows] = useState([
  { account_code: '', particulars: '', debit: 0, credit: 0 }
]);

  const initialOfficer = (() => {
    const u = getCurrentUser()
    return (u && u.full_name) || ''
  })()

  const [officer, setOfficer] = useState(initialOfficer)

  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [addedDV, setAddedDV] = useState(null)
  const [showRecordsModal, setShowRecordsModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [dvCurrentPage, setDVCurrentPage] = useState(1)
  const dvItemsPerPage = 5

  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedDV, setSelectedDV] = useState(null);

  // Normalize department keys to match backend choices (be tolerant of label variants)
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

  // 🔥 Load data from Django backend
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

  // 🔍 Search filter
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return disbursements

    return disbursements.filter((d) =>
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
    )
  }, [search, disbursements])

  // ➕ Create Disbursement
  const addDisbursement = async (e) => {
    e.preventDefault()

    if (!trackingno || !dvno || !officer || !payee || !fundSource || !tin || !paymentDate) {
      toast.error('Please fill required fields: Tracking#, DV#, Payee, Fund Source, ID #/TIN, Date')
      return
    }

    try {
      const payload = {
        dv_no: String(dvno),
        tracking_no: String(trackingno),
        payee,
        office: officer,
        created_date: new Date().toISOString().split('T')[0],
        current_step: 2,
        fund_source: fundSource,
        tin,
        payments: [
          {
            mop: modeOfPayment,
            mop_specify: paymentMopSpecify,
            atm_no: atmNo,
            bank,
            date: paymentDate,
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
      } else {
        toast.error('Failed to add entry. Please check your inputs.');
      }

      // reset form
      setTrackingNo('')
      setDVno('')
      setStatus('Pending')
      setPayee('')
      setFundSource('GF')
      setModeOfPayment('CASH')
      setPaymentMopSpecify('')
      setPaymentDate(new Date().toISOString().split('T')[0])
      setAtmNo('')
      setBank('')
      setTin('')
      setParticularDescription('')
      setParticularJevNo('')
      setParticularDate(new Date().toISOString().split('T')[0])
      setParticulars([
        { category: '', np: '', ft: '', tf: '' },
      ])
      setJeRows([{ account_code: '', particulars: '', debit: 0, credit: 0 }]);
      setOfficer(initialOfficer)
    } catch (err) {
      console.error('Create failed', err)
      toast.error(err?.message || 'Failed to create disbursement')
    }
  }

  // 🔄 Update Status (persisted)
  const updateStatus = async (item, newStatus) => {
  try {
    const updated = await apiRequest(`/dv/${item.id}/`, 'PUT', {
      ...item,
      status: newStatus,
    })

    setDisbursements((prev) =>
      prev.map((d) => (d.id === item.id ? updated : d))
    )
  } catch (err) {
    console.error(err)
    alert("Action not allowed")
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
      didOpen: (modal) => {
        modal.style.fontFamily = "'Inter', sans-serif"
        const confirmBtn = modal.querySelector('.swal2-confirm')
        const cancelBtn = modal.querySelector('.swal2-cancel')
        if (confirmBtn) {
          confirmBtn.style.fontWeight = '500'
          confirmBtn.style.borderRadius = '6px'
          confirmBtn.style.padding = '8px 24px'
        }
        if (cancelBtn) {
          cancelBtn.style.fontWeight = '500'
          cancelBtn.style.borderRadius = '6px'
          cancelBtn.style.padding = '8px 24px'
        }
      }
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
        didOpen: (modal) => {
          modal.style.fontFamily = "'Inter', sans-serif"
        }
      })
      await reload()
    } catch (err) {
      console.error('Approve failed', err)
      await Swal.fire({
        title: 'Error!',
        text: err?.message || 'Approve failed',
        icon: 'error',
        confirmButtonColor: '#e11d48',
        background: '#F0F4FF',
        color: '#1f2937',
        didOpen: (modal) => {
          modal.style.fontFamily = "'Inter', sans-serif"
        }
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
      inputAttributes: {
        style: 'min-height: 100px; font-family: Inter, sans-serif; border-radius: 6px; border: 1px solid #C5D3FF;'
      },
      didOpen: (modal) => {
        modal.style.fontFamily = "'Inter', sans-serif"
        const confirmBtn = modal.querySelector('.swal2-confirm')
        const cancelBtn = modal.querySelector('.swal2-cancel')
        const textarea = modal.querySelector('textarea')
        if (textarea) {
          textarea.style.fontFamily = "'Inter', sans-serif"
        }
        if (confirmBtn) {
          confirmBtn.style.fontWeight = '500'
          confirmBtn.style.borderRadius = '6px'
          confirmBtn.style.padding = '8px 24px'
        }
        if (cancelBtn) {
          cancelBtn.style.fontWeight = '500'
          cancelBtn.style.borderRadius = '6px'
          cancelBtn.style.padding = '8px 24px'
        }
      }
    })
    
    if (!result.isConfirmed) return
    if (!result.value?.trim()) {
      await Swal.fire({
        title: 'Required!',
        text: 'Rejection remarks are required',
        icon: 'warning',
        confirmButtonColor: '#f97316',
        background: '#F0F4FF',
        color: '#1f2937',
        didOpen: (modal) => {
          modal.style.fontFamily = "'Inter', sans-serif"
        }
      })
      return
    }
    
    try {
      await apiRequest(`/dv/${item.id}/disapprove/`, 'POST', { remarks: result.value })
      await Swal.fire({
        title: 'Rejected!',
        text: 'Disbursement rejected successfully.',
        icon: 'success',
        confirmButtonColor: '#0052CC',
        background: '#F0F4FF',
        color: '#1f2937',
        didOpen: (modal) => {
          modal.style.fontFamily = "'Inter', sans-serif"
        }
      })
      await reload()
    } catch (err) {
      console.error('Reject failed', err)
      await Swal.fire({
        title: 'Error!',
        text: err?.message || 'Reject failed',
        icon: 'error',
        confirmButtonColor: '#e11d48',
        background: '#F0F4FF',
        color: '#1f2937',
        didOpen: (modal) => {
          modal.style.fontFamily = "'Inter', sans-serif"
        }
      })
    }
  }

  const handleDecision = async (item) => {
    const input = prompt('Type A to approve, or enter rejection remarks to reject:')
    if (!input) return
    if (input.trim().toLowerCase() === 'a') {
      await approveItem(item)
    } else {
      try {
        await apiRequest(`/dv/${item.id}/disapprove/`, 'POST', { remarks: input })
        await reload()
      } catch (err) {
        console.error('Reject failed', err)
        alert('Reject failed')
      }
    }
  }

  const isActionable = (d) => {
    const statusLower = String(d.status || '').toLowerCase()
    
    if (currentUserDeptKey === 'accounting') {
      return false
    }

    return statusLower === 'pending' && d.current_step === currentUserStep
  }

  const canArchive = (d) => {
  const statusLower = String(d.status || '').toLowerCase();

  // 1. Only Accounting can archive
  if (currentUserDeptKey !== 'accounting') return false;

  // 2. Hide if already archived
  if (statusLower === 'archived') return false;

  // 3. Only show if status is completed
  if (statusLower !== 'completed') return false;

  return true;
};

  const toggleDecision = async (item) => {
    const isApproved = String(item.status || '').toLowerCase() === 'approved'

    // Client-side guard: allow when pending, or for Accounting allow pending at step 2
    const statusLower = String(item.status || '').toLowerCase()
    const allowed = statusLower === 'pending' || (currentUser?.department === 'accounting' && statusLower === 'pending' && item.current_step === 2)
    if (!allowed || item.current_step !== currentUserStep) {
      return await Swal.fire({
        title: 'Not Allowed!',
        text: 'You cannot approve this Disbursement Voucher at this stage.',
        icon: 'error',
        confirmButtonColor: '#e11d48',
        background: '#F0F4FF',
        color: '#1f2937',
        didOpen: (modal) => {
          modal.style.fontFamily = "'Inter', sans-serif"
        }
      })
    }

    if (!isApproved) {
      // Approve
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
        didOpen: (modal) => {
          modal.style.fontFamily = "'Inter', sans-serif"
          const confirmBtn = modal.querySelector('.swal2-confirm')
          const cancelBtn = modal.querySelector('.swal2-cancel')
          if (confirmBtn) {
            confirmBtn.style.fontWeight = '600'
            confirmBtn.style.borderRadius = '8px'
            confirmBtn.style.padding = '12px 28px'
            confirmBtn.style.minWidth = '140px'
          }
          if (cancelBtn) {
            cancelBtn.style.fontWeight = '600'
            cancelBtn.style.borderRadius = '8px'
            cancelBtn.style.padding = '12px 28px'
            cancelBtn.style.minWidth = '140px'
          }
        }
      })
      
      if (!result.isConfirmed) return
      
      try {
        const updated = await apiRequest(`/dv/${item.id}/approve/`, 'POST')
        if (updated) {
          setDisbursements((prev) => prev.map((d) => (d.id === item.id ? updated : d)))
        } else {
          await reload()
        }
        await Swal.fire({
          title: 'Success!',
          text: 'Disbursement approved successfully.',
          icon: 'success',
          confirmButtonColor: '#0052CC',
          background: '#F0F4FF',
          color: '#1f2937',
          didOpen: (modal) => {
            modal.style.fontFamily = "'Inter', sans-serif"
          }
        })
      } catch (err) {
        console.error('Approve failed', err)
        await Swal.fire({
          title: 'Error!',
          text: err?.message || 'Approve failed',
          icon: 'error',
          confirmButtonColor: '#e11d48',
          background: '#F0F4FF',
          color: '#1f2937',
          didOpen: (modal) => {
            modal.style.fontFamily = "'Inter', sans-serif"
          }
        })
      }
    } else {
      // Reject (disapprove) — require remarks
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
        inputAttributes: {
          style: 'min-height: 100px; font-family: Inter, sans-serif; border-radius: 6px; border: 1px solid #C5D3FF;'
        },
        didOpen: (modal) => {
          modal.style.fontFamily = "'Inter', sans-serif"
          const confirmBtn = modal.querySelector('.swal2-confirm')
          const cancelBtn = modal.querySelector('.swal2-cancel')
          const textarea = modal.querySelector('textarea')
          if (textarea) {
            textarea.style.fontFamily = "'Inter', sans-serif"
          }
          if (confirmBtn) {
            confirmBtn.style.fontWeight = '600'
            confirmBtn.style.borderRadius = '8px'
            confirmBtn.style.padding = '12px 28px'
            confirmBtn.style.minWidth = '140px'
          }
          if (cancelBtn) {
            cancelBtn.style.fontWeight = '600'
            cancelBtn.style.borderRadius = '8px'
            cancelBtn.style.padding = '12px 28px'
            cancelBtn.style.minWidth = '140px'
          }
        }
      })
      
      if (!result.isConfirmed) return
      if (!result.value?.trim()) {
        await Swal.fire({
          title: 'Required!',
          text: 'Rejection remarks are required',
          icon: 'warning',
          confirmButtonColor: '#f97316',
          background: '#F0F4FF',
          color: '#1f2937',
          didOpen: (modal) => {
            modal.style.fontFamily = "'Inter', sans-serif"
          }
        })
        return
      }
      
      try {
        const updated = await apiRequest(`/dv/${item.id}/disapprove/`, 'POST', { remarks: result.value })
        if (updated) {
          setDisbursements((prev) => prev.map((d) => (d.id === item.id ? updated : d)))
        } else {
          await reload()
        }
        await Swal.fire({
          title: 'Rejected!',
          text: 'Disbursement rejected successfully.',
          icon: 'success',
          confirmButtonColor: '#0052CC',
          background: '#F0F4FF',
          color: '#1f2937',
          didOpen: (modal) => {
            modal.style.fontFamily = "'Inter', sans-serif"
          }
        })
      } catch (err) {
        console.error('Reject failed', err)
        await Swal.fire({
          title: 'Error!',
          text: err?.message || 'Reject failed',
          icon: 'error',
          confirmButtonColor: '#e11d48',
          background: '#F0F4FF',
          color: '#1f2937',
          didOpen: (modal) => {
            modal.style.fontFamily = "'Inter', sans-serif"
          }
        })
      }
    }
  }

  const handleJeRowChange = (index, field, value) => {
  const updated = [...jeRows];
  updated[index][field] = value;
  setJeRows(updated);
};

const addJeRow = () => {
  setJeRows([...jeRows, { account_code: '', particulars: '', debit: 0, credit: 0 }]);
};

const removeJeRow = (index) => {
  if (jeRows.length > 1) {
    setJeRows(jeRows.filter((_, i) => i !== index));
  }
};

const handleView = (dv) => {
  setSelectedDV(dv);
  setShowViewModal(true);
};
  
  return (
    <div className='noselect'>
      <div className="page-header">
        <div>
          <h2><ion-icon name="card-outline"></ion-icon> Disbursement Voucher Tracking</h2>
          <p>Track requests, approvals, and release statuses in Disbursement MIS.</p>
        </div>
      </div>

      {/* ➕ NEW ENTRY FORM MODAL */}
      {/* ➕ NEW ENTRY FORM MODAL */}
{isAccountant && (
  <ReactModal 
    isOpen={showCreateModal} 
    onClose={() => setShowCreateModal(false)} 
    title="New Disbursement Voucher Entry"
  >
    <section className="panel panel-alt noselect">
      <form onSubmit={addDisbursement}>
        {/* TOP FORM GRID */}
        <div className="form-grid form-grid--split noselect">
          <label>
            <span>Tracking Number<span style={{ color: 'red' }}>*</span></span>
            <input type="number" value={trackingno} onChange={(e) => setTrackingNo(e.target.value)} placeholder="Enter tracking number" />
          </label>
          <label>
            <span>DV Number<span style={{ color: 'red' }}>*</span></span>
            <input type="text" value={dvno} onChange={(e) => setDVno(e.target.value)} placeholder="Enter DV number" />
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
            <span>Mode of Payment</span>
            <select value={modeOfPayment} onChange={(e) => setModeOfPayment(e.target.value)}>
              <option value="CASH">Cash</option>
              <option value="CHECK">Check</option>
              <option value="OTHERS">Others</option>
            </select>
          </label>
          {modeOfPayment === 'OTHERS' && (
            <label>
              <span>Specify Payment Mode</span>
              <input type="text" value={paymentMopSpecify} onChange={(e) => setPaymentMopSpecify(e.target.value)} placeholder="Specify payment mode" />
            </label>
          )}
          <label>
            <span>Date<span style={{ color: 'red' }}>*</span></span>
            <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
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
          <h4 className="section-title"><ion-icon name="list-circle-outline"></ion-icon> Particulars Section</h4>
            <div className="general-description-wrapper">
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
            <button type="button" className="btn-primary btn-small" onClick={addParticularRow} style={{ marginTop: '1rem' }}>
              + Add Category Row
            </button>
          </div>
        </section>

        {/* --- JOURNAL ENTRY SECTION --- */}
        <section className="panel-section" style={{ marginTop: '2.5rem', borderTop: '2px solid var(--border-color)', paddingTop: '1.5rem' }}>
          <h4 className="section-title"><ion-icon name="journal-outline"></ion-icon> Journal Entry Section</h4>
          <div className="table-wrap">
            <table className="particulars-table">
              <thead>
                <tr>
                  <th>Account Code</th>
                  <th>Particulars</th>
                  <th>Debit</th>
                  <th>Credit</th>
                  <th style={{ width: '50px' }}></th>
                </tr>
              </thead>
              <tbody>
                {jeRows.map((row, index) => (
                  <tr key={index}>
                    <td>
                      <input className="particulars-input" type="text" value={row.account_code} onChange={(e) => handleJeRowChange(index, 'account_code', e.target.value)} placeholder="Code" />
                    </td>
                    <td>
                      <input className="particulars-input" type="text" value={row.particulars} onChange={(e) => handleJeRowChange(index, 'particulars', e.target.value)} placeholder="Description" />
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

        {/* --- MODAL FOOTER (BOTTOM RIGHT) --- */}
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
                  <td>{d.accounting_name}</td>
                  <td className="table-column-center">
                    <div className="action-buttons">
                      <button className="btn-archive btn-small flex justify-center items-center gap-1" onClick={() => handleView(d)}>
                          <ion-icon name="eye-outline"></ion-icon> View
                      </button>
                      {/* APPROVE / REJECT: Hidden if Completed, Archived, or not your turn */}
                      {isActionable(d) && (
                        <>
                          <button className="btn-primary btn-small flex justify-center items-center gap-1" onClick={() => approveItem(d)}>
                            <ion-icon name="checkmark-circle"></ion-icon> Approve
                          </button>

                          <button className="btn-danger btn-small flex justify-center items-center gap-1" onClick={() => rejectItem(d)}>
                            <ion-icon name="close-circle"></ion-icon> Reject
                          </button>
                        </>
                      )}

                      {/* ARCHIVE: Only visible to Accounting AND if not already Archived/Completed */}
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

       {/* 👀 VIEW DISBURSEMENT MODAL */}
      <ReactModal 
        isOpen={showViewModal} 
        onClose={() => setShowViewModal(false)} 
        title={`Voucher Preview: DV No. ${selectedDV?.dv_no || 'N/A'}`}
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
                    <div className="form-grid form-grid--split" style={{ marginBottom: '1rem' }}>
                      <label>
                        <span>General Description</span>
                        <textarea 
                          value={part.description || ''} 
                          disabled 
                          style={{gridColumn: 'span 2', minHeight: '80px', backgroundColor: 'var(--bg-light)'}} 
                        />
                      </label>
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
                          {part.category_values?.map((val, vIdx) => (
                            <tr key={vIdx}>
                              <td><input className="particulars-input" value={val.category || ''} disabled /></td>
                              <td><input className="particulars-input" value={val.np || ''} disabled /></td>
                              <td><input className="particulars-input" value={val.ft || ''} disabled /></td>
                              <td><input className="particulars-input" value={val.tf || ''} disabled /></td>
                            </tr>
                          ))}
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
          </section>
        )}
      </ReactModal>
    </div>
  )
}