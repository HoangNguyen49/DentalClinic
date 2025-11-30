import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";

type UserInfo = {
  userId: number;
  fullName: string;
  email: string;
  phone?: string;
  username?: string;
  avatarUrl?: string;
  roles?: string[];
  hasPassword?: boolean;
};

function OAuthSuccessHandler() {
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL;
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    (async () => {
      const params = new URLSearchParams(window.location.search);
      const accessToken = params.get("access_token");

      if (!accessToken) {
        toast.error("Đăng nhập thất bại (Không có token).");
        navigate("/login", { replace: true });
        return;
      }

      try {
        // 1. Lưu token
        localStorage.setItem("accessToken", accessToken);
        axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

        // 2. Lấy thông tin User mới nhất
        const { data } = await axios.get<UserInfo>(`${API}/api/users/me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        localStorage.setItem("user", JSON.stringify(data));
        localStorage.setItem("roles", JSON.stringify(data.roles ?? []));

        // Xóa token trên URL cho sạch
        window.history.replaceState({}, document.title, window.location.pathname);

        // 3. KIỂM TRA SỐ ĐIỆN THOẠI (Logic quan trọng nhất)
        const isMissingPhone = !data.phone || data.phone.trim() === "";
        
        const targetPath = isMissingPhone ? "/my-account" : "/";
        
        // Nếu thiếu thông tin, truyền state forceUpdate = true
        const navOptions = isMissingPhone 
            ? { state: { forceUpdate: true }, replace: true } 
            : { replace: true };

        const hasContainer = typeof document !== "undefined" && !!document.querySelector(".Toastify");

        if (hasContainer) {
          if (!toast.isActive("oauth-success")) {
            if (isMissingPhone) {
                toast.info("Đăng nhập thành công! Vui lòng cập nhật số điện thoại.", {
                    toastId: "oauth-success",
                    autoClose: 2500,
                    closeOnClick: true,
                    onClose: () => navigate(targetPath, navOptions),
                });
            } else {
                toast.success("Đăng nhập thành công!", {
                    toastId: "oauth-success",
                    autoClose: 1200,
                    closeOnClick: true,
                    onClose: () => navigate(targetPath, navOptions),
                });
            }
          }
        } else {
          setTimeout(() => navigate(targetPath, navOptions), 300);
        }

      } catch (err) {
        console.error(err);
        toast.error("Lỗi lấy thông tin người dùng.");
        navigate("/login", { replace: true });
      }
    })();
  }, [navigate, API]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Đang xử lý đăng nhập...</p>
        </div>
    </div>
  );
}

export default OAuthSuccessHandler;