const BASE_URL = 'http://127.0.0.1:8000/api'

export async function apiRequest(endpoint, method = 'GET', body = null) {
  const token = localStorage.getItem('token')

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...(body && { body: JSON.stringify(body) }),
  })

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    console.error("API ERROR:", data)
    throw new Error(data?.detail || data?.error || 'API error')
  }

  return data
}