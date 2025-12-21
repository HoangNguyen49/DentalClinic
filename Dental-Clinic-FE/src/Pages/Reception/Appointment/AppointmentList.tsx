import { useEffect, useState, useCallback } from 'react';
import { Search, Filter, CreditCard, Calendar, DollarSign, RefreshCw, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next'; 
import InvoiceModal from './InvoiceModal'; 

import { 
    searchAppointments, 
    getBillDetails, 
    confirmPayment, 
    type BillInvoice,
    type AppointmentDTO 
} from '../receptionApi'; 

export default function AppointmentList() {
    const { t } = useTranslation("reception"); 

    // --- 1. STATE QUẢN LÝ DỮ LIỆU ---
    const [appointments, setAppointments] = useState<AppointmentDTO[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Pagination
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const pageSize = 10; 

    // Filters
    const [keyword, setKeyword] = useState('');
    const [filterStatus, setFilterStatus] = useState(''); 
    const [filterPayment, setFilterPayment] = useState(''); 
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]); 

    // --- 2. STATE QUẢN LÝ MODAL BILL ---
    const [isBillModalOpen, setIsBillModalOpen] = useState(false);
    const [billData, setBillData] = useState<BillInvoice | null>(null);
    const [processingId, setProcessingId] = useState<number | null>(null); 

    // --- 3. HÀM LOAD DỮ LIỆU TỪ API ---
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await searchAppointments({
                keyword: keyword,
                status: filterStatus || null,
                paymentStatus: filterPayment || null,
                date: filterDate || null,
                page: page,
                size: pageSize
            });
            
            // Fix an toàn: tránh lỗi NaN hoặc undefined
            setAppointments(res.content || []);
            setTotalPages(res.totalPages || 0);
            
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [page, keyword, filterStatus, filterPayment, filterDate, pageSize]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- 4. XỬ LÝ MỞ HÓA ĐƠN ---
    const handleOpenBill = async (appointmentId: number) => {
        setProcessingId(appointmentId);
        try {
            const data = await getBillDetails(appointmentId);
            setBillData(data);
            setIsBillModalOpen(true);
        } catch (error) {
            toast.error(t("invoice.errorLoad")); // Dịch lỗi tải hóa đơn
        } finally {
            setProcessingId(null);
        }
    };

    // --- 5. XỬ LÝ XÁC NHẬN THANH TOÁN ---
    const handleConfirmPayment = async () => {
        if (!billData) return;
        
        const rawId = billData.invoiceId.replace("INV-", "");
        const appId = parseInt(rawId);

        try {
            await confirmPayment(appId);
            // Dịch thông báo thành công có kèm tên bệnh nhân
            toast.success(t("invoice.confirmSuccess", { name: billData.patientName }));
            setIsBillModalOpen(false);
            fetchData(); // Reload lại bảng
        } catch (error) {
            toast.error(t("invoice.errorConfirm")); // Dịch lỗi xác nhận
        }
    };

    // --- HELPER FORMAT ---
    const formatTime = (isoString: string) => {
        if (!isoString) return "--:--";
        const date = new Date(isoString);
        return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    const renderPaymentBadge = (status: string | null) => {
        const safeStatus = status ? status : 'UNPAID';
        // Sử dụng key từ file reception.json (status.PAID, status.UNPAID...)
        switch (safeStatus) {
            case 'PAID': 
                return <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">{t("status.PAID")}</span>;
            case 'UNPAID': 
                return <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">{t("status.UNPAID")}</span>;
            case 'DEPOSIT_PAID': 
                return <span className="px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 border border-yellow-200">{t("status.DEPOSIT_PAID")}</span>;
            default: 
                return <span className="text-gray-400 text-xs">--</span>;
        }
    };

    return (
        <div className="p-6 bg-gray-50 h-full flex flex-col animate-fadeIn">
            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 flex-shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">{t("list.title")}</h1>
                    <p className="text-sm text-gray-500">{t("list.subtitle")}</p>
                </div>
                
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input 
                        type="text" 
                        placeholder={t("list.searchPlaceholder")} 
                        value={keyword}
                        onChange={(e) => { setKeyword(e.target.value); setPage(0); }}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none shadow-sm" 
                    />
                </div>
            </div>

            {/* --- FILTER BAR --- */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-wrap gap-4 items-center flex-shrink-0">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-700">{t("list.filter")}:</span>
                </div>

                <input 
                    type="date" 
                    value={filterDate}
                    onChange={(e) => { setFilterDate(e.target.value); setPage(0); }}
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />

                <select 
                    value={filterStatus}
                    onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }}
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                    <option value="">{t("list.allStatus")}</option>
                    <option value="SCHEDULED">{t("status.SCHEDULED")}</option>
                    <option value="COMPLETED">{t("status.COMPLETED")}</option>
                    <option value="CANCELLED">{t("status.CANCELLED")}</option>
                </select>

                <select 
                    value={filterPayment}
                    onChange={(e) => { setFilterPayment(e.target.value); setPage(0); }}
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                    <option value="">{t("list.allPayment")}</option>
                    <option value="UNPAID">{t("status.UNPAID")}</option>
                    <option value="PAID">{t("status.PAID")}</option>
                </select>

                <button 
                    onClick={fetchData} 
                    className="ml-auto p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all" 
                    title={t("list.refresh")}
                >
                    <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                </button>
            </div>

            {/* --- DATA TABLE CONTAINER --- */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden min-h-0">
                <div className="overflow-x-auto overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    <table className="w-full text-left border-collapse relative">
                        <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-bold tracking-wider sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="p-4 border-b bg-gray-50">{t("list.colPatient")}</th>
                                <th className="p-4 border-b bg-gray-50">{t("list.colTime")}</th>
                                <th className="p-4 border-b bg-gray-50">{t("list.colDoctor")}</th>
                                <th className="p-4 border-b text-center bg-gray-50">{t("list.colStatus")}</th>
                                <th className="p-4 border-b text-center bg-gray-50">{t("list.colPayment")}</th>
                                <th className="p-4 border-b text-right bg-gray-50">{t("list.colAction")}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">
                                        <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                                        <p>{t("list.loading")}</p>
                                    </td>
                                </tr>
                            ) : appointments.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-400 italic">
                                        {t("list.noData")}
                                    </td>
                                </tr>
                            ) : (
                                appointments.map((app) => (
                                    <tr key={app.id} className="hover:bg-blue-50 transition-colors group">
                                        <td className="p-4">
                                            <div className="font-bold text-gray-800 flex items-center gap-2">
                                                <User className="w-4 h-4 text-gray-400"/> {app.patientName}
                                            </div>
                                            <div className="text-xs text-gray-500 pl-6">{app.patientPhone}</div>
                                            <div className="text-[10px] text-gray-400 pl-6 font-mono">{app.patientCode}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium flex items-center gap-1">
                                                <Calendar className="w-3 h-3 text-blue-500"/>
                                                {formatTime(app.startDateTime)}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {new Date(app.startDateTime).toLocaleDateString('vi-VN')}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-gray-900 font-medium">{app.doctorName || t("list.unassignedDoc")}</div>
                                            <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded border ${
                                                app.appointmentType === 'VIP' 
                                                ? 'bg-purple-50 text-purple-600 border-purple-200' 
                                                : 'bg-gray-50 text-gray-600 border-gray-200'
                                            }`}>
                                                {app.appointmentType}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                                app.status === 'COMPLETED' ? 'text-green-600 bg-green-50' : 
                                                app.status === 'CANCELLED' ? 'text-gray-400 bg-gray-100 line-through' :
                                                'text-blue-600 bg-blue-50'
                                            }`}>
                                                {t(`status.${app.status}`)}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            {renderPaymentBadge(app.paymentStatus)}
                                        </td>
                                        <td className="p-4 text-right">
                                            {app.paymentStatus !== 'PAID' && app.status !== 'CANCELLED' && (
                                                <button 
                                                    onClick={() => handleOpenBill(app.id)}
                                                    disabled={processingId === app.id}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm transition-all text-xs font-bold active:scale-95 disabled:opacity-50"
                                                >
                                                    {processingId === app.id ? (
                                                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    ) : (
                                                        <DollarSign className="w-3 h-3" />
                                                    )}
                                                    {t("list.collectMoney")}
                                                </button>
                                            )}
                                            {app.paymentStatus === 'PAID' && (
                                                <button 
                                                    onClick={() => handleOpenBill(app.id)}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-100 transition-all text-xs font-medium"
                                                >
                                                    <CreditCard className="w-3 h-3" /> {t("list.printBill")}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* --- PAGINATION --- */}
                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-between items-center flex-shrink-0">
                    <span className="text-sm text-gray-500">
                        {t("list.pageInfo", { current: isNaN(page) ? 0 : page + 1, total: totalPages || 0, count: appointments.length })}
                    </span>

                    <div className="flex gap-2">
                        <button 
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={page <= 0}
                            className="p-1 border rounded hover:bg-white disabled:opacity-50 transition bg-white"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button 
                            onClick={() => {
                                if (page < totalPages - 1) {
                                    setPage(page + 1);
                                }
                            }}
                            disabled={totalPages === 0 || page >= totalPages - 1}
                            className="p-1 border rounded hover:bg-white disabled:opacity-50 transition bg-white"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* --- MODAL --- */}
            <InvoiceModal 
                isOpen={isBillModalOpen}
                onClose={() => setIsBillModalOpen(false)}
                data={billData}
                onConfirm={handleConfirmPayment}
                loadingConfirm={false} 
            />
        </div>
    );
}