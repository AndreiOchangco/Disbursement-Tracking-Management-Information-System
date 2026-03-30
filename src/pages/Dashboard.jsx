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
      const res = await apiRequest('/disbursements/')
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
        <h2 className="text-2xl font-bold text-slate-800">Dashboard Analytics</h2>
        <p>Disbursement Voucher Insights</p>
      </div>

      {/* 🔥 KPI CARDS */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '20px' }}>
        <div className="panel">Total: {stats.total}</div>
        <div className="panel">Approved: {stats.approved}</div>
        <div className="panel">Pending: {stats.pending}</div>
        <div className="panel">Rejected: {stats.rejected}</div>
        <div className="panel">₱ {stats.totalAmount.toLocaleString()}</div>
      </div>

      {/* 📊 CHARTS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

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