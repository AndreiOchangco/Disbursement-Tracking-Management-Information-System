// Ensure API origin matches the Django admin host (use 127.0.0.1 if your admin runs there)
export const BASE_URL = 'http://localhost:8000/api'
export const API_ORIGIN = new URL(BASE_URL).origin

// ===== STORAGE KEYS =====
const USER_KEY = 'user'

// ===== USER =====
export function setCurrentUser(user) {
  if (!user) return
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    window.dispatchEvent(new Event('auth-change'))
  } catch (err) {
    console.error('Failed to store user profile:', err)
  }
}

export function getCurrentUser() {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw || raw === 'undefined') return null
  try {
    return JSON.parse(raw)
  } catch (err) {
    return null
  }
}

export function clearCurrentUser() {
  localStorage.removeItem(USER_KEY)
  window.dispatchEvent(new Event('auth-change'))
}

// ===== LOGOUT =====
export async function logout() {
  try {
    // Ping backend to delete HttpOnly cookies
    await fetch(`${BASE_URL}/auth/logout/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })
  } catch (err) {
    console.warn('Logout request failed, cleaning local state anyway.', err)
  } finally {
    clearCurrentUser()
    window.location.href = '/login'
  }
}

// ===== API REQUEST =====
export async function apiRequest(endpoint, method = 'GET', body = null, _retry = false) {
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // ✅ Required to send/receive HttpOnly cookies
    ...(body && { body: JSON.stringify(body) }),
  }

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, config)

    // 🔥 SILENT REFRESH LOGIC
    // If unauthorized and we haven't tried refreshing yet...
    if (res.status === 401 && !_retry) {
      const refreshRes = await fetch(`${BASE_URL}/auth/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })

      if (refreshRes.ok) {
        // Refresh succeeded! Retry the original request exactly as it was.
        return await apiRequest(endpoint, method, body, true)
      } else {
        // Refresh failed (refresh token expired) -> Force Logout
        logout()
        return
      }
    }

    // Parse JSON safely
    const data = await res.json().catch(() => null)

    if (!res.ok) {
      const message = data?.error || data?.detail || `HTTP Error ${res.status}`
      throw new Error(message)
    }

    return data

  } catch (err) {
    console.error('NETWORK/API ERROR:', err)
    throw err
  }
}

// ===== INIT USER (OPTIONAL BUT POWERFUL) =====
export async function initUser() {
  try {
    const user = await apiRequest('/auth/me/')
    if (user) {
      setCurrentUser(user)
      return user
    }
  } catch (err) {
    clearCurrentUser()
    return null
  }
}

// ===== SSO: Create Django session from frontend JWT =====
/*export async function ssoLogin() {
  const token = getToken()
  const res = await fetch(`${BASE_URL}/auth/sso-login/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    credentials: 'include', // accept/set cookies from backend
  })

  // Try to parse JSON, fallback to text for better diagnostics
  let body = null
  try {
    body = await res.json()
  } catch (e) {
    try {
      body = await res.text()
    } catch (e2) {
      body = null
    }
  }

  if (!res.ok) {
    console.error('SSO ERROR:', res.status, body)
    const message = (body && (body.error || body.detail || JSON.stringify(body))) || `HTTP ${res.status}`
    throw new Error(`SSO failed: ${message}`)
  }

  return body
}*/