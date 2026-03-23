/* eslint-disable react-hooks/immutability */
/* eslint-disable no-unused-vars */
import { useEffect, useState } from 'react'
import { apiRequest } from '../api'

const roles = [
  'accountant',
  'budget_officer',
  'treasurer',
  'technical_officer',
  'secretary',
]

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('')
  const [error, setError] = useState('')

  // 🔥 Load users
  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const data = await apiRequest('/users/')
      setUsers(data)
    } catch (err) {
      console.error('Failed to load users', err)
    }
  }

  // ➕ Create user (ADMIN ONLY)
  const createUser = async (e) => {
    e.preventDefault()
    setError('')

    if (!username.trim() || !password) {
      setError('Username and password required')
      return
    }

    try {
      await apiRequest('/users/', 'POST', {
        username: username.trim(),
        password,
        role,
      })

      setUsername('')
      setPassword('')
      setRole('')

      loadUsers()
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to create user')
    }
  }

  // ❌ Delete user
  const deleteUser = async (id) => {
    if (!confirm('Delete this user?')) return

    try {
      await apiRequest(`/users/${id}/`, 'DELETE')
      setUsers((prev) => prev.filter((u) => u.id !== id))
    } catch (err) {
      console.error('Delete failed', err)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2>User Management</h2>
        <p>Admin can create and manage system users.</p>
      </div>

      {/* CREATE USER */}
      <section className="panel">
        <h3>Create User</h3>

        <form className="form-grid" onSubmit={createUser}>
          <label>
            Username
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          <label>
            Role
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              {roles.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>

          <button className="btn-primary">Create</button>
        </form>

        {error && <p style={{ color: 'red' }}>{error}</p>}
      </section>

      {/* USER LIST */}
      <section className="panel">
        <h3>Users</h3>

        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Role</th>
              <th>Admin</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.username}</td>
                <td>{u.role}</td>
                <td>{u.is_admin ? 'Yes' : 'No'}</td>
                <td>
                  <button
                    className="btn-danger"
                    onClick={() => deleteUser(u.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && <p>No users found.</p>}
      </section>
    </div>
  )
}