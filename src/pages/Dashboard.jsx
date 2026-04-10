/* eslint-disable react-hooks/immutability */
/* eslint-disable no-unused-vars */
import { useEffect, useState } from 'react'
import { apiRequest } from '../api'
import '../chart.js'

import { Bar, Pie, Line } from 'react-chartjs-2'

export default function Dashboard() {
  const [data, setData] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    totalAmount: 0,
  })

  useEffect(() => {
    loadData()
  }, [])

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
      <div className="page-header">
        <div>
          <h2>Dashboard Analytics</h2>
          <p>Disbursement Voucher Insights & Performance Metrics</p>
        </div>
      </div>

      {/* 🔥 KPI CARDS */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <p className="stat-label">Total Entries</p>
            <h3 className="stat-value">{stats.total}</h3>
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
        <div className="panel">
          <h3>Status Overview</h3>
          <Bar data={statusData} />
        </div>

        {/* 📊 PIE */}
        <div className="panel">
          <h3>Status Distribution</h3>
          <Pie data={statusData} />
        </div>

        {/* 📊 LINE */}
        <div className="panel" style={{ gridColumn: 'span 2' }}>
          <h3>Monthly Trend</h3>
          <Line data={monthlyData} />
        </div>

      </div>
    </div>
  )
}