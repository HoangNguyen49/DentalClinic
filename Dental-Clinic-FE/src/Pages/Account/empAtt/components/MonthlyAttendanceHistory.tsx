import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { AttendanceResponse } from "../types";
import { calculateWorkedHours } from "../utils";
import { MonthlySummaryCards } from "./MonthlySummaryCards";
import { MonthlyAttendanceTable } from "./MonthlyAttendanceTable";

interface MonthlyAttendanceHistoryProps {
    loadingMonthly: boolean;
    monthlyAttendances: AttendanceResponse[];
    selectedMonth: number;
    setSelectedMonth: (month: number) => void;
    selectedYear: number;
    setSelectedYear: (year: number) => void;
}

export const MonthlyAttendanceHistory: React.FC<MonthlyAttendanceHistoryProps> = ({
    loadingMonthly,
    monthlyAttendances,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
}) => {
    const { t } = useTranslation("web");

    const monthlySummary = useMemo(() => {
        if (!monthlyAttendances.length) {
            return {
                totalDays: 0,
                presentDays: 0,
                lateDays: 0,
                absentDays: 0,
                approvedDays: 0,
                totalHours: 0,
                avgHours: 0,
                totalLateMinutes: 0,
                totalEarlyMinutes: 0,
                totalActualWorkHours: 0,
            };
        }

        const uniqueWorkDates = new Set<string>();
        const workDateStatusMap = new Map<string, { isAbsent: boolean; isLate: boolean; isApproved: boolean }>();

        const stats = monthlyAttendances.reduce(
            (acc, attendance) => {
                const workDate = attendance.workDate ? new Date(attendance.workDate).toISOString().split("T")[0] : "";
                const status = (attendance.attendanceStatus || "").toUpperCase();

                if (workDate && !uniqueWorkDates.has(workDate)) {
                    uniqueWorkDates.add(workDate);
                    acc.totalDays += 1;
                    workDateStatusMap.set(workDate, {
                        isAbsent: status === "ABSENT",
                        isLate: status === "LATE" || status === "APPROVED_LATE",
                        isApproved: status.startsWith("APPROVED"),
                    });
                }

                if (workDate && workDateStatusMap.has(workDate)) {
                    const dayStatus = workDateStatusMap.get(workDate)!;
                    if (status === "LATE" || status === "APPROVED_LATE") {
                        dayStatus.isLate = true;
                    }
                    if (status.startsWith("APPROVED")) {
                        dayStatus.isApproved = true;
                    }
                    if (status === "ABSENT") {
                        dayStatus.isAbsent = true;
                    }
                }

                acc.totalHours += calculateWorkedHours(attendance);
                acc.totalLateMinutes += attendance.lateMinutes || 0;
                acc.totalEarlyMinutes += attendance.earlyMinutes || 0;

                if (attendance.actualWorkHours != null && attendance.actualWorkHours > 0) {
                    acc.totalActualWorkHours += attendance.actualWorkHours;
                } else {
                    acc.totalActualWorkHours += calculateWorkedHours(attendance);
                }

                return acc;
            },
            {
                totalDays: 0,
                presentDays: 0,
                lateDays: 0,
                absentDays: 0,
                approvedDays: 0,
                totalHours: 0,
                avgHours: 0,
                totalLateMinutes: 0,
                totalEarlyMinutes: 0,
                totalActualWorkHours: 0,
            }
        );

        stats.presentDays = 0;
        stats.absentDays = 0;
        stats.lateDays = 0;
        stats.approvedDays = 0;

        workDateStatusMap.forEach((dayStatus) => {
            if (dayStatus.isAbsent) {
                stats.absentDays += 1;
            } else {
                stats.presentDays += 1;
            }
            if (dayStatus.isLate) {
                stats.lateDays += 1;
            }
            if (dayStatus.isApproved) {
                stats.approvedDays += 1;
            }
        });

        const avgHours = stats.presentDays > 0 ? stats.totalActualWorkHours / stats.presentDays : 0;

        return { ...stats, avgHours };
    }, [monthlyAttendances]);

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">{t("attendance.monthlyHistory.title", "Monthly Attendance History")}</h2>
                <div className="flex gap-2">
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        className="px-3 py-2 border rounded-lg"
                        title={t("attendance.monthlyHistory.selectMonth", "Select Month")}
                        aria-label={t("attendance.monthlyHistory.selectMonth", "Select Month")}
                    >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                            <option key={month} value={month}>
                                {t("attendance.monthlyHistory.month", "Month")} {month}
                            </option>
                        ))}
                    </select>
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="px-3 py-2 border rounded-lg"
                        title={t("attendance.monthlyHistory.selectYear", "Select Year")}
                        aria-label={t("attendance.monthlyHistory.selectYear", "Select Year")}
                    >
                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                            <option key={year} value={year}>
                                {year}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            {monthlyAttendances.length > 0 && <MonthlySummaryCards monthlySummary={monthlySummary} />}
            {loadingMonthly ? (
                <div className="text-center py-8">{t("attendance.loading", "Loading...")}</div>
            ) : monthlyAttendances.length > 0 ? (
                <MonthlyAttendanceTable monthlyAttendances={monthlyAttendances} />
            ) : (
                <div className="text-center py-8 text-gray-500">
                    {t("attendance.monthlyHistory.noData", "No attendance data for this month")}
                </div>
            )}
        </div>
    );
};

