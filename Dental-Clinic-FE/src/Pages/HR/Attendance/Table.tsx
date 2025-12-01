import React from "react";
import { useTranslation } from "react-i18next";
import type { AttendanceExplanationResponse } from "./hrservice/useExplanations";

type TableProps = {
    explanations: AttendanceExplanationResponse[];
    loading: boolean;
    highlightedAttendanceId: number | null;
    actionNotes: Record<number, string>;
    customTimes: Record<number, string>;
    onNoteChange: (attendanceId: number, value: string) => void;
    onTimeChange: (attendanceId: number, value: string) => void;
    onProcess: (explanation: AttendanceExplanationResponse, action: "APPROVE" | "REJECT") => void;
    tableRef: React.RefObject<HTMLDivElement | null>;
};

export const Table: React.FC<TableProps> = ({
    explanations,
    loading,
    highlightedAttendanceId,
    actionNotes,
    customTimes,
    onNoteChange,
    onTimeChange,
    onProcess,
    tableRef,
}) => {
    const { t } = useTranslation("admin");

    // Lấy nhãn tiếng anh dựa trên type explanation
    const getExplanationTypeLabel = (type?: string | null): string => {
        if (!type) return "-";
        switch (type.toUpperCase()) {
            case "LATE":
                return t("attendance.explanation.typeLate", "Late Arrival");
            case "ABSENT":
                return t("attendance.explanation.typeAbsent", "Absent");
            case "MISSING_CHECK_IN":
                return t("attendance.explanation.typeMissingCheckIn", "Missing Check-In");
            case "MISSING_CHECK_OUT":
                return t("attendance.explanation.typeMissingCheckOut", "Missing Check-Out");
            default:
                return type;
        }
    };

    return (
        <section
            ref={tableRef}
            className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden"
        >
            {loading ? (
                <div className="px-5 py-8 text-center text-slate-500">
                    Loading attendance records...
                </div>
            ) : explanations.length === 0 ? (
                <div className="px-5 py-8 text-center text-slate-500">
                    No pending explanations
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wide text-slate-500">
                                    Employee
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wide text-slate-500">
                                    Clinic
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wide text-slate-500">
                                    Work Date
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wide text-slate-500">
                                    Type
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wide text-slate-500">
                                    Reason
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wide text-slate-500">
                                    Status
                                </th>
                                <th className="px-6 py-4 text-right text-sm font-semibold uppercase tracking-wide text-slate-500">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {explanations.map((explanation) => {
                                // Kiểm tra xem có highlight dòng này không
                                const isHighlighted = highlightedAttendanceId === explanation.attendanceId;
                                return (
                                    <tr
                                        key={explanation.attendanceId}
                                        className={`transition hover:bg-slate-50 ${isHighlighted
                                            ? "bg-gradient-to-r from-blue-50 via-blue-100 to-blue-50 border-l-4 border-blue-500 animate-pulse"
                                            : ""}`
                                        }
                                    >
                                        <td className="px-6 py-5 text-base text-slate-900">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-lg font-semibold text-slate-500">
                                                    {(explanation.userName || explanation.userId.toString())
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="text-base font-semibold text-slate-900">
                                                        {explanation.userName || `#${explanation.userId}`}
                                                    </div>
                                                    <div className="text-xs uppercase tracking-wide text-slate-400">
                                                        ID: {explanation.userId}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-base text-slate-700">
                                            {explanation.clinicName || "Unknown clinic"}
                                        </td>
                                        <td className="px-6 py-5 text-base text-slate-700">
                                            {explanation.workDate}
                                            {explanation.shiftType && (
                                                <span className="ml-2 inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                                    {explanation.shiftType}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 text-base font-medium text-slate-900">
                                            {getExplanationTypeLabel(explanation.explanationType)}
                                        </td>
                                        <td className="px-6 py-5 text-base text-slate-700 max-w-xs">
                                            <div className="truncate" title={explanation.employeeReason || ""}>
                                                {explanation.employeeReason || "-"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-base font-medium">
                                            <span className="inline-flex items-center rounded-full border border-amber-100 bg-amber-50 px-4 py-1.5 text-sm font-semibold text-amber-700">
                                                Pending
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-base text-right space-y-3">
                                            {/* // nhập ghi chú của HR */}
                                            <textarea
                                                rows={2}
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                                placeholder="Add HR note (optional)"
                                                value={actionNotes[explanation.attendanceId] || ""}
                                                onChange={(e) => onNoteChange(explanation.attendanceId, e.target.value)}
                                            />
                                            {/* // nếu là loại thiếu check out thì cho nhập giờ check out thực tế */}
                                            {explanation.explanationType === "MISSING_CHECK_OUT" && (
                                                <div className="mt-2">
                                                    <label className="text-xs font-semibold text-slate-500 block mb-1">
                                                        Actual Check-out Time (Optional)
                                                    </label>
                                                    <input
                                                        type="time"
                                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                                        value={customTimes[explanation.attendanceId] || ""}
                                                        onChange={(e) => onTimeChange(explanation.attendanceId, e.target.value)}
                                                        aria-label="Actual Check-out Time (Optional)"
                                                    />
                                                </div>
                                            )}
                                            <div className="flex flex-col gap-2 md:flex-row md:justify-end">
                                                {/* // duyệt giải trình */}
                                                <button
                                                    onClick={() => onProcess(explanation, "APPROVE")}
                                                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:-translate-y-0.5 hover:bg-emerald-700"
                                                >
                                                    Approve
                                                </button>
                                                {/* // từ chối giải trình */}
                                                <button
                                                    onClick={() => onProcess(explanation, "REJECT")}
                                                    className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-rose-500/30 transition hover:-translate-y-0.5 hover:bg-rose-700"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
};
