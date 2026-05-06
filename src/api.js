/* eslint-disable no-unused-vars */
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

    // 🔴 ERROR HANDLING: If response is bad, parse the JSON error message
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      const message = data?.error || data?.detail || `HTTP Error ${res.status}`
      throw new Error(message)
    }

    // 🟢 SUCCESS HANDLING: Check Content-Type to see if it's a PDF
    const contentType = res.headers.get('content-type')
    if (contentType && contentType.includes('application/pdf')) {
      return await res.blob() // Return binary data for the PDF
    }

    // Default: Parse JSON safely for standard API requests
    return await res.json().catch(() => null)

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