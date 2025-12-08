import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { AttendanceResponse, ExplanationResponse } from "./types";
import {
    formatDate,
    formatDateDisplay,
    formatTime,
    formatHourValue,
    getStatusColor,
    getShiftTypeLabel,
    getShiftTypeFromStartTime,
    createAttendanceFromSchedule,
    needsExplanation,
    getExplanationStatusColor,
    calculateWorkedHours,
} from "./utils";

// --- AttendanceHeader ---
interface AttendanceHeaderProps {
    onRefresh: () => void;
}

export const AttendanceHeader: React.FC<AttendanceHeaderProps> = ({ onRefresh }) => {
    const { t } = useTranslation("web");

    return (
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">{t("attendance.title", "My Attendance")}</h1>
            <button
                onClick={onRefresh}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
                {t("attendance.refresh", "Refresh")}
            </button>
        </div>
    );
};

// --- TodayAttendanceCard ---
interface TodayAttendanceCardProps {
    loading: boolean;
    isDoctor: boolean;
    todayAttendance: AttendanceResponse | null;
    todayAttendanceList: AttendanceResponse[];
    todaySchedules: any[];
    userId: number;
    userName: string;
    onOpenExplanation: (attendance: AttendanceResponse, explanationTypeOverride?: string) => void;
}

export const TodayAttendanceCard: React.FC<TodayAttendanceCardProps> = ({
    loading,
    isDoctor,
    todayAttendance,
    todayAttendanceList,
    todaySchedules,
    userId,
    userName,
    onOpenExplanation,
}) => {
    const { t } = useTranslation("web");

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">{t("attendance.today", "Today")}</h2>
            {loading ? (
                <div className="text-center py-8">{t("attendance.loading", "Loading...")}</div>
            ) : isDoctor ? (
                <div className="space-y-4">
                    {todayAttendanceList.map((attendance, index) => {
                        const explanationInfo = needsExplanation(attendance);
                        return (
                            <div key={attendance.id || `att-${index}`} className="border rounded-lg p-4 bg-gray-50">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {getShiftTypeLabel(attendance.shiftType) || t("attendance.shift", "Shift")}
                                    </h3>
                                    <span
                                        className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                                            attendance.attendanceStatus
                                        )}`}
                                    >
                                        {t(`attendance.statusOptions.${attendance.attendanceStatus || "UNKNOWN"}`, attendance.attendanceStatus || "N/A")}
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                    <div>
                                        <p className="text-sm text-gray-600">{t("attendance.checkIn", "Check-in Time")}</p>
                                        <p className="text-lg font-semibold">{formatTime(attendance.checkInTime)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">{t("attendance.checkOut", "Check-out Time")}</p>
                                        <p className="text-lg font-semibold">{formatTime(attendance.checkOutTime)}</p>
                                    </div>
                                </div>
                                {explanationInfo.needs && (
                                    <button
                                        onClick={() => onOpenExplanation(attendance)}
                                        className="w-full mt-3 px-4 py-2 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors shadow-md hover:shadow-lg"
                                    >
                                        {t("attendance.explanationsNeeded.submit", "Gửi giải trình")} - {getShiftTypeLabel(attendance.shiftType)}
                                    </button>
                                )}
                            </div>
                        );
                    })}

                    {todaySchedules
                        .filter((schedule) => {
                            const shiftType = getShiftTypeFromStartTime(schedule.startTime);
                            return !todayAttendanceList.some(
                                (att) => att.shiftType === shiftType && att.clinicId === schedule.clinic?.id
                            );
                        })
                        .map((schedule, index) => {
                            const shiftType = getShiftTypeFromStartTime(schedule.startTime);
                            const fakeAttendance = createAttendanceFromSchedule(schedule, userId, userName);
                            return (
                                <div key={`schedule-${schedule.id || index}`} className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {getShiftTypeLabel(shiftType) || t("attendance.shift", "Shift")}
                                        </h3>
                                        <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-yellow-200 text-yellow-800">
                                            {t("attendance.statusOptions.ABSENT", "Chưa check-in")}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                        <div>
                                            <p className="text-sm text-gray-600">{t("attendance.scheduleTime", "Thời gian lịch")}</p>
                                            <p className="text-lg font-semibold">
                                                {schedule.startTime || ""} - {schedule.endTime || ""}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">{t("attendance.clinic", "Cơ sở")}</p>
                                            <p className="text-lg font-semibold">{schedule.clinic?.clinicName || ""}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => onOpenExplanation(fakeAttendance, "ABSENT")}
                                        className="w-full mt-3 px-4 py-2 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors shadow-md hover:shadow-lg"
                                    >
                                        {t("attendance.explanationsNeeded.submit", "Gửi giải trình")} - {getShiftTypeLabel(shiftType)}
                                    </button>
                                </div>
                            );
                        })}
                </div>
            ) : todayAttendance ? (
                <div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <p className="text-sm text-gray-600">{t("attendance.checkIn", "Check-in Time")}</p>
                            <p className="text-lg font-semibold">{formatTime(todayAttendance.checkInTime)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">{t("attendance.checkOut", "Check-out Time")}</p>
                            <p className="text-lg font-semibold">{formatTime(todayAttendance.checkOutTime)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">{t("attendance.statusLabel", "Status")}</p>
                            <span
                                className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                                    todayAttendance.attendanceStatus
                                )}`}
                            >
                                {t(`attendance.statusOptions.${todayAttendance.attendanceStatus || "UNKNOWN"}`, todayAttendance.attendanceStatus || "N/A")}
                            </span>
                        </div>
                    </div>
                    {needsExplanation(todayAttendance).needs && (
                        <button
                            onClick={() => onOpenExplanation(todayAttendance)}
                            className="w-full px-4 py-2 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors shadow-md hover:shadow-lg"
                        >
                            {t("attendance.explanationsNeeded.submit", "Gửi giải trình")}
                        </button>
                    )}
                </div>
            ) : (
                <div className="text-center py-8 text-gray-500">
                    {t("attendance.noAttendanceToday", "No attendance record for today")}
                </div>
            )}
        </div>
    );
};

