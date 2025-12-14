import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import Header from '../../../widgets/Header/Header';
import Footer from '../../../widgets/Footer/Footer';
import patientDashboardApi from '../../../patient_api/patientDashboardApi';
import WellnessCard from './components/WellnessCard';
import NextAppointmentCard from './components/NextAppointmentCard';
import MedicalHistoryList from './components/MedicalHistoryList'; 
import type { PatientDashboardDTO } from '../../types/patientDashboard';

// --- HELPER 1: HIỂN THỊ BADGE HẠNG ---
const getRankBadge = (tier: string) => {
    switch(tier) {
        case 'DIAMOND': return <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold border border-purple-200 shadow-sm">💎 Kim Cương</span>;
        case 'GOLD': return <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold border border-yellow-200 shadow-sm">🥇 Vàng</span>;
        case 'SILVER': return <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold border border-gray-300 shadow-sm">🥈 Bạc</span>;
        default: return <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-100">👋 Thành viên</span>;
    }
};

// --- HELPER 2: LẤY % GIẢM GIÁ ĐỂ HIỂN THỊ ---
const getDiscountInfo = (tier: string) => {
    switch(tier) {
        case 'DIAMOND': return { pct: 15, color: 'text-purple-600 bg-purple-50 border-purple-100' };
        case 'GOLD': return { pct: 10, color: 'text-yellow-700 bg-yellow-50 border-yellow-100' };
        case 'SILVER': return { pct: 5, color: 'text-gray-700 bg-gray-50 border-gray-200' };
        default: return null; // Member không giảm
    }
};

// --- COMPONENT CON: QUICK LINK ---
const QuickLink = ({ to, icon, label }: { to: string; icon: string; label: string }) => (
    <Link to={to} className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-2xl hover:bg-blue-50 hover:text-blue-600 transition-all group">
        <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">{icon}</span>
        <span className="text-xs font-bold text-gray-600 group-hover:text-blue-600">{label}</span>
    </Link>
);

