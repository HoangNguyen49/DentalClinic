import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { useNotification } from "../../../app/providers/NotificationContext";
import type { AttendanceResponse, ExplanationResponse } from "./types";
import { formatDate } from "./utils";

const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080";

export const useEmployeeAttendance = (userId: number | undefined, isDoctor: boolean) => {
    const { t } = useTranslation("web");
    const accessToken = localStorage.getItem("accessToken");
    const { notifications } = useNotification();
    const lastNotificationIdRef = useRef<number | null>(null);

    const [todayAttendance, setTodayAttendance] = useState<AttendanceResponse | null>(null);
    const [todayAttendanceList, setTodayAttendanceList] = useState<AttendanceResponse[]>([]);
    const [todaySchedules, setTodaySchedules] = useState<any[]>([]);
    const [explanationsNeeding, setExplanationsNeeding] = useState<ExplanationResponse[]>([]);
    const [monthlyAttendances, setMonthlyAttendances] = useState<AttendanceResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMonthly, setLoadingMonthly] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

    // Lấy schedule hôm nay của bác sĩ
    const fetchTodaySchedules = useCallback(async () => {
        if (!accessToken || !userId || !isDoctor) return;
        try {
            const today = new Date().toISOString().split("T")[0];
            // Sử dụng endpoint my-schedule/date cho bác sĩ
            const response = await axios.get<any[]>(
                `${apiBase}/api/hr/schedules/my-schedule/date/${today}`,
                {
                    headers: { Authorization: `Bearer ${accessToken}` },
                }
            );
            // Backend đã filter theo userId rồi, chỉ cần lọc ACTIVE
            const userSchedules = (response.data || []).filter(
                (schedule: any) => schedule.status === "ACTIVE"
            );
            setTodaySchedules(userSchedules);
        } catch (error: any) {
            // Nếu lỗi 403 (không có quyền), im lặng bỏ qua
            if (error.response?.status === 403) {
                console.warn("User does not have permission to view schedules. Skipping schedule fetch.");
                setTodaySchedules([]);
                return;
            }
            // Nếu lỗi 404 (không có schedule), cũng bỏ qua
            if (error.response?.status === 404) {
                setTodaySchedules([]);
                return;
            }
            console.error("Failed to fetch today schedules:", error);
            setTodaySchedules([]);
        }
    }, [accessToken, userId, isDoctor]);

    // Lấy chấm công ngày hôm nay
    const fetchTodayAttendance = useCallback(async () => {
        if (!accessToken || !userId) return;

        setLoading(true);
        try {
            if (isDoctor) {
                // Bác sĩ: lấy danh sách tất cả các ca
                const response = await axios.get<AttendanceResponse[]>(
                    `${apiBase}/api/hr/attendance/today-list`,
                    {
                        params: { userId },
                        headers: { Authorization: `Bearer ${accessToken}` },
                    }
                );
                const attendances = (response.data || []).filter((att) => att && att.userId === userId);
                setTodayAttendanceList(attendances);
                setTodayAttendance(attendances.length > 0 ? attendances[0] : null);

                // Fetch schedule để biết có ca nào chưa check-in
                await fetchTodaySchedules();
            } else {
                // Nhân viên thường: lấy 1 attendance record
                const response = await axios.get<AttendanceResponse | null>(
                    `${apiBase}/api/hr/attendance/today`,
                    {
                        params: { userId },
                        headers: { Authorization: `Bearer ${accessToken}` },
                    }
                );
                if (response.data && response.data.userId === userId) {
                    setTodayAttendance(response.data);
                    setTodayAttendanceList([response.data]);
                } else {
                    setTodayAttendance(null);
                    setTodayAttendanceList([]);
                }
            }
        } catch (error: any) {
            if (error.response?.status === 404) {
                setTodayAttendance(null);
                setTodayAttendanceList([]);
            } else {
                toast.error(t("attendance.monthlyHistory.loadFailed", "Cannot load today's attendance"));
            }
        } finally {
            setLoading(false);
        }
    }, [accessToken, userId, isDoctor, t, fetchTodaySchedules]);

    // Lấy danh sách giải trình cần gửi
    const fetchExplanationsNeeding = useCallback(async () => {
        if (!accessToken || !userId) return;
        try {
            const response = await axios.get<ExplanationResponse[]>(
                `${apiBase}/api/hr/attendance/explanations/needing`,
                {
                    params: { userId },
                    headers: { Authorization: `Bearer ${accessToken}` },
                }
            );
            console.log('[DEBUG] ===== EXPLANATION FETCH =====');
            console.log('[DEBUG] Raw explanations from API:', response.data);
            console.log('[DEBUG] Total count:', response.data?.length || 0);
            
            const today = new Date().toISOString().split("T")[0];
            const currentHour = new Date().getHours();
            console.log('[DEBUG] Today date:', today);
            console.log('[DEBUG] Current hour:', currentHour);
            
            const filtered = (response.data || []).filter((exp) => {
                const workDate = exp.workDate ? new Date(exp.workDate).toISOString().split("T")[0] : null;
                console.log(`[DEBUG] Checking explanation: workDate=${workDate}, type=${exp.explanationType}, status=${exp.attendanceStatus}`);
                
                // Chỉ loại bỏ MISSING_CHECK_OUT cho ngày hôm nay nếu ĐANG TRONG GIỜ LÀM VIỆC (8:00 - 18:00)
                if (workDate === today && exp.explanationType === "MISSING_CHECK_OUT") {
                    // Nếu đang trong giờ làm việc (8:00 - 18:00) thì filter out
                    if (currentHour >= 8 && currentHour < 18) {
                        console.log('[DEBUG] ❌ Filtered out MISSING_CHECK_OUT for today (still working hours: 8:00-18:00)');
                        return false;
                    } else {
                        console.log('[DEBUG] ✅ Keeping MISSING_CHECK_OUT for today (outside working hours)');
                    }
                }
                
                if (exp.userId !== userId) {
                    console.log('[DEBUG] ❌ Wrong userId');
                    return false;
                }
                
                console.log('[DEBUG] ✅ Passed filter');
                return true;
            });
            console.log('[DEBUG] Filtered explanations count:', filtered.length);
            console.log('[DEBUG] Filtered explanations:', filtered);
            
            const sorted = filtered.sort((a, b) => {
                const dateA = new Date(a.workDate).getTime();
                const dateB = new Date(b.workDate).getTime();
                return dateB - dateA;
            });
            console.log('[DEBUG] Final sorted explanations:', sorted);
            console.log('[DEBUG] ===== END EXPLANATION FETCH =====');
            setExplanationsNeeding(sorted);
        } catch (error: any) {
            console.error("Failed to fetch explanations:", error);
            setExplanationsNeeding([]);
        }
    }, [accessToken, userId]);

    // Lấy lịch sử chấm công theo tháng
    const fetchMonthlyAttendances = useCallback(async () => {
        if (!accessToken || !userId) return;
        setLoadingMonthly(true);
        try {
            const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`;
            const endDate = new Date(selectedYear, selectedMonth, 0).toISOString().split("T")[0];

            const response = await axios.get<{
                content: AttendanceResponse[];
            }>(
                `${apiBase}/api/hr/attendance/history`,
                {
                    params: {
                        userId,
                        startDate,
                        endDate,
                        page: 0,
                        size: 100,
                    },
                    headers: { Authorization: `Bearer ${accessToken}` },
                }
            );

            const attendances: AttendanceResponse[] = response.data?.content || [];
            const filtered = attendances.filter((att) => att && att.userId === userId);
            setMonthlyAttendances(filtered);
        } catch (error: any) {
            console.error("Failed to fetch monthly attendances:", error);
            if (error.response?.status === 403) {
                toast.error(t("attendance.monthlyHistory.loadFailed", "Unable to load attendance history. Please contact HR."));
            }
            setMonthlyAttendances([]);
        } finally {
            setLoadingMonthly(false);
        }
    }, [accessToken, userId, selectedMonth, selectedYear, t]);

    // Initial fetch
    useEffect(() => {
        if (userId) {
            fetchTodayAttendance();
            fetchExplanationsNeeding();
            fetchMonthlyAttendances();
        }
    }, [userId, fetchTodayAttendance, fetchExplanationsNeeding, fetchMonthlyAttendances]);

    // Notification listener
    useEffect(() => {
        if (!notifications || notifications.length === 0) return;
        if (!accessToken || !userId) return;

        const latestNotification = notifications[0];
        if (!latestNotification || latestNotification.notificationId === lastNotificationIdRef.current) {
            return;
        }

        if (
            (latestNotification.type === "EXPLANATION_APPROVED" ||
                latestNotification.type === "EXPLANATION_REJECTED") &&
            latestNotification.relatedEntityType === "ATTENDANCE"
        ) {
            lastNotificationIdRef.current = latestNotification.notificationId;
            fetchExplanationsNeeding();
            fetchMonthlyAttendances();
            fetchTodayAttendance();
        }
    }, [notifications, accessToken, userId, fetchExplanationsNeeding, fetchMonthlyAttendances, fetchTodayAttendance]);

    return {
        todayAttendance,
        todayAttendanceList,
        todaySchedules,
        explanationsNeeding,
        monthlyAttendances,
        loading,
        loadingMonthly,
        selectedMonth,
        setSelectedMonth,
        selectedYear,
        setSelectedYear,
        fetchTodayAttendance,
        fetchExplanationsNeeding,
        fetchMonthlyAttendances,
    };
};

export const useExplanationActions = (
    onSuccess: () => void
) => {
    const { t } = useTranslation("web");
    const accessToken = localStorage.getItem("accessToken");
    const [submitting, setSubmitting] = useState(false);

    const submitExplanation = async (
        selectedExplanation: ExplanationResponse | null,
        explanationReason: string,
        onClose: () => void
    ) => {
        if (!selectedExplanation || !explanationReason.trim()) {
            toast.error(t("attendance.explanationsNeeded.enterReason", "Please enter explanation reason"));
            return;
        }

        setSubmitting(true);
        try {
            const requestBody: any = {
                attendanceId: selectedExplanation.attendanceId,
                explanationType: selectedExplanation.explanationType,
                reason: explanationReason.trim(),
            };

            if (selectedExplanation.attendanceId === 0 || selectedExplanation.attendanceId === null) {
                // Validation: Kiểm tra các trường bắt buộc
                if (!selectedExplanation.clinicId) {
                    toast.error(t("attendance.explanationsNeeded.missingClinicId", "Clinic ID is required"));
                    setSubmitting(false);
                    return;
                }
                if (!selectedExplanation.workDate) {
                    toast.error(t("attendance.explanationsNeeded.missingWorkDate", "Work date is required"));
                    setSubmitting(false);
                    return;
                }
                if (!selectedExplanation.shiftType) {
                    toast.error(t("attendance.explanationsNeeded.missingShiftType", "Shift type is required"));
                    setSubmitting(false);
                    return;
                }
                
                requestBody.shiftType = selectedExplanation.shiftType;
                requestBody.clinicId = selectedExplanation.clinicId;
                // Đảm bảo workDate ở format yyyy-MM-dd
                const workDateValue = selectedExplanation.workDate;
                if (typeof workDateValue === 'string') {
                    // Nếu là string, kiểm tra format và chuẩn hóa
                    try {
                        const parsedDate = new Date(workDateValue);
                        if (!isNaN(parsedDate.getTime())) {
                            requestBody.workDate = formatDate(parsedDate);
                        } else {
                            // Nếu không parse được, gửi nguyên string (có thể đã đúng format yyyy-MM-dd)
                            requestBody.workDate = workDateValue;
                        }
                    } catch (e) {
                        // Nếu không parse được, gửi nguyên string
                        requestBody.workDate = workDateValue;
                    }
                } else {
                    // Nếu là Date object hoặc giá trị khác
                    requestBody.workDate = workDateValue;
                }
            }

            await axios.post(
                `${apiBase}/api/hr/attendance/explanations/submit`,
                requestBody,
                {
                    headers: { Authorization: `Bearer ${accessToken}` },
                }
            );
            toast.success(t("attendance.explanationsNeeded.submitSuccess", "Explanation submitted successfully"));
            onClose();
            onSuccess();
        } catch (error: any) {
            const message = error.response?.data?.message || t("attendance.explanationsNeeded.submitFailed", "Failed to submit explanation");
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    return {
        submitting,
        submitExplanation,
    };
};
