import { useTranslation } from "react-i18next";
import { DollarSign, TrendingUp, Calendar, CalendarRange } from "lucide-react";
import SectionHeader from "./SectionHeader";

interface FinancialSectionProps {
  todayTotalSales: number;
  todayRevenue: number;
  weekRevenue: number;
  weekTotalSales: number;
  monthRevenue: number;
  monthTotalSales: number;
  previousMonthRevenue: number;
  previousMonthTotalSales: number;
  expensesSupported: boolean;
  formatCurrency: (amount: number) => string;
  formatCompact: (value: number) => string;
}

export default function FinancialSection({
  todayTotalSales,
  todayRevenue,
  weekRevenue,
  weekTotalSales,
  monthRevenue,
  monthTotalSales,
  previousMonthRevenue,
  previousMonthTotalSales,
  expensesSupported,
  formatCurrency,
  formatCompact,
}: FinancialSectionProps) {
  const { t } = useTranslation("admin");

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 shadow-sm">
      <SectionHeader
        title={t("dashboard.sections.financial", "Tài chính")}
        icon={<DollarSign className="w-5 h-5" />}
        color="from-emerald-500 to-teal-600"
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Tài chính hôm nay */}
        <div className="bg-white rounded-xl border-2 border-emerald-200 p-6 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900">
                {t("dashboard.metrics.todayFinancial", "Tài chính hôm nay")}
              </h4>
              <p className="text-xs text-slate-500">
                {new Date().toLocaleDateString("vi-VN")}
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                  {t("dashboard.metrics.totalSales", "Doanh số")}
                </span>
              </div>
              <span className="text-base font-bold text-blue-900">
                {formatCurrency(todayTotalSales)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg border border-emerald-200">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                  {t("dashboard.metrics.actualRevenue", "Thực thu")}
                </span>
              </div>
              <span className="text-base font-bold text-emerald-900">
                {formatCurrency(todayRevenue)}
              </span>
            </div>
            {todayTotalSales > todayRevenue && (
              <div className="flex items-center justify-between p-2 bg-orange-50 rounded-lg border border-orange-200 text-xs">
                <span className="font-medium text-orange-700">
                  {t("dashboard.metrics.pendingAmount", "Chưa thu")}
                </span>
                <span className="font-bold text-orange-700">
                  {formatCurrency(todayTotalSales - todayRevenue)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Doanh thu tuần/tháng/tháng trước */}
        <div className="bg-white rounded-xl border-2 border-emerald-200 p-6 shadow-md hover:shadow-lg transition-shadow lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <h4 className="font-bold text-slate-900">
                {t("dashboard.metrics.revenueSummary", "So sánh doanh thu")}
              </h4>
            </div>
            {!expensesSupported && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
                {t("dashboard.metrics.expensesNotSupported", "Chi phí chưa bật")}
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <CalendarRange className="w-4 h-4 text-blue-600" />
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">
                  {t("dashboard.metrics.weekRevenue", "Tuần")}
                </p>
              </div>
              <p className="text-xl font-bold text-blue-900 mb-1">{formatCurrency(weekRevenue)}</p>
              <div className="flex items-center gap-1 text-xs text-blue-600">
                <span className="font-medium">Doanh số:</span>
                <span className="font-semibold">{formatCompact(weekTotalSales)}</span>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200 hover:shadow-md transition-shadow ring-2 ring-emerald-300 ring-offset-2">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide">
                  {t("dashboard.metrics.monthRevenue", "Tháng này")}
                </p>
              </div>
              <p className="text-xl font-bold text-emerald-900 mb-1">{formatCurrency(monthRevenue)}</p>
              <div className="flex items-center gap-1 text-xs text-emerald-600">
                <span className="font-medium">Doanh số:</span>
                <span className="font-semibold">{formatCompact(monthTotalSales)}</span>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-slate-600" />
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                  {t("dashboard.metrics.prevMonthRevenue", "Tháng trước")}
                </p>
              </div>
              <p className="text-xl font-bold text-slate-900 mb-1">{formatCurrency(previousMonthRevenue)}</p>
              <div className="flex items-center gap-1 text-xs text-slate-600">
                <span className="font-medium">Doanh số:</span>
                <span className="font-semibold">{formatCompact(previousMonthTotalSales)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
