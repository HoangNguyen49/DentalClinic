import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { FiEye, FiEyeOff } from "react-icons/fi";
import Header from "../../widgets/Header/Header";
import Footer from "../../widgets/Footer/Footer";
import "react-toastify/dist/ReactToastify.css";

// Regex mật khẩu: 8-100 ký tự, chữ hoa, thường, số, ký tự đặc biệt
const PASSWORD_RULE = /^(?=\S+$)(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,100}$/;

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Lấy token từ URL (?token=...)
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Nếu không có token trên URL, báo lỗi ngay
  useEffect(() => {
    if (!token) {
      toast.error("Đường dẫn không hợp lệ hoặc bị thiếu Token.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error("Token không hợp lệ. Vui lòng yêu cầu gửi lại mail.");
      return;
    }
    if (!newPassword || !confirmPassword) {
      toast.error("Vui lòng điền đầy đủ thông tin.");
      return;
    }
    if (!PASSWORD_RULE.test(newPassword)) {
      toast.error("Mật khẩu phải từ 8 ký tự, bao gồm chữ hoa, thường, số và ký tự đặc biệt.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    try {
      // Gọi API Reset Password
      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/reset-password`, {
        token,
        newPassword,
        confirmPassword
      });

      toast.success("Đổi mật khẩu thành công! Đang chuyển hướng về đăng nhập...");
      
      // Chờ 2s để user đọc thông báo rồi chuyển về Login
      setTimeout(() => navigate("/login"), 2000);

    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.message || "Đổi mật khẩu thất bại. Token có thể đã hết hạn.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Giao diện lỗi nếu ko có token
  if (!token) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 gap-4">
            <h2 className="text-2xl font-bold text-red-600">Liên kết không hợp lệ</h2>
            <p className="text-gray-600">Vui lòng kiểm tra lại email hoặc yêu cầu gửi lại link mới.</p>
            <Link to="/login" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Quay về trang chủ
            </Link>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white p-10 rounded-2xl shadow-xl max-w-md w-full space-y-6 border border-gray-200">
          
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#0D1B3E]">Đặt Lại Mật Khẩu</h2>
            <p className="text-gray-500 mt-2">Vui lòng nhập mật khẩu mới cho tài khoản của bạn.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Mật khẩu mới */}
            <div>
              <label className="block mb-1 text-sm font-semibold text-gray-700">Mật khẩu mới</label>
              <div className="relative">
                <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                />
                <div
                    className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-500"
                    onClick={() => setShowPassword(!showPassword)}
                >
                    {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </div>
              </div>
            </div>

            {/* Nhập lại mật khẩu */}
            <div>
              <label className="block mb-1 text-sm font-semibold text-gray-700">Xác nhận mật khẩu</label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#3366FF] text-white font-bold py-3 rounded-lg hover:bg-[#254EDB] transition disabled:opacity-70 shadow-md flex justify-center items-center"
            >
              {loading ? (
                 <>
                   <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                   Đang xử lý...
                 </>
              ) : "Xác Nhận Đổi Mật Khẩu"}
            </button>
          </form>
          
          <div className="text-center">
             <Link to="/login" className="text-sm text-gray-500 hover:text-[#3366FF] hover:underline">
                Hủy bỏ
             </Link>
          </div>

        </div>
      </div>
      <Footer />
    </>
  );
}

export default ResetPassword;