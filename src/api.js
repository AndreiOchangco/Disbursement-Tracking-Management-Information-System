/* eslint-disable no-empty */
/* eslint-disable no-unused-vars */

export const BASE_URL = 'http://localhost:8000/api'
export const API_ORIGIN = new URL(BASE_URL).origin

// ===== API URLS =====
const API_FALLBACKS = [
  import.meta.env.VITE_LOCAL_API_URL,
  import.meta.env.VITE_NETWORK_API_URL,
  'http://localhost:8000/api',
  'http://10.0.0.39:5173/api',
  'http://192.168.1.3:8000/api',
].filter(Boolean)

// Always keep full base URL (NEVER use origin)
let ACTIVE_API = API_FALLBACKS[0]

// ===== STORAGE =====
const USER_KEY = 'user'

// ===== USER =====
export function setCurrentUser(user) {
  if (!user) return
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  window.dispatchEvent(new Event('auth-change'))
}

export function getCurrentUser() {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw || raw === 'undefined') return null

  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function clearCurrentUser() {
  localStorage.removeItem(USER_KEY)
  window.dispatchEvent(new Event('auth-change'))
}

// ===== FETCH WITH FAILOVER =====
async function fetchWithFailover(endpoint, config) {
  let lastError = null

  const apis = [
    ACTIVE_API,
    ...API_FALLBACKS.filter((a) => a !== ACTIVE_API),
  ]

  for (const api of apis) {
    try {
      const res = await fetch(`${api}${endpoint}`, config)

      ACTIVE_API = api

      return res
    } catch (err) {
      lastError = err
      console.warn(`API failed: ${api}`)
    }
  }

  throw lastError || new Error('All API servers unreachable')
}

// ===== LOGOUT =====
export async function logout() {
  try {
    await fetchWithFailover('/auth/logout/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })
  } catch {}

  clearCurrentUser()
  window.location.href = '/login'
}

// ===== API REQUEST =====
export async function apiRequest(endpoint, method = 'GET', body = null, _retry = false) {
  const config = {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...(body && { body: JSON.stringify(body) }),
  }

  try {
    const res = await fetchWithFailover(endpoint, config)

    // ===== REFRESH =====
    if (res.status === 401 && !_retry) {
      const refreshRes = await fetchWithFailover('/auth/refresh/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })

      if (refreshRes.ok) {
        return apiRequest(endpoint, method, body, true)
      }

      await logout()
      return null
    }

    if (!res.ok) {
      let msg = `HTTP Error ${res.status}`

      try {
        const data = await res.json()
        msg =
          data?.error ||
          data?.detail ||
          JSON.stringify(data) ||
          msg
      } catch {}

      throw new Error(msg)
    }

    const type = res.headers.get('content-type')

    if (type?.includes('application/pdf')) {
      return res.blob()
    }

    return res.json().catch(() => null)
  } catch (err) {
    console.error('API ERROR:', err)
    throw err
  }
}

// ===== INIT USER =====
export async function initUser() {
  try {
    const user = await apiRequest('/auth/me/')

    if (user) {
      setCurrentUser(user)
      return user
    }

    return null
  } catch {
    clearCurrentUser()
    return null
  }
}