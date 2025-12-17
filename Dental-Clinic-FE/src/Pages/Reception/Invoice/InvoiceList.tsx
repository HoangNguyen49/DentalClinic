import { useState, useEffect } from "react";
import { FaSearch, FaFilter, FaFileInvoice, FaEye, FaSyncAlt } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

// Import API & Modal
import { getInvoiceList, getBillDetails, confirmPayment } from "../receptionApi"; 
import InvoiceModal from "../Appointment/InvoiceModal"; 

const InvoiceList = () => {
  const { t, i18n } = useTranslation("reception"); 

  // --- STATE ---
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [fromDate, setFromDate] = useState(""); 
  const [toDate, setToDate] = useState("");     
  const [paymentStatus, setPaymentStatus] = useState(""); 

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 10;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvoiceData, setSelectedInvoiceData] = useState<any>(null);
  const [currentAppointmentId, setCurrentAppointmentId] = useState<number | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  // --- FETCH DATA ---
  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const data = await getInvoiceList(
          keyword, 
          fromDate || null, 
          toDate || null, 
          paymentStatus, 
          page, 
          pageSize
      );
      
      const pageData = (data as any).result || data; 
      setInvoices(pageData.content || []);
      setTotalPages(pageData.totalPages || 0);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [page]); 

  // --- HANDLERS ---
  const handleViewInvoice = async (appointmentId: number) => {
    try {
      document.body.style.cursor = 'wait';
      const detailData = await getBillDetails(appointmentId);
      document.body.style.cursor = 'default';
      
      setSelectedInvoiceData(detailData);
      setCurrentAppointmentId(appointmentId);
      setIsModalOpen(true);
    } catch (error) {
      document.body.style.cursor = 'default';
      toast.error(t("invoice.errorLoad")); // Dùng key từ JSON
    }
  };

  const handleConfirmPayment = async () => {
    if (!currentAppointmentId) return;
    // Dùng key "confirmMsg" từ mục "invoice"
    if (!window.confirm(t("invoice.confirmMsg") || "Xác nhận thu tiền?")) return;

    setIsConfirming(true);
    try {
        await confirmPayment(currentAppointmentId);
        // Dùng key "confirmSuccess"
        toast.success(t("invoice.confirmSuccess", { name: selectedInvoiceData?.patientName }));
        fetchInvoices();
        
        // Refresh data modal
        const updatedData = await getBillDetails(currentAppointmentId);
        setSelectedInvoiceData(updatedData);
    } catch (error) {
        toast.error(t("invoice.errorConfirm"));
    } finally {
        setIsConfirming(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0); 
    fetchInvoices();
  };

  const handleReset = () => {
      setKeyword("");
      setFromDate("");
      setToDate("");
      setPaymentStatus("");
      setPage(0);
      setTimeout(() => fetchInvoices(), 100);
  };

  // --- FORMATTERS ---
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const locale = i18n.language === 'en' ? 'en-GB' : 'vi-VN';
    return new Date(dateStr).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="h-full flex flex-col p-6 max-w-[1600px] mx-auto font-instrument animate-fadeIn">
      
      {/* 1. HEADER & FILTER SECTION */}
      <div className="flex flex-col gap-6 mb-6">
        
        {/* Title */}
        <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-blue-600 border border-slate-100">
                <FaFileInvoice className="text-2xl" />
            </div>
            <div>
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{t("invoiceList.title")}</h1>
                <p className="text-sm text-slate-500 font-medium">Sunshine Dental Clinic</p>
            </div>
        </div>

        {/* Filter Bar */}
        <form onSubmit={handleSearch} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-5 items-end">
            
            {/* Search Input */}
            <div className="flex-1 min-w-[280px]">
                <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wide ml-1">
                    {t("invoiceList.filters.searchLabel")}
                </label>
                <div className="relative group">
                    <input 
                        type="text" 
                        placeholder={t("invoiceList.filters.searchPlaceholder")}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-transparent focus:bg-white border focus:border-blue-500 rounded-xl text-sm transition-all outline-none font-medium text-slate-700"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                    />
                    <FaSearch className="absolute left-3.5 top-3 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
            </div>

            {/* Date Range */}
            <div className="flex gap-3">
                <div>
                    <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wide ml-1">
                        {t("invoiceList.filters.fromDate")}
                    </label>
                    <input 
                        type="date" 
                        className="pl-3 pr-2 py-2.5 bg-slate-50 border-transparent focus:bg-white border focus:border-blue-500 rounded-xl text-sm outline-none text-slate-600 font-medium cursor-pointer"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wide ml-1">
                        {t("invoiceList.filters.toDate")}
                    </label>
                    <input 
                        type="date" 
                        className="pl-3 pr-2 py-2.5 bg-slate-50 border-transparent focus:bg-white border focus:border-blue-500 rounded-xl text-sm outline-none text-slate-600 font-medium cursor-pointer"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                    />
                </div>
            </div>

            {/* Status Select */}
            <div className="min-w-[200px]">
                <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wide ml-1">
                    {t("invoiceList.filters.statusLabel")}
                </label>
                <div className="relative">
                    <select 
                        className="w-full px-4 py-2.5 bg-slate-50 border-transparent focus:bg-white border focus:border-blue-500 rounded-xl text-sm outline-none cursor-pointer text-slate-700 font-medium appearance-none"
                        value={paymentStatus}
                        onChange={(e) => setPaymentStatus(e.target.value)}
                    >
                        <option value="">{t("invoiceList.filters.statusOptions.all")}</option>
                        <option value="PAID">{t("invoiceList.filters.statusOptions.paid")}</option>
                        <option value="UNPAID">{t("invoiceList.filters.statusOptions.unpaid")}</option>
                    </select>
                    {/* Custom Arrow */}
                    <div className="absolute right-3 top-3 pointer-events-none text-slate-400 text-xs">▼</div>
                </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 ml-auto">
                <button 
                    type="button" 
                    onClick={handleReset} 
                    className="w-11 h-11 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors tooltip"
                    title={t("invoiceList.filters.btnResetTooltip")}
                >
                    <FaSyncAlt />
                </button>
                <button 
                    type="submit" 
                    className="px-6 h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center gap-2"
                >
                    <FaFilter /> {t("invoiceList.filters.btnFilter")}
                </button>
            </div>
        </form>
      </div>

      {/* 2. TABLE SECTION */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
        <div className="overflow-auto custom-scrollbar flex-1">
            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/80 sticky top-0 z-10 backdrop-blur-sm">
                    <tr>
                        <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider">{t("invoiceList.table.headers.code")}</th>
                        <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider">{t("invoiceList.table.headers.date")}</th>
                        <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider">{t("invoiceList.table.headers.customer")}</th>
                        <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider text-right">{t("invoiceList.table.headers.total")}</th>
                        <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider text-center">{t("invoiceList.table.headers.status")}</th>
                        <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider text-center w-20"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {loading ? (
                        <tr><td colSpan={6} className="text-center py-24 text-slate-400">
                             <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin mb-3"></div>
                             <div className="text-sm font-medium">{t("invoiceList.table.loading")}</div>
                        </td></tr>
                    ) : invoices.length === 0 ? (
                        <tr><td colSpan={6} className="text-center py-24 text-slate-400 italic font-medium">
                            {t("invoiceList.table.empty")}
                        </td></tr>
                    ) : (
                        invoices.map((inv) => (
                            <tr key={inv.id} className="hover:bg-blue-50/40 transition-colors group">
                                {/* Code */}
                                <td className="px-6 py-4">
                                    <div className="font-mono font-bold text-slate-700 group-hover:text-blue-600 transition-colors text-sm">
                                        {inv.invoiceCode || <span className="text-slate-300">{t("invoiceList.table.noCode")}</span>}
                                    </div>
                                </td>
                                
                                {/* Date */}
                                <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                                    {formatDate(inv.startDateTime)}
                                </td>
                                
                                {/* Customer */}
                                <td className="px-6 py-4">
                                    <div className="font-bold text-slate-800 text-sm">{inv.patientName}</div>
                                    <div className="text-xs text-slate-400 mt-1 font-medium">{inv.patientPhone}</div>
                                </td>
                                
                                {/* Amount */}
                                <td className="px-6 py-4 text-right">
                                    <div className="font-bold text-slate-800 text-base tracking-tight">
                                        {formatCurrency(inv.totalAmount)}
                                    </div>
                                </td>
                                
                                {/* Status Badge */}
                                <td className="px-6 py-4 text-center">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide border ${
                                        inv.paymentStatus === 'PAID' 
                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                            : inv.paymentStatus === 'REFUNDED'
                                            ? 'bg-purple-50 text-purple-600 border-purple-100'
                                            : 'bg-amber-50 text-amber-600 border-amber-100'
                                    }`}>
                                        {inv.paymentStatus === 'PAID' ? t("invoiceList.table.statusDisplay.paid") : 
                                         inv.paymentStatus === 'UNPAID' ? t("invoiceList.table.statusDisplay.unpaid") : 
                                         inv.paymentStatus === 'REFUNDED' ? t("invoiceList.table.statusDisplay.refunded") :
                                         inv.paymentStatus}
                                    </span>
                                </td>
                                
                                {/* Action */}
                                <td className="px-6 py-4 text-center">
                                    <button 
                                        onClick={() => handleViewInvoice(inv.id)}
                                        className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                        title={t("invoiceList.table.viewTooltip")}
                                    >
                                        <FaEye />
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>

        {/* 3. FOOTER PAGINATION */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center bg-white">
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wide">
                {t("invoiceList.pagination.info", { page: page + 1, total: totalPages > 0 ? totalPages : 1 })}
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={() => setPage(p => Math.max(0, p - 1))} 
                    disabled={page === 0} 
                    className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 disabled:opacity-50 disabled:hover:text-slate-600 transition-all shadow-sm"
                >
                    {t("invoiceList.pagination.prev")}
                </button>
                <button 
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} 
                    disabled={page >= totalPages - 1} 
                    className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 disabled:opacity-50 disabled:hover:text-slate-600 transition-all shadow-sm"
                >
                    {t("invoiceList.pagination.next")}
                </button>
            </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && selectedInvoiceData && (
        <InvoiceModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            data={selectedInvoiceData}
            onConfirm={handleConfirmPayment}
            loadingConfirm={isConfirming}
        />
      )}

    </div>
  );
};

export default InvoiceList;