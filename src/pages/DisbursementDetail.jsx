import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getCurrentUser } from '../api'

const STORAGE_KEY = 'dtmis.disbursements'

function readSavedDisbursements() {
  if (typeof window === 'undefined') return []
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (!value) return []
    return JSON.parse(value)
  } catch {
    return []
  }
}

export default function DisbursementDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const currentUser = getCurrentUser()

  // Redirect admin to dashboard
  useEffect(() => {
    if (currentUser?.department === 'admin') {
      navigate('/admin/dashboard', { replace: true })
    }
  }, [currentUser, navigate])

  const disbursements = readSavedDisbursements()
  const disbursement = disbursements.find((d) => String(d.id) === String(id))

  if (!disbursement) {
    return (
      <div className="space-y-3 border border-slate-200 bg-white p-4">
        <h2 className="text-xl font-bold text-slate-800">Disbursement Voucher Entry Request not found</h2>
        <p className="text-sm text-slate-600">The requested disbursement voucher entry does not exist.</p>
        <button onClick={() => navigate('/disbursements')} className="border border-blue-600 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">Back to list</button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="border-b border-slate-200 pb-3">
        <h2 className="text-2xl font-bold text-slate-800">Disbursement Voucher Entry Request #{disbursement.id}</h2>
        <p className="text-sm text-slate-700">Details for {disbursement.trackingno}</p>
      </div>

      <section className="border border-slate-200 bg-white p-4 text-sm text-slate-700">
        <p><span className="font-semibold text-slate-800">Tracking Number:</span> {disbursement.trackingno}</p>
        <p><span className="font-semibold text-slate-800">DV Number:</span> {disbursement.dvno.toLocaleString()}</p>
        <p><span className="font-semibold text-slate-800">Status:</span> {disbursement.status}</p>
        <p><span className="font-semibold text-slate-800">Request Date:</span> {disbursement.date}</p>
        <p><span className="font-semibold text-slate-800">Department:</span> {disbursement.officer}</p>
      </section>

      <Link to="/disbursements" className="inline-block border border-blue-600 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">Back to Voucher Entry List</Link>
    </div>
  )
}
