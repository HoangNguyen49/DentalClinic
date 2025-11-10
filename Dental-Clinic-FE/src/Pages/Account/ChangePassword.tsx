import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import Header from "../../widgets/Header/Header";
import Footer from "../../widgets/Footer/Footer";
import "react-toastify/dist/ReactToastify.css";

const PASSWORD_RULE =
  /^(?=\S+$)(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,100}$/;

function ChangePassword() {
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();


    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (oldPassword === newPassword) {
      toast.error("New password must be different from current.");
      return;
    }
    if (!PASSWORD_RULE.test(newPassword)) {
      toast.error(
        "Password must be 8-100 chars, include upper, lower, digit, special char, and no spaces."
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Confirm password must match.");
      return;
    }

    try {
      setLoading(true);
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        toast.error("You need to login again.");
        navigate("/login");
        return;
      }

      const { data } = await axios.post<{ message?: string }>(
        `${import.meta.env.VITE_API_URL}/api/auth/change-password`,
        {
          currentPassword: oldPassword,
          newPassword: newPassword,
          confirmNewPassword: confirmPassword,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      toast.success(data?.message ?? "Password changed successfully.");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => navigate("/my-account"), 1200);
    } catch (err: any) {
      const res = err?.response?.data;
      let msg =
        (Array.isArray(res) && res.join(", ")) ||
        (Array.isArray(res?.errors) && res.errors.join(", ")) ||
        res?.message ||
        res?.error ||
        "Error changing password";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="min-h-screen flex justify-center items-center bg-gray-100 p-6">
        <form
          onSubmit={handleChangePassword}
          className="bg-white p-8 rounded-2xl shadow-md max-w-md w-full space-y-6"
        >
          <h2 className="text-2xl font-bold text-center">Change Password</h2>

          <input
            type="password"
            placeholder="Current password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded"
            autoComplete="current-password"
          />
          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded"
            autoComplete="new-password"
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded"
            autoComplete="new-password"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#3366FF] text-white py-2 rounded hover:bg-[#254EDB] transition disabled:opacity-60"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
      <Footer />
    </>
  );
}

export default ChangePassword;
