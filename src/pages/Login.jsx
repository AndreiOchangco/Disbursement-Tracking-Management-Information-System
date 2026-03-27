/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { setCurrentUser } from '../auth'
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
      setError('Please enter email address/username and password')
      return
    }

    try {
      const res = await fetch('http://localhost:8000/api/auth/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: username.trim(),
          password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.detail || 'Login failed')
        return
      }

      localStorage.setItem('token', data.access_token)
      localStorage.setItem('user', JSON.stringify(data.user))
      setCurrentUser(data.user)

      navigate('/dashboard')
      
    } catch (err) {
      setError('Network error')
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

        
          <h2 className="text-1xl font-bold text-yellow-500 text-center mb-2">
            Disbursement Tracking System
          </h2>
          
        

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-4">
          
          {/* Username */}
          <div>
            <label className="block text-black mb-1">
              E-mail Address or Username
            </label>
            <input
              className="w-full border border-gray-300 text-black p-2"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="E-mail Address or Username"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-black mb-1">
              Password
            </label>
            <input
              type="password"
              className="w-full border border-gray-300 text-black p-2 focus:outline-none focus:ring-0"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />
          </div>

          {/* Button */}
          <button
            type="submit"
            className="w-full bg-blue-100 text-white font-semibold p-2 border border-blue-500"
          >
            Sign in
          </button>
        </form>
        {error && <p style={{ color: 'red', marginTop: '0.5rem' }}>{error}</p>}
      </div>
    </div>
  )
}