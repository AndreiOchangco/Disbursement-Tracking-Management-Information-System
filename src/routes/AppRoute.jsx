/* eslint-disable react-refresh/only-export-components */
import { createBrowserRouter, Link, Outlet, Navigate } from 'react-router-dom'
import Login from '../pages/Login'
import Dashboard from '../pages/Dashboard'
import Disbursements from '../pages/Disbursements'
import DisbursementDetail from '../pages/DisbursementDetail'
import ArchivedDisbursements from '../pages/ArchivedDisbursements'
import Journals from '../pages/Journals'
import NotFound from '../pages/NotFound'
import PrivateRoute from './PrivateRoute'
import { getCurrentUser } from '../api'

// 🔐 Layout
function AppLayout() {

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    window.location.href = "/login"
  }

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-brand">
          <img src="/logo.png" alt="DTMIS Logo" className="header-logo" />
          <div>
            <h1>DTMIS</h1>
            <p>Disbursement Tracking Management Information System</p>
          </div>
        </div>
        <div className="header-actions">
          <span>{getCurrentUser()?.fullname || 'Guest'}</span>
          <button type="button" onClick={logout} className="btn-danger">
            Logout
          </button>
        </div>
      </header>

      <div className="app-shell">
        <aside className="app-sidebar">
          <div className="sidebar-brand">
            <img src="/logo.png" alt="DTMIS Logo" />
            <p>Disbursement Tracking MIS</p>
          </div>
          <nav className="sidebar-nav">
            <Link to="/dashboard">
              Dashboard
            </Link>

            <Link to="/disbursements">
            Voucher Entry
            </Link>

            <Link to="/journals">
            Journal Entries
            </Link>

          </nav>
        </aside>

        <div className="app-content">
          <main className="app-main">
            <Outlet />
          </main>
        </div>
      </div>

      <footer className="app-footer">© 2026 DTMIS</footer>
    </div>
  )
}

export const router = createBrowserRouter([
  // 🔓 Public
  { path: '/login', element: <Login /> },

  // 🚨 Force root → login
  { path: '/', element: <Navigate to="/login" replace /> },

  // 🔐 Protected routes
  {
    path: '/',
    element: (
      <PrivateRoute>
        <AppLayout />
      </PrivateRoute>
    ),
    children: [
      // USER DASHBOARD
      {
        path: 'dashboard',
        element: (
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        ),
      },

      // USER-ONLY PAGES
      {
        path: 'disbursements',
        element: (
          <PrivateRoute>
            <Disbursements />
          </PrivateRoute>
        ),
      },

      {
        path: 'disbursements/:id',
        element: (
          <PrivateRoute>
            <DisbursementDetail />
          </PrivateRoute>
        ),
      },

      {
        path: 'disbursements/archived',
        element: (
          <PrivateRoute>
            <ArchivedDisbursements />
          </PrivateRoute>
        ),
      },

      {
        path: 'journals',
        element: (
          <PrivateRoute>
            <Journals />
          </PrivateRoute>
        ),
      },

      { path: '*', element: <NotFound /> },
    ],
  },
])