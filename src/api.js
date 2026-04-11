const BASE_URL = 'http://localhost:8000/api'

// ===== STORAGE KEYS =====
const TOKEN_KEY = 'token'
const USER_KEY = 'user'

// ===== TOKEN =====
export function setToken(token) {
  if (!token) return
  localStorage.setItem(TOKEN_KEY, token)
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

// ===== USER =====
export function setCurrentUser(user) {
  if (!user) return

  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    window.dispatchEvent(new Event('auth-change'))
  } catch (err) {
    console.error('Failed to store user:', err)
  }
}

export function getCurrentUser() {
  const raw = localStorage.getItem(USER_KEY)

  if (!raw || raw === 'undefined') return null

  try {
    return JSON.parse(raw)
  } catch (err) {
    console.error('Invalid user in storage:', raw, err)
    return null
  }
}

export function clearCurrentUser() {
  localStorage.removeItem(USER_KEY)
  window.dispatchEvent(new Event('auth-change'))
}

// ===== LOGOUT =====
export function logout() {
  clearToken()
  clearCurrentUser()
  window.location.href = '/login'
}

// ===== API REQUEST =====
export async function apiRequest(endpoint, method = 'GET', body = null) {
  const token = getToken()

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }), // ✅ JWT FIX
      },
      ...(body && { body: JSON.stringify(body) }),
    })

    const data = await res.json().catch(() => null)

    // 🔥 AUTO LOGOUT ON UNAUTHORIZED
    if (res.status === 401) {
      console.warn('Unauthorized → logging out')
      logout()
      return
    }

    if (!res.ok) {
      console.error('API ERROR:', data)
      throw new Error(data?.detail || 'API error')
    }

    return data

  } catch (err) {
    console.error('NETWORK ERROR:', err)
    throw err
  }
}

// ===== INIT USER (OPTIONAL BUT POWERFUL) =====
export async function initUser() {
  try {
    const token = getToken()
    if (!token) return null

    const user = await apiRequest('/me/')
    setCurrentUser(user)
    return user
  } catch (err) {
    console.error('Failed to initialize user:', err)
    logout()
    return null
  }
}

// ===== SSO: Create Django session from frontend JWT =====
export async function ssoLogin() {
  const token = getToken()

  const res = await fetch(`${BASE_URL}/auth/sso-login/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    credentials: 'include', // accept/set cookies from backend
  })

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    console.error('SSO ERROR:', data)
    throw new Error(data?.error || 'SSO failed')
  }

  return data
}