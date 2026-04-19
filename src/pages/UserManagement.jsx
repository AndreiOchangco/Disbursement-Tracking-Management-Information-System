/* eslint-disable no-unused-vars */
import { useEffect, useMemo, useState } from 'react'
import { apiRequest, getCurrentUser } from '../api'

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    adminUsers: 0,
    staffUsers: 0,
  })

  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    department: 'accounting', // Default to accounting department
    status: 'active',
  })

  const departmentChoices = [
    { value: 'admin', label: 'System Administrator', icon: 'crown' },
    { value: 'accounting', label: 'Accountant', icon: 'bar-chart' },
    { value: 'budget', label: 'Budget Officer', icon: 'cash' },
    { value: 'treasurer', label: 'Treasurer', icon: 'business' },
    { value: 'bac_gso', label: 'Technical Officer', icon: 'clipboard' },
    { value: 'mayors_office', label: 'Secretary', icon: 'business' },
  ]

  // Load users
  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const data = await apiRequest('/users/')
      if (data) {
        setUsers(data)
        calculateStats(data)
      // Update stats labels based on admin department
      const adminCount = data.filter(u => u.department === 'admin').length
      setStats(prev => ({...prev, adminUsers: adminCount}))
      }
    } catch (err) {
      console.error('Failed to load users:', err.message, err)
      const errorMsg = err.message?.includes('403') ? 'You do not have permission to view users. Only System Administrators can access this.' : 'Error loading users. Please try again.'
      alert(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (userList) => {
    const activeList = userList.filter(u => u.status !== 'archived')
    setStats({
      totalUsers: activeList.length,
      activeUsers: activeList.filter(u => u.status === 'active').length,
      adminUsers: activeList.filter(u => u.department === 'admin').length,
      staffUsers: activeList.filter(u => u.department !== 'admin').length,
    })
  }

  // Search filter
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    let results = showArchived ? users.filter(u => u.status === 'archived') : users.filter(u => u.status !== 'archived')
    
    if (!query) return results

    return results.filter((u) =>
      (u.full_name + u.email + u.department)
        .toLowerCase()
        .includes(query)
    )
  }, [search, users, showArchived])

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.full_name || !formData.email) {
      alert('Please fill in all required fields')
      return
    }

    if (!editingUser && !formData.password) {
      alert('Password is required for new users')
      return
    }

    try {
      setLoading(true)
      let result
      const submitData = { ...formData }
      
      if (editingUser) {
        // Update user - only include password if it was changed
        if (!submitData.password) {
          delete submitData.password
        }
        result = await apiRequest(`/users/${editingUser.id}/`, 'PUT', submitData)
        setUsers(users.map(u => u.id === editingUser.id ? result : u))
        alert('User updated successfully')
      } else {
        // Create user
        result = await apiRequest('/users/', 'POST', submitData)
        setUsers([result, ...users])
        alert('User created successfully')
      }

      calculateStats([...users.filter(u => u.id !== editingUser?.id), result])
      resetForm()
    } catch (err) {
      console.error('Failed to save user:', err)
      alert('Error saving user')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      password: '',
      department: 'accounting',
      status: 'active',
    })
    setEditingUser(null)
    setShowForm(false)
  }

  const handleEdit = (user) => {
    setEditingUser(user)
    setFormData({
      full_name: user.full_name,
      email: user.email,
      password: '',
      department: user.department || 'accounting',
      status: user.status || 'active',
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Archive this user? They can be restored later.')) return

    try {
      setLoading(true)
      await apiRequest(`/users/${id}/`, 'DELETE')
      setUsers(users.map(u => u.id === id ? { ...u, status: 'archived' } : u))
      alert('User archived successfully')
    } catch (err) {
      console.error('Failed to archive user:', err.message, err)
      alert(err.message || 'Error archiving user')
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async (id) => {
    try {
      setLoading(true)
      const updated = await apiRequest(`/users/${id}/`, 'PUT', {
        status: 'inactive'
      })
      setUsers(users.map(u => u.id === id ? updated : u))
      alert('User restored successfully')
    } catch (err) {
      console.error('Failed to restore user:', err.message, err)
      alert(err.message || 'Error restoring user')
    } finally {
      setLoading(false)
    }
  }

  const toggleUserStatus = async (user) => {
    try {
      const newStatus = user.status === 'active' ? 'inactive' : 'active'
      const updated = await apiRequest(`/users/${user.id}/`, 'PUT', {
        ...user,
        status: newStatus,
      })
      setUsers(users.map(u => u.id === user.id ? updated : u))
    } catch (err) {
      console.error('Failed to update user status:', err)
      alert('Error updating user status')
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2><ion-icon name="people"></ion-icon> User Management</h2>
          <p>Create, edit, archive and manage system users</p>
        </div>
      </div>

      {/* ➕ ADD USER FORM */}
      {showForm && (
        <section className="panel" style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', borderLeft: '4px solid #fbbf24' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ color: '#2c5dff', marginBottom: '0.5rem' }}>
              {editingUser ? <><ion-icon name="pencil"></ion-icon> Edit User</> : <><ion-icon name="add"></ion-icon> Add New User</>}
            </h3>
            <p style={{ color: '#4b5563', fontSize: '0.9rem', margin: 0 }}>
              {editingUser ? 'Update user information' : 'Create a new user account'}
            </p>
          </div>
          <form className="form-grid" onSubmit={handleSubmit}>
            <label>
              <span style={{ color: '#2c5dff', fontWeight: '600' }}>Full Name *</span>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Enter full name"
              />
            </label>
            <label>
              <span style={{ color: '#2c5dff', fontWeight: '600' }}>Email *</span>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email"
              />
            </label>
            {!editingUser && (
              <label>
                <span style={{ color: '#2c5dff', fontWeight: '600' }}>Password * (New users only)</span>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter password"
                />
              </label>
            )}
            {editingUser && (
              <label>
                <span style={{ color: '#2c5dff', fontWeight: '600' }}>Password (Leave blank to keep current)</span>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter new password (optional)"
                />
              </label>
            )}
            <label>
              <span style={{ color: '#2c5dff', fontWeight: '600' }}>Department/Role *</span>
              <select value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })}>
                {departmentChoices.map(dept => (
                  <option key={dept.value} value={dept.value}>
                    {dept.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span style={{ color: '#2c5dff', fontWeight: '600' }}>Status</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: '500' }}>
                  <input
                    type="radio"
                    name="status"
                    checked={formData.status === 'active'}
                    onChange={() => setFormData({ ...formData, status: 'active' })}
                    style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                  />
                  <span style={{ color: '#059669' }}><ion-icon name="checkmark-circle"></ion-icon> Active</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: '500' }}>
                  <input
                    type="radio"
                    name="status"
                    checked={formData.status === 'inactive'}
                    onChange={() => setFormData({ ...formData, status: 'inactive' })}
                    style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                  />
                  <span style={{ color: '#dc2626' }}><ion-icon name="close-circle"></ion-icon> Inactive</span>
                </label>
              </div>
            </label>
            <div style={{ gridColumn: 'span 2', display: 'flex', gap: '0.75rem' }}>
              <button type="submit" className="btn-primary" disabled={loading}>
                {editingUser ? <><ion-icon name="save"></ion-icon> Update User</> : <><ion-icon name="add"></ion-icon> Add User</>}
              </button>
              <button type="button" className="btn-danger" onClick={resetForm} style={{ marginTop: 0 }}>
                <ion-icon name="close-circle"></ion-icon> Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      {/* 📋 USERS TABLE */}
      <section className="panel">
        <div className="table-toolbar">
          <div>
            <h3 style={{ color: '#2c5dff' }}><ion-icon name="clipboard"></ion-icon> User Accounts</h3>
            <p style={{ color: '#4b5563', marginTop: '0.3rem' }}>{filtered.length} users found</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {!showForm && (
              <button 
                className="btn-primary" 
                onClick={() => setShowForm(true)}
                style={{ fontSize: '0.9rem', padding: '0.65rem 1rem' }}
              >
                <ion-icon name="add"></ion-icon> Add New User
              </button>
            )}
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Search users by name, email, username..."
              className="search"
            />
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead style={{ background: 'linear-gradient(90deg, #f0f7ff 0%, #fef3c7 50%, #f0f7ff 100%)', borderBottom: '2px solid #fbbf24' }}>
              <tr>
                <th className='table-column-center table-column-border' style={{ color: '#2c5dff' }}> Full Name</th>
                <th className='table-column-center table-column-border' style={{ color: '#2c5dff' }}><ion-icon name="mail"></ion-icon> Email</th>
                <th className='table-column-center table-column-border' style={{ color: '#2c5dff' }}><ion-icon name="business"></ion-icon> Department/Role</th>
                <th className='table-column-center table-column-border' style={{ color: '#2c5dff' }}><ion-icon name="bar-chart"></ion-icon> Status</th>
                <th className='table-column-center table-column-border' style={{ color: '#2c5dff' }}><ion-icon name="settings"></ion-icon> Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((user) => (
                <tr 
                  key={user.id} 
                  style={{ 
                    borderBottom: '1px solid #fef3c7', 
                    transition: 'all 0.3s ease',
                    opacity: user.status === 'active' ? 1 : 0.7,
                    background: user.status === 'active' ? 'white' : 'rgba(220, 38, 38, 0.03)',
                    filter: user.status === 'active' ? 'none' : 'grayscale(20%)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = user.status === 'active' 
                      ? 'linear-gradient(90deg, #fffbeb 0%, #fef3c7 100%)' 
                      : 'linear-gradient(90deg, rgba(220, 38, 38, 0.08), rgba(220, 38, 38, 0.05))'
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(251, 191, 36, 0.15)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = user.status === 'active' ? 'white' : 'rgba(220, 38, 38, 0.03)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <td style={{ fontWeight: '500' }}>{user.full_name}</td>
                  <td>{user.email}</td>
                  <td className='table-column-center'>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.4rem 0.8rem',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      textTransform: 'capitalize',
                      background: user.department === 'admin' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(44, 93, 255, 0.1)',
                      color: user.department === 'admin' ? '#d97706' : '#2c5dff'
                    }}>
                      {user.department === 'admin' && <ion-icon name="crown"></ion-icon>}
                      {departmentChoices.find(d => d.value === user.department)?.label || user.department}
                    </span>
                  </td>
                  <td className='table-column-center'>
                    <span 
                      className={`status-badge ${user.status === 'active' ? 'status-approved' : user.status === 'archived' ? 'status-archived' : 'status-rejected'}`}
                      style={{
                        display: 'inline-flex',
                        marginBottom: '-3px',
                        alignItems: 'center',
                        background: user.status === 'active' ? 'transparent' : user.status === 'archived' ? 'transparent' : 'transparent',
                        boxShadow: 'none',
                        cursor: 'default'
                      }}
                    >
                      <span style={{ fontSize: '1.3rem' }}>{user.status === 'active' ? <ion-icon name="ellipse" style={{color: 'green', fontSize: '1.1rem', border: '2px solid darkgreen', borderRadius: '100%', margin: '0', padding: '0', background: 'green'}}></ion-icon> : user.status === 'archived' ? <ion-icon name="archive"></ion-icon> : <ion-icon name="ellipse" style={{color: 'red', fontSize: '1.1rem', border: '2px solid darkred', borderRadius: '100%', margin: '0', padding: '0', background: 'red'}}></ion-icon>}</span>
                      {user.status === 'active' ? '' : user.status === 'archived' ? 'Archived' : ''}
                    </span>
                  </td>
                  <td className='table-column-center'>
                    {!showArchived && (
                      <>
                        <button
                          style={{
                            fontSize: '0.8rem',
                            padding: '0.5rem 0.85rem',
                            marginRight: '0.4rem',
                            background: user.status === 'active' ? '#fee2e2' : '#d1fae5',
                            color: user.status === 'active' ? '#991b1b' : '#065f46',
                            border: `2px solid ${user.status === 'active' ? '#dc2626' : '#10b981'}`,
                            fontWeight: '600',
                            cursor: 'pointer',
                            borderRadius: '6px',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)'
                            e.currentTarget.style.boxShadow = user.status === 'active' 
                              ? '0 4px 12px rgba(220, 38, 38, 0.3)' 
                              : '0 4px 12px rgba(16, 185, 129, 0.3)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.boxShadow = 'none'
                          }}
                          onClick={() => toggleUserStatus(user)}
                        >
                          {user.status === 'active' ? <><ion-icon name="lock-closed"></ion-icon> Deactive</> : <><ion-icon name="lock-open"></ion-icon> Active</>}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#4b5563' }}>
              <p style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}><ion-icon name="person"></ion-icon></p>
              <p style={{ margin: 0, fontStyle: 'italic' }}>No users found.</p>
            </div>
          )}
        </div>

        {/* 📄 Pagination Controls */}
        {filtered.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
            <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>
              Page {currentPage} of {Math.ceil(filtered.length / itemsPerPage) || 1}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db',
                  background: currentPage === 1 ? '#f3f4f6' : '#fff',
                  color: currentPage === 1 ? '#9ca3af' : '#2c5dff',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                }}
              >
                <ion-icon name="chevron-back"></ion-icon> Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(filtered.length / itemsPerPage), p + 1))}
                disabled={currentPage >= Math.ceil(filtered.length / itemsPerPage)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db',
                  background: currentPage >= Math.ceil(filtered.length / itemsPerPage) ? '#f3f4f6' : '#fff',
                  color: currentPage >= Math.ceil(filtered.length / itemsPerPage) ? '#9ca3af' : '#2c5dff',
                  cursor: currentPage >= Math.ceil(filtered.length / itemsPerPage) ? 'not-allowed' : 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                }}
              >
                Next <ion-icon name="chevron-forward"></ion-icon>
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
