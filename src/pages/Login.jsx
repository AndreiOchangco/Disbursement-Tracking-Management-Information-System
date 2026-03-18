import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setCurrentUser } from '../auth'

const roles = [
  'System Administrator',
  'Accountant',
  'Budget Officer',
  'Treasurer',
  'Technical Officer',
  'Secretary',
]

export default function Login() {
  const [username, setUsername] = useState('')
  const [role, setRole] = useState(roles[0])
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const onSubmit = (e) => {
    e.preventDefault()
    if (!username.trim()) {
      setError('Please enter your name')
      return
    }
    setCurrentUser({ name: username.trim(), role })
    navigate('/dashboard')
  }

  return (
    <div>
      <div className="page-header">
        <h2>Login to DTMIS</h2>
        <p>Select your role and continue to your dashboard.</p>
      </div>
      <section className="panel">
        <form className="form-grid" onSubmit={onSubmit}>
          <label>
            Name
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name"
            />
          </label>
          <label>
            Role
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="btn-primary">
            Continue to Dashboard
          </button>
        </form>
        {error && <p style={{ color: 'red', marginTop: '0.5rem' }}>{error}</p>}
      </section>
    </div>
  )
}
