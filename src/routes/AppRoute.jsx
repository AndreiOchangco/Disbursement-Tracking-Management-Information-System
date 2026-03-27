/* eslint-disable react-refresh/only-export-components */
import { createBrowserRouter, Link, Outlet, Navigate } from 'react-router-dom'
import Disbursements from '../pages/Disbursements'
import DisbursementDetail from '../pages/DisbursementDetail'
import ArchivedDisbursements from '../pages/ArchivedDisbursements'
import Dashboard from '../pages/Dashboard'
import Login from '../pages/Login'
import Register from '../pages/Register'
import NotFound from '../pages/NotFound'
import PrivateRoute from './PrivateRoute'
import RoleRoute from './RoleRoute'

function AppLayout() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
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
          <span>{user?.name || 'Guest'}</span>
          <button type="button" onClick={logout} className="btn-danger">
            Logout
          </button>
        </div>
      </header>

      <div className="app-shell">
        <aside className="app-sidebar">
          <div className="sidebar-brand">
            <img src="/logo.png" alt="DTMIS Logo" />
            <p>DTMIS</p>
          </div>
          <nav className="sidebar-nav">
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/disbursements">Voucher Entry</Link>
            <Link to="/disbursements/archived">Archived</Link>
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
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },

  { path: '/', element: <Navigate to="/login" replace /> },

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
            <RoleRoute allowAdmin={false}>
              <Dashboard />
            </RoleRoute>
          </PrivateRoute>
        ),
      },

      // ADMIN DASHBOARD
      {
        path: 'admin-dashboard',
        element: (
          <PrivateRoute>
            <RoleRoute allowAdmin={true}>
              <Dashboard />
            </RoleRoute>
          </PrivateRoute>
        ),
      },

      // USER-ONLY PAGES
      {
        path: 'disbursements',
        element: (
          <PrivateRoute>
            <RoleRoute allowAdmin={false}>
              <Disbursements />
            </RoleRoute>
          </PrivateRoute>
        ),
      },

      {
        path: 'disbursements/:id',
        element: (
          <PrivateRoute>
            <RoleRoute allowAdmin={false}>
              <DisbursementDetail />
            </RoleRoute>
          </PrivateRoute>
        ),
      },

      {
        path: 'disbursements/archived',
        element: (
          <PrivateRoute>
            <RoleRoute allowAdmin={false}>
              <ArchivedDisbursements />
            </RoleRoute>
          </PrivateRoute>
        ),
      },

      // ADMIN ONLY
      {
        path: 'users',
        element: (
          <PrivateRoute>
            <RoleRoute allowAdmin={true}>
              <Dashboard />
            </RoleRoute>
          </PrivateRoute>
        ),
      },

      { path: '*', element: <NotFound /> },
    ],
  },
])