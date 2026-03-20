/* eslint-disable react-refresh/only-export-components */
import { createBrowserRouter, Link, Outlet, Navigate } from 'react-router-dom'
import Disbursements from '../pages/Disbursements'
import DisbursementDetail from '../pages/DisbursementDetail'
import ArchivedDisbursements from '../pages/ArchivedDisbursements'
import Login from '../pages/Login'
import Register from '../pages/Register'
import Dashboard from '../pages/Dashboard'
import NotFound from '../pages/NotFound'
import PrivateRoute from '../PrivateRoute'

// 🔐 Layout (protected)
function AppLayout() {
  const logout = () => {
    localStorage.removeItem("token")
    window.location.href = "/login"
  }

  return (
    <>
      <div className="app-shell">
        <aside className="app-sidebar">
          <div className="sidebar-brand">
            <img src="/logo.png" alt="DTMIS Logo" />
            <p>Disbursement Tracking Management Information System</p>
          </div>

          <nav className="sidebar-nav">
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/disbursements">Voucher Entry</Link>
            <button onClick={logout} className="btn-logout">
              Logout
            </button>
          </nav>
        </aside>

        <div className="app-content">
          <main className="app-main">
            <Outlet />
          </main>
        </div>
      </div>

      <footer className="app-footer">© 2026 DTMIS</footer>
    </>
  )
}

export const router = createBrowserRouter([
  // 🔓 Public
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },

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
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'disbursements', element: <Disbursements /> },
      { path: 'disbursements/archived', element: <ArchivedDisbursements /> },
      { path: 'disbursements/:id', element: <DisbursementDetail /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])