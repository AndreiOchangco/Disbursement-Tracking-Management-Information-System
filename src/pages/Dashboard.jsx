/* eslint-disable react-hooks/immutability */
/* eslint-disable no-unused-vars */
import { useEffect, useState } from 'react'
import { apiRequest, getCurrentUser } from '../api'
import '../chart.js'

import { Bar, Pie, Line } from 'react-chartjs-2'

export default function Dashboard() {
  const currentUser = getCurrentUser()
  const isAdmin = currentUser?.department === 'admin'
  
  const [data, setData] = useState([])
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    totalAmount: 0,
  })
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    adminUsers: 0,
    staffUsers: 0,
  })

  useEffect(() => {
    if (isAdmin) {
      loadUserData()
      loadData()
    } else {
      loadData()
    }
  }, [isAdmin])

  const loadData = async () => {
    try {
      const res = await apiRequest('/dv/')
      setData(res)

      const approved = res.filter(d => d.status === 'approved').length
      const pending = res.filter(d => d.status === 'pending').length
      const rejected = res.filter(d => d.status === 'rejected').length
      const totalAmount = res.reduce((sum, d) => sum + Number(d.amount || 0), 0)

      setStats({
        total: res.length,
        approved,
        pending,
        rejected,
        totalAmount,
      })
    } catch (err) {
      console.error(err)
    }
  }

  const loadUserData = async () => {
    try {
      const res = await apiRequest('/users/')
      if (res) {
        setUsers(res)
        const activeList = res.filter(u => u.status !== 'archived')
        setUserStats({
          totalUsers: activeList.length,
          activeUsers: activeList.filter(u => u.status === 'active').length,
          adminUsers: activeList.filter(u => u.department === 'admin').length,
          staffUsers: activeList.filter(u => u.department !== 'admin').length,
        })
      }
    } catch (err) {
      console.error('Failed to load users:', err)
    }
  }

  // 📊 STATUS DATA
  const statusData = {
    labels: ['Approved', 'Pending', 'Rejected'],
    datasets: [
      {
        label: 'Disbursements',
        data: [stats.approved, stats.pending, stats.rejected],
      },
    ],
  }

  // 📊 MONTHLY TREND
  const monthlyMap = {}

  data.forEach(d => {
    const month = new Date(d.created_at).toLocaleString('default', { month: 'short' })
    monthlyMap[month] = (monthlyMap[month] || 0) + 1
  })

  const monthlyData = {
    labels: Object.keys(monthlyMap),
    datasets: [
      {
        label: 'Monthly Entries',
        data: Object.values(monthlyMap),
      },
    ],
  }

  return (
    <div>
      {/* 👑 ADMIN DASHBOARD */}
      {isAdmin && (
        <>
          <div className="page-header">
            <div>
              <h2>👑 Admin Dashboard</h2>
              <p>Complete system overview with user management and all disbursement analytics</p>
            </div>
          </div>

          {/* 📊 USER STATS CARDS */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ color: '#2c5dff', marginBottom: '1rem', fontSize: '1.1rem' }}>👥 User Management</h3>
            <div className="stats-grid">
            <div className="stat-card" style={{ borderColor: '#2c5dff', background: '#f0f7ff' }}>
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <p className="stat-label">Total Users</p>
                <h3 className="stat-value" style={{ color: '#2c5dff' }}>{userStats.totalUsers}</h3>
              </div>
            </div>

            <div className="stat-card" style={{ borderColor: '#059669', background: '#f0fdf4' }}>
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <p className="stat-label">Active Users</p>
                <h3 className="stat-value" style={{ color: '#059669' }}>{userStats.activeUsers}</h3>
              </div>
            </div>

            <div className="stat-card" style={{ borderColor: '#fbbf24', background: '#fffbeb' }}>
              <div className="stat-icon">👑</div>
              <div className="stat-content">
                <p className="stat-label">System Administrators</p>
                <h3 className="stat-value" style={{ color: '#d97706' }}>{userStats.adminUsers}</h3>
              </div>
            </div>

            <div className="stat-card" style={{ borderColor: '#2563eb', background: '#eff6ff' }}>
              <div className="stat-icon">📋</div>
              <div className="stat-content">
                <p className="stat-label">Staff Members</p>
                <h3 className="stat-value" style={{ color: '#2563eb' }}>{userStats.staffUsers}</h3>
              </div>
            </div>
          </div>          </div>
          {/* 📋 USERS LIST PANEL */}
          <section className="panel" style={{ marginBottom: '2rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ color: '#2c5dff', marginBottom: '0.5rem' }}>📋 Recent Users</h3>
              <p style={{ color: '#4b5563', fontSize: '0.9rem', margin: 0 }}>Last {Math.min(5, users.length)} users created</p>
            </div>

            <div className="table-wrap">
              <table>
                <thead style={{ background: 'linear-gradient(90deg, #f0f7ff 0%, #fef3c7 50%, #f0f7ff 100%)', borderBottom: '2px solid #fbbf24' }}>
                  <tr>
                    <th style={{ color: '#2c5dff' }}>📝 Full Name</th>
                    <th style={{ color: '#2c5dff' }}>📧 Email</th>
                    <th style={{ color: '#2c5dff' }}>🏢 Department</th>
                    <th style={{ color: '#2c5dff' }}>📊 Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.filter(u => u.status !== 'archived').slice(0, 5).map((user) => (
                    <tr key={user.id} style={{ borderBottom: '1px solid #fef3c7' }}>
                      <td style={{ fontWeight: '500' }}>{user.full_name}</td>
                      <td>{user.email}</td>
                      <td>
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
                          {user.department === 'admin' && '👑 '}
                          {user.department.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.5rem 1rem',
                          borderRadius: '20px',
                          fontSize: '0.8rem',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          background: user.status === 'active' ? '#d1fae5' : '#fee2e2',
                          color: user.status === 'active' ? '#065f46' : '#991b1b',
                          border: `2px solid ${user.status === 'active' ? '#10b981' : '#dc2626'}`,
                        }}>
                          {user.status === 'active' ? '🟢' : '🔴'}
                          {user.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 📊 DV ANALYTICS SECTION */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ color: '#2c5dff', marginBottom: '1rem', fontSize: '1.1rem' }}>📊 Disbursement Analytics</h3>
            <div className="stats-grid">
              <div className="stat-card" style={{ borderColor: '#2c5dff', background: '#f0f7ff' }}>
                <div className="stat-icon">📊</div>
                <div className="stat-content">
                  <p className="stat-label">Total Entries</p>
                  <h3 className="stat-value" style={{ color: '#2c5dff' }}>{stats.total}</h3>
                </div>
              </div>

              <div className="stat-card stat-approved">
                <div className="stat-icon">✅</div>
                <div className="stat-content">
                  <p className="stat-label">Approved</p>
                  <h3 className="stat-value">{stats.approved}</h3>
                </div>
              </div>

              <div className="stat-card stat-pending">
                <div className="stat-icon">⏳</div>
                <div className="stat-content">
                  <p className="stat-label">Pending</p>
                  <h3 className="stat-value">{stats.pending}</h3>
                </div>
              </div>

              <div className="stat-card stat-rejected">
                <div className="stat-icon">❌</div>
                <div className="stat-content">
                  <p className="stat-label">Rejected</p>
                  <h3 className="stat-value">{stats.rejected}</h3>
                </div>
              </div>

              <div className="stat-card stat-amount">
                <div className="stat-icon">💰</div>
                <div className="stat-content">
                  <p className="stat-label">Total Amount</p>
                  <h3 className="stat-value">₱{(stats.totalAmount / 1000).toFixed(1)}K</h3>
                </div>
              </div>
            </div>
          </div>

          {/* 📊 CHARTS */}
          <div className="charts-grid">

            {/* 📊 BAR */}
            <div className="panel" style={{ boxShadow: '0 4px 12px rgba(251, 191, 36, 0.1)' }}>
              <h3 style={{ color: '#2c5dff', borderBottom: '2px solid #fbbf24', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>📈 Status Overview</h3>
              <Bar data={statusData} />
            </div>

            {/* 📊 PIE */}
            <div className="panel" style={{ boxShadow: '0 4px 12px rgba(251, 191, 36, 0.1)' }}>
              <h3 style={{ color: '#2c5dff', borderBottom: '2px solid #fbbf24', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>🥧 Status Distribution</h3>
              <Pie data={statusData} />
            </div>

            {/* 📊 LINE */}
            <div className="panel" style={{ gridColumn: 'span 2', boxShadow: '0 4px 12px rgba(251, 191, 36, 0.1)' }}>
              <h3 style={{ color: '#2c5dff', borderBottom: '2px solid #fbbf24', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>📅 Monthly Trend</h3>
              <Line data={monthlyData} />
            </div>

          </div>
        </>
      )}

      {/* 📊 REGULAR USER DASHBOARD */}
      {!isAdmin && (
        <>
          <div className="page-header">
            <div>
              <h2>📊 Dashboard Analytics</h2>
              <p>Disbursement Voucher Insights & Performance Metrics</p>
            </div>
          </div>

          {/* 🔥 KPI CARDS */}
          <div className="stats-grid">
            <div className="stat-card" style={{ borderColor: '#2c5dff', background: '#f0f7ff' }}>
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <p className="stat-label">Total Entries</p>
                <h3 className="stat-value" style={{ color: '#2c5dff' }}>{stats.total}</h3>
              </div>
            </div>

            <div className="stat-card stat-approved">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <p className="stat-label">Approved</p>
                <h3 className="stat-value">{stats.approved}</h3>
              </div>
            </div>

            <div className="stat-card stat-pending">
              <div className="stat-icon">⏳</div>
              <div className="stat-content">
                <p className="stat-label">Pending</p>
                <h3 className="stat-value">{stats.pending}</h3>
              </div>
            </div>

            <div className="stat-card stat-rejected">
              <div className="stat-icon">❌</div>
              <div className="stat-content">
                <p className="stat-label">Rejected</p>
                <h3 className="stat-value">{stats.rejected}</h3>
              </div>
            </div>

            <div className="stat-card stat-amount">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <p className="stat-label">Total Amount</p>
                <h3 className="stat-value">₱{(stats.totalAmount / 1000).toFixed(1)}K</h3>
              </div>
            </div>
          </div>

          {/* 📊 CHARTS */}
          <div className="charts-grid">

            {/* 📊 BAR */}
            <div className="panel" style={{ boxShadow: '0 4px 12px rgba(251, 191, 36, 0.1)' }}>
              <h3 style={{ color: '#2c5dff', borderBottom: '2px solid #fbbf24', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>📈 Status Overview</h3>
              <Bar data={statusData} />
            </div>

            {/* 📊 PIE */}
            <div className="panel" style={{ boxShadow: '0 4px 12px rgba(251, 191, 36, 0.1)' }}>
              <h3 style={{ color: '#2c5dff', borderBottom: '2px solid #fbbf24', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>🥧 Status Distribution</h3>
              <Pie data={statusData} />
            </div>

            {/* 📊 LINE */}
            <div className="panel" style={{ gridColumn: 'span 2', boxShadow: '0 4px 12px rgba(251, 191, 36, 0.1)' }}>
              <h3 style={{ color: '#2c5dff', borderBottom: '2px solid #fbbf24', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>📅 Monthly Trend</h3>
              <Line data={monthlyData} />
            </div>

          </div>
        </>
      )}
    </div>
  )
}