// --- ExplanationList ---
interface ExplanationListProps {
    explanationsNeeding: ExplanationResponse[];
    selectedExplanationDate: string;
    setSelectedExplanationDate: (date: string) => void;
    onOpenExplanation: (explanation: ExplanationResponse) => void;
}

export const ExplanationList: React.FC<ExplanationListProps> = ({
    explanationsNeeding,
    selectedExplanationDate,
    setSelectedExplanationDate,
    onOpenExplanation,
}) => {
    const { t } = useTranslation("web");

    // DEBUG: Hiển thị thông tin debug
    console.log('[ExplanationList] Total explanations:', explanationsNeeding.length);
    console.log('[ExplanationList] Selected date:', selectedExplanationDate);
    console.log('[ExplanationList] All explanations:', explanationsNeeding);

    if (explanationsNeeding.length === 0) {
        // Hiển thị message thay vì return null để user biết
        return (
            <div className="bg-yellow-50 rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
                <div className="flex items-center gap-2">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h2 className="text-xl font-semibold text-yellow-900">
                        {t("attendance.explanationsNeeded.title", "Giải trình chấm công")}
                    </h2>
                </div>
                <p className="mt-4 text-gray-600">
                    Không có giải trình nào cần xử lý. Nếu bạn quên check-out hôm qua, vui lòng chờ hệ thống cập nhật hoặc liên hệ HR.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                    </svg>
                    <h2 className="text-xl font-semibold text-orange-900">
                        {t("attendance.explanationsNeeded.title", "Attendance Explanations Needed")}
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                    <label htmlFor="explanation-date-picker" className="text-sm font-medium text-gray-700">
                        {t("attendance.explanationsNeeded.date", "Ngày")}:
                    </label>
                    <input
                        id="explanation-date-picker"
                        type="date"
                        value={selectedExplanationDate}
                        onChange={(e) => setSelectedExplanationDate(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        max={new Date().toISOString().split("T")[0]}
                    />
                </div>
            </div>
            <div className="space-y-4">
                {explanationsNeeding
                    .filter((explanation) => {
                        const explanationDate = new Date(explanation.workDate).toISOString().split("T")[0];
                        return explanationDate === selectedExplanationDate;
                    })
                    .map((explanation) => (
                        <div
                            key={explanation.attendanceId}
                            className="border rounded-lg p-5 bg-white shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                    <p className="text-lg font-bold text-gray-900 mb-2">
                                        {t(`attendance.explanationType.${explanation.explanationType || "UNKNOWN"}`, explanation.explanationType || "")}
                                        {explanation.shiftType && explanation.shiftType !== "FULL_DAY" && (
                                            <span className="ml-2 text-sm font-normal text-blue-600">
                                                ({getShiftTypeLabel(explanation.shiftType)})
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-sm text-gray-600 mb-1">
                                        <span className="font-semibold">{t("attendance.explanationsNeeded.date", "Ngày")}:</span>{" "}
                                        {formatDateDisplay(explanation.workDate)}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        <span className="font-semibold">{t("attendance.explanationsNeeded.status", "Trạng thái")}:</span>{" "}
                                        {t(`attendance.statusOptions.${explanation.attendanceStatus || "UNKNOWN"}`, explanation.attendanceStatus || "N/A")}
                                    </p>
                                </div>
                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-4 ${getExplanationStatusColor(
                                        explanation.explanationStatus
                                    )}`}
                                >
                                    {t(`attendance.explanationStatus.${explanation.explanationStatus || "PENDING"}`, explanation.explanationStatus || "Pending")}
                                </span>
                            </div>
                            {explanation.employeeReason && (
                                <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200">
                                    <p className="text-xs font-semibold text-gray-700 mb-1">{t("attendance.explanationsNeeded.reason", "Lý do")}:</p>
                                    <p className="text-sm text-gray-800">{explanation.employeeReason}</p>
                                </div>
                            )}
                            {explanation.adminNote && (
                                <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                                    <p className="text-xs font-semibold text-blue-700 mb-1">{t("attendance.explanationsNeeded.adminNote", "Ghi chú từ admin")}:</p>
                                    <p className="text-sm text-blue-800">{explanation.adminNote}</p>
                                </div>
                            )}
                            {explanation.explanationStatus === "PENDING" && (
                                <button
                                    onClick={() => onOpenExplanation(explanation)}
                                    className="mt-4 w-full px-4 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors shadow-md hover:shadow-lg"
                                >
                                    {explanation.employeeReason
                                        ? t("attendance.explanationsNeeded.update", "Cập nhật giải trình")
                                        : t("attendance.explanationsNeeded.submit", "Gửi giải trình")}
                                </button>
                            )}
                        </div>
                    ))}
                {explanationsNeeding.filter((explanation) => {
                    const explanationDate = new Date(explanation.workDate).toISOString().split("T")[0];
                    return explanationDate === selectedExplanationDate;
                }).length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            <p>{t("attendance.explanationsNeeded.noExplanationsForDate", "Không có giải trình cần xử lý cho ngày này")}</p>
                        </div>
                    )}
            </div>
        </div>
    );
};

// --- MonthlyAttendanceHistory ---
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
            {monthlyAttendances.length > 0 && (
                <div className="mb-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                        <div className="rounded-xl border border-gray-200 p-4 bg-gradient-to-br from-blue-50 to-blue-100">
                            <p className="text-sm font-medium text-blue-700">{t("attendance.monthlyHistory.summary.totalDays", "Days Logged")}</p>
                            <p className="text-3xl font-bold text-blue-900 mt-2">{monthlySummary.totalDays}</p>
                            <p className="text-xs text-blue-800 mt-1">
                                {t("attendance.monthlyHistory.summary.presentHelper", "Present days: {{value}}", {
                                    value: monthlySummary.presentDays,
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
            )}
            {loadingMonthly ? (
                <div className="text-center py-8">{t("attendance.loading", "Loading...")}</div>
            ) : monthlyAttendances.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t("attendance.monthlyHistory.date", "Date")}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t("attendance.monthlyHistory.clinic", "Clinic / Location")}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t("attendance.monthlyHistory.shift", "Shift")}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t("attendance.monthlyHistory.checkIn", "Check-in")}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t("attendance.monthlyHistory.checkOut", "Check-out")}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t("attendance.monthlyHistory.hours", "Worked Hours")}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t("attendance.monthlyHistory.lateMinutes", "Đi trễ (phút)")}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t("attendance.monthlyHistory.earlyMinutes", "Ra sớm (phút)")}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t("attendance.monthlyHistory.status", "Status")}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t("attendance.monthlyHistory.remarks", "Remarks")}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {monthlyAttendances.map((attendance) => {
                                const workedHours =
                                    attendance.actualWorkHours != null && attendance.actualWorkHours > 0
                                        ? attendance.actualWorkHours
                                        : calculateWorkedHours(attendance);

                                return (
                                    <tr key={attendance.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatDate(new Date(attendance.workDate))}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{attendance.clinicName || "-"}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {attendance.shiftType && attendance.shiftType !== "FULL_DAY" ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {getShiftTypeLabel(attendance.shiftType)}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatTime(attendance.checkInTime)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatTime(attendance.checkOutTime)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatHourValue(workedHours)}
                                            {attendance.expectedWorkHours && (
                                                <span className="text-xs text-gray-500 ml-1">/ {formatHourValue(attendance.expectedWorkHours)}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {attendance.lateMinutes && attendance.lateMinutes > 0 ? (
                                                <span className="text-red-600 font-semibold">{attendance.lateMinutes} phút</span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {attendance.earlyMinutes && attendance.earlyMinutes > 0 ? (
                                                <span className="text-orange-600 font-semibold">{attendance.earlyMinutes} phút</span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                                    attendance.attendanceStatus
                                                )}`}
                                            >
                                                {t(`attendance.status.${attendance.attendanceStatus || "UNKNOWN"}`, attendance.attendanceStatus || "N/A")}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-sm">
                                            {attendance.note ? (
                                                <div className="truncate" title={attendance.note}>
                                                    {attendance.note}
                                                </div>
                                            ) : (
                                                "-"
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-8 text-gray-500">
                    {t("attendance.monthlyHistory.noData", "No attendance data for this month")}
                </div>
            )}
        </div>
    );
};

// --- ExplanationDialog ---
interface ExplanationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    selectedExplanation: ExplanationResponse | null;
    explanationReason: string;
    setExplanationReason: (reason: string) => void;
    onSubmit: () => void;
    submitting: boolean;
}

export const ExplanationDialog: React.FC<ExplanationDialogProps> = ({
    isOpen,
    onClose,
    selectedExplanation,
    explanationReason,
    setExplanationReason,
    onSubmit,
    submitting,
}) => {
    const { t } = useTranslation("web");

    if (!isOpen || !selectedExplanation) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-xl font-semibold mb-4">{t("attendance.explanationsNeeded.dialogTitle", "Submit Explanation")}</h3>
                <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">
                        {t("attendance.explanationsNeeded.type", "Type")}:{" "}
                        <span className="font-semibold">
                            {t(`attendance.explanationType.${selectedExplanation.explanationType || "UNKNOWN"}`, selectedExplanation.explanationType || "")}
                            {selectedExplanation.shiftType && selectedExplanation.shiftType !== "FULL_DAY" && (
                                <span className="ml-1 text-blue-600">({getShiftTypeLabel(selectedExplanation.shiftType)})</span>
                            )}
                        </span>
                    </p>
                    <p className="text-sm text-gray-600">
                        {t("attendance.explanationsNeeded.date", "Date")}: {formatDate(new Date(selectedExplanation.workDate))}
                    </p>
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t("attendance.explanationsNeeded.reasonLabel", "Explanation Reason *")}
                    </label>
                    <textarea
                        value={explanationReason}
                        onChange={(e) => setExplanationReason(e.target.value)}
                        placeholder={t("attendance.explanationsNeeded.reasonPlaceholder", "Please explain the reason...")}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <div className="flex gap-2 justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                        disabled={submitting}
                    >
                        {t("attendance.explanationsNeeded.cancel", "Cancel")}
                    </button>
                    <button
                        onClick={onSubmit}
                        disabled={submitting || !explanationReason.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? t("attendance.explanationsNeeded.submitting", "Submitting...") : t("attendance.explanationsNeeded.submitButton", "Submit")}
                    </button>
                </div>
            </div>
        </div>
    );
};
