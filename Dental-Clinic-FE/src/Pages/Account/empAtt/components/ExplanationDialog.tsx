import React from "react";
import { useTranslation } from "react-i18next";
import type { ExplanationResponse } from "../types";
import { formatDate, getShiftTypeLabel } from "../utils";

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

