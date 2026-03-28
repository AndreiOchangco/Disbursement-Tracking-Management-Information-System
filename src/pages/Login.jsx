/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { setToken, setCurrentUser, apiRequest } from '../api'
import logo from '/MuniLuna.png'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError('Please enter email and password')
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
          email,
          password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Login failed')
        return
      }

      // 🔥 SAVE TOKEN (CENTRALIZED)
      setToken(data.access_token)

      // 🔥 GET USER INFO FROM BACKEND
      const me = await apiRequest('/auth/me/')

      // 🔥 SAVE USER
      setCurrentUser(me)

      navigate('/dashboard')

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
      <div className="bg-transparent p-8 w-full max-w-md border border-gray-300 rounded-lg shadow-lg">

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src={logo} alt="Logo" className="w-35 h-35" />
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-yellow-500 text-center mb-4 text-shadow-sm">
          Disbursement Tracking Management Information System (DTMIS)
        </h2>

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-4">

          {/* Email */}
          <div>
            <label className="block text-black mb-1 font-semibold">
              Email
            </label>
            <input
              className="w-full border border-gray-300 text-black p-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-black mb-1 font-semibold">
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
            className="w-full bg-yellow-500 text-white font-semibold p-2 hover:bg-yellow-600 transition-colors"
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