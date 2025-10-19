import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import Header from "../../widgets/Header/Header";
import Footer from "../../widgets/Footer/Footer";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useTranslation } from "react-i18next";

const defaultAvatars = [
  "/assets/avatars/avatar1.png",
  "/assets/avatars/avatar2.png",
  "/assets/avatars/avatar3.png",
  "/assets/avatars/avatar4.png",
];

function SignUp() {
  const { t } = useTranslation(["signup", "web"]);
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [customAvatar, setCustomAvatar] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCustomAvatar(file);
      setPreviewUrl(URL.createObjectURL(file));
      setAvatarUrl("");
    } else {
      setCustomAvatar(null);
      setPreviewUrl(null);
    }
  };

  interface UserResponse {
    userId: number;
    avatarUrl: string;
  }

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!fullName || !username || !email || !password || !confirmPassword || !phone) {
      toast.error(t("signup:errors.fillAll"));
      return;
    }

    if (password !== confirmPassword) {
      toast.error(t("signup:errors.passwordMismatch"));
      return;
    }

    setLoading(true);
    try {
      // Nếu chọn avatar mặc định (public/assets/avatars), gán URL tuyệt đối
      let initialAvatarUrl = "";
      if (avatarUrl) {
        initialAvatarUrl = `${window.location.origin}${avatarUrl}`;
      }

      // Tạo user
      const res = await axios.post<UserResponse>(
        `${import.meta.env.VITE_API_URL}/users`,
        {
          fullName,
          username,
          password,
          email,
          phone,
          avatarUrl: customAvatar ? undefined : initialAvatarUrl,
        }
      );

      const userId = res.data.userId;
      if (!userId) throw new Error(t("signup:errors.idMissing"));

      // Nếu có upload avatar custom → PATCH avatar
      if (customAvatar) {
        // ⚠️ Fix tên key token cho khớp với LoginPage (access_token)
        const token = localStorage.getItem("access_token");
        const formData = new FormData();
        formData.append("file", customAvatar);

        await axios.patch(
          `${import.meta.env.VITE_API_URL}/users/${userId}/avatar`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }
        );
      }

      toast.success(t("signup:success.registered"));
      setTimeout(() => navigate("/login"), 2000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message;
      if (Array.isArray(errorMessage)) {
        errorMessage.forEach((msg: string) => toast.error(msg));
      } else {
        toast.error(errorMessage || t("signup:errors.failed"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="min-h-screen flex items-center justify-center bg-white p-10">
        <div className="flex w-full max-w-7xl rounded-3xl shadow-2xl border-4 border-gray-300 overflow-hidden">
          {/* Left: avatar chooser */}
          <div className="hidden md:flex w-1/2 bg-gradient-to-br from-[#0D1B3E] to-[#3366FF] items-center justify-center text-white p-10">
            <div className="space-y-6 w-full flex flex-col items-center">
              <h2 className="text-3xl font-bold mb-4">{t("signup:leftTitle")}</h2>

              <div className="grid grid-cols-2 gap-4 w-2/3">
                {defaultAvatars.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt="avatar"
                    className={`w-36 h-36 rounded-full cursor-pointer object-cover transition duration-300 transform hover:scale-110 shadow-lg ${
                      avatarUrl === url ? "ring-4 ring-yellow-400" : "ring-2 ring-transparent"
                    }`}
                    onClick={() => {
                      setAvatarUrl(url);
                      setCustomAvatar(null);
                      setPreviewUrl(null);
                    }}
                  />
                ))}
              </div>

              <div className="text-sm mt-6 text-center">
                <label className="block mb-3 text-base font-medium text-white">
                  {t("signup:leftOrUpload")}
                </label>
                <div className="relative w-full flex justify-center">
                  <label className="bg-white text-[#3366FF] font-semibold px-4 py-2 rounded cursor-pointer hover:bg-gray-200 transition shadow-md">
                    {t("signup:leftChooseFile")}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt={t("signup:previewAlt")}
                    className="mt-4 w-36 h-36 rounded-full object-cover shadow-lg mx-auto"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Right: form */}
          <div className="w-full md:w-1/2 p-8 md:p-16 bg-white flex flex-col justify-center">
            <form onSubmit={handleSignUp} className="space-y-6">
              <h2 className="text-3xl font-bold text-center">
                {t("signup:createTitle")}
              </h2>

              <InputField label={t("signup:fields.fullName")} value={fullName} setValue={setFullName} />
              <InputField label={t("signup:fields.username")} value={username} setValue={setUsername} />
              <InputField label={t("signup:fields.email")} value={email} setValue={setEmail} type="email" />
              <InputField label={t("signup:fields.phone")} value={phone} setValue={setPhone} />

              <PasswordField
                label={t("signup:fields.password")}
                value={password}
                setValue={setPassword}
                visible={showPassword}
                setVisible={setShowPassword}
              />
              <PasswordField
                label={t("signup:fields.confirmPassword")}
                value={confirmPassword}
                setValue={setConfirmPassword}
                visible={showConfirmPassword}
                setVisible={setShowConfirmPassword}
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#3366FF] text-white font-semibold py-3 rounded hover:bg-[#254EDB] transition text-base"
              >
                {loading ? t("signup:buttons.signingUp") : t("signup:buttons.signUp")}
              </button>

              <p className="text-center text-sm">
                {t("signup:bottom.haveAccount")}{" "}
                <Link to="/login" className="text-[#3366FF] hover:underline">
                  {t("signup:bottom.login")}
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

function InputField({ label, value, setValue, type = "text" }: any) {
  return (
    <div>
      <label className="block mb-1 text-sm font-medium">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full border rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#3366FF] text-base"
      />
    </div>
  );
}

function PasswordField({ label, value, setValue, visible, setVisible }: any) {
  return (
    <div>
      <label className="block mb-1 text-sm font-medium">{label}</label>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full border rounded px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-[#3366FF] text-base"
        />
        <div
          className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-500 hover:text-[#3366FF]"
          onClick={() => setVisible(!visible)}
        >
          {visible ? <FiEyeOff size={20} /> : <FiEye size={20} />}
        </div>
      </div>
    </div>
  );
}

export default SignUp;
