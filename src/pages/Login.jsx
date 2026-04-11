/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable no-unused-vars */
import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { setToken, setCurrentUser, apiRequest } from '../api'
import logo from '/MuniLuna.png'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [touched, setTouched] = useState({ email: false, password: false })
  const [capsLockOn, setCapsLockOn] = useState(false)
  const [rememberEmail, setRememberEmail] = useState(false)
  const emailRef = useRef(null)
  const navigate = useNavigate()

  // Validation
  const isEmailValid = email.includes('@') && email.includes('.')
  const isPasswordValid = password.length >= 6
  const passwordStrength = password.length >= 12 ? 'strong' : password.length >= 8 ? 'medium' : 'weak'
  const isFormValid = email.trim() && password && isEmailValid && isPasswordValid
  const showEmailError = touched.email && email.trim() && !isEmailValid
  const showPasswordError = touched.password && password && !isPasswordValid

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError('Please enter email and password')
      return
    }

    if (!isFormValid) {
      setError('Please check your email and password')
      return
    }

    setLoading(true)

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
        setLoading(false)
        return
      }

      // 🔥 SAVE TOKEN (CENTRALIZED)
      setToken(data.access_token)

      // 🔥 GET USER INFO FROM BACKEND
      const me = await apiRequest('/auth/me/')

      // 🔥 SAVE USER
      setCurrentUser(me)

      // Save email if remember me is checked
      if (rememberEmail) {
        localStorage.setItem('rememberedEmail', email)
      } else {
        localStorage.removeItem('rememberedEmail')
      }

      navigate('/dashboard')

    } catch (err) {
      console.error(err)
      setError('Cannot connect to server. Please try again.')
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

  // Load remembered email on mount
  useEffect(() => {
    const remembered = localStorage.getItem('rememberedEmail')
    if (remembered) {
      setEmail(remembered)
      setRememberEmail(true)
    }
    // Auto-focus email field
    if (emailRef.current) {
      emailRef.current.focus()
    }
  }, [])

  useEffect(() => {
    setPassword('')
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ background: 'linear-gradient(135deg, #0052CC 0%, #003A96 100%)' }}>
      <div className="bg-white p-8 w-full max-w-md border-4 border-yellow-400 rounded-lg shadow-2xl" style={{ boxShadow: '0 8px 32px rgba(0, 82, 204, 0.3)' }}>

        {/* Header */}
        <div className="flex justify-center mb-6">
          <div style={{ 
            width: '100px', 
            height: '100px', 
            background: 'linear-gradient(135deg, #0052CC, #FFD700)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeInScale 0.6s ease-out'
          }}>
            <img src={logo} alt="DTMIS Logo" className="w-20 h-20" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center mb-1" style={{ color: '#0052CC' }}>
          DTMIS
        </h1>
        <p className="text-center mb-6 font-semibold text-sm" style={{ color: '#666' }}>
          Disbursement Tracking Management Information System
        </p>

        {/* Welcome Message */}
        <div className="mb-6 p-3 rounded-lg flex items-start gap-3" style={{ backgroundColor: '#F0F7FF', borderLeft: '4px solid #0052CC' }}>
          <span style={{ fontSize: '1.3rem' }}>👋</span>
          <div>
            <p style={{ color: '#0052CC', fontSize: '0.9rem', fontWeight: '500' }}>
              Welcome back!
            </p>
            <p style={{ color: '#666', fontSize: '0.85rem' }}>
              Sign in with your Luna LGU credentials to continue
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-lg border-l-4 flex items-start gap-3 animate-pulse" style={{ 
            backgroundColor: '#FEE2E2',
            borderColor: '#DC2626'
          }}>
            <span style={{ color: '#DC2626', fontSize: '1.2rem', flexShrink: 0 }}>⚠️</span>
            <div>
              <p className="font-semibold" style={{ color: '#991B1B' }}>Oops! Sign in failed</p>
              <p style={{ color: '#7F1D1D', fontSize: '0.9rem' }}>{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-5">

          {/* Email Field */}
          <div>
            <label className="block font-semibold mb-2 flex items-center gap-2 text-sm" style={{ color: '#0052CC' }}>
              <span>📧</span> Email Address
              {isEmailValid && email && <span style={{ color: '#16A34A', fontSize: '0.75rem', fontWeight: 'bold' }}>✓ Valid</span>}
            </label>
            <input
              ref={emailRef}
              type="email"
              autoComplete="email"
              className="w-full p-3 border-2 rounded-lg transition-all focus:outline-none text-sm font-medium"
              style={{ 
                borderColor: showEmailError ? '#DC2626' : touched.email && isEmailValid ? '#16A34A' : '#0052CC',
                backgroundColor: '#F9FAFB'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#FFD700'
                e.target.style.boxShadow = '0 0 0 3px rgba(255, 215, 0, 0.1)'
                e.target.style.backgroundColor = '#FFFFFF'
              }}
              onBlur={(e) => {
                handleFieldTouched('email')
                e.target.style.borderColor = showEmailError ? '#DC2626' : '#0052CC'
                e.target.style.boxShadow = 'none'
                e.target.style.backgroundColor = '#F9FAFB'
              }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@luna.gov.ph"
              aria-label="Email address"
              aria-required="true"
              aria-invalid={showEmailError}
            />
            {showEmailError && (
              <p style={{ color: '#DC2626', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                ✗ Invalid email format (use: name@domain.com)
              </p>
            )}
            {touched.email && isEmailValid && (
              <p style={{ color: '#16A34A', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                ✓ Email is valid
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label className="block font-semibold mb-2 flex items-center justify-between text-sm" style={{ color: '#0052CC' }}>
              <span className="flex items-center gap-2">
                <span>🔐</span> Password
                {isPasswordValid && password && (
                  <span style={{ 
                    color: passwordStrength === 'strong' ? '#16A34A' : passwordStrength === 'medium' ? '#F59E0B' : '#DC2626', 
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: passwordStrength === 'strong' ? '#DCFCE7' : passwordStrength === 'medium' ? '#FEF3C7' : '#FEE2E2'
                  }}>
                    {passwordStrength === 'strong' ? '💪 Strong' : passwordStrength === 'medium' ? '👍 Medium' : '⚠️ Weak'}
                  </span>
                )}
              </span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className="w-full p-3 border-2 rounded-lg transition-all focus:outline-none text-sm font-medium pr-10"
                style={{ 
                  borderColor: showPasswordError ? '#DC2626' : touched.password && isPasswordValid ? '#16A34A' : '#0052CC',
                  backgroundColor: '#F9FAFB'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#FFD700'
                  e.target.style.boxShadow = '0 0 0 3px rgba(255, 215, 0, 0.1)'
                  e.target.style.backgroundColor = '#FFFFFF'
                }}
                onBlur={(e) => {
                  handleFieldTouched('password')
                  e.target.style.borderColor = showPasswordError ? '#DC2626' : '#0052CC'
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
                aria-invalid={showPasswordError}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xl cursor-pointer transition-colors hover:scale-110"
                onClick={() => setShowPassword(!showPassword)}
                style={{ color: '#0052CC', background: 'none', border: 'none', padding: '4px' }}
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>

            {/* Caps Lock Warning */}
            {capsLockOn && (
              <p style={{ color: '#F59E0B', fontSize: '0.85rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                ⚠️ Caps Lock is ON
              </p>
            )}

            {/* Password Validation Messages */}
            {showPasswordError && (
              <p style={{ color: '#DC2626', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                ✗ Password must be at least 6 characters
              </p>
            )}
            {touched.password && isPasswordValid && (
              <div style={{ marginTop: '0.5rem' }}>
                <p style={{ color: '#16A34A', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  ✓ Password strength: <strong>{passwordStrength}</strong>
                </p>
              </div>
            )}

            {/* Password Strength Bar */}
            {password && (
              <div style={{ marginTop: '0.75rem', display: 'flex', gap: '4px' }}>
                <div style={{ 
                  flex: 1, 
                  height: '4px', 
                  backgroundColor: password.length >= 6 ? '#16A34A' : '#E5E7EB', 
                  borderRadius: '2px',
                  transition: 'backgroundColor 0.3s'
                }}></div>
                <div style={{ 
                  flex: 1, 
                  height: '4px', 
                  backgroundColor: password.length >= 8 ? '#F59E0B' : '#E5E7EB', 
                  borderRadius: '2px',
                  transition: 'backgroundColor 0.3s'
                }}></div>
                <div style={{ 
                  flex: 1, 
                  height: '4px', 
                  backgroundColor: password.length >= 12 ? '#16A34A' : '#E5E7EB', 
                  borderRadius: '2px',
                  transition: 'backgroundColor 0.3s'
                }}></div>
              </div>
            )}
          </div>

          {/* Remember Email Checkbox */}
          <div className="flex items-center gap-3 py-2">
            <input
              type="checkbox"
              id="rememberEmail"
              checked={rememberEmail}
              onChange={(e) => setRememberEmail(e.target.checked)}
              style={{ 
                width: '18px',
                height: '18px',
                cursor: 'pointer',
                accentColor: '#0052CC'
              }}
              aria-label="Remember email address"
            />
            <label htmlFor="rememberEmail" style={{ color: '#666', fontSize: '0.9rem', cursor: 'pointer', userSelect: 'none' }}>
              Remember my email ✨
            </label>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={!isFormValid || loading}
            className="w-full font-bold p-3 rounded-lg transition-all transform text-sm flex items-center justify-center gap-2 duration-200"
            style={{ 
              backgroundColor: isFormValid && !loading ? '#FFD700' : '#FFE55C',
              color: '#0052CC',
              border: '2px solid #DAA500',
              cursor: isFormValid && !loading ? 'pointer' : 'not-allowed',
              opacity: loading ? 0.9 : 1,
              textShadow: isFormValid && !loading ? 'none' : '0 1px 0 rgba(0,0,0,0.05)'
            }}
            onMouseEnter={(e) => {
              if (isFormValid && !loading) {
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
                <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>
                Logging in...
              </>
            ) : (
              <>
                <span>🚪</span> Login
              </>
            )}
          </button>

          {/* Keyboard Hint */}
          <p style={{ color: '#999', fontSize: '0.75rem', textAlign: 'center', marginTop: '0.5rem' }}>
            💡 Press <kbd style={{ padding: '2px 6px', backgroundColor: '#F3F4F6', borderRadius: '3px', fontSize: '0.7rem' }}>Tab</kbd> to navigate • <kbd style={{ padding: '2px 6px', backgroundColor: '#F3F4F6', borderRadius: '3px', fontSize: '0.7rem' }}>Enter</kbd> to submit
          </p>
        </form>

        {/* Helper Text & Footer */}
        <div className="mt-6 pt-6 border-t-2 text-center" style={{ borderColor: '#FFD700' }}>
          <p style={{ color: '#666', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
            🔗 <span style={{ color: '#0052CC', fontWeight: '600' }}>Need help?</span>
          </p>
          <p style={{ color: '#999', fontSize: '0.75rem', lineHeight: '1.5' }}>
            📧 Contact your administrator if you've forgotten your password<br/>
            🏛️ Luna LGU Emergency Fuel Conservation Measures
          </p>
        </div>
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
  )
}