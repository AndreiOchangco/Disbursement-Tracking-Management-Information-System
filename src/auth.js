export const AUTH_USER_KEY = 'dtmis.currentUser'

export function setCurrentUser(user) {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
  window.dispatchEvent(new Event('dtmis-auth-change'))
}

export function getCurrentUser() {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function clearCurrentUser() {
  localStorage.removeItem(AUTH_USER_KEY)
  window.dispatchEvent(new Event('dtmis-auth-change'))
}
