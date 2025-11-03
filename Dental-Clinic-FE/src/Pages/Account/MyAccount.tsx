import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Header from "../../widgets/Header/Header";
import Footer from "../../widgets/Footer/Footer";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type UserInfo = {
  userId: number;
  fullName: string;
  email: string;
  phone?: string;
  username?: string;
  avatarUrl?: string;
  roles?: string[];
};

function MyAccount() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [newAvatar, setNewAvatar] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL;

  // ===== Lấy thông tin user hiện tại =====
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/login");
      return;
    }

    axios
      .get<UserInfo>(`${API}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setUser(res.data);
        localStorage.setItem("user", JSON.stringify(res.data));
      })
      .catch((err) => {
        console.error(err);
        navigate("/login");
      });
  }, [API, navigate]);

  const avatarSrc =
    previewUrl ||
    (user?.avatarUrl && user.avatarUrl.trim() !== ""
      ? user.avatarUrl
      : `${API}/uploads_avatar/default-avatar.png`);

  // ===== Chọn file avatar mới =====
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewAvatar(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // ===== Upload avatar =====
  const handleUploadAvatar = async () => {
    if (!newAvatar || !user) return;
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Unauthorized: No access token found.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", newAvatar);

      const res = await axios.patch<{ userId: number; avatarUrl: string }>(
        `${API}/api/users/${user.userId}/avatar`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const updatedUser = { ...user, avatarUrl: res.data.avatarUrl };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setNewAvatar(null);
      setPreviewUrl(null);
      toast.success("Avatar updated successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update avatar.");
    }
  };

  // ===== Cập nhật thông tin profile =====
  const handleSaveChanges = async () => {
    if (!user) return;
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Unauthorized");
      return;
    }

    try {
      const { fullName, email, phone } = user;
      const { data } = await axios.patch<UserInfo>(
        `${API}/api/users/${user.userId}`,
        { fullName, email, phone },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUser(data);
      localStorage.setItem("user", JSON.stringify(data));
      toast.success("Profile updated successfully!");
      
    } catch (error) {
      console.error(error);
      toast.error("Failed to update profile.");
    }
  };

  return (
    <>
      <Header />
      <ToastContainer />
      <div className="min-h-screen p-10 bg-gray-100 flex justify-center items-center">
        <div className="bg-white p-10 rounded-3xl shadow-lg w-full max-w-5xl flex flex-col md:flex-row items-center gap-10">
          {/* ===== Left: Info ===== */}
          <div className="flex-1 space-y-4 w-full">
            <h2 className="text-3xl font-bold">My Account</h2>

            <div>
              <label className="block font-semibold mb-1">Full Name</label>
              <input
                type="text"
                value={user?.fullName || ""}
                onChange={(e) =>
                  setUser((prev) =>
                    prev ? { ...prev, fullName: e.target.value } : prev
                  )
                }
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Email</label>
              <input
                type="email"
                value={user?.email || ""}
                onChange={(e) =>
                  setUser((prev) =>
                    prev ? { ...prev, email: e.target.value } : prev
                  )
                }
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Phone</label>
              <input
                type="text"
                value={user?.phone || ""}
                onChange={(e) =>
                  setUser((prev) =>
                    prev ? { ...prev, phone: e.target.value } : prev
                  )
                }
                className="w-full p-2 border rounded"
              />
            </div>

            <p>
              <strong>Username:</strong> {user?.username || "-"}
            </p>
            <p>
              <strong>Roles:</strong>{" "}
              {(user?.roles || []).join(", ") || "-"}
            </p>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleSaveChanges}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
              >
                Save Changes
              </button>

              <button
                onClick={() => navigate("/change-password")}
                className="px-4 py-2 bg-[#3366FF] text-white rounded hover:bg-[#254EDB] transition"
              >
                Change Password
              </button>
            </div>
          </div>

          {/* ===== Right: Avatar ===== */}
          <div className="md:w-1/2 bg-gradient-to-br from-[#0D1B3E] to-[#3366FF] flex flex-col items-center justify-center p-10 gap-4">
            <img
              src={avatarSrc}
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
