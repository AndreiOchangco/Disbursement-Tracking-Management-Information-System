/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { setToken, setCurrentUser, apiRequest } from '../api'
import logo from '../components/MuniLuna.png'

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
      // 🔥 LOGIN REQUEST
      const res = await fetch('http://localhost:8000/api/auth/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(), // ✅ FIXED (NOT email)
          password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.detail || 'Login failed')
        return
      }

      // 🔥 SAVE TOKEN (CENTRALIZED)
      setToken(data.access_token)

      // 🔥 GET USER INFO FROM BACKEND
      const me = await apiRequest('/me/')

      // 🔥 SAVE USER
      setCurrentUser(me)

      // 🔥 ROLE-BASED REDIRECT
      if (me.is_admin) {
        navigate('/admin-dashboard')
      } else {
        navigate('/dashboard')
      }

    } catch (err) {
      console.error(err)
      setError('Cannot connect to server')
    }
  }

  useEffect(() => {
    setPassword('')
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="bg-white p-8 w-full max-w-md border border-gray-300">

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src={logo} alt="Logo" className="w-32 h-32" />
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-yellow-500 text-center mb-4">
          Disbursement Tracking System
        </h2>

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-4">

          {/* Username */}
          <div>
            <label className="block text-black mb-1">
              Username
            </label>
            <input
              className="w-full border border-gray-300 text-black p-2"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-black mb-1">
              Password
            </label>
            <input
              type="password"
              className="w-full border border-gray-300 text-black p-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
            />
          </div>

          {/* Button */}
          <button
            type="submit"
            className="w-full bg-blue-500 text-white font-semibold p-2"
          >
            Sign in
          </button>
        </form>

        {/* Error */}
        {error && (
          <p style={{ color: 'red', marginTop: '0.5rem' }}>
            {error}
          </p>
        )}
      </div>
    </div>
  )
}