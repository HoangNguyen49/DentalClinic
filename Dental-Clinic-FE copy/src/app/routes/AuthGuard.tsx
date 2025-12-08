import { Navigate, Outlet, useLocation } from "react-router-dom";

const AuthGuard = () => {
  const token = localStorage.getItem("accessToken");
  const userStr = localStorage.getItem("user");
  
  let user = null;
  try {
    user = userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    console.error("Lỗi parse user từ localStorage", e);
    user = null;
  }

  const location = useLocation();

  // 1. Kiểm tra đăng nhập: Nếu chưa có token -> Về Login
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Kiểm tra thông tin bắt buộc (Số điện thoại)
  // Nếu thiếu SĐT VÀ đang cố truy cập trang khác ngoài /my-account
  const isMissingPhone = !user?.phone || user.phone.toString().trim() === "";
  
  if (isMissingPhone && location.pathname !== "/my-account") {
    // Chuyển hướng cưỡng ép về trang cập nhật
    return <Navigate to="/my-account" state={{ forceUpdate: true }} replace />;
  }

  // 3. Hợp lệ -> Cho phép truy cập
  return <Outlet />;
};

export default AuthGuard;