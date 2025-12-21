import React from "react";
import { useGetPayrollByIdDetail } from "./useGetPayrollByIdDetail";
import {
  ArrowLeft, Download, User, Clock,
  TrendingUp, TrendingDown, HelpCircle, AlertCircle
} from "lucide-react";
import { formatMoney, formatVNDateTime } from "../../../../../../utils/format";
import { exportToPDF } from "../../../../../../utils/PDFExport";

const GetPayrollByIdDetail: React.FC = () => {
  const { payslip, loading, error, navigate } = useGetPayrollByIdDetail();
  const [showTaxDetail, setShowTaxDetail] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);

  const handleExportClick = async () => {
    if (!payslip) return;
    setIsExporting(true);
    const fileName = `Payslip_${payslip.userCode}_${payslip.month}_${payslip.year}`;
    await exportToPDF('payslip-content', fileName);
    setIsExporting(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  if (error || !payslip) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-red-500 font-medium bg-white p-6 rounded shadow">{error || "Payslip not found"}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-6 font-sans text-gray-900 print:bg-white print:p-0">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* HEADER ACTIONS (Ẩn khi in) */}
        <div className="flex justify-between items-center print:hidden">
          <button
            onClick={handleExportClick}
            disabled={isExporting}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-sm transition-colors disabled:opacity-70"
          >
            {isExporting ? (
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
            ) : (
              <Download size={18} />
            )}
            {isExporting ? " Generating PDF..." : " Download PDF"}
          </button>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>

        {/* === MAIN PAYSLIP CARD === */}
        <div id="payslip-content" className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200 print:shadow-none print:border">

          {/* 1. BRANDING HEADER */}
          <div className="bg-gradient-to-r from-blue-800 to-blue-600 p-8 text-white flex justify-between items-start print:bg-none print:text-black print:border-b-2 print:border-black">
            <div>
              <h1 className="text-3xl font-bold uppercase tracking-wide">Payslip Details</h1>
              <p className="opacity-90 mt-1 text-lg">Sunshine Dental Care</p>
            </div>
            <div className="text-right">
              <div className="text-sm opacity-80 uppercase tracking-wider">Payroll Period</div>
              <div className="text-3xl font-bold">{payslip.month} / {payslip.year}</div>
              <div className="mt-2 inline-block px-3 py-1 rounded bg-white/20 border border-white/30 text-xs font-bold uppercase tracking-wider print:border-black print:text-black">
                {payslip.status}
              </div>
            </div>
          </div>

          {/* 2. EMPLOYEE & ATTENDANCE INFO */}
          <div className="p-8 border-b border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex gap-5">
              <div className="h-16 w-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 print:hidden">
                <User size={32} />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Employee Information</p>
                <h3 className="text-xl font-bold text-gray-900 mt-1">{payslip.userFullName}</h3>
                <div className="text-sm text-gray-600 mt-1 space-y-0.5">
                  <p>ID: <span className="font-mono font-medium text-gray-900">{payslip.userCode}</span></p>
                  <p>Email: {payslip.userEmail}</p>
                  <p>Role: <span className="font-medium text-blue-700">{payslip.roleName || "Staff"}</span></p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 print:bg-transparent print:border-black">
              <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                <Clock size={14} /> Work Summary ({payslip.workType})
              </h4>
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-gray-600">Standard (Định mức):</span>
                <span className="font-bold text-gray-900">{payslip.workStandard}</span>
              </div>
              <div className="flex justify-between items-center text-sm mb-3 border-b border-gray-200 pb-2">
                <span className="text-gray-600">Actual (Thực tế):</span>
                <span className="font-bold text-blue-600 text-lg">{payslip.workActual}</span>
              </div>
              <div className="text-xs text-gray-500  bg-white p-2 rounded border border-dashed border-gray-300">
                <span className="font-semibold">Formula:</span> {payslip.workFormula}
              </div>
            </div>
          </div>

          <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* 3. INCOME SECTION */}
            <section>
              <div className="flex justify-between items-center border-b-2 border-green-500 pb-3 mb-5">
                <h4 className="text-lg font-bold text-green-800 uppercase flex items-center gap-2">
                  <TrendingUp size={20} /> Earnings
                </h4>
                <span className="text-xl font-bold text-green-700">+ {formatMoney(payslip.totalIncome)}</span>
              </div>

              <div className="space-y-4">
                {payslip.incomeItems.map((item, idx) => (
                  <div key={idx} className="border-b border-dashed border-gray-100 pb-3 last:border-0">
                    <div className="flex justify-between items-start">
                      <div className="pr-4">
                        <span className={`block text-sm ${item.isHighlight ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                          {item.name}
                        </span>
                        {/* HIỂN THỊ CÔNG THỨC THƯỞNG CHI TIẾT TỪ BE */}
                        {item.description && (
                          <span className="text-xs text-gray-400 mt-1 block ">{item.description}</span>
                        )}
                      </div>
                      <span className={`text-sm whitespace-nowrap ${item.isHighlight ? 'font-bold text-gray-900' : 'font-medium text-gray-600'}`}>
                        {formatMoney(item.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 4. DEDUCTION SECTION */}
            <section>
              <div className="flex justify-between items-center border-b-2 border-red-500 pb-3 mb-5">
                <h4 className="text-lg font-bold text-red-800 uppercase flex items-center gap-2">
                  <TrendingDown size={20} /> Deductions
                </h4>
                <span className="text-xl font-bold text-red-600">- {formatMoney(payslip.totalDeduction)}</span>
              </div>

              <div className="space-y-4 mb-6">
                {payslip.deductionItems.map((item, idx) => (
                  <div key={idx} className="border-b border-dashed border-gray-100 pb-3 last:border-0">
                    <div className="flex justify-between items-start">
                      <div className="pr-4">
                        <span className={`block text-sm ${item.isHighlight ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                          {item.name}
                        </span>
                        {/* HIỂN THỊ GIẢI TRÌNH BẢO HIỂM MINH BẠCH TỪ BE */}
                        {item.description && (
                          <span className="text-xs text-gray-400 mt-1 block ">{item.description}</span>
                        )}
                      </div>
                      <span className={`text-sm whitespace-nowrap ${item.isHighlight ? 'font-bold text-red-600' : 'font-medium text-red-500'}`}>
                        - {formatMoney(item.amount)}
                      </span>
                    </div>
                  </div>
                ))}
                {payslip.deductionItems.length === 0 && (
                  <div className="text-sm text-gray-400  py-2">No deductions.</div>
                )}
              </div>

              {/* 5. TAX BREAKDOWN (MINH BẠCH GIẢM TRỪ GIA CẢNH) */}
              <div className="bg-red-50 p-5 rounded-xl border border-red-100 print:border-black">
                <div
                  onClick={() => setShowTaxDetail(prev => !prev)}
                  className="font-bold text-red-900 border-b border-red-200 pb-2 mb-3 flex items-center gap-2 text-sm uppercase cursor-pointer select-none hover:text-red-700"
                  title="Click để xem / ẩn chi tiết thuế"
                >
                  <AlertCircle size={14} className={`transition-transform ${showTaxDetail ? "rotate-180" : ""}`} />
                  Tax Calculation Detail
                </div>
                {showTaxDetail && (
                  <div className="space-y-2 text-xs text-gray-700">
                    <div className="flex justify-between">
                      <span>Total Income (Gross):</span>
                      <span className="font-medium">{formatMoney(payslip.taxBreakdown.grossIncome)}</span>
                    </div>
                    {payslip.taxBreakdown.insuranceDeduction > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>(-) Tax Exempt (Insurance):</span>
                        <span>- {formatMoney(payslip.taxBreakdown.insuranceDeduction)}</span>
                      </div>
                    )}
                    {/* GIẢI TRÌNH GIẢM TRỪ GIA CẢNH (LẤY TỪ NOTE BE) */}
                    <div className="flex justify-between text-red-600 font-bold border-t border-red-100 pt-2 mt-1">
                      <span>(-) Total Relief:</span>
                      <span>- {formatMoney(payslip.taxBreakdown.selfRelief)}</span>
                    </div>
                    <div className="text-[10px] text-gray-400  mb-2">
                      {payslip.note} {/* Hiển thị: Bản thân (11tr) + N người phụ thuộc... */}
                    </div>

                    <div className="border-t-2 border-red-200 pt-2 flex justify-between font-bold text-gray-900 bg-white p-2 rounded">
                      <span>(=) Taxable Income:</span>
                      <span>{formatMoney(payslip.taxBreakdown.taxableIncome)}</span>
                    </div>

                    {payslip.taxBreakdown.details && payslip.taxBreakdown.details.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-dashed border-red-200">
                        <p className="text-[10px] text-red-800 font-bold uppercase mb-1">Progressive Tax Breakdown:</p>
                        {payslip.taxBreakdown.details.map((item, index) => (
                          <div key={index} className="flex justify-between py-0.5 text-gray-500">
                            <span>• {item.label}</span>
                            <span className="font-medium">{formatMoney(item.amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-between items-center bg-red-600 p-2 rounded text-white mt-2">
                      <span className="font-bold uppercase">Tax Payable:</span>
                      <span className="font-bold text-sm">{formatMoney(payslip.taxBreakdown.taxAmount)}</span>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* 6. NET SALARY & FOOTER */}
          <div className="bg-gray-50 border-t border-gray-200 p-8 flex flex-col md:flex-row justify-between items-center print:bg-transparent print:border-t-2 print:border-black">
            <div className="mb-4 md:mb-0 w-full md:w-auto">
              <div className="text-sm font-bold uppercase text-gray-500 tracking-wider">Net Salary Transfer</div>
              <div className="mt-2 text-[10px] text-blue-700 bg-blue-50 px-3 py-2 rounded border border-blue-100 flex gap-2 items-center">
                <HelpCircle size={12} />
                <span>The net amount of money received after taxes and insurance deductions</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-5xl font-extrabold text-blue-700 print:text-black">
                {formatMoney(payslip.netSalary)}
              </div>
              <p className="text-sm text-gray-400 mt-2">Vietnam Dong (VND)</p>
            </div>
          </div>

          <div className="bg-gray-100 px-8 py-3 text-center text-xs text-gray-400 border-t border-gray-200 print:hidden">
            Generated by Sunshine Dental Care System on {formatVNDateTime(new Date().toString())}
          </div>

        </div>
      </div>
    </div>
  );
};

export default GetPayrollByIdDetail;