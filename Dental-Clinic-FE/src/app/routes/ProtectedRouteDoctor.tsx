import { Navigate, Outlet } from "react-router-dom";
import { getToken, getRoles } from "./shared/auth";
import { ToastContainer, toast } from "react-toastify";

export default function ProtectedRouteDoctor() {
  const token = getToken();;
  const roles = getRoles()
  const hasDoctor = roles.includes("DOCTOR");

  if (!token) return <Navigate to="/login" replace />;
  if (!hasDoctor) {
    toast.error("You do not have permission to access this page.");
    return (
      <>
        <ToastContainer position="top-right" autoClose={3000} />
        <Navigate to="/" replace />
      </>
    );
  }
  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <Outlet />
    </>
  );
}