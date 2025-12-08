import { determineShiftType } from "../../../utils/workHoursConstants";
import type { AttendanceResponse } from "./types";

export function formatDate(date: Date): string {
    return date.toISOString().split("T")[0];
}

export function formatDateDisplay(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

export function formatTime(value?: string | null): string {
    if (!value) return "-";
    try {
        const date = new Date(value);
        return date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    } catch {
        return value;
    }
}

export function getStatusColor(status?: string | null): string {
    if (!status) return "bg-gray-100 text-gray-800";
    switch (status.toUpperCase()) {
        case "ON_TIME":
        case "APPROVED_LATE":
        case "APPROVED_ABSENCE":
            return "bg-green-100 text-green-800";
        case "LATE":
            return "bg-yellow-100 text-yellow-800";
        case "ABSENT":
            return "bg-red-100 text-red-800";
        default:
            return "bg-gray-100 text-gray-800";
    }
}

export function getExplanationStatusColor(status?: string | null): string {
    if (!status) return "bg-gray-100 text-gray-800";
    switch (status.toUpperCase()) {
        case "APPROVED":
            return "bg-green-100 text-green-800";
        case "REJECTED":
            return "bg-red-100 text-red-800";
        case "PENDING":
            return "bg-yellow-100 text-yellow-800";
        default:
            return "bg-gray-100 text-gray-800";
    }
}

export function calculateWorkedHours(attendance: AttendanceResponse): number {
    if (!attendance.checkInTime || !attendance.checkOutTime) return 0;
    const start = new Date(attendance.checkInTime).getTime();
    const end = new Date(attendance.checkOutTime).getTime();
    if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 0;
    const diffMs = end - start;
    return diffMs / (1000 * 60 * 60);
}

export function formatHourValue(value: number): string {
    if (!Number.isFinite(value) || value <= 0) return "-";
    return `${value.toFixed(1)}h`;
}

export function getShiftTypeLabel(shiftType?: string | null): string {
    if (!shiftType || shiftType === "FULL_DAY") return "";
    return shiftType === "MORNING" ? "Ca sáng" : "Ca chiều";
}

export const getShiftTypeFromStartTime = (startTime: string): string => {
    return determineShiftType(startTime);
};

export const createAttendanceFromSchedule = (schedule: any, userId: number, userName: string): AttendanceResponse => {
    const shiftType = getShiftTypeFromStartTime(schedule.startTime);
    return {
        id: 0,
        userId: userId,
        userName: userName,
        clinicId: schedule.clinic?.id,
        clinicName: schedule.clinic?.clinicName || "",
        workDate: schedule.workDate,
        checkInTime: null,
        checkOutTime: null,
        attendanceStatus: "ABSENT",
        shiftType: shiftType,
        note: null,
    };
};

export const needsExplanation = (attendance: AttendanceResponse): { needs: boolean; explanationType?: string } => {
    if (!attendance) return { needs: false };

    const status = (attendance.attendanceStatus || "").toUpperCase();
    const hasCheckIn = attendance.checkInTime != null;
    const hasCheckOut = attendance.checkOutTime != null;

    const hasExplanation = attendance.note && (
        attendance.note.includes("[EXPLANATION_REQUEST:") ||
        attendance.note.includes("[APPROVED]") ||
        attendance.note.includes("[REJECTED]")
    );

    if (hasExplanation) return { needs: false };

    if (status === "LATE") {
        return { needs: true, explanationType: "LATE" };
    }
    if (status === "ABSENT") {
        return { needs: true, explanationType: "ABSENT" };
    }

    const today = new Date().toISOString().split("T")[0];
    const workDate = attendance.workDate ? new Date(attendance.workDate).toISOString().split("T")[0] : null;
    if (workDate === today && hasCheckIn && !hasCheckOut) {
        return { needs: false };
    }
    if (hasCheckIn && !hasCheckOut) {
        return { needs: true, explanationType: "MISSING_CHECK_OUT" };
    }
    if (!hasCheckIn && hasCheckOut) {
        return { needs: true, explanationType: "MISSING_CHECK_IN" };
    }

    return { needs: false };
};
