import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { FiEye, FiEyeOff, FiX } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import Header from "../../widgets/Header/Header";
import Footer from "../../widgets/Footer/Footer";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTranslation } from "react-i18next";

// Cập nhật Type để khớp với Backend (đã thêm phone)
type LoginResponse = {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
  userId: number;
  fullName?: string;
  email?: string;
  avatarUrl?: string;
  phone?: string; // <--- Quan trọng cho AuthGuard
  roles: string[];
};

function LoginPage() {
  const { t } = useTranslation(["login", "web"]);
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  // --- State Login ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // --- State Forgot Password Modal ---
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [isSendingLink, setIsSendingLink] = useState(false);

  // ===== 1. XỬ LÝ LOGIN =====
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(t("login:fillAll"));
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.post<LoginResponse>(
        `${API_URL}/api/auth/login`,
        { email, password },
        { withCredentials: false }
      );

      const normalizedRoles = (data.roles ?? []).map((r) =>
        r?.toString().replace(/^ROLE_/i, "").toUpperCase()
      );

      // Lưu Token
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("roles", JSON.stringify(normalizedRoles));
      
      // Lưu User Info đầy đủ (Quan trọng cho các Guard và trang khác)
      localStorage.setItem("user", JSON.stringify({
          userId: data.userId,
          fullName: data.fullName,
          email: data.email,
          avatarUrl: data.avatarUrl,
          phone: data.phone,        // Lưu SĐT để AuthGuard check
          hasPassword: true,        // Login thường -> Chắc chắn có pass
          provider: "local",        // Provider là local
          roles: normalizedRoles
      }));

      axios.defaults.headers.common["Authorization"] = `Bearer ${data.accessToken}`;

      toast.success(t("login:loginSuccess"));
      
      // Điều hướng thông minh
      setTimeout(() => {
        // Nếu chưa có SĐT (trường hợp hiếm) -> Về trang cập nhật
        if (!data.phone || data.phone.trim() === "") {
            navigate("/my-account", { state: { forceUpdate: true } });
        } else {
            // Phân quyền điều hướng
            if (normalizedRoles.includes("ADMIN")) navigate("/admin/dashboard");
            else if (normalizedRoles.includes("HR")) navigate("/hr/dashboard");
            else if(normalizedRoles.includes("RECEPTION")) navigate("/reception/dashboard");
            else navigate("/");
        }
      }, 1500);

    } catch (err: any) {
      const msg = err?.response?.data?.message;
      if (Array.isArray(msg)) msg.forEach((m: string) => toast.error(m));
      else toast.error(msg || t("login:loginFailed"));
    } finally {
      setLoading(false);
    }
  };

  // ===== 2. XỬ LÝ GỬI LINK QUÊN MẬT KHẨU =====
  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      toast.error("Please enter your email.");
      return;
    }

    setIsSendingLink(true);
    try {
      await axios.post(`${API_URL}/api/auth/forgot-password`, { 
        email: forgotEmail 
      });
      
      toast.success("Reset link sent! Please check your email.");
      setShowForgotModal(false);
      setForgotEmail("");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to send reset link.");
    } finally {
      setIsSendingLink(false);
    }
  };

  return (
    <>
      <Header />
      <ToastContainer position="top-right" autoClose={5000} />
      
      <div className="min-h-screen flex items-center justify-center bg-white p-16">
        <div className="flex w-full max-w-7xl rounded-[2rem] shadow-2xl border-4 border-gray-300 overflow-hidden relative">
          
          {/* Left panel */}
          <div className="hidden md:flex w-1/2 bg-gradient-to-br from-[#0D1B3E] to-[#3366FF] items-center justify-center text-white p-20">
            <div className="text-center space-y-6">
              <h1 className="text-5xl font-bold">{t("login:pageTitle")}</h1>
              <p className="text-lg">{t("login:pageSubtitle")}</p>
            </div>
          </div>

          {/* Right panel (form) */}
          <div className="flex w-full md:w-1/2 flex-col items-center justify-center bg-white p-16 space-y-6">
            <form onSubmit={handleLogin} className="w-full max-w-md space-y-6">
              <h2 className="text-3xl font-bold text-center">{t("login:formTitle")}</h2>

              <div>
                <label className="block mb-1 text-sm font-medium">{t("login:Email")}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="w-full border rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#3366FF] text-base"
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium">{t("login:password")}</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="w-full border rounded px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-[#3366FF] text-base"
                  />
                  <div
                    className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-500 hover:text-[#3366FF]"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#3366FF] text-white font-semibold py-3 rounded hover:bg-[#254EDB] transition text-base disabled:opacity-60"
              >
                {loading ? t("login:loggingIn") : t("login:loginNow")}
              </button>

              {/* OAuth Google */}
              <button
                type="button"
                onClick={() => (window.location.href = `${API_URL}/api/auth/google`)}
                className="w-full flex items-center justify-center border rounded py-3 bg-white hover:bg-gray-100 transition text-base shadow"
              >
                <FcGoogle className="mr-2" size={24} /> {t("login:google")}
              </button>

              <div className="text-center space-y-2">
                <p className="text-sm">
                  {t("login:noAccount")}{" "}
                  <Link to="/register" className="text-[#3366FF] hover:underline font-semibold">
                    {t("login:signUp")}
                  </Link>
                </p>
                
                {/* Nút Forgot Password mở Modal */}
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-sm text-gray-500 hover:text-[#3366FF] hover:underline"
                >
                  Forgot Password?
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>

      {/* ===== FORGOT PASSWORD MODAL ===== */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md relative animate-fade-in-up">
            
            <button 
                onClick={() => setShowForgotModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
            >
                <FiX size={24} />
            </button>

            <h3 className="text-2xl font-bold mb-2 text-[#0D1B3E]">Reset Password</h3>
            <p className="text-gray-600 mb-6 text-sm">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            <form onSubmit={handleSendResetLink} className="space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Email Address</label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#3366FF]"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingLink}
                  className="px-6 py-2 bg-[#3366FF] text-white rounded-lg hover:bg-[#254EDB] transition font-medium disabled:opacity-70 flex items-center"
                >
                  {isSendingLink ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                      Sending...
                    </>
                  ) : (
                    "Send Link"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}

export default LoginPage;