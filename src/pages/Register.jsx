/* eslint-disable no-unused-vars */
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

export default function Register() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState(roles[0])
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!username.trim() || !password) {
      setError('Please enter username and password')
      return
    }

    try {
      const res = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password, role }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Registration failed')
        return
      }
      const user = json.user
      setCurrentUser({ name: user.username, role: user.role })
      navigate('/dashboard')
    } catch (err) {
      setError('Network error')
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-inner">
        <div className="page-header">
          <h2>Register for DTMIS</h2>
          <p>Create an account to access the dashboard.</p>
        </div>
        <section className="panel auth-panel">
          <form className="form-grid" onSubmit={onSubmit}>
            <label>
              Username
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Choose a password"
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
              Register
            </button>
          </form>
          {error && <p style={{ color: 'red', marginTop: '0.5rem' }}>{error}</p>}
        </section>
      </div>
    </div>
  )
}
