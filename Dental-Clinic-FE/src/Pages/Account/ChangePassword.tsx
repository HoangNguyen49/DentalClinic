import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import Header from "../../widgets/Header/Header";
import Footer from "../../widgets/Footer/Footer";
import "react-toastify/dist/ReactToastify.css";

function ChangePassword() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<number | null>(null);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUserId(parsed.userId);
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const handleChangePassword = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!oldPassword || !newPassword || !confirmPassword) {
    toast.error("Please fill in all fields.");
    return;
  }

  if (newPassword.length < 6) {
    toast.error("New password must be at least 6 characters.");
    return;
  }

  if (oldPassword === newPassword) {
    toast.error("New password cannot be the same as old password.");
    return;
  }

  if (newPassword !== confirmPassword) {
    toast.error("Confirm password does not match new password.");
    return;
  }

  try {
    const accessToken = localStorage.getItem("access_token");
    await axios.patch(
      `${import.meta.env.VITE_API_URL}/users/${userId}/change-password`,
      { oldPassword, newPassword, confirmPassword },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    toast.success("Password changed successfully.");
    setTimeout(() => navigate("/my-account"), 1500);
  } catch (err: any) {
    const message = err.response?.data?.message || "Error changing password";
    toast.error(Array.isArray(message) ? message.join(", ") : message);
  }
};

  return (
    <>
      <Header />
      <ToastContainer />
      <div className="min-h-screen flex justify-center items-center bg-gray-100 p-6">
        <form
          onSubmit={handleChangePassword}
          className="bg-white p-8 rounded-2xl shadow-md max-w-md w-full space-y-6"
        >
          <h2 className="text-2xl font-bold text-center">Change Password</h2>

          <input
            type="password"
            placeholder="Old Password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded"
          />
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded"
          />
          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded"
          />

          <button
            type="submit"
            className="w-full bg-[#3366FF] text-white py-2 rounded hover:bg-[#254EDB] transition"
          >
            Update Password
          </button>
        </form>
      </div>
      <Footer />
    </>
  );
}
export default ChangePassword;
