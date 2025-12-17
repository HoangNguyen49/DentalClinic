import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePayroll } from "./usePayroll";
import {
  Calculator, Lock, Search, AlertCircle, Banknote, Calendar,
  User, Clock, CheckCircle2, MoreVertical, Eye, SlidersHorizontal, FileSpreadsheet
} from "lucide-react";
import { formatMoney, formatVNDateTime } from "../../../../../utils/format";
import ProductPagination from "../../Product/widgets/ProductPagination";
import AdvancePaymentModal from "../widgets/AdvancePaymentModal";
import { useAdvancePaymentModal } from "../widgets/useAdvancePaymentModal";
import MissingConfigAlert from "../widgets/MissingConfigAlert";

const PayrollPage: React.FC = () => {
  const navigate = useNavigate();
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  const {
    payslips, loading, error,
    month, year, keyword,
    page, size, totalPages, totalElements,
    cycleStatus,
    handleCalculate, handleFinalize,
    missingConfigs,
    handlePageChange, handleSizeChange, handleSearch, handleMonthChange,
    fetchPayslips,
    handleExportExcel, isExporting
  } = usePayroll();
  const adjustmentModal = useAdvancePaymentModal(fetchPayslips);
  const currentMonthValue = `${year}-${month.toString().padStart(2, '0')}`;

  return (
    <div className="p-6 min-h-screen bg-gray-50 font-sans text-gray-900">
      <AdvancePaymentModal
        isOpen={adjustmentModal.isOpen}
        onClose={adjustmentModal.closeModal}
        employeeName={adjustmentModal.employeeName}
        items={adjustmentModal.items}
        loading={adjustmentModal.loading}
        onAdd={adjustmentModal.handleAddItem}
        onRemove={adjustmentModal.handleRemoveItem}
      />
      <div className="max-w-[1600px] mx-auto space-y-6">

        {/* HEADER */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                Payroll Management
              </h1>
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                <p className="text-sm text-gray-500">
                  Monthly payroll processing and finalization.
                </p>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 uppercase tracking-wide
      ${cycleStatus === 'PAID' ? 'bg-green-100 text-green-700 border-green-200' :
                      cycleStatus === 'FINALIZED' ? 'bg-gray-100 text-gray-600 border-gray-200' :
                        cycleStatus === 'DRAFT' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                          'bg-white text-gray-400 border-gray-200 border-dashed'
                    }`}
                >
                  {cycleStatus === 'PAID' ? <CheckCircle2 size={12} /> :
                    cycleStatus === 'FINALIZED' ? <Lock size={12} /> :
                      <Calculator size={12} />}
                  {cycleStatus || "NO DATA"}
                </span>
              </div>
            </div>
            <MissingConfigAlert missingUsers={missingConfigs} />

          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Period</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="month"
                  value={currentMonthValue}
                  onChange={handleMonthChange}
                  className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Search</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full sm:w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-blue-500 shadow-sm"
                  placeholder="Search staff name..."
                  value={keyword}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 mb-[1px]">
              <button
                onClick={handleCalculate}
                disabled={cycleStatus === 'FINALIZED' || cycleStatus === 'PAID' || loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all font-medium text-sm"
              >
                <Calculator className="w-4 h-4" /> {loading ? 'Processing...' : ''}
              </button>
              <button
                onClick={handleFinalize}
                disabled={cycleStatus === 'FINALIZED' || cycleStatus === 'PAID' || payslips.length === 0 || loading}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 shadow-sm transition-all font-medium text-sm"
              >
                <Lock className="w-4 h-4" />
              </button>
              <button
                onClick={handleExportExcel}
                disabled={loading || isExporting || payslips.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all font-medium text-sm"
                title="Download Excel Report"
              >
                {isExporting ? (
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                ) : (
                  <FileSpreadsheet className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* TABLE AREA */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {error && (
            <div className="p-4 bg-red-50 text-red-700 text-sm border-b border-red-100 flex items-center gap-2">
              <AlertCircle size={16} />
              <span className="font-bold">Error:</span> {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Employee</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Calculated At</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase">Work Days / Shifts</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Base Salary</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-green-600 uppercase">Total Income (+)</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-red-600 uppercase">Deductions (-)</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-blue-700 uppercase">NET SALARY</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="mt-2 text-sm text-gray-500">Calculating payroll...</p>
                    </td>
                  </tr>
                ) : payslips.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-gray-500 italic flex flex-col items-center gap-2">
                      <Banknote className="w-10 h-10 text-gray-300" />
                      No data for this period. Click "Calculate" to start.
                    </td>
                  </tr>
                ) : (
                  payslips.map((slip) => (
                    <tr key={slip.id} className="hover:bg-blue-50/30 transition-colors group">

                      {/* Employee Info (DTO Phẳng) */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 text-sm">{slip.userFullName}</div>
                            <div className="text-xs text-gray-500">{slip.userCode}</div>
                          </div>
                        </div>
                      </td>

                      {/* Created At */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="w-3 h-3 text-gray-400" />
                          {formatVNDateTime(slip.createdAt)}
                        </div>
                      </td>

                      {/* Work Logic: Ưu tiên hiển thị Shift nếu có */}
                      <td className="px-6 py-4 text-center text-sm text-gray-600">
                        {slip.standardShiftsSnapshot > 0
                          ? <span>{slip.actualShifts} / {slip.standardShiftsSnapshot} shifts</span>
                          : <span>{slip.actualWorkDays} / {slip.standardWorkDaysSnapshot} days</span>
                        }
                      </td>

                      <td className="px-6 py-4 text-right text-sm text-gray-600">{formatMoney(slip.baseSalarySnapshot)}</td>

                      <td className="px-6 py-4 text-right text-sm font-medium text-green-700 bg-green-50/30">
                        <div title={`Salary: ${formatMoney(slip.salaryAmount)} + Allowance: ${formatMoney(slip.allowanceAmount)}`}>
                          {formatMoney(slip.grossSalary)}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right text-sm font-medium text-red-700 bg-red-50/30">
                        <div title={`Penalty: ${formatMoney(slip.latePenaltyAmount)} + Ins: ${formatMoney(slip.insuranceDeduction)} + Tax: ${formatMoney(slip.taxDeduction)}`}>
                          -{formatMoney(slip.latePenaltyAmount + slip.insuranceDeduction + slip.taxDeduction + slip.otherDeductionAmount)}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 font-bold rounded-lg border border-blue-100 text-sm">
                          {formatMoney(slip.netSalary)}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <div className="relative flex justify-center">
                          <button
                            onClick={() => setOpenDropdown(openDropdown === slip.id ? null : slip.id)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                          >
                            <MoreVertical size={18} />
                          </button>

                          {openDropdown === slip.id && (
                            <>
                              {/* Overlay click ra ngoài */}
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setOpenDropdown(null)}
                              />

                              {/* Dropdown Content */}
                              <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-20 py-1 origin-top-right animate-in fade-in zoom-in-95 duration-100">

                                {/* ITEM 1: VIEW DETAIL */}
                                <button
                                  onClick={() => {
                                    navigate(`/accountant/payroll/payslips/${slip.id}`);
                                    setOpenDropdown(null);
                                  }}
                                  className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-3 transition-colors border-b border-gray-50"
                                >
                                  <Eye className="w-4 h-4" />
                                  <div>
                                    <div className="font-medium">View Detail</div>
                                    <div className="text-[10px] text-gray-400">See full payslip breakdown</div>
                                  </div>
                                </button>

                                {/* ITEM 2: ADJUSTMENTS */}
                                {(cycleStatus === 'DRAFT' || cycleStatus === null) && (
                                  <button
                                    onClick={() => {
                                      adjustmentModal.openModal(slip); // [QUAN TRỌNG] Gọi hàm open từ hook mới
                                      setOpenDropdown(null);
                                    }}
                                    className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-3 transition-colors"
                                  >
                                    <SlidersHorizontal className="w-4 h-4" />
                                    <div>
                                      <div className="font-medium">Adjustments</div>
                                      <div className="text-[10px] text-gray-400">Add Bonus, Penalty, Advance...</div>
                                    </div>
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && payslips.length > 0 && (
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

export default PayrollPage;