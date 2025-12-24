import { useState, useEffect, useMemo } from "react";
import {
  FaSearch,
  FaFilter,
  FaFileInvoice,
  FaEye,
  FaSyncAlt,
  FaMoneyBillWave,
  FaChartLine,
  FaReceipt,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

// Import API & Modal
import {
  getInvoiceList,
  getBillDetails,
  confirmPayment,
} from "../receptionApi";
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
  const [currentAppointmentId, setCurrentAppointmentId] = useState<
    number | null
  >(null);
  const [isConfirming, setIsConfirming] = useState(false);

  // --- LOGIC THỐNG KÊ (Sử dụng useMemo để tối ưu hiệu năng) ---
  const stats = useMemo(() => {
    // Chỉ tính toán dựa trên các hóa đơn đã thanh toán (PAID) trong danh sách hiện tại
    const paidInvoices = invoices.filter((inv) => inv.paymentStatus === "PAID");
    const totalRevenue = paidInvoices.reduce(
      (sum, inv) => sum + (inv.totalAmount || 0),
      0
    );
    const invoiceCount = paidInvoices.length;
    const averageValue = invoiceCount > 0 ? totalRevenue / invoiceCount : 0;

    return { totalRevenue, invoiceCount, averageValue };
  }, [invoices]);

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
      toast.error(t("invoice.errorFetch"));
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
      document.body.style.cursor = "wait";
      const detailData = await getBillDetails(appointmentId);
      document.body.style.cursor = "default";

      setSelectedInvoiceData(detailData);
      setCurrentAppointmentId(appointmentId);
      setIsModalOpen(true);
    } catch (error) {
      document.body.style.cursor = "default";
      toast.error(t("invoice.errorLoad"));
    }
  };

  const handleConfirmPayment = async () => {
    if (!currentAppointmentId) return;
    if (!window.confirm(t("invoice.confirmMsg") || "Xác nhận thu tiền?"))
      return;

    setIsConfirming(true);
    try {
      await confirmPayment(currentAppointmentId);
      toast.success(
        t("invoice.confirmSuccess", { name: selectedInvoiceData?.patientName })
      );
      fetchInvoices();

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
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const locale = i18n.language === "en" ? "en-GB" : "vi-VN";
    return new Date(dateStr).toLocaleDateString(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="h-full flex flex-col p-6 max-w-[1600px] mx-auto font-instrument animate-fadeIn bg-slate-50/30">
      {/* 1. HEADER SECTION */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-blue-600 border border-slate-100">
          <FaFileInvoice className="text-2xl" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            {t("invoiceList.title")}
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Sunshine Dental Clinic
          </p>
        </div>
      </div>

      {/* 2. STATISTICS SECTION (New Horizontal Row) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
  {/* Doanh thu */}
  <div className="bg-white px-4 py-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3 transition-all hover:border-blue-200">
    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex-shrink-0 flex items-center justify-center text-emerald-600">
      <FaMoneyBillWave className="text-lg" />
    </div>
    <div className="overflow-hidden">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider leading-none mb-1">
        {/* FIX: Sử dụng t() cho Doanh thu (Lọc) */}
        {t("invoiceList.stats.revenue")}
      </p>
      <h3 className="text-lg font-black text-slate-800 tracking-tight truncate">
        {formatCurrency(stats.totalRevenue)}
      </h3>
    </div>
  </div>

  {/* Số lượng đơn */}
  <div className="bg-white px-4 py-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3 transition-all hover:border-blue-200">
    <div className="w-10 h-10 bg-blue-50 rounded-xl flex-shrink-0 flex items-center justify-center text-blue-600">
      <FaReceipt className="text-lg" />
    </div>
    <div className="overflow-hidden">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider leading-none mb-1">
        {/* FIX: Sử dụng t() cho Hóa đơn đã trả */}
        {t("invoiceList.stats.invoiceCount")}
      </p>
      <h3 className="text-lg font-black text-slate-800 tracking-tight">
        {stats.invoiceCount}{" "}
        <span className="text-[10px] font-bold text-slate-400 uppercase">
          {/* FIX: Sử dụng t() cho Đơn (unit) */}
          {t("invoiceList.stats.unit")}
        </span>
      </h3>
    </div>
  </div>

  {/* Giá trị trung bình */}
  <div className="bg-white px-4 py-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3 transition-all hover:border-blue-200">
    <div className="w-10 h-10 bg-purple-50 rounded-xl flex-shrink-0 flex items-center justify-center text-purple-600">
      <FaChartLine className="text-lg" />
    </div>
    <div className="overflow-hidden">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider leading-none mb-1">
        {/* FIX: Sử dụng t() cho Trung bình/Đơn */}
        {t("invoiceList.stats.averageValue")}
      </p>
      <h3 className="text-lg font-black text-slate-800 tracking-tight truncate">
        {formatCurrency(stats.averageValue)}
      </h3>
    </div>
  </div>
</div>

      {/* 3. FILTER SECTION */}
      <form
        onSubmit={handleSearch}
        className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-wrap gap-6 items-end mb-8"
      >
        <div className="flex-1 min-w-[300px]">
          <label className="text-xs font-black text-slate-400 mb-3 block uppercase tracking-[0.15em] ml-1">
            {t("invoiceList.filters.searchLabel")}
          </label>
          <div className="relative group">
            <input
              type="text"
              placeholder={t("invoiceList.filters.searchPlaceholder")}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-500 rounded-2xl text-sm transition-all outline-none font-bold text-slate-700 placeholder:text-slate-300"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <FaSearch className="absolute left-4 top-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
          </div>
        </div>

        <div className="flex gap-4">
          <div>
            <label className="text-xs font-black text-slate-400 mb-3 block uppercase tracking-[0.15em] ml-1">
              {t("invoiceList.filters.fromDate")}
            </label>
            <input
              type="date"
              className="px-4 py-3 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-500 rounded-2xl text-sm outline-none text-slate-600 font-bold cursor-pointer"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-black text-slate-400 mb-3 block uppercase tracking-[0.15em] ml-1">
              {t("invoiceList.filters.toDate")}
            </label>
            <input
              type="date"
              className="px-4 py-3 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-500 rounded-2xl text-sm outline-none text-slate-600 font-bold cursor-pointer"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
        </div>

        <div className="min-w-[220px]">
          <label className="text-xs font-black text-slate-400 mb-3 block uppercase tracking-[0.15em] ml-1">
            {t("invoiceList.filters.statusLabel")}
          </label>
          <div className="relative">
            <select
              className="w-full px-5 py-3 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-500 rounded-2xl text-sm outline-none cursor-pointer text-slate-700 font-bold appearance-none"
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
            >
              <option value="">
                {t("invoiceList.filters.statusOptions.all")}
              </option>
              <option value="PAID">
                {t("invoiceList.filters.statusOptions.paid")}
              </option>
              <option value="UNPAID">
                {t("invoiceList.filters.statusOptions.unpaid")}
              </option>
            </select>
            <div className="absolute right-4 top-4 pointer-events-none text-slate-300 text-[10px]">
              ▼
            </div>
          </div>
        </div>

        <div className="flex gap-3 ml-auto">
          <button
            type="button"
            onClick={handleReset}
            className="w-12 h-12 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-2xl transition-all active:scale-90"
            title={t("invoiceList.filters.btnResetTooltip")}
          >
            <FaSyncAlt />
          </button>
          <button
            type="submit"
            className="px-5 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-100 transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap"
          >
            <FaFilter className="text-[10px]" />{" "}
            {t("invoiceList.filters.btnFilter")}
          </button>
        </div>
      </form>

      {/* 4. TABLE SECTION */}
      <div className="flex-1 bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1 custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  {t("invoiceList.table.headers.code")}
                </th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  {t("invoiceList.table.headers.date")}
                </th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  {t("invoiceList.table.headers.customer")}
                </th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">
                  {t("invoiceList.table.headers.total")}
                </th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">
                  {t("invoiceList.table.headers.status")}
                </th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-32">
                    <div className="inline-block w-10 h-10 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                    <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                      {t("invoiceList.table.loading")}
                    </div>
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-32 text-slate-300 italic font-bold tracking-wide"
                  >
                    {t("invoiceList.table.empty")}
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-slate-50/80 transition-all group cursor-default"
                  >
                    <td className="px-8 py-5">
                      <div className="font-mono font-black text-blue-600 bg-blue-50/50 px-3 py-1 rounded-lg inline-block text-xs">
                        {inv.invoiceCode || "NO CODE"}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-sm text-slate-600 font-bold">
                      {formatDate(inv.startDateTime)}
                    </td>
                    <td className="px-8 py-5">
                      <div className="font-black text-slate-800 text-sm">
                        {inv.patientName}
                      </div>
                      <div className="text-[10px] font-black text-slate-300 mt-1 uppercase tracking-tighter">
                        {inv.patientPhone}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="font-black text-slate-800 text-base tracking-tight">
                        {formatCurrency(inv.totalAmount)}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span
                        className={`inline-flex items-center px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 ${
                          inv.paymentStatus === "PAID"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                            : inv.paymentStatus === "REFUNDED"
                            ? "bg-purple-50 text-purple-600 border-purple-100"
                            : "bg-amber-50 text-amber-600 border-amber-100"
                        }`}
                      >
                        {inv.paymentStatus}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <button
                        onClick={() => handleViewInvoice(inv.id)}
                        className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all active:scale-90"
                      >
                        <FaEye className="text-lg" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 5. FOOTER PAGINATION */}
        <div className="px-10 py-6 border-t border-slate-50 flex justify-between items-center bg-white">
          <div className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
            {t("invoiceList.pagination.info", {
              page: page + 1,
              total: totalPages > 0 ? totalPages : 1,
            })}
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-6 py-2.5 bg-slate-50 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-blue-600 hover:text-white disabled:opacity-30 disabled:hover:bg-slate-50 disabled:hover:text-slate-400 transition-all shadow-sm"
            >
              {t("invoiceList.pagination.prev")}
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-6 py-2.5 bg-slate-50 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-blue-600 hover:text-white disabled:opacity-30 disabled:hover:bg-slate-50 disabled:hover:text-slate-400 transition-all shadow-sm"
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
          viewOnly={true}
        />
      )}
    </div>
  );
};

export default InvoiceList;
