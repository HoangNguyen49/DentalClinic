import React from "react";
import { useTranslation } from "react-i18next";
import type { ScheduleItem } from "../../utils/hr/scheduleUtils";

type ScheduleShiftCardProps = {
    shiftType: "morning" | "afternoon";
    shiftLabel: string;
    scheduleItem?: ScheduleItem;
    formatTime: (time: string) => string;
};

const ScheduleShiftCard: React.FC<ScheduleShiftCardProps> = ({
    shiftType,
    shiftLabel,
    scheduleItem,
    formatTime,
}) => {
    const { t } = useTranslation("schedules");
    const isMorning = shiftType === "morning";
    const bgColor = isMorning ? "bg-blue-100" : "bg-orange-100";
    const borderColor = isMorning ? "border-blue-500" : "border-orange-500";
    const titleColor = isMorning ? "text-blue-900" : "text-orange-900";
    const timeColor = isMorning ? "text-blue-700" : "text-orange-700";
    const clinicColor = isMorning ? "text-blue-900" : "text-orange-900";
    const roomColor = isMorning ? "text-blue-800" : "text-orange-800";
    const statusColor = isMorning ? "text-blue-600" : "text-orange-600";
    const noteColor = isMorning ? "text-blue-700" : "text-orange-700";

    if (!scheduleItem) {
        return (
            <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 opacity-50">
                <div className="text-xs font-semibold text-gray-500 mb-1">{shiftLabel}</div>
                <div className="text-xs text-gray-400">{t("list.noSessions")}</div>
            </div>
        );
    }

    const isCancelled = scheduleItem.status?.toLowerCase() === "cancelled";
    const cancelledBgColor = isCancelled ? "bg-red-50" : bgColor;
    const cancelledBorderColor = isCancelled ? "border-red-400" : borderColor;
    const cancelledOpacity = isCancelled ? "opacity-75" : "";

    return (
        <div
            className={`p-2.5 ${cancelledBgColor} rounded-lg shadow-sm border-l-4 ${cancelledBorderColor} hover:shadow-md transition-shadow ${cancelledOpacity}`}
            title={isCancelled ? t("list.scheduleCancelledDueToHoliday", "Lịch đã bị hủy do ngày nghỉ lễ") : undefined}
        >
            <div className={`text-xs font-semibold ${isCancelled ? "text-red-900" : titleColor} mb-1 flex items-center gap-1`}>
                {shiftLabel}
                {isCancelled && (
                    <span className="text-[10px]" title={t("list.scheduleCancelledDueToHoliday", "Lịch đã bị hủy do ngày nghỉ lễ")}>
                        
                    </span>
                )}
            </div>
            <div className={`text-xs ${isCancelled ? "text-red-700" : timeColor} mb-1 font-medium`}>
                {formatTime(scheduleItem.startTime)} - {formatTime(scheduleItem.endTime)}
            </div>
            {scheduleItem.clinic && (
                <div className={`text-xs ${isCancelled ? "text-red-800" : clinicColor} font-medium truncate mb-0.5`}>
                     {scheduleItem.clinic.clinicName}
                </div>
            )}
            {scheduleItem.room && (
                <div className={`text-xs ${isCancelled ? "text-red-700" : roomColor} truncate mb-0.5`}>
                    {isMorning ? "" : " "} {scheduleItem.room.roomName}
                </div>
            )}
            {scheduleItem.status && (
                <div className={`text-xs ${isCancelled ? "text-red-700" : statusColor} mt-1`}>
                    <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${scheduleItem.status.toLowerCase() === "active"
                            ? "bg-green-200 text-green-800"
                            : scheduleItem.status.toLowerCase() === "cancelled"
                                ? "bg-red-300 text-red-900 border border-red-400"
                                : "bg-gray-200 text-gray-800"
                            }`}
                    >
                        {scheduleItem.status}
                    </span>
                </div>
            )}
            {scheduleItem.note && (
                <div className={`text-xs ${isCancelled ? "text-red-700" : noteColor} mt-1 italic truncate`} title={scheduleItem.note}>
                    {isMorning ? "" : " "} {scheduleItem.note}
                </div>
            )}
        </div>
    );
};

export default ScheduleShiftCard;

