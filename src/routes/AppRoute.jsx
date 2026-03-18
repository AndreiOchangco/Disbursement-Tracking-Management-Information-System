/* eslint-disable react-refresh/only-export-components */
import { createBrowserRouter, Link, Outlet } from 'react-router-dom'
import Disbursements from '../pages/Disbursements'
import DisbursementDetail from '../pages/DisbursementDetail'
import Login from '../pages/Login'
import Register from '../pages/Register'
import Dashboard from '../pages/Dashboard'
import NotFound from '../pages/NotFound'

function AppLayout() {
  return (
    <>
      <div className="app-shell">
        <aside className="app-sidebar">
        <div className="sidebar-brand">
          <h1>DTMIS</h1>
          <p>Disbursement Tracking Management Information System</p>
        </div>
        <nav className="sidebar-nav">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/disbursements">Voucher Entry</Link>
          <Link to="/login">Logout</Link>
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
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, path: 'dashboard', element: <Dashboard /> },
      { path: 'disbursements', element: <Disbursements /> },
      { path: 'disbursements/:id', element: <DisbursementDetail /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])
