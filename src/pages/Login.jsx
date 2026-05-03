/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable no-unused-vars */
import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { setCurrentUser, apiRequest, getCurrentUser } from '../api'
import logo from '/MuniLuna.png'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [touched, setTouched] = useState({ email: false, password: false })
  const [capsLockOn, setCapsLockOn] = useState(false)
  const emailRef = useRef(null)
  const navigate = useNavigate()

  const onSubmit = async (e) => {
  e.preventDefault()
  setLoading(true)
  try {
    const res = await fetch('http://localhost:8000/api/auth/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include', // ✅ Receives cookies from backend
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.error)

    // Only save profile info for the UI (name, avatar, etc.)
    setCurrentUser(data.user) 
    navigate('/dashboard')
  } catch (err) {
    setError(err.message)
  } finally {
    setLoading(false)
  }
}

  const handleFieldTouched = (field) => {
    setTouched({ ...touched, [field]: true })
  }

  const handlePasswordKeyDown = (e) => {
    const capsLockEnabled = e.getModifierState('CapsLock')
    setCapsLockOn(capsLockEnabled)
  }

  const handlePasswordChange = (e) => {
    setPassword(e.target.value)
  }

  // Check if user is already logged in on mount
  useEffect(() => {
    const currentUser = getCurrentUser()
    
    if (currentUser) {
      navigate('/dashboard')
    } else {
      setIsChecking(false)
    }
  }, [navigate])

  useEffect(() => {
    setPassword('')
  }, [])

  return (
    <>
      {isChecking ? null : (
      <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ background: 'linear-gradient(135deg, #0052CC 0%, #003A96 100%)' }}>
      <div className="bg-white p-8 w-full max-w-md border-4 border-yellow-400 rounded-lg shadow-2xl" style={{ boxShadow: '0 8px 32px rgba(0, 82, 204, 0.3)' }}>

        {/* Header */}
        <div className="flex justify-center mb-6">
          <img src={logo} alt="DTMIS Logo" className="w-30 h-30" />
        </div>

        <h1 className="text-3xl font-bold text-center mb-1" style={{ color: '#0052CC' }}>
          DTMIS
        </h1>
        <p className="text-center mb-6 font-semibold text-sm" style={{ color: '#666' }}>
          Disbursement Tracking Management Information System
        </p>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-lg border-l-4 flex items-start gap-3 animate-pulse" style={{ 
            backgroundColor: '#FEE2E2',
            borderColor: '#DC2626'
          }}>
            <span style={{ color: '#DC2626', fontSize: '1.2rem', flexShrink: 0 }}><ion-icon name="warning"></ion-icon></span>
            <div>
              <p className="font-semibold" style={{ color: '#991B1B' }}>Oops! Sign in failed</p>
              <p style={{ color: '#7F1D1D', fontSize: '0.9rem' }}>{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-5" autoComplete="off">

          {/* Email Field */}
          <div>
            <label className="block font-semibold mb-2 flex items-center gap-2 text-sm" style={{ color: '#0052CC' }}>
              <span>📧</span> Email Address
            </label>
            <input
              ref={emailRef}
              type="email"
              autoComplete="email"
              className="w-full p-3 border-2 rounded-lg transition-all focus:outline-none text-sm font-medium"
              style={{ 
                backgroundColor: '#F9FAFB'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#FFD700'
                e.target.style.boxShadow = '0 0 0 3px rgba(255, 215, 0, 0.1)'
                e.target.style.backgroundColor = '#FFFFFF'
              }}
              onBlur={(e) => {
                handleFieldTouched('email')
                e.target.style.boxShadow = 'none'
                e.target.style.backgroundColor = '#F9FAFB'
              }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@luna.gov.ph"
              aria-label="Email address"
              aria-required="true"
            />
          </div>

          {/* Password Field */}
          <div>
            <label className="block font-semibold mb-2 flex items-center justify-between text-sm" style={{ color: '#0052CC' }}>
              <span className="flex items-center gap-2">
                <span>🔐</span> Password
              </span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                name="no-password"
                className="w-full p-3 border-2 rounded-lg transition-all focus:outline-none text-sm font-medium pr-10"
                style={{ 
                  backgroundColor: '#F9FAFB'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#FFD700'
                  e.target.style.boxShadow = '0 0 0 3px rgba(255, 215, 0, 0.1)'
                  e.target.style.backgroundColor = '#FFFFFF'
                }}
                onBlur={(e) => {
                  handleFieldTouched('password')
                  e.target.style.boxShadow = 'none'
                  e.target.style.backgroundColor = '#F9FAFB'
                  setCapsLockOn(false)
                }}
                value={password}
                onChange={handlePasswordChange}
                onKeyDown={handlePasswordKeyDown}
                onKeyUp={(e) => setCapsLockOn(e.getModifierState('CapsLock'))}
                placeholder="Min. 6 characters"
                aria-label="Password"
                aria-required="true"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xl cursor-pointer transition-colors hover:scale-110"
                onClick={() => setShowPassword(!showPassword)}
                style={{ color: '#0052CC', background: 'none', border: 'none', padding: '4px' }}
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <ion-icon name="eye-off"></ion-icon> : <ion-icon name="eye"></ion-icon>}
              </button>
            </div>

            {/* Caps Lock Warning */}
            {capsLockOn && (
              <p style={{ color: '#F59E0B', fontSize: '0.85rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <ion-icon name="warning"></ion-icon> Caps Lock is ON
              </p>
            )}
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full font-bold p-3 rounded-lg transition-all transform text-sm flex items-center justify-center gap-2 duration-200"
            style={{ 
              backgroundColor: '#FFE55C',
              color: '#0052CC',
              border: '2px solid #DAA500',
              opacity: loading ? 0.9 : 1,
              textShadow: '0 1px 0 rgba(0,0,0,0.05)'
            }}
            onMouseEnter={(e) => {
              if (loading) {
                e.target.style.backgroundColor = '#DAA500'
                e.target.style.color = '#FFFFFF'
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 10px 20px rgba(0, 82, 204, 0.3)'
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#FFD700'
              e.target.style.color = '#0052CC'
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = 'none'
            }}
            aria-busy={loading}
          >
            {loading ? (
              <>
                <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}><ion-icon name="time" style={{ marginTop: '3px', fontSize: '1.25rem' }}></ion-icon></span>
                Logging in...
              </>
            ) : (
              <>
                Login
              </>
            )}
          </button>
        </form>

      </div>

      {/* Global Keyboard Shortcut Hint */}
      {!loading && (
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes fadeInScale {
            from {
              opacity: 0;
              transform: scale(0.9);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}</style>
      )}
      </div>
      )}
    </>
  )
}