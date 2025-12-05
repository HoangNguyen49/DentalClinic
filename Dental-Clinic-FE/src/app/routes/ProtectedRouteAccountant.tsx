// ProtectedRouteAccountant.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useEffect } from "react";
import { getToken, hasRole } from "./shared/auth";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ProtectedRouteAccountant() {
  const token = getToken();
  const isAccountant = hasRole("ACCOUNTANT");

  useEffect(() => {
    if (!token) return;
    if (token && !isAccountant) {
      toast.error(
        "You do not have permission to access this page. Only users with the ACCOUNTANT role are allowed."
      );
    }
  }, [token, isAccountant]);

  // Chưa đăng nhập → về /login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Đã đăng nhập nhưng không phải accountant → về trang chủ
  if (!isAccountant) {
    return (
      <>
        <ToastContainer position="top-right" autoClose={3000} />
        <Navigate to="/" replace />
      </>
    );
  }

  // Đúng quyền → cho vào
  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <Outlet />
    </>
  );
}
