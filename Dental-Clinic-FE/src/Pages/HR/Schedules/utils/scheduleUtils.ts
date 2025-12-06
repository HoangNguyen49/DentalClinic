import type { CreateScheduleRequest } from "../../../../services/hr/scheduleService";
import { WORK_HOURS_CONSTANTS } from "../../../../utils/workHoursConstants";

export const SHIFTS = [
    {
        id: "morning",
        name: "Morning",
        startTime: WORK_HOURS_CONSTANTS.MORNING_SHIFT.START,
        endTime: WORK_HOURS_CONSTANTS.MORNING_SHIFT.END,
    },
    {
        id: "afternoon",
        name: "Afternoon",
        startTime: WORK_HOURS_CONSTANTS.AFTERNOON_SHIFT.START,
        endTime: WORK_HOURS_CONSTANTS.AFTERNOON_SHIFT.END,
    },
];

// --- Types for Creating Schedule (Input) ---
export type DaySchedule = {
    morning?: {
        clinicId: number;
    };
    afternoon?: {
        clinicId: number;
    };
};

export type TableSchedule = {
    [doctorId: number]: {
        [dayKey: string]: DaySchedule;
    };
};

// --- Types for Viewing Schedule (Output) ---
export type HrDocDto = {
    id: number;
    fullName: string;
};

export type RoomResponse = {
    id: number;
    roomName: string;
    clinicId?: number;
    clinicName?: string;
};

export type ScheduleItem = {
    id: number;
    doctor: HrDocDto | null;
    clinic: any;
    room: RoomResponse | null;
    workDate: string;
    startTime: string;
    endTime: string;
    status?: string;
    note?: string;
};

export type DoctorDaySchedule = {
    doctor: HrDocDto | null;
    morning?: ScheduleItem;
    afternoon?: ScheduleItem;
};

export type WeekDay = {
    date: string;
    dayName: string;
    dayNum: number;
    isToday: boolean;
};

export type DoctorWeekSchedule = {
    doctor: { id: number; fullName: string } | null;
    daySchedules: Record<string, DoctorDaySchedule>;
};

// --- Functions ---

export const convertTableToAPIFormat = (
    tableSchedules: TableSchedule,
    daysOfWeek: any[],
    doctors: any[],
    weekStart: string,
    note: string
): CreateScheduleRequest => {
    const dailyAssignments: {
        [key: string]: Array<{
            doctorId: number;
            clinicId: number;
            roomId: number;
            chairId: number;
            startTime: string;
            endTime: string;
            note?: string;
        }>;
    } = {};

    daysOfWeek.forEach((day) => {
        dailyAssignments[day.key] = [];

        Object.entries(tableSchedules).forEach(([doctorIdStr, daySchedule]) => {
            const doctorId = Number(doctorIdStr);
            const dayScheduleData = daySchedule[day.key];

            if (doctorId && dayScheduleData) {
                const doctor = doctors.find((d: any) => d.id === doctorId);
                const roomId =
                    doctor?.room?.id || doctor?.roomId || doctor?.defaultRoomId || 0;

                if (dayScheduleData.morning?.clinicId) {
                    const morningShift = SHIFTS.find((s) => s.id === "morning") || SHIFTS[0];
                    dailyAssignments[day.key].push({
                        doctorId,
                        clinicId: dayScheduleData.morning.clinicId,
                        roomId,
                        chairId: 0,
                        startTime: morningShift.startTime,
                        endTime: morningShift.endTime,
                        note: undefined,
                    });
                }

                if (dayScheduleData.afternoon?.clinicId) {
                    const afternoonShift = SHIFTS.find((s) => s.id === "afternoon") || SHIFTS[1];
                    dailyAssignments[day.key].push({
                        doctorId,
                        clinicId: dayScheduleData.afternoon.clinicId,
                        roomId,
                        chairId: 0,
                        startTime: afternoonShift.startTime,
                        endTime: afternoonShift.endTime,
                        note: undefined,
                    });
                }
            }
        });
    });

    return {
        weekStart,
        dailyAssignments,
        note: note || undefined,
    };
};

