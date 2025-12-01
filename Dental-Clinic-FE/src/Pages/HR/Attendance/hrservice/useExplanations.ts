import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { useNotification } from "../../../../app/providers/NotificationContext";

// Kiểu dữ liệu clinic cho HR
export type HrClinic = {
    id: number;
    clinicName: string;
};

// Kiểu dữ liệu Attendance cơ bản
export type AttendanceResponse = {
    id: number;
    userId: number;
    userName: string;
    userAvatarUrl?: string;
    clinicId: number;
    clinicName?: string;
    workDate: string;
    checkInTime?: string | null;
    checkOutTime?: string | null;
    attendanceStatus?: string | null;
    note?: string | null;
};

// Kiểu dữ liệu giải trình chấm công
export type AttendanceExplanationResponse = {
    attendanceId: number;
    userId: number;
    userName?: string;
    clinicId: number;
    clinicName?: string;
    workDate: string;
    checkInTime?: string | null;
    checkOutTime?: string | null;
    attendanceStatus?: string | null;
    explanationType?: string | null;
    employeeReason?: string | null;
    explanationStatus?: string | null;
    adminNote?: string | null;
    note?: string | null;
    shiftType?: string | null;
};

const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080";

// Hook quản lý giải trình & giải thích lỗi chấm công
export const useExplanations = () => {
    const { t } = useTranslation("admin");
    const accessToken = localStorage.getItem("accessToken");
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    const hrUserId = user?.userId || user?.id;
    const { onNotificationReceived } = useNotification();

    const [clinics, setClinics] = useState<HrClinic[]>([]);
    const [pendingExplanations, setPendingExplanations] = useState<AttendanceExplanationResponse[]>([]);
    const [loadingExplanations, setLoadingExplanations] = useState(false);
    const [explanationClinicFilter, setExplanationClinicFilter] = useState<string>("all");
    const [actionNotes, setActionNotes] = useState<Record<number, string>>({});
    const [customTimes, setCustomTimes] = useState<Record<number, string>>({});
    const [highlightedAttendanceId, setHighlightedAttendanceId] = useState<number | null>(null);

    // ref scroll vào bảng giải trình
    const explanationsTableRef = useRef<HTMLDivElement>(null);

    // Lấy danh sách clinic cho HR
    const fetchClinics = useCallback(async () => {
        if (!accessToken) return;
        try {
            const response = await axios.get<HrClinic[]>(`${apiBase}/api/hr/management/clinics`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            setClinics(response.data || []);
        } catch (error: any) {
            const message =
                error?.response?.data?.message ||
                error?.message ||
                t("attendance.messages.loadClinicsFailed", "Unable to load clinics");
            toast.error(message);
        }
    }, [accessToken, t]);

    // Lấy danh sách giải trình chưa xử lý
    const fetchPendingExplanations = useCallback(async (): Promise<AttendanceExplanationResponse[] | undefined> => {
        if (!accessToken) return undefined;
        setLoadingExplanations(true);
        try {
            const params: Record<string, string | number> = {};
            if (explanationClinicFilter && explanationClinicFilter !== "all") {
                const clinicIdNum = parseInt(explanationClinicFilter, 10);
                if (!isNaN(clinicIdNum)) {
                    params.clinicId = clinicIdNum;
                }
            }
            const response = await axios.get<AttendanceExplanationResponse[]>(
                `${apiBase}/api/hr/attendance/explanations/pending`,
                {
                    headers: { Authorization: `Bearer ${accessToken}` },
                    params,
                }
            );
            setPendingExplanations(response.data || []);
            return response.data;
        } catch (error: any) {
            const message =
                error?.response?.data?.message ||
                error?.message ||
                t("attendance.messages.loadExplanationsFailed", "Unable to load pending explanations");
            if (error?.response?.status !== 500) {
                toast.error(message);
            }
            return undefined;
        } finally {
            setLoadingExplanations(false);
        }
    }, [accessToken, explanationClinicFilter, t]);

    // Khởi tạo lần đầu
    useEffect(() => {
        if (!accessToken) {
            toast.error(t("attendance.messages.noAccessToken", "Missing access token"));
            return;
        }
        fetchClinics();
    }, [accessToken, fetchClinics, t]);

    useEffect(() => {
        if (!accessToken) return;
        fetchPendingExplanations();
    }, [explanationClinicFilter, accessToken, fetchPendingExplanations]);

    // Nhận thông báo realtime để cập nhật giải trình mới hoặc thay đổi trạng thái
    useEffect(() => {
        if (!accessToken) return;

        const unsubscribe = onNotificationReceived((notification) => {
            const relatedEntityType = notification.relatedEntityType?.toUpperCase();
            if (
                relatedEntityType === "ATTENDANCE" ||
                notification.type === "EXPLANATION_SUBMITTED" ||
                notification.type === "EXPLANATION_APPROVED" ||
                notification.type === "EXPLANATION_REJECTED"
            ) {
                const newAttendanceId = notification.relatedEntityId;
                // Hiển thị giải trình vừa cập nhật trên màn hình
                if (explanationsTableRef.current) {
                    explanationsTableRef.current.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                    });
                } else {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                }

                if (newAttendanceId) {
                    setHighlightedAttendanceId(newAttendanceId);
                    setTimeout(() => {
                        setHighlightedAttendanceId(null);
                    }, 3000);
                }
                fetchPendingExplanations();
            }
        });

        return unsubscribe;
    }, [accessToken, onNotificationReceived, fetchPendingExplanations]);

    // Xử lý duyệt/ từ chối giải trình chấm công
    const handleProcessExplanation = async (
        explanation: AttendanceExplanationResponse,
        action: "APPROVE" | "REJECT"
    ) => {
        if (!accessToken || !hrUserId) return;
        const adminNote = (actionNotes[explanation.attendanceId] || "").trim();
        const customTime = customTimes[explanation.attendanceId] || "";

        // Tối ưu giao diện trước khi gửi request, ẩn giải trình khỏi bảng trước
        const explanationId = explanation.attendanceId;
        setPendingExplanations((prev) => prev.filter((exp) => exp.attendanceId !== explanationId));
        setActionNotes((prev) => {
            const updated = { ...prev };
            delete updated[explanation.attendanceId];
            return updated;
        });
        setCustomTimes((prev) => {
            const updated = { ...prev };
            delete updated[explanation.attendanceId];
            return updated;
        });

        try {
            const response = await axios.post<AttendanceResponse>(
                `${apiBase}/api/hr/attendance/explanations/process`,
                {
                    attendanceId: explanation.attendanceId,
                    action: action,
                    adminNote: adminNote || "",
                    customTime: customTime,
                },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            // Thông báo kết quả xử lý giải trình
            const newStatus = response.data.attendanceStatus;
            if (action === "APPROVE") {
                let statusMessage = "";
                if (explanation.explanationType === "LATE") {
                    statusMessage = `Status updated: LATE → ${newStatus || "APPROVED_LATE"}`;
                } else if (explanation.explanationType === "ABSENT" || explanation.explanationType === "MISSING_CHECK_IN") {
                    statusMessage = `Status updated: ${explanation.attendanceStatus} → ${newStatus || "APPROVED_ABSENCE"}`;
                } else if (explanation.explanationType === "MISSING_CHECK_OUT") {
                    statusMessage = t(
                        "attendance.messages.missingCheckOutApproved",
                        "Explanation approved. Check-out time set to 18:00 and work hours recalculated automatically."
                    );
                }

                toast.success(
                    `${t("attendance.messages.explanationApproved", "Explanation approved successfully")}\n${statusMessage}`,
                    { autoClose: 5000 }
                );
            } else {
                toast.success(
                    `${t("attendance.messages.explanationRejected", "Explanation rejected")}\nStatus unchanged: ${explanation.attendanceStatus}`,
                    { autoClose: 5000 }
                );
            }
            fetchPendingExplanations();
        } catch (error: any) {
            // Rollback dữ liệu khi xử lý lỗi (restore lại item đã xóa khỏi bảng)
            setPendingExplanations((prev) => {
                const exists = prev.some((exp) => exp.attendanceId === explanationId);
                if (!exists) {
                    return [...prev, explanation];
                }
                return prev;
            });

            if (adminNote) {
                setActionNotes((prev) => ({ ...prev, [explanationId]: adminNote }));
            }
            if (customTime) {
                setCustomTimes((prev) => ({ ...prev, [explanationId]: customTime }));
            }

            const message =
                error?.response?.data?.message ||
                error?.message ||
                t("attendance.messages.processFailed", "Unable to process explanation");
            toast.error(message);
        }
    };

    // Ghi chú thay đổi của HR cho giải trình
    const handleNoteChange = (attendanceId: number, value: string) => {
        setActionNotes((prev) => ({
            ...prev,
            [attendanceId]: value,
        }));
    };

    // Thay đổi custom time cho approve giải trình
    const handleCustomTimeChange = (attendanceId: number, value: string) => {
        setCustomTimes((prev) => ({
            ...prev,
            [attendanceId]: value,
        }));
    };

    // Expose các state & hàm quan trọng cho component gọi hook
    return {
        clinics,
        pendingExplanations,
        loadingExplanations,
        explanationClinicFilter,
        setExplanationClinicFilter,
        actionNotes,
        customTimes,
        highlightedAttendanceId,
        explanationsTableRef,
        fetchPendingExplanations,
        handleProcessExplanation,
        handleNoteChange,
        handleCustomTimeChange,
    };
};
