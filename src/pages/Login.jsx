/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setCurrentUser } from '../auth'
import { useEffect } from 'react'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
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
      const res = await fetch('http://localhost:8000/api/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.detail || 'Login failed')
        return
      }

      // 🔑 Django JWT response
      // { access: "...", refresh: "..." }

      localStorage.setItem('token', data.access)

      // optional: store basic user info (not from backend yet)
      setCurrentUser({
        name: username,
        role: 'user', // placeholder unless you implement roles in backend
      })

      navigate('/dashboard')
    } catch (err) {
      setError('Network error')
    }
  }

  useEffect(() => {
    // clear password on mount for safety
    setPassword('')
  }, [])

  return (
    <div className="auth-wrapper">
      <div className="auth-inner">
        <div className="page-header">
        <h2>Login to DTMIS</h2>
        <p>Select your role and continue to your dashboard.</p>
      </div>
        <section className="panel auth-panel">
        <form className="form-grid" onSubmit={onSubmit}>
          <label>
            Username
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </label>
          {/* role is determined by registration/back-end; login only needs username/password */}
          <button type="submit" className="btn-primary">
            Login
          </button>
        </form>
        <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
          <a href="/register">Create an account</a>
        </div>
        {error && <p style={{ color: 'red', marginTop: '0.5rem' }}>{error}</p>}
        </section>
      </div>
    </div>
  )
}