export const validateScheduleFrontend = (
    tableSchedules: TableSchedule,
    daysOfWeek: any[],
    clinics: any[],
    doctors: any[]
): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const clinicIds = clinics.map((c) => c.id).sort();
    if (clinicIds.length !== 2) {
        errors.push(`There must be exactly 2 clinics but got ${clinics.length}.`);
        return { isValid: false, errors };
    }
    const [clinic1Id, clinic2Id] = clinicIds;

    daysOfWeek.forEach((day) => {
        // Thu thập thông tin phân công cho mỗi ngày
        const clinicShifts: { [clinicId: number]: { morning: boolean; afternoon: boolean } } = {};
        const specialtyClinicDoctors: { [specialtyName: string]: { [clinicId: number]: Set<number> } } = {};

        Object.entries(tableSchedules).forEach(([doctorIdStr, daySchedule]) => {
            const doctorId = Number(doctorIdStr);
            const dayScheduleData = daySchedule[day.key];
            if (!dayScheduleData) return;

            const doctor = doctors.find((d: any) => d.id === doctorId);
            if (!doctor) return;

            const doctorSpecialties: string[] =
                (doctor.specialties && Array.isArray(doctor.specialties) && doctor.specialties.length > 0)
                    ? doctor.specialties
                    : (doctor.specialty || doctor.specialtyName)
                        ? [doctor.specialty || doctor.specialtyName]
                        : ["Uncategorized"];

            if (dayScheduleData.morning?.clinicId) {
                const clinicId = dayScheduleData.morning.clinicId;
                if (!clinicShifts[clinicId]) {
                    clinicShifts[clinicId] = { morning: false, afternoon: false };
                }
                clinicShifts[clinicId].morning = true;
                doctorSpecialties.forEach((specialtyName) => {
                    if (!specialtyClinicDoctors[specialtyName]) {
                        specialtyClinicDoctors[specialtyName] = {};
                    }
                    if (!specialtyClinicDoctors[specialtyName][clinicId]) {
                        specialtyClinicDoctors[specialtyName][clinicId] = new Set();
                    }
                    specialtyClinicDoctors[specialtyName][clinicId].add(doctorId);
                });
            }

            if (dayScheduleData.afternoon?.clinicId) {
                const clinicId = dayScheduleData.afternoon.clinicId;
                if (!clinicShifts[clinicId]) {
                    clinicShifts[clinicId] = { morning: false, afternoon: false };
                }
                clinicShifts[clinicId].afternoon = true;
                doctorSpecialties.forEach((specialtyName) => {
                    if (!specialtyClinicDoctors[specialtyName]) {
                        specialtyClinicDoctors[specialtyName] = {};
                    }
                    if (!specialtyClinicDoctors[specialtyName][clinicId]) {
                        specialtyClinicDoctors[specialtyName][clinicId] = new Set();
                    }
                    specialtyClinicDoctors[specialtyName][clinicId].add(doctorId);
                });
            }
        });

        // validate: phải có đúng 2 clinic hoạt động mỗi ngày
        const workingClinicIds = Object.keys(clinicShifts).map(Number);
        if (workingClinicIds.length === 0) {
            return;
        }
        if (workingClinicIds.length !== 2) {
            if (workingClinicIds.length === 1) {
                const clinicName = clinics.find((c) => c.id === workingClinicIds[0])?.name || `Clinic ${workingClinicIds[0]}`;
                errors.push(
                    `Only 1 clinic (${clinicName}) is active on ${day.label} (${day.dateString}). Both clinics must be active.`
                );
            } else {
                errors.push(
                    `Too many clinics (${workingClinicIds.length}) are active on ${day.label} (${day.dateString}). Exactly 2 clinics must be active.`
                );
            }
            return;
        }

        // validate: mỗi clinic phải có bác sĩ cả sáng và chiều
        [clinic1Id, clinic2Id].forEach((clinicId) => {
            const shifts = clinicShifts[clinicId];
            const clinicName = clinics.find((c) => c.id === clinicId)?.name || `Clinic ${clinicId}`;
            if (!shifts) {
                errors.push(
                    `${clinicName} must have doctors assigned on ${day.label} (${day.dateString}).`
                );
            } else {
                if (!shifts.morning) {
                    errors.push(
                        `${clinicName} must have doctors assigned in the morning shift (${WORK_HOURS_CONSTANTS.MORNING_SHIFT.START}-${WORK_HOURS_CONSTANTS.MORNING_SHIFT.END}) on ${day.label} (${day.dateString}).`
                    );
                }
                if (!shifts.afternoon) {
                    errors.push(
                        `${clinicName} must have doctors assigned in the afternoon shift (${WORK_HOURS_CONSTANTS.AFTERNOON_SHIFT.START}-${WORK_HOURS_CONSTANTS.AFTERNOON_SHIFT.END}) on ${day.label} (${day.dateString}).`
                    );
                }
            }
        });

        // validate: mỗi specialty phải có bác sĩ ở mỗi clinic mỗi ngày
        Object.entries(specialtyClinicDoctors).forEach(([specialtyName, clinicDoctorsMap]) => {
            const clinicIdsForSpecialty = Object.keys(clinicDoctorsMap).map(Number);
            if (clinicIdsForSpecialty.length !== 2) {
                errors.push(
                    `Specialty "${specialtyName}" must have doctors assigned to both clinics on ${day.label} (${day.dateString}). Found in ${clinicIdsForSpecialty.length} clinic(s).`
                );
            } else {
                [clinic1Id, clinic2Id].forEach((clinicId) => {
                    if (!clinicDoctorsMap[clinicId] || clinicDoctorsMap[clinicId].size === 0) {
                        const clinicName = clinics.find((c) => c.id === clinicId)?.name || `Clinic ${clinicId}`;
                        errors.push(
                            `Specialty "${specialtyName}" must have at least one doctor assigned to ${clinicName} on ${day.label} (${day.dateString}).`
                        );
                    }
                });
            }
        });
    });

    return {
        isValid: errors.length === 0,
        errors,
    };
};

