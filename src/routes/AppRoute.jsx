/* eslint-disable react-refresh/only-export-components */
import { createBrowserRouter, Link, Outlet, Navigate } from 'react-router-dom'
import Disbursements from '../pages/Disbursements'
import DisbursementDetail from '../pages/DisbursementDetail'
import ArchivedDisbursements from '../pages/ArchivedDisbursements'
import Login from '../pages/Login'
import Register from '../pages/Register'
import NotFound from '../pages/NotFound'
import PrivateRoute from './PrivateRoute'
import RoleRoute from './RoleRoute'

import UserDashboard from '../pages/UserDashboard'
import AdminDashboard from '../pages/AdminDashboard'
import UserManagement from '../pages/UserManagement'

// 🔐 Layout
function AppLayout() {
  const user = JSON.parse(localStorage.getItem("user") || "{}")

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    window.location.href = "/login"
  }

  return (
    <>
      <div className="app-shell">
        <aside className="app-sidebar">
          <div className="sidebar-brand">
            <img src="/logo.png" alt="DTMIS Logo" />
            <p>Disbursement Tracking MIS</p>
          </div>

          <nav className="sidebar-nav">
            <Link to={user?.is_admin ? "/admin-dashboard" : "/dashboard"}>
              Dashboard
            </Link>

            {/* ONLY normal users */}
            {!user?.is_admin && (
              <Link to="/disbursements">Voucher Entry</Link>
            )}

            {/* ONLY admin */}
            {user?.is_admin && (
              <Link to="/users">User Management</Link>
            )}

            <button onClick={logout}>Logout</button>
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
              <UserDashboard />
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
              <AdminDashboard />
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
              <UserManagement />
            </RoleRoute>
          </PrivateRoute>
        ),
      },

      { path: '*', element: <NotFound /> },
    ],
  },
])