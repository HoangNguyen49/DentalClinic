import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../../widgets/Header/Header";
import Footer from "../../widgets/Footer/Footer";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
// [MỚI] Import thư viện QR
import { QRCodeCanvas } from "qrcode.react";

type UserInfo = {
  userId: number;
  fullName: string;
  email: string;
  phone?: string;
  username?: string;
  avatarUrl?: string;
  hasPassword?: boolean;
  roles?: string[];
};

function MyAccount() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [newAvatar, setNewAvatar] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // [MỚI] State cho QR Code
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const API = import.meta.env.VITE_API_URL;
  const DEFAULT_AVATAR = import.meta.env.VITE_DEFAULT_AVATAR_URL || "https://res.cloudinary.com/dchzko3lj/image/upload/v1762616672/default-avatar_brvdfn.png";

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
      toast.error("Unauthorized: No access token found.");
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

      const oldUserData = JSON.parse(localStorage.getItem("user") || "{}");
      const mergedUser = { ...oldUserData, ...data };

      setUser(mergedUser);
      localStorage.setItem("user", JSON.stringify(mergedUser));
      
      window.dispatchEvent(new Event("userUpdated")); 

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

  // [MỚI] Hàm lấy QR Token từ Backend
  const handleGenerateQr = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      // SỬA DÒNG NÀY: Thêm <{ result: string }> để định nghĩa kiểu trả về
      const res = await axios.get<{ result: string }>(`${API}/api/auth/qr-generate`, {
         headers: { Authorization: `Bearer ${token}` }
      });
      
      // Lúc này res.data đã được hiểu là có thuộc tính result
      setQrToken(res.data.result);
      setShowQrModal(true);
    } catch (error) {
      toast.error("Không thể tạo mã QR đăng nhập.");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <>
      {!isForceUpdate && <Header />}
      
      <ToastContainer />

      {/* [MỚI] Modal hiển thị QR Code */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[9999]">
          <div className="bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm w-full relative animate-fadeIn">
            <button 
                onClick={() => setShowQrModal(false)}
                className="absolute top-2 right-4 text-gray-400 hover:text-red-500 text-3xl font-bold transition"
            >
                &times;
            </button>
            <h3 className="text-xl font-bold mb-2 text-[#3366FF]">Đăng nhập Mobile App</h3>
            <p className="text-sm text-gray-500 mb-6 text-center px-4">
                Mở ứng dụng <strong>Sunshine Dental</strong> trên điện thoại và quét mã này để đăng nhập ngay lập tức.
            </p>
            
            <div className="p-4 border-4 border-[#AACCFF] rounded-xl bg-white shadow-inner">
                {qrToken && (
                    <QRCodeCanvas 
                        value={qrToken} 
                        size={220}
                        level={"H"}
                        includeMargin={true}
                    />
                )}
            </div>
            
            <div className="mt-6 flex items-center gap-2 text-yellow-600 bg-yellow-50 px-3 py-2 rounded-lg text-xs font-semibold">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Mã này sẽ hết hạn trong 2 phút
            </div>
          </div>
        </div>
      )}

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

            {/* ... Các input fields cũ giữ nguyên ... */}
            <div>
              <label className="block font-semibold mb-1">Full Name</label>
              <input
                type="text"
                value={user?.fullName || ""}
                onChange={(e) => setUser((prev) => (prev ? { ...prev, fullName: e.target.value } : prev))}
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Email</label>
              <input
                type="email"
                value={user?.email || ""}
                disabled 
                className="w-full p-2 border rounded bg-gray-100 text-gray-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={user?.phone || ""}
                onChange={(e) => setUser((prev) => (prev ? { ...prev, phone: e.target.value } : prev))}
                className={`w-full p-2 border rounded ${
                    !user?.phone && isForceUpdate ? "border-red-500 ring-2 ring-red-200" : ""
                }`}
                placeholder="Nhập số điện thoại của bạn"
              />
              {!user?.phone && isForceUpdate && (
                  <p className="text-red-500 text-sm mt-1">Bắt buộc nhập số điện thoại.</p>
              )}
            </div>

            <p><strong>Username:</strong> {user?.username || "-"}</p>

            <div className="flex flex-wrap gap-4 items-center pt-2">
              <button
                onClick={handleSaveChanges}
                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition font-semibold shadow-md"
              >
                {isForceUpdate ? "Hoàn tất & Về trang chủ" : "Lưu thay đổi"}
              </button>
              
              {!isForceUpdate && (
                <button
                  onClick={() => navigate("/change-password")}
                  className="px-4 py-2 bg-[#3366FF] text-white rounded hover:bg-[#254EDB] transition"
                >
                  {user?.hasPassword ? "Đổi mật khẩu" : "Tạo mật khẩu"}
                </button>
              )}
            </div>

            {/* [MỚI] Phần nút bấm tạo QR Code */}
            {!isForceUpdate && (
                <div className="mt-8 pt-6 border-t border-gray-100">
                    <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        Kết nối thiết bị di động
                    </h3>
                    <button
                        onClick={handleGenerateQr}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 transition shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                        Lấy mã QR đăng nhập
                    </button>
                </div>
            )}
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