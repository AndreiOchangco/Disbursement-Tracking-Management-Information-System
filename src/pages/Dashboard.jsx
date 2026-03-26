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

export default function Dashboard() {
  const [user, setUser] = useState(() => getCurrentUser())
  const navigate = useNavigate()

  useEffect(() => {
    const onChange = () => setUser(getCurrentUser())
    window.addEventListener('dtmis-auth-change', onChange)
    return () => window.removeEventListener('dtmis-auth-change', onChange)
  }, [])

  if (!user) {
    return (
      <div className="space-y-4">
        <div className="border-b border-slate-200 pb-4">
          <h2 className="text-xl font-bold text-slate-800">Dashboard</h2>
          <p className="text-sm text-slate-600">Login to continue to your role-specific dashboard.</p>
        </div>
        <Link to="/login" className="inline-block border border-blue-600 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">Go to Login</Link>
      </div>
    )
  }

  const tasks = roleCards[user.role] || ['Access core disbursement workflows']

  return (
    <div className="space-y-5">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-2xl font-bold text-slate-800">{user.role} Dashboard</h2>
        <p className="text-sm text-slate-700">
          Welcome <strong>{user.name} ({user.role})</strong>. This dashboard shows quick tasks for your role.
        </p>
      </div>

      <section className="border border-slate-200 bg-white p-4">
        <h3 className="text-lg font-semibold text-slate-800">Quick Actions</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {tasks.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="border border-slate-200 bg-white p-4">
        <h3 className="text-lg font-semibold text-slate-800">Quick Navigation</h3>
        <ul className="mt-2 space-y-1 text-sm">
          <li>
            <Link to="/disbursements" className="text-blue-700">Disbursement Workflow</Link>
          </li>
          <li>
            <Link to="/users" className="text-blue-700">User Roles</Link>
          </li>
        </ul>
      </section>

      <button
        className="border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700"
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
