import React from "react";
import { useTranslation } from "react-i18next";
import type { ExplanationResponse } from "../types";
import {
    formatDateDisplay,
    getShiftTypeLabel,
    getExplanationStatusColor,
} from "../utils";

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

    if (explanationsNeeding.length === 0) {
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

