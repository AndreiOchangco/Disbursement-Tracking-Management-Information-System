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
    completed: 0,
    pending: 0,
    draft: 0,
    archived: 0,
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

      // Separate status counts based on your API response
      const completed = res.filter(d => d.status === 'completed').length
      const pending = res.filter(d => d.status === 'pending').length
      const draft = res.filter(d => d.status === 'draft').length
      const archived = res.filter(d => d.status === 'archived').length
      
      // Calculate total amount by summing debits in journal entries
      const totalAmount = res.reduce((sum, d) => {
        const entrySum = d.journal_entries?.reduce((s, j) => s + Number(j.debit || 0), 0) || 0
        return sum + entrySum
      }, 0)

      setStats({
        total: res.length,
        completed,
        pending,
        draft,
        archived,
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

  const statusData = {
    labels: ['Completed', 'Pending', 'Draft', 'Archived'],
    datasets: [
      {
        label: 'Disbursements',
        data: [stats.completed, stats.pending, stats.draft, stats.archived],
        backgroundColor: [
          'rgba(5, 150, 105, 0.7)', // Success Green
          'rgba(0, 82, 204, 0.7)',   // Primary Blue
          'rgba(249, 115, 22, 0.7)', // Warning Orange
          'rgba(107, 114, 128, 0.7)', // Gray
        ],
        borderColor: [
          '#059669',
          '#0052CC',
          '#f97316',
          '#6b7280',
        ],
        borderWidth: 1,
      },
    ],
  }

  const monthlyMap = {}
  const sortedData = [...data].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

  sortedData.forEach(d => {
    const month = new Date(d.created_at).toLocaleString('default', { month: 'short' })
    monthlyMap[month] = (monthlyMap[month] || 0) + 1
  })

  const monthlyData = {
    labels: Object.keys(monthlyMap),
    datasets: [
      {
        label: 'Monthly Entries',
        data: Object.values(monthlyMap),
        fill: true,
        backgroundColor: 'rgba(0, 82, 204, 0.1)',
        borderColor: '#0052CC',
        tension: 0.4,
        pointBackgroundColor: '#0052CC',
      },
    ],
  }

  return (
    <div>
      {/* 👑 ADMIN DASHBOARD VIEW */}
      {isAdmin && (
        <>
          <div className="page-header">
            <div>
              <h2><ion-icon name="crown"></ion-icon> Admin Dashboard</h2>
              <p>Complete system overview with user management and all disbursement analytics</p>
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ color: '#2c5dff', marginBottom: '1rem', fontSize: '1.1rem' }}><ion-icon name="people"></ion-icon> User Management</h3>
            <div className="stats-grid">
              <div className="stat-card" style={{ borderColor: '#2c5dff', background: '#f0f7ff' }}>
                <div className="stat-icon"><ion-icon name="people"></ion-icon></div>
                <div className="stat-content">
                  <p className="stat-label">Total Users</p>
                  <h3 className="stat-value" style={{ color: '#2c5dff' }}>{userStats.totalUsers}</h3>
                </div>
              </div>
              <div className="stat-card" style={{ borderColor: '#059669', background: '#f0fdf4' }}>
                <div className="stat-icon"><ion-icon name="checkmark-circle"></ion-icon></div>
                <div className="stat-content">
                  <p className="stat-label">Active Users</p>
                  <h3 className="stat-value" style={{ color: '#059669' }}>{userStats.activeUsers}</h3>
                </div>
              </div>
              <div className="stat-card" style={{ borderColor: '#fbbf24', background: '#fffbeb' }}>
                <div className="stat-icon"><ion-icon name="crown"></ion-icon></div>
                <div className="stat-content">
                  <p className="stat-label">Admins</p>
                  <h3 className="stat-value" style={{ color: '#d97706' }}>{userStats.adminUsers}</h3>
                </div>
              </div>
            </div>
          </div>

          <section className="panel" style={{ marginBottom: '2rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ color: '#2c5dff', marginBottom: '0.5rem' }}><ion-icon name="clipboard"></ion-icon> Recent Users</h3>
            </div>
            <div className="table-wrap">
              <table>
                <thead style={{ background: 'linear-gradient(90deg, #f0f7ff 0%, #fef3c7 50%, #f0f7ff 100%)', borderBottom: '2px solid #fbbf24' }}>
                  <tr>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.slice(0, 5).map((user) => (
                    <tr key={user.id}>
                      <td style={{ fontWeight: '500' }}>{user.full_name}</td>
                      <td>{user.email}</td>
                      <td>{user.department}</td>
                      <td>{user.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* 📊 GLOBAL STATS SECTION (For both Admin & Staff) */}
      <div className={!isAdmin ? "" : ""} style={{ marginBottom: '2rem' }}>
        {!isAdmin && (
          <div className="page-header">
            <div>
              <h2><ion-icon name="bar-chart"></ion-icon> Dashboard Analytics</h2>
              <p>Disbursement Voucher Insights & Performance Metrics</p>
            </div>
          </div>
        )}
        
        <h3 style={{ color: '#2c5dff', marginBottom: '1rem', fontSize: '1.1rem' }}><ion-icon name="stats-chart"></ion-icon> Disbursement Overview</h3>
        <div className="stats-grid">
          <div className="stat-card" style={{ borderLeft: '4px solid #059669' }}>
            <div className="stat-icon"><ion-icon name="checkmark-done-circle" style={{color: '#059669'}}></ion-icon></div>
            <div className="stat-content">
              <p className="stat-label">Completed</p>
              <h3 className="stat-value">{stats.completed}</h3>
            </div>
          </div>
          <div className="stat-card" style={{ borderLeft: '4px solid #0052CC' }}>
            <div className="stat-icon"><ion-icon name="time" style={{color: '#0052CC'}}></ion-icon></div>
            <div className="stat-content">
              <p className="stat-label">Pending</p>
              <h3 className="stat-value">{stats.pending}</h3>
            </div>
          </div>
          <div className="stat-card" style={{ borderLeft: '4px solid #f97316' }}>
            <div className="stat-icon"><ion-icon name="document-text" style={{color: '#f97316'}}></ion-icon></div>
            <div className="stat-content">
              <p className="stat-label">Draft</p>
              <h3 className="stat-value">{stats.draft}</h3>
            </div>
          </div>
          <div className="stat-card" style={{ borderLeft: '4px solid #6b7280' }}>
            <div className="stat-icon"><ion-icon name="archive" style={{color: '#6b7280'}}></ion-icon></div>
            <div className="stat-content">
              <p className="stat-label">Archived</p>
              <h3 className="stat-value">{stats.archived}</h3>
            </div>
          </div>
          <div className="stat-card" style={{ borderLeft: '4px solid #fbbf24', background: '#fffbeb' }}>
            <div className="stat-icon"><ion-icon name="cash" style={{color: '#d97706'}}></ion-icon></div>
            <div className="stat-content">
              <p className="stat-label">Total Amount</p>
              <h3 className="stat-value">₱{stats.totalAmount.toLocaleString()}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="panel" style={{ boxShadow: '0 4px 12px rgba(251, 191, 36, 0.1)' }}>
          <h3 style={{ color: '#2c5dff', borderBottom: '2px solid #fbbf24', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}><ion-icon name="trending-up"></ion-icon> Status Overview</h3>
          <Bar data={statusData} options={{ plugins: { legend: { display: false } } }} />
        </div>

        <div className="panel" style={{ boxShadow: '0 4px 12px rgba(251, 191, 36, 0.1)' }}>
          <h3 style={{ color: '#2c5dff', borderBottom: '2px solid #fbbf24', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}><ion-icon name="pie-chart"></ion-icon> Status Distribution</h3>
          <Pie data={statusData} />
        </div>

        <div className="panel" style={{ gridColumn: 'span 2', boxShadow: '0 4px 12px rgba(251, 191, 36, 0.1)' }}>
          <h3 style={{ color: '#2c5dff', borderBottom: '2px solid #fbbf24', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}><ion-icon name="calendar"></ion-icon> Monthly Trend</h3>
          <Line data={monthlyData} />
        </div>
      </div>
    </div>
  )
}