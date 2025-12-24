import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import Header from "../../widgets/Header/Header";
import Footer from "../../widgets/Footer/Footer";
import "react-toastify/dist/ReactToastify.css";
// 1. Import hook
import { useTranslation } from "react-i18next";

const PASSWORD_RULE = /^(?=\S+$)(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,100}$/;

type UserProfile = {
  userId: number;
  hasPassword?: boolean;
  email: string;
};

function ChangePassword() {
  // 2. Setup hook
  const { t } = useTranslation(["account"]);
  
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;
  
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const [hasPassword, setHasPassword] = useState(true); 

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

        setHasPassword(!!data.hasPassword); 

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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast.error(t("password.ruleError")); // Có thể thêm key chung cho empty field
      return;
    }
    
    if (hasPassword && !oldPassword) {
        toast.error(t("password.current") + " is required.");
        return;
    }

    if (hasPassword && oldPassword === newPassword) {
      toast.error("New password must be different from current.");
      return;
    }
    if (!PASSWORD_RULE.test(newPassword)) {
      toast.error(t("password.ruleError"));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t("password.matchError"));
      return;
    }

    try {
      setLoading(true);
      const accessToken = localStorage.getItem("accessToken");

      await axios.post<{ message?: string }>(
        `${API_URL}/api/auth/change-password`,
        {
          currentPassword: hasPassword ? oldPassword : "", 
          newPassword: newPassword,
          confirmNewPassword: confirmPassword,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      toast.success(t("password.success"));
      
      setHasPassword(true);
      
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");

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
            {hasPassword ? t("password.titleChange") : t("password.titleSet")}
          </h2>
          
          {!hasPassword && (
              <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-sm text-center border border-blue-100">
                  {t("password.googleWarning")}
              </div>
          )}

          {hasPassword && (
            <div>
                <label className="block mb-1 text-sm font-semibold text-gray-700">{t("password.current")}</label>
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
            <label className="block mb-1 text-sm font-semibold text-gray-700">{t("password.new")}</label>
            <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded focus:outline-blue-500"
                placeholder="Enter new password"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-semibold text-gray-700">{t("password.confirm")}</label>
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
            {loading ? "Processing..." : (hasPassword ? t("password.btnUpdate") : t("password.btnSet"))}
          </button>
        </form>
      </div>
      <Footer />
    </>
  );
}

export default ChangePassword;