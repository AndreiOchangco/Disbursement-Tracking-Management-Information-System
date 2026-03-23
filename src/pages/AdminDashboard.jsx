import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { clearCurrentUser, getCurrentUser } from '../auth'

const roleCards = {
  'System Administrator': [
    'Manage user roles',
    'Configure system settings',
    'View operational audit logs',
  ],
  Accountant: [
    'Review payment vouchers',
    'Track monthly cash flow',
    'Generate accounting reports',
  ],
  'Budget Officer': [
    'Create and monitor budgets',
    'Authorize funding allocations',
    'Validate budget approvals',
  ],
  Treasurer: [
    'Authorize fund releases',
    'Reconcile disbursement totals',
    'Verify collection receipts',
  ],
  'Technical Officer': [
    'Review document compliance',
    'Validate requirement checklists',
    'Support MIS maintenance',
  ],
  Secretary: [
    'Prepare meeting minutes',
    'Track committee approvals',
    'Document disbursement files',
  ],
}

export default function AdminDashboard() {
  const [user, setUser] = useState(() => getCurrentUser())
  const navigate = useNavigate()

  useEffect(() => {
    const onChange = () => setUser(getCurrentUser())
    window.addEventListener('dtmis-auth-change', onChange)
    return () => window.removeEventListener('dtmis-auth-change', onChange)
  }, [])

  if (!user) {
    return (
      <div>
        <div className="page-header">
          <h2>Admin Dashboard</h2>
          <p>Login to continue to your role-specific dashboard.</p>
        </div>
        <Link to="/login" className="btn-primary">
          Go to Login
        </Link>
      </div>
    )
  }

  const tasks = roleCards[user.role] || ['Access core disbursement workflows']

  return (
    <div>
      <div className="page-header">
        <h2>{user.role} Dashboard</h2>
        <p>
          Welcome <strong>{user.name} ({user.role})</strong>. This dashboard shows quick tasks
          for your role.
        </p>
      </div>
      <section className="panel">
        <h3>Quick Actions</h3>
        <ul>
          {tasks.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      <div className="panel">
        <h3>Quick Navigation</h3>
        <ul>
          <li>
            <Link to="/disbursements">Disbursement Workflow</Link>
          </li>
          <li>
            <Link to="/users">User Roles</Link>
          </li>
        </ul>
      </div>
      <button
        className="btn-primary"
        style={{ background: '#c53030', borderColor: '#a83232', marginTop: '0.25rem' }}
        onClick={() => {
          clearCurrentUser()
          navigate('/login')
        }}
      >
        Logout
      </button>
    </div>
  )
}
