import { Navigate, Outlet } from "react-router-dom";
import { useEffect } from "react";
import { getToken, getRoles } from "./shared/auth";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Bảo vệ route chỉ dành cho users có role HR
export default function ProtectedRouteHR() {
  const token = getToken();
  const roles = getRoles();
  const hasHRRole = roles.includes("HR");

  // useEffect để thông báo lỗi cho user khi không đủ quyền HR
  useEffect(() => {
    if (!token) {
      return;
    }
    if (token && !hasHRRole) {
      toast.error("You do not have permission to access this page. Only users with the HR role are allowed."); // Thông báo lỗi truy cập (chỉ HR được phép)
    }
  }, [hasHRRole, token]);

  // Kiểm tra đăng nhập, nếu chưa thì chuyển về login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Nếu đã đăng nhập nhưng không có quyền HR thì chuyển về trang chủ
  if (!hasHRRole) {
    return (
      <>
        <ToastContainer position="top-right" autoClose={3000} />
        <Navigate to="/" replace />
      </>
    );
  }

  // Nếu hợp lệ, render nội dung cho HR
  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <Outlet />
    </>
  );
}
