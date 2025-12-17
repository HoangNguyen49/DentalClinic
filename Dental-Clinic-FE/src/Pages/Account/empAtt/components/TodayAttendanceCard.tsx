import React from "react";
import { useTranslation } from "react-i18next";
import type { AttendanceResponse } from "../types";
import {
    formatTime,
    getStatusDisplay,
    getStatusColor,
    getShiftTypeLabel,
    getShiftTypeFromStartTime,
    createAttendanceFromSchedule,
    needsExplanation,
} from "../utils";

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
                        const statusDisplay = getStatusDisplay(
                            attendance.attendanceStatus,
                            attendance.startTime,
                            attendance.checkInTime
                        );
                        return (
                            <div key={attendance.id || `att-${index}`} className="border rounded-lg p-4 bg-gray-50">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {getShiftTypeLabel(attendance.shiftType) || t("attendance.shift", "Shift")}
                                    </h3>
                                    <span
                                        className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${statusDisplay.color}`}
                                    >
                                        {t(`attendance.statusOptions.${statusDisplay.displayStatus}`, statusDisplay.displayStatus)}
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
                            const scheduleClinicId = schedule.clinic?.id;
                            const today = new Date().toISOString().split("T")[0];
                            const normalizeDate = (value: any): string | null => {
                                if (!value) return null;
                                if (typeof value === "string") {
                                    if (value.includes("T")) return value.split("T")[0];
                                    if (value.length >= 10) return value.slice(0, 10);
                                    return value;
                                }
                                try {
                                    return new Date(value).toISOString().split("T")[0];
                                } catch {
                                    return null;
                                }
                            };

                            const scheduleWorkDate = normalizeDate(schedule.workDate);
                            if (scheduleWorkDate !== today) return false;
                            
                            // Kiểm tra xem có attendance nào đã check-in cho schedule này không
                            return !todayAttendanceList.some((att) => {
                                // So sánh shiftType (case-insensitive)
                                const attShift = att.shiftType ? String(att.shiftType).toUpperCase() : null;
                                const schedShift = shiftType ? String(shiftType).toUpperCase() : null;
                                if (attShift !== schedShift) return false;
                                
                                // So sánh clinicId
                                const attClinic = att.clinicId != null ? String(att.clinicId) : null;
                                const schedClinic = scheduleClinicId != null ? String(scheduleClinicId) : null;
                                // Nếu schedule không có clinicId, bỏ qua check; nếu có, phải khớp
                                if (schedClinic && attClinic !== schedClinic) return false;
                                
                                // So sánh workDate (cùng ngày)
                                const attWorkDate = normalizeDate(att.workDate);
                                if (attWorkDate !== today) return false;
                                
                                // Quan trọng: chỉ coi là đã có attendance nếu đã check-in
                                if (!att.checkInTime) return false;
                                
                                return true;
                            });
                        })
                        .map((schedule, index) => {
                            const shiftType = getShiftTypeFromStartTime(schedule.startTime);
                            const fakeAttendance = createAttendanceFromSchedule(schedule, userId, userName);
                            
                            const statusDisplay = getStatusDisplay(
                                "ABSENT",
                                schedule.startTime,
                                null
                            );
                            
                            const bgColor = statusDisplay.displayStatus === "PENDING" 
                                ? "bg-blue-50 border-blue-200" 
                                : "bg-yellow-50 border-yellow-200";
                            
                            return (
                                <div key={`schedule-${schedule.id || index}`} className={`border rounded-lg p-4 ${bgColor}`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {getShiftTypeLabel(shiftType) || t("attendance.shift", "Shift")}
                                        </h3>
                                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${statusDisplay.color}`}>
                                            {t(`attendance.statusOptions.${statusDisplay.displayStatus}`, statusDisplay.displayStatus)}
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

