import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form'; // npm install react-hook-form nếu chưa có
import { toast, ToastContainer } from 'react-toastify';
import Header from '../../../widgets/Header/Header';
import Footer from '../../../widgets/Footer/Footer';
import patientProfileApi from '../../../patient_api/patientProfileApi';
import type { PatientProfile } from '../../types/patientProfile';


const PatientProfilePage: React.FC = () => {
    const [profile, setProfile] = useState<PatientProfile | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    
    // Form Hook
    const { register, handleSubmit, reset } = useForm<PatientProfile>();

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (!token) { navigate("/login"); return; }
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const data = await patientProfileApi.getProfile();
            setProfile(data);
            // Set giá trị ban đầu cho form
            reset(data); 
        } catch (error) {
            toast.error("Không thể tải hồ sơ.");
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: PatientProfile) => {
        try {
            await patientProfileApi.updateProfile(data);
            toast.success("Cập nhật hồ sơ thành công!");
            setProfile(data); // Cập nhật lại UI
            setIsEditing(false); // Tắt chế độ sửa
        } catch (error) {
            toast.error("Cập nhật thất bại. Vui lòng thử lại.");
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3366FF]"></div></div>;

    return (
        <>
            <Header />
            <ToastContainer />
            <div className="min-h-screen bg-gray-50 py-10 px-4 font-instrument">
                <div className="max-w-4xl mx-auto">
                    
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold text-gray-800">📋 Hồ Sơ Bệnh Nhân</h1>
                        {!isEditing ? (
                            <button 
                                onClick={() => setIsEditing(true)}
                                className="bg-[#3366FF] text-white px-5 py-2 rounded-xl font-bold shadow hover:bg-blue-700 transition flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                                Chỉnh sửa
                            </button>
                        ) : (
                            <button 
                                onClick={() => { setIsEditing(false); reset(profile!); }}
                                className="bg-gray-200 text-gray-700 px-5 py-2 rounded-xl font-bold hover:bg-gray-300 transition"
                            >
                                Hủy bỏ
                            </button>
                        )}
                    </div>

                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        {/* Banner trang trí */}
                        <div className="h-32 bg-gradient-to-r from-blue-500 to-cyan-400"></div>
                        
                        <div className="px-8 pb-8">
                            <div className="relative flex justify-between items-end -mt-12 mb-6">
                                <div className="bg-white p-1 rounded-full">
                                    <img 
                                        src={ localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")!).avatarUrl || "https://ui-avatars.com/api/?name=" + profile?.fullName : ""} 
                                        className="w-24 h-24 rounded-full border-4 border-white shadow-md object-cover bg-gray-200"
                                        alt="Avatar"
                                    />
                                </div>
                                <div className="mb-2">
                                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">
                                        Mã BN: {profile?.patientCode || 'Chưa cấp'}
                                    </span>
                                </div>
                            </div>

                            {/* --- FORM HOẶC VIEW --- */}
                            <form onSubmit={handleSubmit(onSubmit)}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    
                                    {/* Họ tên (Read-only hoặc Edit tùy logic, thường tên ít đổi) */}
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Họ và tên</label>
                                        <input 
                                            {...register("fullName", { required: true })}
                                            disabled={!isEditing}
                                            className={`w-full px-4 py-3 rounded-xl border ${isEditing ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 bg-white' : 'border-transparent bg-gray-50 text-gray-500'}`}
                                        />
                                    </div>

                                    {/* Số điện thoại (Read-only vì liên quan login) */}
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Số điện thoại</label>
                                        <input 
                                            {...register("phone")}
                                            disabled={true} 
                                            className="w-full px-4 py-3 rounded-xl border border-transparent bg-gray-100 text-gray-500 cursor-not-allowed"
                                        />
                                        {isEditing && <p className="text-xs text-gray-400 mt-1">*Liên hệ CSKH để đổi SĐT</p>}
                                    </div>

                                    {/* --- CÁC TRƯỜNG CẦN UPDATE --- */}

                                    {/* Giới tính */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Giới tính</label>
                                        <select 
                                            {...register("gender")}
                                            disabled={!isEditing}
                                            className={`w-full px-4 py-3 rounded-xl border ${isEditing ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 bg-white' : 'border-transparent bg-gray-50 text-gray-500 appearance-none'}`}
                                        >
                                            <option value="">-- Chọn giới tính --</option>
                                            <option value="Nam">Nam</option>
                                            <option value="Nữ">Nữ</option>
                                            <option value="Khác">Khác</option>
                                        </select>
                                    </div>

                                    {/* Ngày sinh */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Ngày sinh</label>
                                        <input 
                                            type="date"
                                            {...register("dateOfBirth")}
                                            disabled={!isEditing}
                                            className={`w-full px-4 py-3 rounded-xl border ${isEditing ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 bg-white' : 'border-transparent bg-gray-50 text-gray-500'}`}
                                        />
                                    </div>

                                    {/* Địa chỉ */}
                                    <div className="col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Địa chỉ liên hệ</label>
                                        <input 
                                            type="text"
                                            {...register("address")}
                                            disabled={!isEditing}
                                            placeholder="Số nhà, tên đường, phường/xã..."
                                            className={`w-full px-4 py-3 rounded-xl border ${isEditing ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 bg-white' : 'border-transparent bg-gray-50 text-gray-500'}`}
                                        />
                                    </div>

                                    {/* Ghi chú cá nhân */}
                                    <div className="col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Ghi chú y tế / Tiền sử bệnh
                                            <span className="font-normal text-gray-400 ml-2 text-xs">(Thông tin này giúp bác sĩ hiểu rõ hơn về bạn)</span>
                                        </label>
                                        <textarea 
                                            {...register("note")}
                                            disabled={!isEditing}
                                            rows={4}
                                            placeholder="Ví dụ: Dị ứng thuốc kháng sinh, tiền sử bệnh tim mạch..."
                                            className={`w-full px-4 py-3 rounded-xl border ${isEditing ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 bg-white' : 'border-transparent bg-gray-50 text-gray-500'}`}
                                        />
                                    </div>
                                </div>

                                {/* Nút Lưu */}
                                {isEditing && (
                                    <div className="mt-8 flex justify-end">
                                        <button 
                                            type="submit"
                                            className="bg-green-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-green-600 transition transform hover:scale-105"
                                        >
                                            Lưu Thay Đổi
                                        </button>
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
};

export default PatientProfilePage;