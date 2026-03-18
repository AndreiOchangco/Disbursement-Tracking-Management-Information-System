import { createBrowserRouter, Link, Outlet } from 'react-router-dom'
import Home from '../pages/Home'
import About from '../pages/About'
import Disbursements from '../pages/Disbursements'
import DisbursementDetail from '../pages/DisbursementDetail'
import Login from '../pages/Login'
import Dashboard from '../pages/Dashboard'
import NotFound from '../pages/NotFound'

function AppLayout() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>DTMIS</h1>
          <p>Disbursement Tracking Management Information System</p>
        </div>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/login">Login</Link>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/disbursements">Disbursements</Link>
          <Link to="/about">About</Link>
        </nav>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
      <footer className="app-footer">© 2026 DTMIS</footer>
    </div>
  )
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'login', element: <Login /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'disbursements', element: <Disbursements /> },
      { path: 'disbursements/:id', element: <DisbursementDetail /> },
      { path: 'about', element: <About /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])
