/* eslint-disable react-refresh/only-export-components */
import { createBrowserRouter, Link, Outlet, Navigate, useLocation } from 'react-router-dom'
import Login from '../pages/Login'
import Dashboard from '../pages/Dashboard'
import UserManagement from '../pages/UserManagement'
import Disbursements from '../pages/Disbursements'
import DisbursementDetail from '../pages/DisbursementDetail'
import ArchivedDisbursements from '../pages/ArchivedDisbursements'
import Journals from '../pages/Journals'
import NotFound from '../pages/NotFound'
import ReportGeneration from '../pages/ReportGeneration'
import PrivateRoute from './PrivateRoute'
import { getCurrentUser, clearCurrentUser, ssoLogin, API_ORIGIN } from '../api'

// <ion-icon name="lock-closed"></ion-icon> Layout
function AppLayout() {
  const location = useLocation()
  const currentUser = getCurrentUser()

  const logout = () => {
    clearCurrentUser()
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    window.location.href = "/login"
  }

  const openDjangoAdmin = async () => {
    try {
      const res = await ssoLogin()
      const base = API_ORIGIN
      const next = res?.next || '/admin/'
      window.open(base + next, '_blank')
    } catch (err) {
      console.error('SSO failed', err)
      alert('Failed to open Django admin. Check console for details.')
    }
  }

  const isActive = (path) => location.pathname === path
  const isAdmin = currentUser?.department === 'admin'
  const isAccountant = currentUser?.department === 'accounting'

  return (
    <div className="app-layout noselect">
      <header className="app-header">
        <div className="header-brand">
          <Link
                  className={`${isActive('/admin/dashboard') ? 'active' : ''}`}
                  to="/admin/dashboard"
                  title="Admin Dashboard"
                >
                <img src="/MuniLuna.png" alt="DTMIS Logo" className="header-logo" />
                </Link>
          <div>
            <h1 className="text-xl font-bold">DTMIS</h1>
            <p className="text-sm text-gray-600">Disbursement Tracking Management Information System</p>
          </div>
        </div>
        <div className="header-actions">
          <span>{currentUser?.full_name || 'Guest'}</span>
          {isAdmin && (
            <button type="button" onClick={openDjangoAdmin} className="btn-primary" style={{ marginRight: '0.5rem' }}>
              🔐 Open Django Admin
            </button>
          )}
          <button type="button" onClick={logout} className="btn-logout">
            <ion-icon name="log-out" style={{ fontSize: '18px' }}></ion-icon> Logout
          </button>
        </div>
      </header>

      <div className="app-shell">
        <aside className="app-sidebar">
          <nav className="sidebar-nav">
            {/* Admin-specific navigation */}
            {isAdmin ? (
              <>
                <Link
                  className={`nav-link ${isActive('/admin/dashboard') ? 'active' : ''}`}
                  to="/admin/dashboard"
                  title="Admin Dashboard"
                >
                  <span className="nav-icon">📈</span>
                  <span className="nav-text">Dashboard</span>
                </Link>

                <Link
                  className={`nav-link ${isActive('/admin/users') ? 'active' : ''}`}
                  to="/admin/users"
                  title="Manage Users and Permissions"
                >
                  <span className="nav-icon">👥</span>
                  <span className="nav-text">User Management</span>
                </Link>

              </>
            ) : (
              <>
                <Link
                  className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
                  to="/dashboard"
                  title="View Dashboard"
                >
                  <span className="nav-icon">📈</span>
                  <span className="nav-text">Dashboard</span>
                </Link>

                <Link
                  className={`nav-link ${isActive('/disbursements') ? 'active' : ''}`}
                  to="/disbursements"
                  title="Manage Vouchers"
                >
                  <span className="nav-icon">📋</span>
                  <span className="nav-text">Voucher Entry</span>
                </Link>

                <Link
                  className={`nav-link ${isActive('/journals') ? 'active' : ''}`}
                  to="/journals"
                  title="Manage Journals"
                >
                  <span className="nav-icon">📔</span>
                  <span className="nav-text">Journal Entry</span>
                </Link>

                {/* Accountant gets report generation link */}
                {isAccountant && (
                  <Link
                    className={`nav-link ${isActive('/reports') ? 'active' : ''}`}
                    to="/reports"
                    title="Report Generation"
                  >
                    <span className="nav-icon">📑</span>
                    <span className="nav-text">Report Generation</span>
                  </Link>
                )}
              </>
            )}
          </nav>
        </aside>

        <div className="app-content">
          <main className="app-main">
            <Outlet />
          </main>
        </div>
      </div>

      <footer className="app-footer">© 2026 DTMIS - Powered by Municipal Innovation</footer>
    </div>
  )
}

export const router = createBrowserRouter([
  // <ion-icon name="lock-open"></ion-icon> Public
  { path: '/login', element: <Login /> },

  // <ion-icon name="alert"></ion-icon> Force root → login
  { path: '/', element: <Navigate to="/login" replace /> },

  // <ion-icon name="lock-closed"></ion-icon> Protected routes
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

      // ADMIN DASHBOARD (separate admin route)
      {
        path: 'admin/dashboard',
        element: (
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        ),
      },

      // ADMIN DASHBOARD
      {
        path: 'admin/users',
        element: (
          <PrivateRoute>
            <UserManagement />
          </PrivateRoute>
        ),
      },

      // ADMIN: Disbursement list management
      {
        path: 'admin/disbursements',
        element: (
          <PrivateRoute>
            <Disbursements />
          </PrivateRoute>
        ),
      },

      // ACCOUNTANT: Report generation (user route)
      {
        path: 'reports',
        element: (
          <PrivateRoute>
            <ReportGeneration />
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