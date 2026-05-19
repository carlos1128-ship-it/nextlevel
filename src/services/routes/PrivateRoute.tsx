import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";

export function PrivateRoute({ children }: { children: ReactNode }) {
  const hasSession = Boolean(localStorage.getItem("auth_user"));

  if (!hasSession) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
