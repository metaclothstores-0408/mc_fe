import { Navigate, useLocation } from "react-router-dom";
import { getAccessToken, getUser } from "../lib/storage";

export default function ProtectedRoute({
  children,
  adminOnly = false,
}) {
  const location = useLocation();

  const token = getAccessToken();
  const user = getUser();

  // Not logged in
  if (!token || !user) {
    return (
      <Navigate
        to={adminOnly ? "/admin/login" : "/login"}
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  // Admin-only page
  if (adminOnly && user.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  return children;
}