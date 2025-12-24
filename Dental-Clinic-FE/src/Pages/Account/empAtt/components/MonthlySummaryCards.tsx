import React from "react";
import { useTranslation } from "react-i18next";
import { formatHourValue } from "../utils";

interface MonthlySummary {
    totalDays: number;
    presentDays: number;
    lateDays: number;
    absentDays: number;
    approvedDays: number;
    totalHours: number;
    avgHours: number;
    totalLateMinutes: number;
    totalEarlyMinutes: number;
    totalActualWorkHours: number;
}

interface MonthlySummaryCardsProps {
    monthlySummary: MonthlySummary;
}

export const MonthlySummaryCards: React.FC<MonthlySummaryCardsProps> = ({ monthlySummary }) => {
    const { t } = useTranslation("web");

    return (
        <div className="mb-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <div className="rounded-xl border border-gray-200 p-4 bg-gradient-to-br from-blue-50 to-blue-100">
                    <p className="text-sm font-medium text-blue-700">{t("attendance.monthlyHistory.summary.totalDays", "Days Logged")}</p>
                    <p className="text-3xl font-bold text-blue-900 mt-2">
                        {monthlySummary.totalDays % 1 === 0 ? monthlySummary.totalDays : monthlySummary.totalDays.toFixed(1)}
                    </p>
                    <p className="text-xs text-blue-800 mt-1">
                        {t("attendance.monthlyHistory.summary.presentHelper", "Ngày làm: {{value}}", {
                            value: monthlySummary.presentDays % 1 === 0 ? monthlySummary.presentDays : monthlySummary.presentDays.toFixed(1),
                        })}
                    </p>
                </div>
                <div className="rounded-xl border border-gray-200 p-4 bg-gradient-to-br from-amber-50 to-amber-100">
                    <p className="text-sm font-medium text-amber-700">{t("attendance.monthlyHistory.summary.lateDays", "Late days")}</p>
                    <p className="text-3xl font-bold text-amber-900 mt-2">{monthlySummary.lateDays}</p>
                    <p className="text-xs text-amber-800 mt-1">
                        {t("attendance.monthlyHistory.summary.approvedHelper", "Approved entries: {{value}}", {
                            value: monthlySummary.approvedDays,
                        })}
                    </p>
                </div>
                <div className="rounded-xl border border-gray-200 p-4 bg-gradient-to-br from-red-50 to-red-100">
                    <p className="text-sm font-medium text-red-700">{t("attendance.monthlyHistory.summary.totalLateMinutes", "Tổng phút đi trễ")}</p>
                    <p className="text-3xl font-bold text-red-900 mt-2">
                        {monthlySummary.totalLateMinutes > 0 ? `${monthlySummary.totalLateMinutes} phút` : "0"}
                    </p>
                    <p className="text-xs text-red-800 mt-1">
                        {t("attendance.monthlyHistory.summary.lateHours", "≈ {{hours}} giờ", {
                            hours: (monthlySummary.totalLateMinutes / 60).toFixed(1),
                        })}
                    </p>
                </div>
                <div className="rounded-xl border border-gray-200 p-4">
                    <p className="text-sm font-medium text-rose-700">{t("attendance.monthlyHistory.summary.absentDays", "Absent days")}</p>
                    <p className="text-3xl font-bold text-rose-900 mt-2">{monthlySummary.absentDays}</p>
                    <p className="text-xs text-rose-800 mt-1">
                        {t("attendance.monthlyHistory.summary.absentHelper", "Impact days: {{value}}", {
                            value: monthlySummary.absentDays,
                        })}
                    </p>
                </div>
                <div className="rounded-xl border border-gray-200 p-4">
                    <p className="text-sm font-medium text-gray-600">{t("attendance.monthlyHistory.summary.totalHours", "Total hours")}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                        {formatHourValue(monthlySummary.totalActualWorkHours || monthlySummary.totalHours)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        {t("attendance.monthlyHistory.summary.avgHours", "Avg hours/day")}: {formatHourValue(monthlySummary.avgHours)}
                    </p>
                </div>
            </div>
        </div>
    );
};

