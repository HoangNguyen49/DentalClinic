import { useState } from "react";
import { toast } from "react-toastify";
import { hrApi } from "../../services/hr/hrApi";
import { useHrApi } from "../useHrApi";
import { convertTableToAPIFormat, validateScheduleFrontend, type TableSchedule } from "../../utils/hr/scheduleUtils";

export const useScheduleActions = (
    tableSchedules: TableSchedule,
    setTableSchedules: (s: TableSchedule) => void,
    daysOfWeek: any[],
    clinics: any[],
    doctors: any[],
    weekStart: string,
    note: string,
    navigate: any,
    t: any,
    holidays: any[] = []
) => {
    const { execute: executeApi } = useHrApi<any>();
    const [submitting, setSubmitting] = useState(false);
    const [validating, setValidating] = useState(false);
    const [aiGenerating, setAiGenerating] = useState(false);
    const [aiResult, setAiResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);

    // Gửi request validate schedule cho backend, thông báo lỗi nếu có
    const validateSchedule = async () => {
        setValidating(true);
        const request = convertTableToAPIFormat(tableSchedules, daysOfWeek, doctors, weekStart, note);

        await executeApi(() => hrApi.schedules.validate(request), {
            onSuccess: (data: any) => {
                if (data.isValid) {
                    toast.success(t("create.validation.scheduleValid"));
                } else {
                    const errors = data.errors || [];
                    if (errors.length > 0) {
                        if (errors.length > 5) {
                            const firstErrors = errors.slice(0, 5);
                            const remainingCount = errors.length - 5;
                            toast.error(
                                `${t("create.validation.foundErrors", { count: errors.length })}\n${firstErrors.join(
                                    "\n"
                                )}\n${t("create.validation.andMore", { count: remainingCount })}`,
                                {
                                    autoClose: 8000,
                                    style: { whiteSpace: "pre-line" },
                                }
                            );
                        } else {
                            toast.error(
                                `${t("create.validation.foundErrors", { count: errors.length })}\n${errors.join("\n")}`,
                                {
                                    autoClose: 8000,
                                    style: { whiteSpace: "pre-line" },
                                }
                            );
                        }
                    }
                }
            },
            errorMessage: t("create.validation.errorDuringValidation"),
        });
        setValidating(false);

    };

    // Gửi request tạo schedule mới (và validate)
    const handleSubmit = async () => {
        // Ghép tất cả assignment lại (dùng để validate phía trước)
        const assignmentDetails: Array<{
            day: string;
            date: string;
            clinicId?: number;
            clinicName?: string;
        }> = [];

        Object.entries(tableSchedules).forEach(([_doctorId, daySchedule]) => {
            Object.entries(daySchedule).forEach(([dayKey, dayScheduleData]: [string, any]) => {
                if (dayScheduleData) {
                    const dayInfo = daysOfWeek.find((d) => d.key === dayKey);
                    if (dayInfo) {
                        const morningClinicId = dayScheduleData.morning?.clinicId;
                        if (morningClinicId) {
                            const clinic = clinics.find((c) => c.id === morningClinicId);
                            assignmentDetails.push({
                                day: dayInfo.label,
                                date: dayInfo.dateString,
                                clinicId: morningClinicId,
                                clinicName: clinic?.name || clinic?.clinicName || `Clinic ${morningClinicId}`,
                            });
                        }
                        const afternoonClinicId = dayScheduleData.afternoon?.clinicId;
                        if (afternoonClinicId) {
                            const clinic = clinics.find((c) => c.id === afternoonClinicId);
                            assignmentDetails.push({
                                day: dayInfo.label,
                                date: dayInfo.dateString,
                                clinicId: afternoonClinicId,
                                clinicName: clinic?.name || clinic?.clinicName || `Clinic ${afternoonClinicId}`,
                            });
                        }
                    }
                }
            });
        });

        if (assignmentDetails.length === 0) {
            toast.error(t("create.validation.noAssignments"), { autoClose: 6000 });
            return;
        }

        const daysWithAssignments = new Set(assignmentDetails.map((a) => a.day));
        const daysWithoutDoctors = daysOfWeek.filter((day) => !daysWithAssignments.has(day.label));
        if (daysWithoutDoctors.length === daysOfWeek.length) {
            toast.error(t("create.validation.noAssignments"), { autoClose: 6000 });
            return;
        }

        // Check if there are only assignments in one clinic
        const errors: string[] = [];
        daysOfWeek.forEach((day) => {
            const dayAssignments = assignmentDetails.filter((a) => a.day === day.label);
            const clinicIdsSet = new Set(dayAssignments.map((a) => a.clinicId).filter((id) => id !== undefined));
            if (clinics.length === 2 && clinicIdsSet.size === 1) {
                const assignedClinicId = Array.from(clinicIdsSet)[0];
                const missingClinic = clinics.find((c) => c.id !== assignedClinicId);
                if (missingClinic) {
                    errors.push(
                        t("create.validation.missingClinicAssignment", {
                            day: day.label,
                            date: day.dateString,
                            clinic: missingClinic.name || missingClinic.clinicName || `Clinic ${missingClinic.id}`
                        })
                    );
                }
            }
        });

        if (errors.length > 0) {
            errors.forEach((error, index) => {
                setTimeout(() => {
                    toast.error(error, { autoClose: 6000 });
                }, index * 200);
            });
            return;
        }

        const validation = validateScheduleFrontend(tableSchedules, daysOfWeek, clinics, doctors, holidays);
        if (!validation.isValid) {
            validation.errors.forEach((error: string) =>
                toast.error(error, { autoClose: 5000 })
            );
            return;
        }

        setSubmitting(true);
        const request = convertTableToAPIFormat(tableSchedules, daysOfWeek, doctors, weekStart, note);

        await executeApi(() => hrApi.schedules.create(request), {
            onSuccess: (data: any) => {
                toast.success(t("create.messages.successCreated", { count: (data as any[]).length }));
                setTimeout(() => {
                    navigate("/hr/schedules", {
                        state: {
                            refresh: true,
                            weekStart: weekStart,
                        },
                    });
                }, 1500);
            },
            errorMessage: t("create.messages.cannotCreate"),
        });
        setSubmitting(false);
    };

    // Sinh lịch tự động dùng AI từ mô tả
    const handleAiGenerate = async (aiDescription: string, setAiDescription: (s: string) => void) => {
        if (!aiDescription.trim()) {
            toast.error(t("create.aiGeneration.messages.pleaseInput"));
            return;
        }

        setAiGenerating(true);
        
        // Show progress messages to keep user informed
        const progressMessages: NodeJS.Timeout[] = [];
        
        // Initial message
        toast.info(t("create.aiGeneration.messages.preparing", "Đang chuẩn bị dữ liệu..."), {
            toastId: "ai-progress-0",
            autoClose: false,
        });
        
        // Show progress at 10 seconds
        const msg1 = setTimeout(() => {
            if (aiGenerating) {
                toast.info(t("create.aiGeneration.messages.callingAi", "Đang gọi AI Gemini..."), {
                    toastId: "ai-progress-1",
                    autoClose: false,
                });
            }
        }, 10000);
        progressMessages.push(msg1);
        
        // Show progress at 30 seconds
        const msg2 = setTimeout(() => {
            if (aiGenerating) {
                toast.info(t("create.aiGeneration.messages.processing", "AI đang xử lý, vui lòng đợi..."), {
                    toastId: "ai-progress-2",
                    autoClose: false,
                });
            }
        }, 30000);
        progressMessages.push(msg2);
        
        // Show progress at 60 seconds
        const msg3 = setTimeout(() => {
            if (aiGenerating) {
                toast.info(t("create.aiGeneration.messages.almostDone", "Gần xong rồi..."), {
                    toastId: "ai-progress-3",
                    autoClose: false,
                });
            }
        }, 60000);
        progressMessages.push(msg3);
        
        // Cleanup function
        const cleanupProgressMessages = () => {
            progressMessages.forEach(timeout => clearTimeout(timeout));
            // Dismiss all progress toasts
            toast.dismiss("ai-progress-0");
            toast.dismiss("ai-progress-1");
            toast.dismiss("ai-progress-2");
            toast.dismiss("ai-progress-3");
        };
        
        // Luôn sử dụng endpoint generate với template tự động
        await executeApi(() => hrApi.schedules.generateAi(weekStart, aiDescription.trim()), {
            onSuccess: (generatedRequest: any) => {
            // Cleanup progress messages
            cleanupProgressMessages();

            // Convert AI result về format tableSchedules
            const newTableSchedules: TableSchedule = {};
            Object.entries(generatedRequest.dailyAssignments).forEach(([rawDayKey, assignments]: [string, any]) => {
                const dayKey = rawDayKey.toLowerCase();
                (assignments as any[]).forEach((assignment: any) => {
                    const doctorId = assignment.doctorId;
                    const clinicId = assignment.clinicId;
                    const startTime = assignment.startTime;
                    const isMorning = startTime >= "08:00" && startTime < "12:00";
                    const shiftKey = isMorning ? "morning" : "afternoon";
                    if (!newTableSchedules[doctorId]) {
                        newTableSchedules[doctorId] = {};
                    }
                    if (!newTableSchedules[doctorId][dayKey]) {
                        newTableSchedules[doctorId][dayKey] = {};
                    }
                    newTableSchedules[doctorId][dayKey][shiftKey] = {
                        clinicId: clinicId,
                    };
                });
            });
            setTableSchedules(newTableSchedules);

            // Số lượng phân công đã tạo từ AI
            const totalAssignments = Object.values(generatedRequest.dailyAssignments)
                .reduce((sum: number, assignments: any) => sum + (assignments as any[]).length, 0);

            setAiResult({
                success: true,
                message: t("create.aiGeneration.resultMessage", { count: totalAssignments, days: Object.keys(generatedRequest.dailyAssignments).length }),
                count: totalAssignments,
            });

                toast.success(t("create.aiGeneration.success", { count: totalAssignments }));
                setTimeout(() => {
                    setAiDescription("");
                    setAiResult(null);
                }, 5000);
            },
            onError: (err: any) => {
                // Cleanup progress messages
                cleanupProgressMessages();
                
                const errorMessage = err?.response?.data?.message || t("create.aiGeneration.error");
                setAiResult({
                    success: false,
                    message: errorMessage,
                });
            },
            errorMessage: t("create.aiGeneration.error"),
        });
        setAiGenerating(false);
    };

    return {
        handleSubmit,
        handleAiGenerate,
        validateSchedule,
        submitting,
        validating,
        aiGenerating,
        aiResult,
        setAiResult
    };
};
