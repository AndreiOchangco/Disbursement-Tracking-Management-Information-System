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
        <h2>Disbursement not found</h2>
        <p>The requested disbursement does not exist.</p>
        <button onClick={() => navigate('/disbursements')} className="btn-primary">
          Back to list
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h2>Disbursement Request #{disbursement.id}</h2>
        <p>Details for {disbursement.project}</p>
      </div>
      <section className="panel">
        <div>
          <p><strong>Project:</strong> {disbursement.project}</p>
          <p><strong>Amount:</strong> ${disbursement.amount.toLocaleString()}</p>
          <p><strong>Status:</strong> {disbursement.status}</p>
          <p><strong>Request Date:</strong> {disbursement.date}</p>
          <p><strong>Officer:</strong> {disbursement.officer}</p>
        </div>
      </section>
      <Link to="/disbursements" className="btn-primary">Back to Disbursements</Link>
    </div>
  )
}
