import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { FiEye, FiEyeOff } from "react-icons/fi";
import Header from "../../widgets/Header/Header";
import Footer from "../../widgets/Footer/Footer";
import "react-toastify/dist/ReactToastify.css";
// 1. Import hook
import { useTranslation } from "react-i18next";

// Regex mật khẩu: 8-100 ký tự, chữ hoa, thường, số, ký tự đặc biệt
const PASSWORD_RULE = /^(?=\S+$)(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,100}$/;

function ResetPassword() {
  // 2. Sử dụng namespace "login"
  const { t } = useTranslation(["login"]);
  
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
      toast.error(t("login:reset.errorToken"));
    }
  }, [token, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error(t("login:reset.errorToken"));
      return;
    }
    if (!newPassword || !confirmPassword) {
      toast.error(t("login:reset.errorEmpty"));
      return;
    }
    if (!PASSWORD_RULE.test(newPassword)) {
      toast.error(t("login:reset.errorRule"));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t("login:reset.errorMatch"));
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

      toast.success(t("login:reset.success"));
      
      // Chờ 2s để user đọc thông báo rồi chuyển về Login
      setTimeout(() => navigate("/login"), 2000);

    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.message || t("login:reset.failed");
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
            <h2 className="text-2xl font-bold text-red-600">{t("login:reset.errorTokenTitle")}</h2>
            <p className="text-gray-600">{t("login:reset.errorTokenMsg")}</p>
            <Link to="/login" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                {t("login:reset.btnHome")}
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
            <h2 className="text-3xl font-bold text-[#0D1B3E]">{t("login:reset.title")}</h2>
            <p className="text-gray-500 mt-2">{t("login:reset.subtitle")}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Mật khẩu mới */}
            <div>
              <label className="block mb-1 text-sm font-semibold text-gray-700">{t("login:reset.newPass")}</label>
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
              <label className="block mb-1 text-sm font-semibold text-gray-700">{t("login:reset.confirmPass")}</label>
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
                   {t("login:reset.processing")}
                 </>
              ) : t("login:reset.btnSubmit")}
            </button>
          </form>
          
          <div className="text-center">
             <Link to="/login" className="text-sm text-gray-500 hover:text-[#3366FF] hover:underline">
                {t("login:reset.cancel")}
             </Link>
          </div>

        </div>
      </div>
      <Footer />
    </>
  );
}

export default ResetPassword;