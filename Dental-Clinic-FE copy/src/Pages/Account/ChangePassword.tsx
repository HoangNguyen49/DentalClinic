import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import Header from "../../widgets/Header/Header";
import Footer from "../../widgets/Footer/Footer";
import "react-toastify/dist/ReactToastify.css";

const PASSWORD_RULE = /^(?=\S+$)(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,100}$/;

// Định nghĩa kiểu dữ liệu trả về từ API /me
type UserProfile = {
  userId: number;
  hasPassword?: boolean; // Trường quan trọng
  email: string;
};

function ChangePassword() {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;
  
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [loading, setLoading] = useState(false); // Loading khi submit
  const [fetching, setFetching] = useState(true); // Loading khi lấy thông tin user
  
  // State quyết định giao diện: True = Hiện 3 ô, False = Hiện 2 ô
  const [hasPassword, setHasPassword] = useState(true); 

  // 1. KHI VÀO TRANG: GỌI API KIỂM TRA TRẠNG THÁI MỚI NHẤT
  useEffect(() => {
    const checkUserStatus = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const { data } = await axios.get<UserProfile>(`${API_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Cập nhật state dựa trên DB thực tế
        setHasPassword(!!data.hasPassword); 

        // Đồng bộ lại localStorage để các trang khác dùng chung
        const localUser = localStorage.getItem("user");
        if (localUser) {
            const parsed = JSON.parse(localUser);
            parsed.hasPassword = data.hasPassword;
            localStorage.setItem("user", JSON.stringify(parsed));
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to verify account status.");
      } finally {
        setFetching(false);
      }
    };

    checkUserStatus();
  }, [API_URL, navigate]);

  // 2. XỬ LÝ SUBMIT
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in new password fields.");
      return;
    }
    
    // Chỉ bắt buộc nhập pass cũ nếu hệ thống xác nhận user ĐÃ CÓ password
    if (hasPassword && !oldPassword) {
        toast.error("Current password is required.");
        return;
    }

    if (hasPassword && oldPassword === newPassword) {
      toast.error("New password must be different from current.");
      return;
    }
    if (!PASSWORD_RULE.test(newPassword)) {
      toast.error("Password must be 8-100 chars, include upper, lower, digit, special char.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Confirm password must match.");
      return;
    }

    try {
      setLoading(true);
      const accessToken = localStorage.getItem("accessToken");

      await axios.post<{ message?: string }>(
        `${API_URL}/api/auth/change-password`,
        {
          // Nếu chưa có pass -> gửi chuỗi rỗng để Backend bỏ qua check
          currentPassword: hasPassword ? oldPassword : "", 
          newPassword: newPassword,
          confirmNewPassword: confirmPassword,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      toast.success("Password updated successfully!");
      
      // 3. QUAN TRỌNG: CẬP NHẬT STATE NGAY LẬP TỨC
      // Sau bước này, user đã có mật khẩu -> Set hasPassword = true
      // Để nếu user ở lại trang này hoặc quay lại sau, họ sẽ thấy form đầy đủ (3 ô)
      setHasPassword(true);
      
      // Clear form
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Chuyển trang sau 1.5s
      setTimeout(() => navigate("/my-account"), 1500);

    } catch (err: any) {
      const res = err?.response?.data;
      let msg = (Array.isArray(res?.errors) && res.errors.join(", ")) || res?.message || "Error changing password";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
      return <div className="min-h-screen flex items-center justify-center">Loading user info...</div>;
  }

  return (
    <>
      <Header />
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="min-h-screen flex justify-center items-center bg-gray-100 p-6">
        <form
          onSubmit={handleChangePassword}
          className="bg-white p-8 rounded-2xl shadow-md max-w-md w-full space-y-6"
        >
          <h2 className="text-2xl font-bold text-center">
            {hasPassword ? "Change Password" : "Set Password"}
          </h2>
          
          {/* Thông báo chỉ hiện khi chưa có pass */}
          {!hasPassword && (
              <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-sm text-center border border-blue-100">
                  Bạn đang sử dụng tài khoản Google chưa có mật khẩu. Vui lòng thiết lập mật khẩu mới.
              </div>
          )}

          {/* ẨN/HIỆN ô Current Password dựa trên state hasPassword */}
          {hasPassword && (
            <div>
                <label className="block mb-1 text-sm font-semibold text-gray-700">Current Password</label>
                <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full px-4 py-2 border rounded focus:outline-blue-500"
                    placeholder="Enter current password"
                />
            </div>
          )}

          <div>
            <label className="block mb-1 text-sm font-semibold text-gray-700">New Password</label>
            <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded focus:outline-blue-500"
                placeholder="Enter new password"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-semibold text-gray-700">Confirm Password</label>
            <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded focus:outline-blue-500"
                placeholder="Confirm new password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#3366FF] text-white py-2 rounded hover:bg-[#254EDB] transition disabled:opacity-60 font-bold"
          >
            {loading ? "Processing..." : (hasPassword ? "Update Password" : "Set Password")}
          </button>
        </form>
      </div>
      <Footer />
    </>
  );
}

export default ChangePassword;