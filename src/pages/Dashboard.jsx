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
  })
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    adminUsers: 0,
    staffUsers: 0,
  })

  const [userCurrentPage, setUserCurrentPage] = useState(1)
  const usersPerPage = 5
  const [dvCurrentPage, setDVCurrentPage] = useState(1)
  const dvPerPage = 5

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
      const approved = res.filter(d => d.status === 'approved').length
      const pending = res.filter(d => d.status === 'pending').length
      const draft = res.filter(d => d.status === 'draft').length
      const archived = res.filter(d => d.status === 'archived').length
      
      // Calculate total amount by summing debits in journal entries
      const totalAmount = res.reduce((sum, d) => {
        const entrySum = d.journal_entries?.reduce((s, j) => s + Number(j.debit || 0), 0) || 0
        return sum + entrySum
      }, 0)
      const rejected = res.filter(d => d.status === 'rejected').length

      setStats({
        total: res.length,
        approved,
        pending,
        rejected,
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

  // <ion-icon name="bar-chart"></ion-icon> STATUS DATA
  const statusData = {
    labels: ['Approved', 'Pending', 'Rejected'],
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

  // 📊 MONTHLY TREND
  const sortedData = [...data].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  const monthlyMap = {}

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
      {/* 👑 ADMIN DASHBOARD */}
      {isAdmin && (
              <>
                <div className="page-header">
                  <div>
                    <h2><ion-icon name="crown"></ion-icon> Admin Dashboard</h2>
                    <p>Complete system overview with user management</p>
                  </div>
                </div>
      
                {/* 📊 USER STATS CARDS */}
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
                    <div className="stat-icon"><ion-icon name="terminal"></ion-icon></div>
                    <div className="stat-content">
                      <p className="stat-label">System Administrators</p>
                      <h3 className="stat-value" style={{ color: '#d97706' }}>{userStats.adminUsers}</h3>
                    </div>
                  </div>
      
                  <div className="stat-card" style={{ borderColor: '#2563eb', background: '#eff6ff' }}>
                    <div className="stat-icon"><ion-icon name="clipboard"></ion-icon></div>
                    <div className="stat-content">
                      <p className="stat-label">Staff Members</p>
                      <h3 className="stat-value" style={{ color: '#2563eb' }}>{userStats.staffUsers}</h3>
                    </div>
                  </div>
                </div>          </div>
                {/* 📋 USERS LIST PANEL */}
                <section className="panel" style={{ marginBottom: '2rem' }}>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ color: '#2c5dff', marginBottom: '0.5rem' }}><ion-icon name="clipboard"></ion-icon> Recent Users</h3>
                    <p style={{ color: '#4b5563', fontSize: '0.9rem', margin: 0 }}>Total {users.filter(u => u.status !== 'archived').length} users</p>
                  </div>
      
                  <div className="table-wrap">
                    <table>
                      <thead style={{ background: 'linear-gradient(90deg, #f0f7ff 0%, #fef3c7 50%, #f0f7ff 100%)', borderBottom: '2px solid #fbbf24' }}>
                        <tr>
                          <th className='table-column-center table-column-border' style={{ color: '#2c5dff' }}><ion-icon name="pencil"></ion-icon> Full Name</th>
                          <th className='table-column-center table-column-border' style={{ color: '#2c5dff' }}><ion-icon name="mail"></ion-icon> Email</th>
                          <th className='table-column-center table-column-border' style={{ color: '#2c5dff' }}><ion-icon name="business"></ion-icon> Department</th>
                          <th className='table-column-center table-column-border' style={{ color: '#2c5dff' }}><ion-icon name="bar-chart"></ion-icon> Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.filter(u => u.status !== 'archived')
                          .slice((userCurrentPage - 1) * usersPerPage, userCurrentPage * usersPerPage)
                          .map((user) => (
                          <tr key={user.id} style={{ borderBottom: '1px solid #fef3c7' }}>
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
                                {user.department.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className='table-column-center'>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                borderRadius: '20px',
                                fontSize: '0.8rem',
                              }}>
                                {user.status === 'active' ? <ion-icon name="ellipse" style={{color: 'green', fontSize: '1.1rem', border: '2px solid darkgreen', borderRadius: '100%', margin: '0', padding: '0', background: 'green'}}></ion-icon> : user.status === 'archived' ? <ion-icon name="archive"></ion-icon> : <ion-icon name="ellipse" style={{color: 'red', fontSize: '1.1rem', border: '2px solid darkred', borderRadius: '100%', margin: '0', padding: '0', background: 'red'}}></ion-icon>}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* 📄 Pagination Controls */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                    <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                      Page {userCurrentPage} of {Math.ceil(users.filter(u => u.status !== 'archived').length / usersPerPage) || 1}
                    </span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => setUserCurrentPage(p => Math.max(1, p - 1))}
                        disabled={userCurrentPage === 1}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          padding: '0.5rem 1rem',
                          borderRadius: '4px',
                          border: '1px solid #d1d5db',
                          background: userCurrentPage === 1 ? '#f3f4f6' : '#fff',
                          color: userCurrentPage === 1 ? '#9ca3af' : '#2c5dff',
                          cursor: userCurrentPage === 1 ? 'not-allowed' : 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                        }}
                      >
                        <ion-icon name="chevron-back"></ion-icon> Previous
                      </button>
                      <button
                        onClick={() => setUserCurrentPage(p => Math.min(Math.ceil(users.filter(u => u.status !== 'archived').length / usersPerPage), p + 1))}
                        disabled={userCurrentPage >= Math.ceil(users.filter(u => u.status !== 'archived').length / usersPerPage)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          padding: '0.5rem 1rem',
                          borderRadius: '4px',
                          border: '1px solid #d1d5db',
                          background: userCurrentPage >= Math.ceil(users.filter(u => u.status !== 'archived').length / usersPerPage) ? '#f3f4f6' : '#fff',
                          color: userCurrentPage >= Math.ceil(users.filter(u => u.status !== 'archived').length / usersPerPage) ? '#9ca3af' : '#2c5dff',
                          cursor: userCurrentPage >= Math.ceil(users.filter(u => u.status !== 'archived').length / usersPerPage) ? 'not-allowed' : 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                        }}
                      >
                        Next <ion-icon name="chevron-forward"></ion-icon>
                      </button>
                    </div>
                  </div>
                </section>

          {/* 📊 DV ANALYTICS SECTION */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ color: '#2c5dff', marginBottom: '1rem', fontSize: '1.1rem' }}><ion-icon name="bar-chart"></ion-icon> Disbursement Analytics</h3>
            <div className="stats-grid">
              <div className="stat-card" style={{ borderColor: '#2c5dff', background: '#f0f7ff' }}>
                <div className="stat-icon"><ion-icon name="bar-chart"></ion-icon></div>
                <div className="stat-content">
                  <p className="stat-label">Total Entries</p>
                  <h3 className="stat-value" style={{ color: '#2c5dff' }}>{stats.total}</h3>
                </div>
              </div>

              <div className="stat-card stat-approved">
                <div className="stat-icon"><ion-icon name="checkmark-circle"></ion-icon></div>
                <div className="stat-content">
                  <p className="stat-label">Approved</p>
                  <h3 className="stat-value">{stats.approved}</h3>
                </div>
              </div>

              <div className="stat-card stat-pending">
                <div className="stat-icon"><ion-icon name="time"></ion-icon></div>
                <div className="stat-content">
                  <p className="stat-label">Pending</p>
                  <h3 className="stat-value">{stats.pending}</h3>
                </div>
              </div>

              <div className="stat-card stat-rejected">
                <div className="stat-icon"><ion-icon name="close-circle"></ion-icon></div>
                <div className="stat-content">
                  <p className="stat-label">Rejected</p>
                  <h3 className="stat-value">{stats.rejected}</h3>
                </div>
              </div>
            </div>
          </div>

          {/* 📊 CHARTS */}
          <div className="charts-grid">

            {/* 📊 BAR */}
            <div className="panel" style={{ boxShadow: '0 4px 12px rgba(251, 191, 36, 0.1)' }}>
              <h3 style={{ color: '#2c5dff', borderBottom: '2px solid #fbbf24', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}><ion-icon name="trending-up"></ion-icon> Status Overview</h3>
              <Bar data={statusData} />
            </div>

            {/* 📊 PIE */}
            <div className="panel" style={{ boxShadow: '0 4px 12px rgba(251, 191, 36, 0.1)' }}>
              <h3 style={{ color: '#2c5dff', borderBottom: '2px solid #fbbf24', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}><ion-icon name="pie-chart"></ion-icon> Status Distribution</h3>
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
              <h2><ion-icon name="bar-chart"></ion-icon> Dashboard Analytics</h2>
              <p>Disbursement Voucher Insights & Performance Metrics</p>
            </div>
          </div>

          {/* <ion-icon name="flame"></ion-icon> KPI CARDS */}
          <div className="stats-grid">
            <div className="stat-card" style={{ borderColor: '#2c5dff', background: '#f0f7ff' }}>
              <div className="stat-icon"><ion-icon name="bar-chart"></ion-icon></div>
              <div className="stat-content">
                <p className="stat-label">Total Entries</p>
                <h3 className="stat-value" style={{ color: '#2c5dff' }}>{stats.total}</h3>
              </div>
            </div>

            <div className="stat-card stat-approved">
              <div className="stat-icon"><ion-icon name="checkmark-circle"></ion-icon></div>
              <div className="stat-content">
                <p className="stat-label">Approved</p>
                <h3 className="stat-value">{stats.approved}</h3>
              </div>
            </div>

            <div className="stat-card stat-pending">
              <div className="stat-icon"><ion-icon name="time"></ion-icon></div>
              <div className="stat-content">
                <p className="stat-label">Pending</p>
                <h3 className="stat-value">{stats.pending}</h3>
              </div>
            </div>

            <div className="stat-card stat-rejected">
              <div className="stat-icon"><ion-icon name="close-circle"></ion-icon></div>
              <div className="stat-content">
                <p className="stat-label">Rejected</p>
                <h3 className="stat-value">{stats.rejected}</h3>
              </div>
            </div>
          </div>

          <section className="panel" style={{ marginBottom: '2rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ color: '#2c5dff', marginBottom: '0.5rem' }}><ion-icon name="receipt"></ion-icon> Recent Disbursements</h3>
          <p style={{ color: '#4b5563', fontSize: '0.9rem', margin: 0 }}>Latest {data.length} disbursement vouchers</p>
        </div>

        <div className="table-wrap">
          <table>
            <thead style={{ background: 'linear-gradient(90deg, #f0f7ff 0%, #fef3c7 50%, #f0f7ff 100%)', borderBottom: '2px solid #fbbf24' }}>
              <tr>
                <th style={{ color: '#2c5dff' }}><ion-icon name="pin"></ion-icon> Tracking #</th>
                <th style={{ color: '#2c5dff' }}><ion-icon name="bookmark"></ion-icon> DV Number</th>
                <th style={{ color: '#2c5dff' }}><ion-icon name="person"></ion-icon> Payee</th>
                <th style={{ color: '#2c5dff' }}><ion-icon name="bar-chart"></ion-icon> Status</th>
                <th style={{ color: '#2c5dff' }}><ion-icon name="calendar"></ion-icon> Created Date</th>
              </tr>
            </thead>
            <tbody>
              {data
                .slice((dvCurrentPage - 1) * dvPerPage, dvCurrentPage * dvPerPage)
                .map((dv) => (
                <tr key={dv.id} style={{ borderBottom: '1px solid #fef3c7' }}>
                  <td style={{ fontWeight: '500' }}>{dv.tracking_no}</td>
                  <td>{dv.dv_no || '-'}</td>
                  <td>{dv.payee}</td>
                  <td>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.3rem 0.6rem',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      textTransform: 'capitalize',
                      background: dv.status === 'completed' ? 'rgba(5, 150, 105, 0.2)' : 
                                 dv.status === 'pending' ? 'rgba(0, 82, 204, 0.2)' :
                                 dv.status === 'draft' ? 'rgba(249, 115, 22, 0.2)' :
                                 'rgba(107, 114, 128, 0.2)',
                      color: dv.status === 'completed' ? '#059669' :
                             dv.status === 'pending' ? '#0052CC' :
                             dv.status === 'draft' ? '#f97316' :
                             '#6b7280'
                    }}>
                      {dv.status}
                    </span>
                  </td>
                  <td>{dv.created_date ? new Date(dv.created_date).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 📄 Pagination Controls */}
        {data.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
            <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>
              Page {dvCurrentPage} of {Math.ceil(data.length / dvPerPage) || 1}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setDVCurrentPage(p => Math.max(1, p - 1))}
                disabled={dvCurrentPage === 1}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db',
                  background: dvCurrentPage === 1 ? '#f3f4f6' : '#fff',
                  color: dvCurrentPage === 1 ? '#9ca3af' : '#2c5dff',
                  cursor: dvCurrentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                }}
              >
                <ion-icon name="chevron-back"></ion-icon> Previous
              </button>
              <button
                onClick={() => setDVCurrentPage(p => Math.min(Math.ceil(data.length / dvPerPage), p + 1))}
                disabled={dvCurrentPage >= Math.ceil(data.length / dvPerPage)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db',
                  background: dvCurrentPage >= Math.ceil(data.length / dvPerPage) ? '#f3f4f6' : '#fff',
                  color: dvCurrentPage >= Math.ceil(data.length / dvPerPage) ? '#9ca3af' : '#2c5dff',
                  cursor: dvCurrentPage >= Math.ceil(data.length / dvPerPage) ? 'not-allowed' : 'pointer',
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

          {/* 📊 CHARTS */}
          <div className="charts-grid">

            {/* 📊 BAR */}
            <div className="panel" style={{ boxShadow: '0 4px 12px rgba(251, 191, 36, 0.1)' }}>
              <h3 style={{ color: '#2c5dff', borderBottom: '2px solid #fbbf24', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}><ion-icon name="trending-up"></ion-icon> Status Overview</h3>
              <Bar data={statusData} />
            </div>

            {/* 📊 PIE */}
            <div className="panel" style={{ boxShadow: '0 4px 12px rgba(251, 191, 36, 0.1)' }}>
              <h3 style={{ color: '#2c5dff', borderBottom: '2px solid #fbbf24', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}><ion-icon name="pie-chart"></ion-icon> Status Distribution</h3>
              <Pie data={statusData} />
            </div>

            {/* 📊 LINE */}
            <div className="panel" style={{ gridColumn: 'span 2', boxShadow: '0 4px 12px rgba(251, 191, 36, 0.1)' }}>
              <h3 style={{ color: '#2c5dff', borderBottom: '2px solid #fbbf24', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}><ion-icon name="calendar"></ion-icon> Monthly Trend</h3>
              <Line data={monthlyData} />
            </div>

          </div>
        </>
      )}
    </div>
  )
}