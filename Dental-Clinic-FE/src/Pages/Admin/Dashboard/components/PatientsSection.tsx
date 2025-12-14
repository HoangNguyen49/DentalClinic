import { useTranslation } from "react-i18next";
import { UserCircle, Users, TrendingUp } from "lucide-react";
import SectionHeader from "./SectionHeader";

interface PatientsSectionProps {
  todayNewPatients: number;
  weekNewPatients: number;
  monthNewPatients: number;
  returningPatients: number;
  patientsThisMonth: number;
  retentionRate: number;
}

export default function PatientsSection({
  todayNewPatients,
  weekNewPatients,
  monthNewPatients,
  returningPatients,
  patientsThisMonth,
  retentionRate,
}: PatientsSectionProps) {
  const { t } = useTranslation("admin");

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 shadow-sm">
      <SectionHeader
        title={t("dashboard.sections.patients", "Bệnh nhân")}
        icon={<UserCircle className="w-5 h-5" />}
        color="from-indigo-500 to-blue-600"
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bệnh nhân mới */}
        <div className="bg-white rounded-xl border-2 border-indigo-200 p-6 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md">
              <Users className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-slate-900">
              {t("dashboard.metrics.newPatients", "Bệnh nhân mới")}
            </h4>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-indigo-100 p-3 hover:shadow-md transition-shadow">
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-1">
                {t("dashboard.metrics.today", "Hôm nay")}
              </p>
              <p className="text-2xl font-bold text-indigo-900">{todayNewPatients}</p>
            </div>
            <div className="rounded-lg border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-3 hover:shadow-md transition-shadow">
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1">
                {t("dashboard.metrics.week", "Tuần")}
              </p>
              <p className="text-2xl font-bold text-blue-900">{weekNewPatients}</p>
            </div>
            <div className="rounded-lg border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-3 hover:shadow-md transition-shadow">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                {t("dashboard.metrics.month", "Tháng")}
              </p>
              <p className="text-2xl font-bold text-slate-900">{monthNewPatients}</p>
            </div>
          </div>
        </div>

        {/* Bệnh nhân quay lại */}
        <div className="bg-white rounded-xl border-2 border-indigo-200 p-6 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-slate-900">
              {t("dashboard.metrics.returningPatients", "Bệnh nhân quay lại")}
            </h4>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-bold text-slate-900">
                  {returningPatients}
                </p>
                <span className="text-lg text-slate-400 font-medium">/</span>
                <p className="text-2xl font-semibold text-slate-600">
                  {patientsThisMonth || 0}
                </p>
              </div>
              <p className="text-xs text-slate-500 mt-2 font-medium">
                {t("dashboard.metrics.patientsThisMonth", "bệnh nhân trong tháng")}
              </p>
            </div>
            <div className="text-right bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border-2 border-emerald-200">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">
                {t("dashboard.metrics.retentionRate", "Tỷ lệ quay lại")}
              </p>
              <p className="text-3xl font-bold text-emerald-700">
                {retentionRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
