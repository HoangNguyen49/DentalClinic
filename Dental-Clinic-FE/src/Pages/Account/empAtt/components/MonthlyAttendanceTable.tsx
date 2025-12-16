import React from "react";
import { useTranslation } from "react-i18next";
import type { AttendanceResponse } from "../types";
import {
    formatDate,
    formatTime,
    formatHourValue,
    getStatusColor,
    getShiftTypeLabel,
    calculateWorkedHours,
} from "../utils";

interface MonthlyAttendanceTableProps {
    monthlyAttendances: AttendanceResponse[];
}

export const MonthlyAttendanceTable: React.FC<MonthlyAttendanceTableProps> = ({ monthlyAttendances }) => {
    const { t } = useTranslation("web");

    return (
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
    );
};

