import { Calendar, Frown, Clock, FileText } from "lucide-react";
import { useTranslation } from "react-i18next";

type SummaryCardsProps = {
  stats: {
    todayPresents: number;
    todayLates: number;
    todayAbsents: number;
    todayLeaves: number;
    todayOffdays: number;
    presentChange: number;
    lateChange: number;
    absentChange: number;
    leaveChange: number;
    offdayChange: number;
  };
  loadingSummary: boolean;
};

export default function SummaryCards({ stats, loadingSummary }: SummaryCardsProps) {
  const { t } = useTranslation("attendance");
  
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 max-w-7xl mx-auto transition-opacity duration-300 ${loadingSummary ? 'opacity-50' : 'opacity-100'}`}>
      {/* Today Presents Card */}
      <div className="bg-green-50 rounded-lg shadow-sm border border-green-100 p-5">
        <div className="mb-3">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mb-3">
            <Calendar className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            {t("summaryCards.todayPresents")}
          </h3>
          <p className="text-xs text-gray-600 mb-3">
            {t("summaryCards.totalPresentToday")}
          </p>
        </div>
        <div className="mb-2">
          <span className="text-3xl font-bold text-gray-900">{stats.todayPresents}</span>
        </div>
        <p className="text-xs text-green-700">
          {stats.presentChange !== 0 
            ? `${stats.presentChange >= 0 ? "+" : ""}${stats.presentChange.toFixed(0)}% ${t("summaryCards.vsYesterday")}`
            : t("summaryCards.noComparisonData")}
        </p>
      </div>

      {/* Today Late Card */}
      <div className="bg-orange-50 rounded-lg shadow-sm border border-orange-100 p-5">
        <div className="mb-3">
          <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center mb-3">
            <Clock className="w-5 h-5 text-orange-600" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            {t("summaryCards.todayLate")}
          </h3>
          <p className="text-xs text-gray-600 mb-3">
            {t("summaryCards.totalLateToday")}
          </p>
        </div>
        <div className="mb-2">
          <span className="text-3xl font-bold text-gray-900">{stats.todayLates}</span>
        </div>
        <p className="text-xs text-orange-700">
          {stats.lateChange !== 0 
            ? `${stats.lateChange >= 0 ? "+" : ""}${stats.lateChange.toFixed(0)}% ${t("summaryCards.vsYesterday")}`
            : t("summaryCards.noComparisonData")}
        </p>
      </div>

      {/* Today Absents Card */}
      <div className="bg-red-50 rounded-lg shadow-sm border border-red-100 p-5">
        <div className="mb-3">
          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center mb-3">
            <Frown className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            {t("summaryCards.todayAbsents")}
          </h3>
          <p className="text-xs text-gray-600 mb-3">
            {t("summaryCards.totalAbsentsToday")}
          </p>
        </div>
        <div className="mb-2">
          <span className="text-3xl font-bold text-gray-900">{stats.todayAbsents}</span>
        </div>
        <p className="text-xs text-red-700">
          {stats.absentChange !== 0 
            ? `${stats.absentChange >= 0 ? "+" : ""}${stats.absentChange.toFixed(0)}% ${t("summaryCards.vsYesterday")}`
            : t("summaryCards.noComparisonData")}
        </p>
      </div>

      {/* Today Leave Card */}
      <div className="bg-blue-50 rounded-lg shadow-sm border border-blue-100 p-5">
        <div className="mb-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            {t("summaryCards.todayLeave")}
          </h3>
          <p className="text-xs text-gray-600 mb-3">
            {t("summaryCards.totalLeaveToday")}
          </p>
        </div>
        <div className="mb-2">
          <span className="text-3xl font-bold text-gray-900">{stats.todayLeaves}</span>
        </div>
        <p className="text-xs text-blue-700">
          {stats.leaveChange !== 0 
            ? `${stats.leaveChange >= 0 ? "+" : ""}${stats.leaveChange.toFixed(0)}% ${t("summaryCards.vsYesterday")}`
            : t("summaryCards.noComparisonData")}
        </p>
      </div>

      {/* Today Offday Card */}
      <div className="bg-gray-50 rounded-lg shadow-sm border border-gray-100 p-5">
        <div className="mb-3">
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mb-3">
            <Calendar className="w-5 h-5 text-gray-600" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            {t("summaryCards.todayOffday")}
          </h3>
          <p className="text-xs text-gray-600 mb-3">
            {t("summaryCards.totalOffdayToday")}
          </p>
        </div>
        <div className="mb-2">
          <span className="text-3xl font-bold text-gray-900">{stats.todayOffdays}</span>
        </div>
        <p className="text-xs text-gray-700">
          {stats.offdayChange !== 0 
            ? `${stats.offdayChange >= 0 ? "+" : ""}${stats.offdayChange.toFixed(0)}% ${t("summaryCards.vsYesterday")}`
            : t("summaryCards.noComparisonData")}
        </p>
      </div>
    </div>
  );
}

