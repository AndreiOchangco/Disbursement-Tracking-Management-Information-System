import { Link, useNavigate, useParams } from 'react-router-dom'

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
  const disbursements = readSavedDisbursements()
  const disbursement = disbursements.find((d) => String(d.id) === String(id))

  if (!disbursement) {
    return (
      <div>
        <h2>Disbursement Voucher Entry Request not found</h2>
        <p>The requested disbursement voucher entry does not exist.</p>
        <button onClick={() => navigate('/disbursements')} className="btn-primary">
          Back to list
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h2>Disbursement Voucher Entry Request #{disbursement.id}</h2>
        <p>Details for {disbursement.trackingno}</p>
      </div>
      <section className="panel">
        <div>
          <p><strong>Tracking Number:</strong> {disbursement.trackingno}</p>
          <p><strong>DV Number:</strong> {disbursement.dvno.toLocaleString()}</p>
          <p><strong>Status:</strong> {disbursement.status}</p>
          <p><strong>Request Date:</strong> {disbursement.date}</p>
          <p><strong>Officer:</strong> {disbursement.officer}</p>
        </div>
      </section>
      <Link to="/disbursements" className="btn-primary">Back to Voucher Entry List</Link>
    </div>
  )
}
