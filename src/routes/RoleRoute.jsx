import { Navigate } from "react-router-dom"

export default function RoleRoute({ children, allowAdmin = true }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}")

  // block admin from user pages
  if (!allowAdmin && user?.is_admin) {
    return <Navigate to="/admin-dashboard" />
  }

  // block normal users from admin pages
  if (allowAdmin && user && !user.is_admin) {
    return <Navigate to="/dashboard" />
  }

  return children
}