// --- COMPONENT CHÍNH ---
const PatientDashboardPage: React.FC = () => {
    const [data, setData] = useState<PatientDashboardDTO | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (!token) { navigate("/login"); return; }
        const fetchData = async () => {
            try {
                const response = await patientDashboardApi.getDashboardSummary();
                setData(response);
            } catch (error) { console.error("Failed:", error); } 
            finally { setLoading(false); }
        };
        fetchData();
    }, [navigate]);

    // Tính % thanh tiến trình lên hạng
    const calculateProgress = () => {
        if (!data || !data.nextTierGoal) return 100;
        const percent = (data.totalSpent / data.nextTierGoal) * 100;
        return Math.min(percent, 100);
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3366FF]"></div></div>;

    // Lấy thông tin giảm giá hiện tại
    const discountInfo = data ? getDiscountInfo(data.memberTier) : null;

    return (
        <>
            <Header />
            <ToastContainer />
            <div className="min-h-screen bg-[#F8FAFC] font-instrument py-10 px-4 pb-20">
                <div className="max-w-5xl mx-auto">
                    
                    {/* --- HEADER DASHBOARD (AVATAR + RANK + PROGRESS) --- */}
                    <div className="mb-8 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
                        
                        {/* Background decoration */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50 pointer-events-none"></div>

                        <div className="flex items-center gap-5 relative z-10 w-full md:w-auto">
                            <img src={data?.avatarUrl || "https://via.placeholder.com/150"} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-4 border-blue-50 shadow-md" />
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h1 className="text-2xl font-bold text-gray-800">{data?.fullName}</h1>
                                    {data && getRankBadge(data.memberTier)}
                                </div>
                                <p className="text-gray-500 text-sm">Mã BN: <span className="font-mono font-bold text-gray-700">{data?.patientCode}</span></p>
                                
                                {/* Hiển thị ưu đãi giảm giá */}
                                {discountInfo && (
                                    <div className={`mt-2 inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold border ${discountInfo.color}`}>
                                        <span className="mr-1">🎁</span> Ưu đãi thành viên: Giảm {discountInfo.pct}%
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Progress Bar Lên Hạng */}
                        {data && data.nextTierGoal ? (
                            <div className="w-full md:w-1/3 relative z-10 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <div className="flex justify-between text-xs mb-2 font-bold">
                                    <span className="text-gray-500 uppercase tracking-wide">Chi tiêu tích lũy</span>
                                    <span className="text-blue-600">
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(data.totalSpent)} 
                                        <span className="text-gray-400 font-normal"> / {new Intl.NumberFormat('vi-VN', { notation: "compact" }).format(data.nextTierGoal)}</span>
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden mb-2">
                                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-1000 ease-out" style={{ width: `${calculateProgress()}%` }}></div>
                                </div>
                                <p className="text-[10px] text-gray-500 text-right">
                                    Cần thêm <span className="font-bold text-gray-700">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(data.nextTierGoal - data.totalSpent)}</span> để thăng hạng kế tiếp.
                                </p>
                            </div>
                        ) : (
                            /* Nếu đã max cấp (Diamond) */
                            data && (
                                <div className="text-right relative z-10 px-4">
                                    <p className="text-lg font-bold text-purple-600 flex items-center justify-end gap-1">
                                        Đẳng cấp thượng lưu 👑
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">Cảm ơn bạn đã là khách hàng thân thiết nhất!</p>
                                </div>
                            )
                        )}
                    </div>

                    {/* --- BODY DASHBOARD --- */}
                    {!data ? <div className="text-center py-10">Không có dữ liệu.</div> : (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            
                            {/* CỘT TRÁI (40%) */}
                            <div className="lg:col-span-5 flex flex-col gap-6">
                                {/* Wellness */}
                                <div className="h-80">
                                    <WellnessCard 
                                        status={data.healthStatus} 
                                        message={data.healthMessage} 
                                        daysSince={data.daysSinceLastVisit} 
                                    />
                                </div>
                                {/* Menu */}
                                <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100">
                                    <h4 className="font-bold text-gray-700 mb-4 text-sm uppercase tracking-wide">Menu nhanh</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <QuickLink to="/my-appointments" icon="📅" label="Lịch hẹn" />
                                        <QuickLink to="/my-account" icon="🔐" label="Tài khoản" />
                                        <QuickLink to="/patient-profile" icon="📋" label="Hồ sơ" />
                                        <QuickLink to="/contact" icon="📞" label="Liên hệ" />
                                    </div>
                                </div>
                            </div>

                            {/* CỘT PHẢI (60%) */}
                            <div className="lg:col-span-7 flex flex-col gap-6">
                                {/* Lịch hẹn */}
                                <div className="h-64">
                                    <NextAppointmentCard appointment={data.nextAppointment} />
                                </div>
                                {/* AI Tip */}
                                <div className="flex-1 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col">
                                    <div className="flex gap-4 mb-6">
                                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex-shrink-0 flex items-center justify-center text-2xl">🤖</div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-gray-800 text-sm">Lời khuyên AI</h3>
                                                <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full">AUTO</span>
                                            </div>
                                            <p className="text-gray-600 text-sm italic leading-relaxed">"{data.latestAiTip}"</p>
                                        </div>
                                    </div>
                                    <div className="border-t border-gray-100 pt-4 mt-auto">
                                        <h4 className="font-bold text-gray-500 mb-3 text-xs uppercase">Hoạt động gần đây</h4>
                                        <div className="space-y-3">
                                            {data.recentActivities.slice(0, 2).map((act, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-xs group">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${act.type === 'COMPLETED' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                                        <span className="font-medium text-gray-700 group-hover:text-blue-600 transition">{act.title}</span>
                                                    </div>
                                                    <span className="text-gray-400 bg-gray-50 px-2 py-1 rounded">{act.date}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* DÒNG CUỐI: DANH SÁCH LỊCH SỬ (TOP 3) */}
                            <div className="lg:col-span-12 mt-4">
                                <MedicalHistoryList 
                                    history={data.medicalHistory ? data.medicalHistory.slice(0, 3) : []} 
                                    isDashboard={true}
                                    onViewAll={() => navigate('/patient-history')}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </>
    );
};

export default PatientDashboardPage;