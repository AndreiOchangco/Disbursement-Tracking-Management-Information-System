const BASE_URL = 'http://localhost:8000/api'

// ===== AUTH STORAGE =====
const TOKEN_KEY = 'token'
const USER_KEY = 'user'

// ===== TOKEN =====
export function setToken(token) {
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
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  window.dispatchEvent(new Event('auth-change'))
}

export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY))
  } catch {
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

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }), // 🔥 FIXED (JWT)
    },
    ...(body && { body: JSON.stringify(body) }),
  })

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    console.error('API ERROR:', data)
    throw new Error(data?.detail || 'API error')
  }

  return data
}