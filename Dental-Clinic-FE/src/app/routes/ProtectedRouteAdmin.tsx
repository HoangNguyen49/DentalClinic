// ProtectedRoute “generic” cho nhiều role khác nhau để tái sử dụng

import { Navigate, Outlet } from "react-router-dom";
import { getToken, getRoles } from "../routes/shared/auth";

type Props = {
  anyOf?: string[]; // ["ADMIN", "RECEPTIONIST",.....]
};

export default function ProtectedRoute({ anyOf }: Props) {
  const token = getToken();
  if (!token) return <Navigate to="/login" replace />;

  if (anyOf && anyOf.length > 0) {
    const roles = getRoles();
    const ok = anyOf
      .map(r => r.toUpperCase())
      .some(r => roles.includes(r));
    if (!ok) return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
