import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function MyAccount() {
  const [user, setUser] = useState<any>(null);
  const [newAvatar, setNewAvatar] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const accessToken = localStorage.getItem("access_token");

    if (storedUser && accessToken) {
      const parsed = JSON.parse(storedUser);

      axios
        .get(`${import.meta.env.VITE_API_URL}/users/${parsed.userId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        .then((res) => {
          setUser(res.data);
          localStorage.setItem("user", JSON.stringify(res.data)); // update full info
        })
        .catch((err) => {
          console.error(err);
          navigate("/login");
        });
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const avatarSrc =
    user?.avatarUrl && user.avatarUrl.trim() !== ""
      ? user.avatarUrl
      : `${import.meta.env.VITE_API_URL}/uploads/default-avatar.png`;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewAvatar(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUploadAvatar = async () => {
    if (!newAvatar || !user) return;

    const formData = new FormData();
    formData.append("file", newAvatar);

    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      toast.error("Unauthorized: No access token found.");
      return;
    }

    try {
      const res = await axios.patch(
        `${import.meta.env.VITE_API_URL}/users/${user.userId}/avatar`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const avatarUrl = (res.data as { avatarUrl: string }).avatarUrl;

      const updatedUser = { ...user, avatarUrl };

      await axios.patch(
        `${import.meta.env.VITE_API_URL}/users/${user.userId}`,
        updatedUser,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setNewAvatar(null);
      setPreviewUrl(null);
      toast.success("Avatar updated successfully!");
      window.location.reload();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update avatar.");
    }
  };

  return (
    <>
      <Header />
      <ToastContainer />
      <div className="min-h-screen p-10 bg-gray-100 flex justify-center items-center">
        <div className="bg-white p-10 rounded-3xl shadow-lg w-full max-w-5xl flex flex-col md:flex-row items-center gap-10">
          {/* Left: Info */}
          <div className="flex-1 space-y-4 w-full">
            <h2 className="text-3xl font-bold">My Account</h2>
            <p><strong>Full Name:</strong> {user?.fullName}</p>
            <p><strong>Username:</strong> {user?.username}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Phone:</strong> {user?.phone || "Not provided"}</p>
            <p><strong>Role:</strong> {user?.role}</p>
            <button
              onClick={() => navigate("/change-password")}
              className="mt-4 px-4 py-2 bg-[#3366FF] text-white rounded hover:bg-[#254EDB] transition"
            >
              Change Password
            </button>
          </div>

          {/* Right: Avatar */}
          <div className="md:w-1/2 bg-gradient-to-br from-[#0D1B3E] to-[#3366FF] flex flex-col items-center justify-center p-10 gap-4">
            <img
              src={previewUrl || avatarSrc}
              alt="Avatar"
              className="w-60 h-60 rounded-full object-cover shadow-2xl border-4 border-white"
            />
            <label className="bg-white text-[#3366FF] font-semibold px-4 py-2 rounded cursor-pointer hover:bg-gray-100 transition">
              Choose your avatar
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </label>
            {newAvatar && (
              <button
                onClick={handleUploadAvatar}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
              >
                Upload Avatar
              </button>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default MyAccount;
