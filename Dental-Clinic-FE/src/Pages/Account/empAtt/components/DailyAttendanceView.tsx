import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import type { AttendanceResponse } from "../types";
import { MonthlyAttendanceTable } from "./MonthlyAttendanceTable";

const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080";

interface DailyAttendanceViewProps {
    userId: number | undefined;
    onOpenExplanation?: (attendance: AttendanceResponse) => void;
}

export const DailyAttendanceView: React.FC<DailyAttendanceViewProps> = ({
    userId,
    onOpenExplanation,
}) => {
    const { t } = useTranslation("web");
    const accessToken = localStorage.getItem("accessToken");
    
    const [selectedDate, setSelectedDate] = useState<string>(
        new Date().toISOString().split("T")[0]
    );
    const [dailyAttendances, setDailyAttendances] = useState<AttendanceResponse[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (userId && selectedDate) {
            fetchDailyAttendance();
        }
    }, [userId, selectedDate]);

    const fetchDailyAttendance = async () => {
        if (!userId || !accessToken) return;
        
        setLoading(true);
        try {
            const response = await axios.get<AttendanceResponse[]>(
                `${apiBase}/api/hr/attendance/history`,
                {
                    params: {
                        userId: userId,
                        startDate: selectedDate,
                        endDate: selectedDate,
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
            
            setDailyAttendances(attendances);
        } catch (error: any) {
            console.error("Error fetching daily attendance:", error);
            setDailyAttendances([]);
        } finally {
            setLoading(false);
        }
    };

    // Tìm các record cần giải trình (quên check-out)
    const recordsNeedingExplanation = useMemo(() => {
        return dailyAttendances.filter(attendance => {
            const hasCheckIn = attendance.checkInTime != null;
            const hasCheckOut = attendance.checkOutTime != null;
            const hasProcessedExplanation = attendance.note && (attendance.note.includes("[APPROVED]") || attendance.note.includes("[REJECTED]"));
            return hasCheckIn && !hasCheckOut && !hasProcessedExplanation;
        });
    }, [dailyAttendances]);

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                    {t("attendance.dailyView.title", "Xem chấm công theo ngày")}
                </h2>
                <div className="flex gap-2 items-center">
                    <label htmlFor="date-picker" className="text-sm font-medium text-gray-700">
                        {t("attendance.dailyView.selectDate", "Chọn ngày")}:
                    </label>
                    <input
                        id="date-picker"
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
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
                                            key={attendance.id}
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
            
            {loading ? (
                <div className="text-center py-8">{t("attendance.loading", "Loading...")}</div>
            ) : dailyAttendances.length > 0 ? (
                <MonthlyAttendanceTable 
                    monthlyAttendances={dailyAttendances}
                />
            ) : (
                <div className="text-center py-8 text-gray-500">
                    {t("attendance.dailyView.noData", "Không có dữ liệu chấm công cho ngày này")}
                </div>
            )}
        </div>
    );
};

