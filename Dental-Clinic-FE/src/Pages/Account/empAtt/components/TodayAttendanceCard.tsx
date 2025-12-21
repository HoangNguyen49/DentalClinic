import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
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
    selectedDate?: string;
    onDateChange?: (date: string) => void;
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
    selectedDate,
    onDateChange,
}) => {
    const { t } = useTranslation("web");
    const accessToken = localStorage.getItem("accessToken");
    const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080";
    
    const [localSelectedDate, setLocalSelectedDate] = useState<string>(
        selectedDate || new Date().toISOString().split("T")[0]
    );
    const [selectedDateAttendances, setSelectedDateAttendances] = useState<AttendanceResponse[]>([]);
    const [loadingSelectedDate, setLoadingSelectedDate] = useState(false);

    const displayDate = selectedDate || localSelectedDate;
    const isToday = displayDate === new Date().toISOString().split("T")[0];

    // Fetch attendance cho ngày được chọn (nếu không phải hôm nay)
    useEffect(() => {
        if (!isToday && userId && displayDate) {
            fetchAttendanceByDate(displayDate);
        } else {
            // Nếu là hôm nay, dùng data từ props
            setSelectedDateAttendances(todayAttendanceList);
        }
    }, [displayDate, isToday, userId]);

    const fetchAttendanceByDate = async (date: string) => {
        if (!userId || !accessToken) return;
        
        setLoadingSelectedDate(true);
        try {
            const response = await axios.get<AttendanceResponse[]>(
                `${apiBase}/api/hr/attendance/history`,
                {
                    params: {
                        userId: userId,
                        startDate: date,
                        endDate: date,
                        page: 0,
                        size: 100,
                    },
                    headers: { Authorization: `Bearer ${accessToken}` },
                }
            );
            
            // Backend trả về Page hoặc List
            const data = response.data;
            let attendances: AttendanceResponse[] = [];
            
            if (Array.isArray(data)) {
                attendances = data;
            } else if (data && typeof data === 'object' && 'content' in data) {
                attendances = (data as any).content || [];
            }
            
            setSelectedDateAttendances(attendances);
        } catch (error: any) {
            console.error("Error fetching attendance by date:", error);
            setSelectedDateAttendances([]);
        } finally {
            setLoadingSelectedDate(false);
        }
    };

    const handleDateChange = (date: string) => {
        setLocalSelectedDate(date);
        if (onDateChange) {
            onDateChange(date);
        }
    };

    // Tìm các record cần giải trình (quên check-out) cho ngày được chọn
    const recordsNeedingExplanation = useMemo(() => {
        const attendancesToCheck = isToday ? todayAttendanceList : selectedDateAttendances;
        return attendancesToCheck.filter((attendance: AttendanceResponse) => {
            const hasCheckIn = attendance.checkInTime != null;
            const hasCheckOut = attendance.checkOutTime != null;
            const hasProcessedExplanation = attendance.note && (attendance.note.includes("[APPROVED]") || attendance.note.includes("[REJECTED]"));
            return hasCheckIn && !hasCheckOut && !hasProcessedExplanation;
        });
    }, [isToday, todayAttendanceList, selectedDateAttendances]);

    // Xác định attendance để hiển thị
    const displayAttendance = isToday ? todayAttendance : (selectedDateAttendances.length > 0 ? selectedDateAttendances[0] : null);
    const displayAttendanceList = isToday ? todayAttendanceList : selectedDateAttendances;
    const displayLoading = isToday ? loading : loadingSelectedDate;

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">{isToday ? t("attendance.today", "Today") : t("attendance.selectedDate", "Selected Date")}</h2>
                <div className="flex gap-2 items-center">
                    <label htmlFor="today-date-picker" className="text-sm font-medium text-gray-700">
                        {t("attendance.dailyView.selectDate", "Chọn ngày")}:
                    </label>
                    <input
                        id="today-date-picker"
                        type="date"
                        value={displayDate}
                        onChange={(e) => handleDateChange(e.target.value)}
                        max={new Date().toISOString().split("T")[0]}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Banner cảnh báo nếu có record quên check-out */}
            {recordsNeedingExplanation.length > 0 && onOpenExplanation && (
                <div className="mb-4 p-4 bg-orange-50 border-l-4 border-orange-500 rounded-lg">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.159c1.6-1.6 4.2-1.6 5.8 0l5.07 5.07a1.65 1.65 0 010 2.34l-5.07 5.07c-1.6 1.6-4.2 1.6-5.8 0l-5.07-5.07a1.65 1.65 0 010-2.34l5.07-5.07zm1.4 1.4a.75.75 0 00-1.06 1.06l.72.72H6a.75.75 0 000 1.5h3.33l-.72.72a.75.75 0 001.06 1.06l2-2a.75.75 0 000-1.06l-2-2z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3 flex-1">
                            <h3 className="text-sm font-semibold text-orange-800 mb-2">
                                {t("attendance.dailyView.missingCheckOutTitle", "Bạn quên chấm ra!")}
                            </h3>
                            <p className="text-sm text-orange-700 mb-3">
                                {recordsNeedingExplanation.length === 1 
                                    ? t("attendance.dailyView.missingCheckOutMessage", "Bạn có 1 ca làm việc quên chấm ra. Vui lòng gửi giải trình.")
                                    : t("attendance.dailyView.missingCheckOutMessagePlural", "Bạn có {{count}} ca làm việc quên chấm ra. Vui lòng gửi giải trình.", { count: recordsNeedingExplanation.length })}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {recordsNeedingExplanation.map((attendance) => {
                                    const hasPendingExplanation = attendance.note && attendance.note.includes("[EXPLANATION_REQUEST:");
                                    return (
                                        <button
                                            key={attendance.id || `expl-${attendance.workDate}`}
                                            onClick={() => onOpenExplanation(attendance)}
                                            className="px-4 py-2 bg-orange-600 text-white text-sm font-semibold rounded-lg hover:bg-orange-700 transition-colors shadow-md hover:shadow-lg"
                                        >
                                            {hasPendingExplanation 
                                                ? t("attendance.explanationsNeeded.update", "Cập nhật giải trình")
                                                : t("attendance.explanationsNeeded.submit", "Gửi giải trình")}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {displayLoading ? (
                <div className="text-center py-8">{t("attendance.loading", "Loading...")}</div>
            ) : isDoctor ? (
                <div className="space-y-4">
                    {displayAttendanceList.map((attendance, index) => {
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

                    {(isToday ? todaySchedules : [])
                        .filter((schedule) => {
                            const shiftType = getShiftTypeFromStartTime(schedule.startTime);
                            const scheduleClinicId = schedule.clinic?.id;
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
                            if (scheduleWorkDate !== displayDate) return false;
                            
                            // Kiểm tra xem có attendance nào đã check-in cho schedule này không
                            return !displayAttendanceList.some((att: AttendanceResponse) => {
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
                                if (attWorkDate !== displayDate) return false;
                                
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
                                {/* KHÔNG hiển thị nút giải trình cho schedule chưa có attendance (ABSENT/PENDING)
                                    Giải trình chỉ dành cho trường hợp quên check-out (có check-in nhưng không có check-out) */}
                                </div>
                            );
                        })}
                </div>
            ) : displayAttendance ? (
                <div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <p className="text-sm text-gray-600">{t("attendance.checkIn", "Check-in Time")}</p>
                            <p className="text-lg font-semibold">{formatTime(displayAttendance.checkInTime)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">{t("attendance.checkOut", "Check-out Time")}</p>
                            <p className="text-lg font-semibold">{formatTime(displayAttendance.checkOutTime)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">{t("attendance.statusLabel", "Status")}</p>
                            <span
                                className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                                    displayAttendance.attendanceStatus
                                )}`}
                            >
                                {t(`attendance.statusOptions.${displayAttendance.attendanceStatus || "UNKNOWN"}`, displayAttendance.attendanceStatus || "N/A")}
                            </span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-8 text-gray-500">
                    {isToday 
                        ? t("attendance.noAttendanceToday", "No attendance record for today")
                        : t("attendance.dailyView.noData", "Không có dữ liệu chấm công cho ngày này")}
                </div>
            )}
        </div>
    );
};

