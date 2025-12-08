import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom"; 
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
  hasPassword?: boolean;
};

function MyAccount() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [newAvatar, setNewAvatar] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();
  const API = import.meta.env.VITE_API_URL;
  const DEFAULT_AVATAR = import.meta.env.VITE_DEFAULT_AVATAR_URL || "https://res.cloudinary.com/dchzko3lj/image/upload/v1762616672/default-avatar_brvdfn.png";

  // Logic xác định chế độ "Bắt buộc cập nhật"
  const isForceUpdate = location.state?.forceUpdate || (user && (!user.phone || user.phone.trim() === ""));

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        navigate("/login");
        return;
      }
      try {
        const res = await axios.get<UserInfo>(`${API}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
        localStorage.setItem("user", JSON.stringify(res.data));
      } catch (err) {
        console.error(err);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [API, navigate]);

  const avatarSrc = previewUrl || (user?.avatarUrl && user.avatarUrl.trim() !== "" ? user.avatarUrl : DEFAULT_AVATAR);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewAvatar(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUploadAvatar = async () => {
    if (!newAvatar || !user) return;
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Unauthorized");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("file", newAvatar);
      const res = await axios.patch<{ userId: number; avatarUrl: string }>(
        `${API}/api/users/${user.userId}/avatar`,
        formData,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } }
      );
      const updatedUser = { ...user, avatarUrl: res.data.avatarUrl };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      window.dispatchEvent(new Event("avatarUpdated"));
      setNewAvatar(null);
      setPreviewUrl(null);
      toast.success("Avatar updated successfully!");
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to update avatar.");
    }
  };

  const handleSaveChanges = async () => {
    if (!user) return;
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Unauthorized");
      return;
    }

    if (!user.phone || user.phone.trim() === "") {
        toast.warn("Vui lòng nhập số điện thoại để hoàn tất hồ sơ!");
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
      toast.success("Cập nhật hồ sơ thành công!");

      if (isForceUpdate) {
          setTimeout(() => {
              toast.info("Hoàn tất! Đang chuyển hướng về trang chủ...");
              navigate("/");
          }, 1500);
      }

    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to update profile.");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <>
      {!isForceUpdate && <Header />}
      
      <ToastContainer />
      <div className="min-h-screen p-10 bg-gray-100 flex justify-center items-center relative">
        <div className="bg-white p-10 rounded-3xl shadow-lg w-full max-w-5xl flex flex-col md:flex-row items-center gap-10 relative overflow-hidden">
          
          {isForceUpdate && (
             <div className="absolute top-0 left-0 w-full bg-yellow-100 text-yellow-800 p-3 text-center font-bold z-10 border-b border-yellow-300">
                ⚠️ Bạn cần cập nhật số điện thoại để hoàn tất đăng ký.
             </div>
          )}

          {/* Left Info */}
          <div className={`flex-1 space-y-4 w-full ${isForceUpdate ? "mt-8" : ""}`}>
            <h2 className="text-3xl font-bold">My Account</h2>

            <div>
              <label className="block font-semibold mb-1">Full Name</label>
              <input type="text" value={user?.fullName || ""} onChange={(e) => setUser((prev) => (prev ? { ...prev, fullName: e.target.value } : prev))} className="w-full p-2 border rounded" />
            </div>

            <div>
              <label className="block font-semibold mb-1">Email</label>
              <input type="email" value={user?.email || ""} disabled className="w-full p-2 border rounded bg-gray-100 text-gray-500 cursor-not-allowed" />
            </div>

            <div>
              <label className="block font-semibold mb-1">Phone <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={user?.phone || ""}
                onChange={(e) => setUser((prev) => (prev ? { ...prev, phone: e.target.value } : prev))}
                className={`w-full p-2 border rounded ${!user?.phone && isForceUpdate ? "border-red-500 ring-2 ring-red-200" : ""}`}
                placeholder="Nhập số điện thoại của bạn"
              />
              {!user?.phone && isForceUpdate && <p className="text-red-500 text-sm mt-1">Bắt buộc nhập số điện thoại.</p>}
            </div>

            <p><strong>Username:</strong> {user?.username || "-"}</p>

            <div className="flex flex-wrap gap-4 items-center pt-2">
              <button onClick={handleSaveChanges} className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition font-semibold shadow-md">
                {isForceUpdate ? "Hoàn tất & Về trang chủ" : "Lưu thay đổi"}
              </button>
              
              {/* --- SỬA ĐỔI TẠI ĐÂY --- */}
              {/* Luôn hiện nút, chỉ ẩn khi đang bắt buộc update SĐT */}
              {!isForceUpdate && (
                <button 
                    onClick={() => navigate("/change-password")} 
                    className="px-4 py-2 bg-[#3366FF] text-white rounded hover:bg-[#254EDB] transition"
                >
                  {/* Hiển thị text linh hoạt */}
                  {user?.hasPassword ? "Đổi mật khẩu" : "Tạo mật khẩu"}
                </button>
              )}
            </div>
          </div>

          {/* Right Avatar */}
          <div className="md:w-1/2 flex flex-col items-center justify-center gap-4">
            <img src={avatarSrc} alt="Avatar" className="w-60 h-60 rounded-full object-cover shadow-2xl border-4 border-white" />
            <label className="bg-white text-[#3366FF] font-semibold px-4 py-2 rounded cursor-pointer border border-[#3366FF] hover:bg-blue-50 transition">
              Choose your avatar
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </label>
            {newAvatar && (
              <button onClick={handleUploadAvatar} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition">
                Confirm Upload
              </button>
            )}
          </div>
        </div>
      </div>
      {!isForceUpdate && <Footer />}
    </>
  );
}

export default MyAccount;