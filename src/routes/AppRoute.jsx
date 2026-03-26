/* eslint-disable react-refresh/only-export-components */
import { createBrowserRouter, Link, Outlet } from 'react-router-dom'
import Disbursements from '../pages/Disbursements'
import DisbursementDetail from '../pages/DisbursementDetail'
import ArchivedDisbursements from '../pages/ArchivedDisbursements'
import Login from '../pages/Login'
import Register from '../pages/Register'
import Dashboard from '../pages/Dashboard'
import NotFound from '../pages/NotFound'
import logo from '../components/MuniLuna.png'

function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="ml-64 h-14 flex items-center justify-between px-6 bg-blue-800 border-b border-slate-200">
        <div className='flex items-center gap-2'>

        <img src={logo} alt="Logo" className="w-18 h-18 " />
        <h1 className="text-xs font-semibold text-slate-800">
          Disbursement Tracking Management Information System
        </h1>
        </div>
      </header>
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 p-4 overflow-y-auto">
        <div className="mb-4 text-center">
          <img src={logo} alt="Logo" className="mx-auto w-24 h-24" />
          <p className="mt-2 text-sm text-slate-700">
            Disbursement Tracking Management Information System
          </p>
        </div>
        <nav className="space-y-2">
          <Link to="/dashboard" className="block border border-slate-300 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800">Dashboard</Link>
          <Link to="/disbursements" className="block border border-slate-300 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800">Voucher Entry</Link>
          <Link to="/login" className="block border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">Logout</Link>
        </nav>
      </aside>


      {/* Main Content */}
      <main className="ml-64 p-4 bg-white border border-slate-200 min-h-[calc(100vh-3.5rem)]">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="ml-64 border-t border-slate-200 bg-slate-100 text-center text-slate-600 text-sm py-3">
        © 2026 DTMIS
      </footer>
    </div>
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
      { path: 'disbursements/archived', element: <ArchivedDisbursements /> },
      { path: 'disbursements/:id', element: <DisbursementDetail /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])
