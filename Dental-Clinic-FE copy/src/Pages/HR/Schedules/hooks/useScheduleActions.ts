import { useState } from "react";
import { toast } from "react-toastify";
import scheduleService from "../../../../services/hr/scheduleService";
import { convertTableToAPIFormat, validateScheduleFrontend, type TableSchedule } from "../utils/scheduleUtils";

export const useScheduleActions = (
    tableSchedules: TableSchedule,
    setTableSchedules: (s: TableSchedule) => void,
    daysOfWeek: any[],
    clinics: any[],
    doctors: any[],
    weekStart: string,
    note: string,
    navigate: any,
    t: any
) => {
    const [submitting, setSubmitting] = useState(false);
    const [validating, setValidating] = useState(false);
    const [aiGenerating, setAiGenerating] = useState(false);
    const [aiResult, setAiResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);

    // Gửi request validate schedule cho backend, thông báo lỗi nếu có
    const validateSchedule = async () => {
        setValidating(true);
        try {
            const request = convertTableToAPIFormat(tableSchedules, daysOfWeek, doctors, weekStart, note);

            const response = await scheduleService.validateSchedule(request);

            if (response.data.isValid) {
                toast.success(t("create.validation.scheduleValid"));
            } else {
                const errors = response.data.errors || [];
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
        } catch (err: any) {
            let errorMsg = t("create.validation.errorDuringValidation");
            if (err?.response?.data) {
                const errorData = err.response.data;
                if (errorData.errors && Array.isArray(errorData.errors)) {
                    const errors = errorData.errors;
                    if (errors.length > 5) {
                        errorMsg = `${t("create.validation.foundErrors", { count: errors.length })}\n${errors
                            .slice(0, 5)
                            .join("\n")}\n${t("create.validation.andMore", { count: errors.length - 5 })}`;
                    } else {
                        errorMsg = `${t("create.validation.foundErrors", { count: errors.length })}\n${errors.join("\n")}`;
                    }
                } else {
                    errorMsg = errorData.message || errorData.error || errorMsg;
                }
            } else if (err?.message) {
                errorMsg = err.message;
            }
            toast.error(errorMsg, {
                autoClose: 8000,
                style: { whiteSpace: "pre-line" },
            });
        } finally {
            setValidating(false);
        }
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
            Object.entries(daySchedule).forEach(([dayKey, dayScheduleData]) => {
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

        const validation = validateScheduleFrontend(tableSchedules, daysOfWeek, clinics, doctors);
        if (!validation.isValid) {
            validation.errors.forEach((error) =>
                toast.error(error, { autoClose: 5000 })
            );
            return;
        }

        setSubmitting(true);
        try {
            const request = convertTableToAPIFormat(tableSchedules, daysOfWeek, doctors, weekStart, note);

            const response = await scheduleService.createSchedule(request);

            toast.success(t("create.messages.successCreated", { count: response.data.length }));
            setTimeout(() => {
                navigate("/hr/schedules", {
                    state: {
                        refresh: true,
                        weekStart: weekStart,
                    },
                });
            }, 1500);
        } catch (err: any) {
            // Thông báo lỗi cụ thể trả về từ backend
            if (err?.response?.data) {
                const errorData = err.response.data;
                if (errorData.errors && Array.isArray(errorData.errors)) {
                    errorData.errors.forEach((error: string, index: number) => {
                        setTimeout(() => {
                            toast.error(error, {
                                autoClose: 6000,
                                position: "top-right",
                            });
                        }, index * 100);
                    });
                } else if (errorData.validationErrors && Array.isArray(errorData.validationErrors)) {
                    errorData.validationErrors.forEach((error: string, index: number) => {
                        setTimeout(() => {
                            toast.error(error, {
                                autoClose: 6000,
                                position: "top-right",
                            });
                        }, index * 100);
                    });
                } else if (errorData.message) {
                    toast.error(errorData.message, {
                        autoClose: 6000,
                        position: "top-right",
                    });
                } else if (errorData.error) {
                    toast.error(errorData.error, {
                        autoClose: 6000,
                        position: "top-right",
                    });
                } else {
                    toast.error(t("create.messages.cannotCreate"), {
                        autoClose: 6000,
                        position: "top-right",
                    });
                }
            } else if (err?.message) {
                toast.error(err.message, {
                    autoClose: 6000,
                    position: "top-right",
                });
            } else {
                toast.error(t("create.messages.cannotCreate"), {
                    autoClose: 6000,
                    position: "top-right",
                });
            }
        } finally {
            setSubmitting(false);
        }
    };

    // Sinh lịch tự động dùng AI từ mô tả
    const handleAiGenerate = async (aiDescription: string, setAiDescription: (s: string) => void) => {
        if (!aiDescription.trim()) {
            toast.error(t("create.aiGeneration.messages.pleaseInput"));
            return;
        }

        setAiGenerating(true);
        try {
            // Luôn sử dụng endpoint generate với template tự động
            const response = await scheduleService.generateScheduleAi(weekStart, aiDescription.trim());

            const generatedRequest = response.data;

            // Convert AI result về format tableSchedules
            const newTableSchedules: TableSchedule = {};
            Object.entries(generatedRequest.dailyAssignments).forEach(([rawDayKey, assignments]) => {
                const dayKey = rawDayKey.toLowerCase();
                assignments.forEach((assignment) => {
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
                .reduce((sum, assignments) => sum + assignments.length, 0);

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
        } catch (err: any) {
            console.error("AI generation error:", err);
            const errorMessage = err?.response?.data?.message || t("create.aiGeneration.error");
            setAiResult({
                success: false,
                message: errorMessage,
            });
            toast.error(errorMessage);
        } finally {
            setAiGenerating(false);
        }
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
