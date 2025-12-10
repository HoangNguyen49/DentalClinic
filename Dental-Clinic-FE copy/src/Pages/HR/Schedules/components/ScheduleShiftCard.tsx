import React from "react";
import { useTranslation } from "react-i18next";
import type { ScheduleItem } from "../utils/scheduleUtils";

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

    return (
        <div
            className={`p-2.5 ${bgColor} rounded-lg shadow-sm border-l-4 ${borderColor} hover:shadow-md transition-shadow`}
        >
            <div className={`text-xs font-semibold ${titleColor} mb-1`}>{shiftLabel}</div>
            <div className={`text-xs ${timeColor} mb-1 font-medium`}>
                {formatTime(scheduleItem.startTime)} - {formatTime(scheduleItem.endTime)}
            </div>
            {scheduleItem.clinic && (
                <div className={`text-xs ${clinicColor} font-medium truncate mb-0.5`}>
                    🏥 {scheduleItem.clinic.clinicName}
                </div>
            )}
            {scheduleItem.room && (
                <div className={`text-xs ${roomColor} truncate mb-0.5`}>
                    {isMorning ? "" : "🚪 "} {scheduleItem.room.roomName}
                </div>
            )}
            {scheduleItem.status && (
                <div className={`text-xs ${statusColor} mt-1`}>
                    <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${scheduleItem.status.toLowerCase() === "active"
                            ? "bg-green-200 text-green-800"
                            : scheduleItem.status.toLowerCase() === "cancelled"
                                ? "bg-red-200 text-red-800"
                                : "bg-gray-200 text-gray-800"
                            }`}
                    >
                        {scheduleItem.status}
                    </span>
                </div>
            )}
            {scheduleItem.note && (
                <div className={`text-xs ${noteColor} mt-1 italic truncate`} title={scheduleItem.note}>
                    {isMorning ? "" : "📝 "} {scheduleItem.note}
                </div>
            )}
        </div>
    );
};

export default ScheduleShiftCard;
