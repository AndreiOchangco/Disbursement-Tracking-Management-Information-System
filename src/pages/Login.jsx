/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { apiRequest } from '../api'

export default function Login() {
  const [fullname, setFullname] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!fullname.trim() || !password) {
      setError('Please enter your email and password')
      return
    }

    try {
      const res = await fetch('http://localhost:8000/api/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullname,
          password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.detail || 'Login failed')
        return
      }

      localStorage.setItem('token', data.access)

      // 🔥 GET USER INFO
      const me = await apiRequest('/me/')

      // store user
      localStorage.setItem('user', JSON.stringify(me))

      navigate('/dashboard')
    } catch (err) {
      console.error(err)
      setError("Cannot connect to server")
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
        {error && <p style={{ color: 'red', marginTop: '0.5rem' }}>{error}</p>}
        </section>
      </div>
    </div>
  )
}
