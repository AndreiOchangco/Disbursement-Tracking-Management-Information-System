const BASE_URL = 'http://localhost:8000/api'

export async function apiRequest(endpoint, method = 'GET', body = null) {
  const token = localStorage.getItem('token')

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Token ${token}` }), // ✅ FIX HERE
    },
    ...(body && { body: JSON.stringify(body) }),
  })

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    console.error("API ERROR:", data)
    throw new Error(data?.detail || JSON.stringify(data) || 'API error')
  }

  return data
}