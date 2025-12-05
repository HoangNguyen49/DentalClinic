import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { FiEye, FiEyeOff, FiX, FiPhone, FiMail, FiLock, FiMessageSquare } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import Header from "../../widgets/Header/Header";
import Footer from "../../widgets/Footer/Footer";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTranslation } from "react-i18next";

// Định nghĩa kiểu dữ liệu phản hồi từ API Login
type LoginResponse = {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
  userId: number;
  fullName?: string;
  email?: string;
  avatarUrl?: string;
  phone?: string;
  roles: string[];
};

function LoginPage() {
  const { t } = useTranslation(["login", "web"]);
  const navigate = useNavigate();
  // Lấy API URL từ biến môi trường Vite
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

  // --- QUẢN LÝ TRẠNG THÁI TABS ---
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [phoneMode, setPhoneMode] = useState<'password' | 'otp'>('password');

  // --- DỮ LIỆU FORM ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");

  // --- TRẠNG THÁI UI ---
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  
  // --- ĐẾM NGƯỢC OTP ---
  const [countdown, setCountdown] = useState(0); 

  // --- MODAL QUÊN MẬT KHẨU ---
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [isSendingLink, setIsSendingLink] = useState(false);

  // --- EFFECT ĐẾM NGƯỢC THỜI GIAN ---
  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // --- HÀM GỬI LẠI EMAIL KÍCH HOẠT ---
  const handleResendVerification = async (emailToResend: string) => {
      try {
          await axios.post(`${API_URL}/api/auth/resend-verification`, { email: emailToResend });
          toast.success("Đã gửi lại email kích hoạt! Vui lòng kiểm tra hộp thư.");
      } catch (error) {
          toast.error("Gửi lại thất bại. Vui lòng thử lại sau.");
      }
  };

  // =================================================================
  // HÀM XỬ LÝ KHI ĐĂNG NHẬP THÀNH CÔNG (CORE LOGIC)
  // =================================================================
  const handleLoginSuccess = (data: LoginResponse) => {
    // 1. Chuẩn hóa role (Bỏ chữ ROLE_ nếu có và viết hoa)
    const normalizedRoles = (data.roles ?? []).map((r) =>
      r?.toString().replace(/^ROLE_/i, "").toUpperCase()
    );

    // 2. Lưu thông tin vào LocalStorage
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("roles", JSON.stringify(normalizedRoles));
    
    // Lưu User Info đầy đủ (Gộp logic của cả Tuấn và Long)
    localStorage.setItem("user", JSON.stringify({
      userId: data.userId,
      fullName: data.fullName,
      email: data.email,
      avatarUrl: data.avatarUrl,
      phone: data.phone,
      hasPassword: true, // Mặc định true khi login thường
      provider: "local",
      roles: normalizedRoles
    }));

    // 3. Cập nhật header cho axios
    axios.defaults.headers.common["Authorization"] = `Bearer ${data.accessToken}`;
    toast.success(t("login:loginSuccess"));

    // 4. ĐIỀU HƯỚNG (MERGE LOGIC CỦA LONG VÀO ĐÂY)
    setTimeout(() => {
      // Nếu chưa có SĐT -> Bắt buộc cập nhật (Logic của Tuấn)
      if (!data.phone || data.phone.trim() === "") {
        navigate("/my-account", { state: { forceUpdate: true } });
      } else {
        // Phân quyền điều hướng (Đã thêm RECEPTION của Long)
        if (normalizedRoles.includes("ADMIN")) navigate("/admin/dashboard");
        else if (normalizedRoles.includes("HR")) navigate("/hr/dashboard");
        else if (normalizedRoles.includes("RECEPTION")) navigate("/reception/dashboard"); // <-- MỚI THÊM CỦA LONG
        else if (normalizedRoles.includes("DOCTOR")) navigate("/doctor/schedule");
        else navigate("/"); // User thường về trang chủ
      }
    }, 1500);
  };

  // =================================================================
  // HELPER XỬ LÝ LỖI
  // =================================================================
  const handleLoginError = (err: any) => {
    const msg = err?.response?.data?.message || t("login:loginFailed");
    
    // Kiểm tra lỗi KHÓA TÀI KHOẢN
    if (typeof msg === 'string' && (msg.toLowerCase().includes("locked") || msg.toLowerCase().includes("khóa"))) {
        toast.error(
            <div className="flex flex-col">
                <span className="font-bold text-base">⚠️ Tài khoản đã bị khóa!</span>
                <span className="text-sm mb-3 mt-1">{msg}</span>
                <button 
                    onClick={() => setShowForgotModal(true)} 
                    className="bg-white text-red-600 px-4 py-2 rounded text-sm font-bold border border-red-200 hover:bg-red-50 transition shadow-sm self-start"
                >
                    👉 Mở khóa ngay (Quên mật khẩu)
                </button>
            </div>, 
            { autoClose: 10000, closeOnClick: false } 
        );
        return;
    }

    // Kiểm tra lỗi CHƯA KÍCH HOẠT EMAIL
    if (typeof msg === 'string' && (msg.toLowerCase().includes("not active") || msg.toLowerCase().includes("chưa được kích hoạt"))) {
        toast.error(
            <div className="flex flex-col">
                <span className="font-bold text-base">⚠️ Tài khoản chưa kích hoạt</span>
                <span className="text-sm mb-3 mt-1">{msg}</span>
                <button 
                    onClick={() => handleResendVerification(email)} 
                    className="bg-white text-blue-600 px-4 py-2 rounded text-sm font-bold border border-blue-200 hover:bg-blue-50 transition shadow-sm self-start"
                >
                    📧 Gửi lại email kích hoạt
                </button>
            </div>, 
            { autoClose: 10000, closeOnClick: false } 
        );
        return;
    }

    // Lỗi thông thường
    if (Array.isArray(msg)) msg.forEach((m: string) => toast.error(m));
    else toast.error(msg);
  };

  // =================================================================
  // 1. ĐĂNG NHẬP EMAIL
  // =================================================================
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error(t("login:fillAll"));
    
    setLoading(true);
    try {
      const { data } = await axios.post<LoginResponse>(`${API_URL}/api/auth/login`, { email, password });
      handleLoginSuccess(data);
    } catch (err: any) {
      handleLoginError(err);
    } finally {
      setLoading(false);
    }
  };

  // =================================================================
  // 2. ĐĂNG NHẬP SĐT + MẬT KHẨU
  // =================================================================
  const handlePhonePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) return toast.error("Vui lòng nhập số điện thoại và mật khẩu");

    setLoading(true);
    try {
      const { data } = await axios.post<LoginResponse>(`${API_URL}/api/auth/login-phone/password`, { phone, password });
      handleLoginSuccess(data);
    } catch (err: any) {
      handleLoginError(err);
    } finally {
      setLoading(false);
    }
  };

  // =================================================================
  // 3. ĐĂNG NHẬP SĐT + OTP
  // =================================================================
  const handleSendOtp = async () => {
    if (!phone) return toast.error("Vui lòng nhập số điện thoại");
    
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/login-phone/step1`, { phone });
      setOtpSent(true);
      setCountdown(60);
      toast.info("Mã OTP đã được gửi!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Gửi OTP thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !otp) return toast.error("Vui lòng nhập mã OTP");

    setLoading(true);
    try {
      const { data } = await axios.post<LoginResponse>(`${API_URL}/api/auth/login-phone/step2`, { phone, otp });
      handleLoginSuccess(data);
    } catch (err: any) {
      handleLoginError(err);
    } finally {
      setLoading(false);
    }
  };

  // =================================================================
  // 4. QUÊN MẬT KHẨU (GỬI MAIL)
  // =================================================================
  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return toast.error("Please enter your email.");

    setIsSendingLink(true);
    try {
      await axios.post(`${API_URL}/api/auth/forgot-password`, { email: forgotEmail });
      toast.success("Link đặt lại mật khẩu đã được gửi! Vui lòng kiểm tra email.");
      setShowForgotModal(false);
      setForgotEmail("");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Gửi yêu cầu thất bại.");
    } finally {
      setIsSendingLink(false);
    }
  };

  return (
    <>
      <Header />
      <ToastContainer position="top-right" autoClose={5000} />
      
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6 md:p-16 font-instrument">
        <div className="flex w-full max-w-6xl rounded-[2rem] shadow-2xl bg-white overflow-hidden relative border border-gray-200">
          
          {/* CỘT TRÁI */}
          <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#0D1B3E] to-[#3366FF] items-center justify-center text-white p-12 relative overflow-hidden">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
             <div className="relative z-10 text-center space-y-6">
                <h1 className="text-5xl font-bold leading-tight">{t("login:pageTitle")}</h1>
                <p className="text-lg text-blue-100 max-w-md mx-auto">{t("login:pageSubtitle")}</p>
             </div>
          </div>

          {/* CỘT PHẢI */}
          <div className="flex w-full lg:w-1/2 flex-col items-center justify-center p-8 md:p-16 space-y-6">
            
            <div className="w-full max-w-md space-y-6">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-800">{t("login:formTitle")}</h2>
                    <p className="text-gray-500 mt-2">Welcome back! Please enter your details.</p>
                </div>

                {/* TAB SWITCHER */}
                <div className="flex p-1 bg-gray-100 rounded-xl">
                    <button
                        onClick={() => setLoginMethod('email')}
                        className={`flex-1 flex items-center justify-center py-2.5 text-sm font-semibold rounded-lg transition-all ${
                            loginMethod === 'email' ? 'bg-white text-[#3366FF] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <FiMail className="mr-2" /> Email
                    </button>
                    <button
                        onClick={() => setLoginMethod('phone')}
                        className={`flex-1 flex items-center justify-center py-2.5 text-sm font-semibold rounded-lg transition-all ${
                            loginMethod === 'phone' ? 'bg-white text-[#3366FF] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <FiPhone className="mr-2" /> Phone Number
                    </button>
                </div>

                {/* FORM EMAIL */}
                {loginMethod === 'email' && (
                    <form onSubmit={handleEmailLogin} className="space-y-5 animate-fade-in-up">
                        <div>
                            <label className="block mb-1.5 text-sm font-medium text-gray-700">{t("login:Email")}</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#3366FF] focus:border-transparent transition"
                                placeholder="Enter your email"
                            />
                        </div>
                        <div>
                            <label className="block mb-1.5 text-sm font-medium text-gray-700">{t("login:password")}</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-[#3366FF] focus:border-transparent transition"
                                    placeholder="••••••••"
                                />
                                <div
                                    className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-400 hover:text-[#3366FF]"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button type="button" onClick={() => setShowForgotModal(true)} className="text-sm font-medium text-[#3366FF] hover:underline">
                                Forgot Password?
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#3366FF] text-white font-bold py-3.5 rounded-lg hover:bg-[#254EDB] transition shadow-lg shadow-blue-200 disabled:opacity-70"
                        >
                            {loading ? t("login:loggingIn") : t("login:loginNow")}
                        </button>
                    </form>
                )}

                {/* FORM PHONE */}
                {loginMethod === 'phone' && (
                    <div className="space-y-5 animate-fade-in-up">
                        <div className="flex justify-center space-x-6 text-sm">
                            <button 
                                onClick={() => setPhoneMode('password')}
                                className={`pb-1 border-b-2 font-medium transition ${phoneMode === 'password' ? 'border-[#3366FF] text-[#3366FF]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                            >
                                Use Password
                            </button>
                            <button 
                                onClick={() => setPhoneMode('otp')}
                                className={`pb-1 border-b-2 font-medium transition ${phoneMode === 'otp' ? 'border-[#3366FF] text-[#3366FF]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                            >
                                Use OTP Code
                            </button>
                        </div>

                        <div>
                            <label className="block mb-1.5 text-sm font-medium text-gray-700">Phone Number</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-3 flex items-center text-gray-500">
                                    <FiPhone />
                                </span>
                                <input
                                    type="text"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    disabled={otpSent && phoneMode === 'otp'}
                                    className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#3366FF] focus:border-transparent transition disabled:bg-gray-100"
                                    placeholder="0912345678"
                                />
                            </div>
                        </div>

                        {phoneMode === 'password' && (
                            <form onSubmit={handlePhonePasswordLogin} className="space-y-5">
                                <div>
                                    <label className="block mb-1.5 text-sm font-medium text-gray-700">Password</label>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-3 flex items-center text-gray-500">
                                            <FiLock />
                                        </span>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg pl-10 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-[#3366FF] focus:border-transparent transition"
                                            placeholder="••••••••"
                                        />
                                        <div
                                            className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-400 hover:text-[#3366FF]"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#3366FF] text-white font-bold py-3.5 rounded-lg hover:bg-[#254EDB] transition shadow-lg shadow-blue-200 disabled:opacity-70"
                                >
                                    {loading ? "Logging In..." : "Login with Password"}
                                </button>
                            </form>
                        )}

                        {phoneMode === 'otp' && (
                            <div className="space-y-5">
                                {otpSent && (
                                    <div className="animate-fade-in-up">
                                        <label className="block mb-1.5 text-sm font-medium text-gray-700">OTP Code</label>
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-3 flex items-center text-gray-500">
                                                <FiMessageSquare />
                                            </span>
                                            <input
                                                type="text"
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#3366FF] focus:border-transparent transition tracking-widest font-bold text-center"
                                                placeholder="123456"
                                                maxLength={6}
                                            />
                                        </div>
                                        <div className="text-right mt-1">
                                            <button 
                                                onClick={() => { setOtpSent(false); setOtp(""); setCountdown(0); }}
                                                className="text-xs text-[#3366FF] hover:underline"
                                            >
                                                Change Phone Number?
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {!otpSent ? (
                                    <button
                                        onClick={handleSendOtp}
                                        disabled={loading || !phone || countdown > 0}
                                        className="w-full bg-gray-800 text-white font-bold py-3.5 rounded-lg hover:bg-black transition shadow-lg disabled:opacity-70 flex justify-center items-center"
                                    >
                                        {loading ? "Sending..." : (countdown > 0 ? `Resend OTP in ${countdown}s` : "Get OTP Code")}
                                    </button>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        <button
                                            onClick={handleOtpLogin}
                                            disabled={loading || !otp}
                                            className="w-full bg-[#3366FF] text-white font-bold py-3.5 rounded-lg hover:bg-[#254EDB] transition shadow-lg shadow-blue-200 disabled:opacity-70"
                                        >
                                            {loading ? "Verifying..." : "Login with OTP"}
                                        </button>
                                        
                                        <button 
                                            onClick={handleSendOtp} 
                                            disabled={loading || countdown > 0}
                                            className="text-sm text-gray-500 hover:text-gray-800 disabled:text-gray-300"
                                        >
                                            {countdown > 0 ? `Resend OTP in ${countdown}s` : "Resend OTP"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* GOOGLE LOGIN */}
                <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-gray-300"></div>
                    <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">Or continue with</span>
                    <div className="flex-grow border-t border-gray-300"></div>
                </div>

                <button
                    type="button"
                    onClick={() => (window.location.href = `${API_URL}/api/auth/google`)}
                    className="w-full flex items-center justify-center border border-gray-300 rounded-lg py-3 bg-white hover:bg-gray-50 transition text-gray-700 font-medium shadow-sm"
                >
                    <FcGoogle className="mr-2" size={24} /> {t("login:google")}
                </button>

                <div className="text-center mt-6">
                    <p className="text-sm text-gray-600">
                        {t("login:noAccount")}{" "}
                        <Link to="/register" className="text-[#3366FF] hover:underline font-bold">
                            {t("login:signUp")}
                        </Link>
                    </p>
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* FORGOT PASSWORD MODAL */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md relative animate-fade-in-up">
            <button 
                onClick={() => setShowForgotModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
            >
                <FiX size={24} />
            </button>
            <h3 className="text-2xl font-bold mb-2 text-[#0D1B3E]">Reset Password</h3>
            <p className="text-gray-600 mb-6 text-sm">Enter your email address and we'll send you a link to unlock your account.</p>
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
                <button type="button" onClick={() => setShowForgotModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition font-medium">Cancel</button>
                <button type="submit" disabled={isSendingLink} className="px-6 py-2 bg-[#3366FF] text-white rounded-lg hover:bg-[#254EDB] transition font-medium disabled:opacity-70">{isSendingLink ? "Sending..." : "Send Link"}</button>
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