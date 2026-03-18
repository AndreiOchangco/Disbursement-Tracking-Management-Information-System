import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

const STORAGE_KEY = 'dtmis.disbursements'

const initialDisbursements = [
  {
    id: 1,
    project: 'Road Repair Program',
    amount: 125000,
    status: 'Approved',
    date: '2026-03-05',
    officer: 'J. Rivera',
  },
  {
    id: 2,
    project: 'School Construction',
    amount: 85000,
    status: 'Pending',
    date: '2026-03-10',
    officer: 'M. Santos',
  },
  {
    id: 3,
    project: 'Health Clinic Supplies',
    amount: 42000,
    status: 'Released',
    date: '2026-03-12',
    officer: 'A. Cruz',
  },
]

const statusOptions = ['Pending', 'Approved', 'Released', 'Rejected']
const statusLifeCycle = {
  Pending: 'Approved',
  Approved: 'Released',
  Released: 'Released',
  Rejected: 'Rejected',
}

function readSaved() {
  if (typeof window === 'undefined') return initialDisbursements
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialDisbursements
    return JSON.parse(raw)
  } catch {
    return initialDisbursements
  }
}

export default function Disbursements() {
  const [disbursements, setDisbursements] = useState(() => readSaved())
  const [search, setSearch] = useState('')
  const [project, setProject] = useState('')
  const [amount, setAmount] = useState('')
  const [status, setStatus] = useState('Pending')
  const [officer, setOfficer] = useState('')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(disbursements))
  }, [disbursements])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return disbursements
    return disbursements.filter((d) => {
      return (
        d.project.toLowerCase().includes(query) ||
        d.status.toLowerCase().includes(query) ||
        d.officer.toLowerCase().includes(query)
      )
    })
  }, [search, disbursements])

  const addDisbursement = (e) => {
    e.preventDefault()
    if (!project || !amount || !officer) return

    setDisbursements((prev) => [
      ...prev,
      {
        id: prev.length ? Math.max(...prev.map((d) => d.id)) + 1 : 1,
        project,
        amount: Number(amount),
        status,
        date: new Date().toISOString().slice(0, 10),
        officer,
      },
    ])

    setProject('')
    setAmount('')
    setStatus('Pending')
    setOfficer('')
  }

  const updateStatus = (id) => {
    setDisbursements((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        const nextStatus = statusLifeCycle[item.status] ?? 'Pending'
        return { ...item, status: nextStatus }
      }),
    )
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Disbursement Tracking</h2>
          <p>
            Track requests, approvals, and release statuses in your financial MIS.
          </p>
        </div>
      </div>

      <section className="panel">
        <h3>New Disbursement Request</h3>
        <form className="form-grid" onSubmit={addDisbursement}>
          <label>
            Project
            <input
              value={project}
              onChange={(e) => setProject(e.target.value)}
              placeholder="Project name"
            />
          </label>
          <label>
            Amount
            <input
              type="number"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount"
            />
          </label>
          <label>
            Officer
            <input
              value={officer}
              onChange={(e) => setOfficer(e.target.value)}
              placeholder="Fiscal officer"
            />
          </label>
          <label>
            Status
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {statusOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="btn-primary">
            Add Request
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="table-toolbar">
          <div>
            <h3>Open Disbursement Requests</h3>
            <p>{filtered.length} records</p>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by project, status, or officer"
            className="search"
          />
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Project</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Request Date</th>
                <th>Officer</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id}>
                  <td>
                    <Link to={`/disbursements/${d.id}`} className="small-link">
                      #{d.id}
                    </Link>
                  </td>
                  <td>{d.project}</td>
                  <td>${d.amount.toLocaleString()}</td>
                  <td>{d.status}</td>
                  <td>{d.date}</td>
                  <td>{d.officer}</td>
                  <td>
                    <button
                      className="btn-primary" 
                      onClick={() => updateStatus(d.id)}
                      disabled={d.status === 'Released' || d.status === 'Rejected'}
                    >
                      {d.status === 'Pending' ? 'Approve' : d.status === 'Approved' ? 'Release' : 'Locked'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="empty">No disbursements found.</p>}
        </div>
      </section>
    </div>
  )
}