export const transformScheduleData = (
    schedulesByDateAndDoctor: Record<string, Record<number, DoctorDaySchedule>>,
    weekDays: WeekDay[]
): DoctorWeekSchedule[] => {
    // Tập hợp tất cả doctorId xuất hiện trong tuần
    const allDoctorIds = new Set<number>();
    Object.values(schedulesByDateAndDoctor).forEach((daySchedules) => {
        Object.values(daySchedules).forEach((docSchedule) => {
            if (docSchedule.doctor?.id) {
                allDoctorIds.add(docSchedule.doctor.id);
            }
        });
    });

    // Tạo mảng thông tin bác sĩ với lịch theo từng ngày trong tuần
    const allDoctors: DoctorWeekSchedule[] = [];
    allDoctorIds.forEach((doctorId) => {
        const doctor = Object.values(schedulesByDateAndDoctor)
            .flatMap(daySchedules => Object.values(daySchedules))
            .find(ds => ds.doctor?.id === doctorId)?.doctor || null;
        const daySchedules: Record<string, DoctorDaySchedule> = {};
        weekDays.forEach((day) => {
            const daySchedule = schedulesByDateAndDoctor[day.date]?.[doctorId];
            if (daySchedule) {
                daySchedules[day.date] = daySchedule;
            }
        });
        allDoctors.push({
            doctor,
            daySchedules,
        });
    });

    // Sắp xếp danh sách bác sĩ theo tên
    allDoctors.sort((a, b) => {
        const nameA = a.doctor?.fullName || "";
        const nameB = b.doctor?.fullName || "";
        return nameA.localeCompare(nameB);
    });

    return allDoctors;
};
