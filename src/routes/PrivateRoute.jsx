import { Navigate } from "react-router-dom";
import { getCurrentUser } from "../api";

export default function PrivateRoute({ children, allowedDepartments }) {
  const user = getCurrentUser();

  // 1. Check Authentication: If no user, send to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 2. Check Authorization: If route is restricted, check their department
  if (allowedDepartments && !allowedDepartments.includes(user.department)) {
    // If they are unauthorized, send Admins to admin dashboard, others to regular dashboard
    if (user.department === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  // 3. All good! Render the requested page
  return children;
}