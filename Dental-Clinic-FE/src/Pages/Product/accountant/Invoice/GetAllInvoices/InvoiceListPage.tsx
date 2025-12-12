import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useInvoiceList } from "./useInvoiceList";
import { 
  Search, Filter, Eye, FileText, 
  CheckCircle, Clock, XCircle, Package, AlertCircle, Layers 
} from "lucide-react"; // [NEW] Import thêm icons
import { formatMoney, formatVNDateTime } from "../../../../../utils/format";
import ProductPagination from "../../Product/widgets/ProductPagination";

const InvoiceListPage: React.FC = () => {
  const {
    invoices,
    statistics, // [NEW] Lấy statistics từ hook
    loading,
    error,
    totalPages,
    totalElements,
    page,
    size,
    filters,
    handlePageChange,
    handleSizeChange,
    handleStatusChange,
    handleSearch,
  } = useInvoiceList();

  // [HELPER] Tính tổng số lượng từ API Statistics trả về
  const totalCountAll = useMemo(() => {
    return statistics.reduce((sum, item) => sum + item.totalCount, 0);
  }, [statistics]);

  // [HELPER] Lấy số lượng theo status (An toàn null)
  const getCount = (status: string) => {
    return statistics.find(s => s.status === status)?.totalCount || 0;
  };

  // [HELPER] Render Badge cho từng Status trên Header
  const renderStatBadge = (status: string, label: string, count: number, icon: React.ReactNode, colorClass: string, activeColor: string) => {
    const isActive = filters.status === status || (status === "" && filters.status === "");
    
    return (
      <button
        onClick={() => handleStatusChange(status)}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200 text-sm font-medium
          ${isActive 
            ? `bg-white shadow-sm ring-2 ring-offset-1 ${activeColor} border-transparent` 
            : `bg-white/50 hover:bg-white border-gray-200 text-gray-600 hover:shadow-sm`
          }
          ${colorClass}
        `}
      >
        {icon}
        <span>{label}</span>
        <span className="bg-white/80 px-1.5 py-0.5 rounded-md text-xs font-bold shadow-sm ml-1 border border-black/5">
          {count}
        </span>
      </button>
    );
  };

  // [HELPER] Render Badge nhỏ trong bảng (Table Cell)
  const getStatusBadge = (status: string) => {
     // Style config
     const styles: Record<string, { bg: string, text: string, border: string, icon: React.ReactNode }> = {
      NEW: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-100", icon: <Package size={12} /> },
      CONFIRMED: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-100", icon: <CheckCircle size={12} /> },
      PROCESSING: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-100", icon: <Clock size={12} /> },
      COMPLETED: { bg: "bg-green-50", text: "text-green-700", border: "border-green-100", icon: <CheckCircle size={12} /> },
      CANCELLED: { bg: "bg-red-50", text: "text-red-700", border: "border-red-100", icon: <XCircle size={12} /> },
    };

    const style = styles[status] || { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-100", icon: <AlertCircle size={12} /> };

    return (
      <div className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center justify-center w-fit mx-auto gap-1.5 uppercase tracking-wide ${style.bg} ${style.text} ${style.border}`}>
        {style.icon}
        {status}
      </div>
    );
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50 font-sans text-gray-900">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* === HEADER AREA === */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
          
          {/* LEFT: Title & Description */}
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-7 h-7 text-blue-600" />
                Invoices Management
              </h1>
              <p className="text-sm text-gray-500 mt-1 ml-9">
                Manage orders, track payments and financial records.
              </p>
            </div>

            {/* [NEW] STATISTICS BADGES (DASHBOARD MINI) */}
            <div className="flex flex-wrap gap-3 ml-9">
              {/* Tất cả */}
              {renderStatBadge("", "All", totalCountAll, <Layers size={14} />, "text-gray-700", "ring-gray-400")}
              
              {/* New */}
              {renderStatBadge("NEW", "New", getCount("NEW"), <Package size={14} />, "text-blue-700", "ring-blue-400")}
              
              {/* Confirmed */}
              {renderStatBadge("CONFIRMED", "Confirmed", getCount("CONFIRMED"), <CheckCircle size={14} />, "text-yellow-700", "ring-yellow-400")}
              
              {/* Processing */}
              {renderStatBadge("PROCESSING", "Processing", getCount("PROCESSING"), <Clock size={14} />, "text-purple-700", "ring-purple-400")}
              
              {/* Completed */}
              {renderStatBadge("COMPLETED", "Paid", getCount("COMPLETED"), <CheckCircle size={14} />, "text-green-700", "ring-green-400")}
              
              {/* Cancelled */}
              {renderStatBadge("CANCELLED", "Cancelled", getCount("CANCELLED"), <XCircle size={14} />, "text-red-700", "ring-red-400")}
            </div>
          </div>

          {/* RIGHT: Search & Filter (Giữ nguyên logic cũ nhưng làm gọn UI) */}
          <div className="flex flex-col sm:flex-row gap-3">
             {/* ... (Phần Input Search cũ giữ nguyên) ... */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                type="text"
                className="block w-full sm:w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-shadow shadow-sm"
                placeholder="Search code, phone..."
                value={filters.keyword}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            {/* Đã có nút filter nhanh ở trên rồi nên có thể ẩn Select Dropdown Status nếu muốn, hoặc giữ lại làm backup */}
          </div>
        </div>

        {/* === TABLE AREA === */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {error && (
            <div className="p-4 bg-red-50 text-red-700 text-sm border-b border-red-100 flex items-center gap-2">
              <AlertCircle size={16} />
              <span className="font-bold">Error:</span> {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Invoice Code</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created At</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Updated</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="mt-2 text-sm text-gray-500">Loading invoices...</p>
                    </td>
                  </tr>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-gray-500 italic flex flex-col items-center gap-2">
                      <Package className="w-10 h-10 text-gray-300" />
                      No invoices found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.invoiceId} className="hover:bg-blue-50/30 transition-colors group">
                       {/* ... (Các cột khác giữ nguyên) ... */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                            <FileText className="w-4 h-4" />
                          </div>
                          <span className="font-medium text-gray-900 text-sm">{inv.invoiceCode}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatVNDateTime(inv.createdAt)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {inv.updatedAt && inv.updatedAt !== inv.createdAt ? formatVNDateTime(inv.updatedAt) : <span className="text-gray-400">-</span>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{inv.customerFullName}</div>
                        <div className="text-xs text-gray-500 font-mono mt-0.5">{inv.customerPhone}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold text-gray-900">{formatMoney(inv.totalAmount, inv.currency)}</span>
                      </td>
                      
                      {/* [UPDATE] Status Column dùng style mới */}
                      <td className="px-6 py-4 text-center">
                        {getStatusBadge(inv.invoiceStatus)}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <Link to={`/accountant/invoices/${inv.invoiceId}`} className="inline-flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all" title="View Details">
                          <Eye className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && invoices.length > 0 && (
            <ProductPagination
              page={page}
              size={size}
              totalPages={totalPages}
              totalElements={totalElements}
              onPageChange={handlePageChange}
              onSizeChange={handleSizeChange}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceListPage;