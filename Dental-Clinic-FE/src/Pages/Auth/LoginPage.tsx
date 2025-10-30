import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import Header from "../../widgets/Header/Header";
import Footer from "../../widgets/Footer/Footer";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTranslation } from "react-i18next";

type LoginResponse = {
  accessToken: string;
  tokenType: string; // "Bearer"
  expiresInSeconds: number;
  userId: number;
  fullName?: string;
  email?: string;
  avatarUrl?: string;
  roles: string[];
};

function LoginPage() {
  const { t } = useTranslation(["login", "web"]);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(t("login:fillAll"));
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.post<LoginResponse>(
        `${import.meta.env.VITE_API_URL}/api/auth/login`,
        { email, password },
        { withCredentials: false } // JWT Bearer không cần cookie
      );

      const normalizedRoles = (data.roles ?? []).map((r) =>
        r
          ?.toString()
          .replace(/^ROLE_/i, "")
          .toUpperCase()
      );

      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("roles", JSON.stringify(normalizedRoles));
      localStorage.setItem(
        "user",
        JSON.stringify({
          userId: data.userId,
          fullName: data.fullName,
          email: data.email,
          avatarUrl: data.avatarUrl,
        })
      );

      axios.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${data.accessToken}`;

      toast.success(t("login:loginSuccess"));
      setTimeout(() => {
        if (normalizedRoles.includes("ADMIN")) navigate("/admin");
        else navigate("/");
      }, 2000);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      if (Array.isArray(msg)) msg.forEach((m: string) => toast.error(m));
      else toast.error(msg || t("login:loginFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <ToastContainer position="top-right" autoClose={8000} />
      <div className="min-h-screen flex items-center justify-center bg-white p-16">
        <div className="flex w-full max-w-7xl rounded-[2rem] shadow-2xl border-4 border-gray-300 overflow-hidden">
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
              <h2 className="text-3xl font-bold text-center">
                {t("login:formTitle")}
              </h2>

              <div>
                <label className="block mb-1 text-sm font-medium">
                  {t("login:email")}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="w-full border rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#3366FF] text-base"
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium">
                  {t("login:password")}
                </label>
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
                    aria-label="toggle-password"
                  >
                    {showPassword ? (
                      <FiEyeOff size={20} />
                    ) : (
                      <FiEye size={20} />
                    )}
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
                onClick={() =>
                  (window.location.href = `${
                    import.meta.env.VITE_API_URL
                  }/api/auth/google`)
                }
                className="w-full flex items-center justify-center border rounded py-3 bg-white hover:bg-gray-100 transition text-base shadow"
              >
                <FcGoogle className="mr-2" size={24} /> {t("login:google")}
              </button>

              <p className="text-center text-sm">
                {t("login:noAccount")}{" "}
                <Link to="/register" className="text-[#3366FF] hover:underline">
                  {t("login:signUp")}
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default LoginPage;
