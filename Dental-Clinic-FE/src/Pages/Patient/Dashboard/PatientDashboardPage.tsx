import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import Header from '../../../widgets/Header/Header';
import Footer from '../../../widgets/Footer/Footer';

import patientDashboardApi from '../../../patient_api/patientDashboardApi';
import WellnessCard from './components/WellnessCard';
import NextAppointmentCard from './components/NextAppointmentCard';
import type { PatientDashboardDTO } from '../../types/patientDashboard';

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
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [navigate]);

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3366FF]"></div></div>;

    return (
        <>
            <Header />
            <ToastContainer />
            <div className="min-h-screen bg-[#F8FAFC] font-instrument py-10 px-4 pb-20">
                <div className="max-w-5xl mx-auto">
                    
                    {/* Header */}
                    <div className="mb-8 flex justify-between items-end">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Tổng quan</h1>
                            <p className="text-gray-500">Xin chào, <span className="text-[#3366FF] font-bold">{data?.fullName}</span> 👋</p>
                        </div>
                    </div>

                    {!data ? <div className="text-center py-10">Không có dữ liệu.</div> : (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            
                            {/* --- CỘT TRÁI (40%): WELLNESS & PHÍM TẮT --- */}
                            <div className="lg:col-span-5 flex flex-col gap-6">
                                
                                {/* 1. WELLNESS TRACKER */}
                                <div className="h-80">
                                    <WellnessCard 
                                        status={data.healthStatus} 
                                        message={data.healthMessage} 
                                        daysSince={data.daysSinceLastVisit} 
                                    />
                                </div>

                                {/* 4. PHÍM TẮT NHANH (Quick Actions) */}
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

                            {/* --- CỘT PHẢI (60%): LỊCH HẸN & THÔNG TIN --- */}
                            <div className="lg:col-span-7 flex flex-col gap-6">
                                
                                {/* 2. LỊCH HẸN / HÀNH ĐỘNG */}
                                <div className="h-64">
                                    <NextAppointmentCard appointment={data.nextAppointment} />
                                </div>

                                {/* 3. THÔNG TIN & AI */}
                                <div className="flex-1 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col">
                                    
                                    {/* AI Message */}
                                    <div className="flex gap-4 mb-6">
                                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex-shrink-0 flex items-center justify-center text-2xl">🤖</div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-gray-800">Lời khuyên AI</h3>
                                                <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full">AUTO</span>
                                            </div>
                                            <p className="text-gray-600 text-sm italic leading-relaxed">"{data.latestAiTip}"</p>
                                        </div>
                                    </div>

                                    {/* Recent Activity */}
                                    <div className="border-t border-gray-100 pt-5 mt-auto">
                                        <h4 className="font-bold text-gray-700 mb-3 text-xs uppercase">Gần đây nhất</h4>
                                        <div className="space-y-3">
                                            {data.recentActivities.length === 0 ? <p className="text-gray-400 text-sm">Chưa có hoạt động.</p> :
                                                data.recentActivities.map((act, idx) => (
                                                    <div key={idx} className="flex items-center justify-between text-sm group">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-2 h-2 rounded-full ${act.type === 'COMPLETED' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                                            <span className="font-medium text-gray-700 group-hover:text-blue-600 transition">{act.title}</span>
                                                        </div>
                                                        <span className="text-gray-400 text-xs bg-gray-50 px-2 py-1 rounded">{act.date}</span>
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </>
    );
};

// Component con cho nút bấm nhanh
const QuickLink = ({ to, icon, label }: any) => (
    <Link to={to} className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-2xl hover:bg-blue-50 hover:text-blue-600 transition-all group">
        <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">{icon}</span>
        <span className="text-xs font-bold text-gray-600 group-hover:text-blue-600">{label}</span>
    </Link>
);

export default PatientDashboardPage;