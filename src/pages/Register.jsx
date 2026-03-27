/* eslint-disable no-unused-vars */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setCurrentUser } from '../auth'
import logo from '../components/MuniLuna.png'

const roles = [
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
        setError(data.detail || 'Registration failed')
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="bg-white p-8 w-full max-w-md border border-gray-300">

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src={logo} alt="Logo" className="w-32 h-32" />
        </div>

        
          <h2 className="text-1xl font-bold text-yellow-500 text-center mb-2">
            Register for DTMIS
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
              placeholder="Choose a username"
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
              placeholder="Choose a password"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-black mb-1">
              Role
            </label>
            <select
              className="w-full border border-gray-300 text-black p-2 focus:outline-none focus:ring-0"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Button */}
          <button
            type="submit"
            className="w-full bg-blue-500 text-white font-semibold p-2 border border-blue-500"
          >
            Register
          </button>
        </form>

        {/* Error message */}
        {error && (
          <p className="text-red-500 text-sm mt-3 text-center">
            {error}
          </p>
        )}
        {/* Login link */}
        <div className="mt-4 text-center text-sm">
          <a href="/login" className="text-blue-500">
            Already have an account? Sign in
          </a>
        </div>

      </div>
    </div>
  )
}
