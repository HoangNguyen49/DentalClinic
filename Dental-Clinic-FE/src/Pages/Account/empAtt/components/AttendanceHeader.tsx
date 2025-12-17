import React from "react";
import { useTranslation } from "react-i18next";

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

