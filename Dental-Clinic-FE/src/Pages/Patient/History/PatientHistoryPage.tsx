import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../../widgets/Header/Header';
import Footer from '../../../widgets/Footer/Footer';
import patientDashboardApi from '../../../patient_api/patientDashboardApi';
import MedicalHistoryList from '../Dashboard/components/MedicalHistoryList'; 
import type { MedicalRecordDTO } from '../../types/patientDashboard';

const PatientHistoryPage: React.FC = () => {
    // 1. State dữ liệu gốc
    const [fullHistory, setFullHistory] = useState<MedicalRecordDTO[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    
    // 2. State bộ lọc
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDate, setFilterDate] = useState('');

    // 3. State phân trang
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5; 

    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (!token) { navigate("/login"); return; }

        const fetchData = async () => {
            try {
                const response = await patientDashboardApi.getDashboardSummary();
                setFullHistory(response.medicalHistory || []);
            } catch (error) {
                console.error("Failed:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [navigate]);

    // --- LOGIC LỌC DỮ LIỆU (REAL-TIME) ---
    const filteredHistory = useMemo(() => {
        return fullHistory.filter(record => {
            // 1. Lọc theo từ khóa (Tìm trong Tên BS, Chẩn đoán, Điều trị)
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = 
                record.doctorName.toLowerCase().includes(searchLower) ||
                record.diagnosis.toLowerCase().includes(searchLower) ||
                record.treatment.toLowerCase().includes(searchLower);

            // 2. Lọc theo ngày (Nếu có chọn ngày)
            // Note: record.visitDate format là "dd/MM/yyyy", input date là "yyyy-MM-dd"
            let matchesDate = true;
            if (filterDate) {
                const [year, month, day] = filterDate.split('-');
                const formattedInputDate = `${day}/${month}/${year}`;
                matchesDate = record.visitDate === formattedInputDate;
            }

            return matchesSearch && matchesDate;
        });
    }, [fullHistory, searchTerm, filterDate]);

    // --- LOGIC PHÂN TRANG (Dựa trên danh sách ĐÃ LỌC) ---
    // Reset về trang 1 khi search thay đổi
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterDate]);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredHistory.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);

    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
        window.scrollTo(0, 0);
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

    return (
        <>
            <Header />
            <div className="min-h-screen bg-[#F8FAFC] font-instrument py-10 px-4">
                <div className="max-w-5xl mx-auto">
                    
                    {/* Header Page */}
                    <div className="mb-8">
                        <button onClick={() => navigate('/patient-dashboard')} className="text-gray-500 hover:text-blue-600 text-sm mb-2 flex items-center gap-1 transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                            Quay lại Dashboard
                        </button>
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800">Lịch sử khám chữa bệnh</h1>
                                <p className="text-gray-500 mt-1">Tra cứu chi tiết quá trình điều trị của bạn.</p>
                            </div>
                            
                            {/* Thống kê nhỏ */}
                            <div className="bg-blue-50 px-4 py-2 rounded-xl text-blue-700 text-sm font-bold border border-blue-100">
                                Tổng cộng: {fullHistory.length} hồ sơ
                            </div>
                        </div>
                    </div>

                    {/* --- THANH CÔNG CỤ TÌM KIẾM & BỘ LỌC --- */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4">
                        
                        {/* 1. Ô Tìm kiếm */}
                        <div className="flex-1 relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </div>
                            <input 
                                type="text"
                                placeholder="Tìm theo tên bác sĩ, chẩn đoán, dịch vụ..." 
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* 2. Bộ lọc Ngày */}
                        <div className="md:w-48 relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            </div>
                            <input 
                                type="date" 
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-gray-600"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                            />
                        </div>

                        {/* Nút Xóa lọc (Chỉ hiện khi đang lọc) */}
                        {(searchTerm || filterDate) && (
                            <button 
                                onClick={() => { setSearchTerm(''); setFilterDate(''); }}
                                className="px-4 py-2.5 text-red-500 hover:bg-red-50 rounded-xl text-sm font-bold transition-colors whitespace-nowrap"
                            >
                                Xóa lọc &times;
                            </button>
                        )}
                    </div>

                    {/* --- DANH SÁCH --- */}
                    <div className="mb-6">
                        {filteredHistory.length > 0 ? (
                            <MedicalHistoryList history={currentItems} isDashboard={false} />
                        ) : (
                            <div className="text-center py-12 bg-white rounded-[2rem] border border-dashed border-gray-200">
                                <span className="text-4xl">🔍</span>
                                <p className="text-gray-500 mt-2 font-medium">Không tìm thấy kết quả phù hợp.</p>
                                <button 
                                    onClick={() => { setSearchTerm(''); setFilterDate(''); }}
                                    className="mt-4 text-blue-600 hover:underline text-sm"
                                >
                                    Xóa bộ lọc để xem tất cả
                                </button>
                            </div>
                        )}
                    </div>

                    {/* --- BỘ ĐIỀU KHIỂN PHÂN TRANG --- */}
                    {filteredHistory.length > 0 && totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 pb-10">
                            <button 
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
                            >
                                &larr; Trước
                            </button>
                            
                            <div className="flex gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                                    <button
                                        key={number}
                                        onClick={() => handlePageChange(number)}
                                        className={`w-10 h-10 rounded-lg font-bold transition-all ${
                                            currentPage === number 
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105' 
                                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        {number}
                                    </button>
                                ))}
                            </div>

                            <button 
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
                            >
                                Sau &rarr;
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </>
    );
};

export default PatientHistoryPage;