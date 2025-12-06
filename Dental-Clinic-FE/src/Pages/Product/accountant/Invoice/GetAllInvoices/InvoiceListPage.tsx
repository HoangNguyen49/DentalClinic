import React from "react";
import { Link } from "react-router-dom";
import { useInvoiceList } from "./useInvoiceList";
import { Search, Filter, Eye, FileText } from "lucide-react";
import { formatMoney, formatVNDateTime } from "../../../../../utils/format";
import ProductPagination from "../../Product/widgets/ProductPagination"; 

const InvoiceListPage: React.FC = () => {
  const {
    invoices,
    loading,
    error,
    totalPages,
    totalElements, // [NEW]
    page,          // [UPDATE]
    size,          // [NEW]
    filters,
    handlePageChange,
    handleSizeChange, // [NEW]
    handleStatusChange,
    handleSearch,
  } = useInvoiceList();

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      NEW: "bg-blue-100 text-blue-800 border-blue-200",
      CONFIRMED: "bg-yellow-100 text-yellow-800 border-yellow-200",
      PROCESSING: "bg-purple-100 text-purple-800 border-purple-200",
      COMPLETED: "bg-green-100 text-green-800 border-green-200",
      CANCELLED: "bg-red-100 text-red-800 border-red-200",
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || "bg-gray-100 text-gray-800 border-gray-200"}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="p-6 min-h-screen bg-gray-100 font-sans text-gray-900">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* TOOLBAR AREA (Giữ nguyên) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              Invoices
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage orders and financial records.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
             {/* ... (Phần Search và Filter giữ nguyên) ... */}
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

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <select
                className="block w-full sm:w-48 pl-10 pr-8 py-2 border border-gray-300 rounded-lg leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm shadow-sm appearance-none cursor-pointer"
                value={filters.status}
                onChange={(e) => handleStatusChange(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="NEW">New Order</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PROCESSING">Processing</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* TABLE AREA */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          {error && (
            <div className="p-4 bg-red-50 text-red-700 text-sm border-b border-red-100">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              {/* ... (Phần thead và tbody giữ nguyên code cũ của bạn) ... */}
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
                    <td colSpan={7} className="p-12 text-center text-gray-500 italic">
                      No invoices found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.invoiceId} className="hover:bg-blue-50/50 transition-colors group">
                       <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
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
                        <span className="text-sm font-bold text-gray-900">{formatMoney(inv.totalAmount)}</span>
                      </td>
                      <td className="px-6 py-4 text-center">{getStatusBadge(inv.invoiceStatus)}</td>
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

          {/* [NEW] Pagination xịn mịn */}
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