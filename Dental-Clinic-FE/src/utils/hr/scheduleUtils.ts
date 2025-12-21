import type { CreateScheduleRequest } from "../../services/hr/hrApi";
import { WORK_HOURS_CONSTANTS } from "../workHoursConstants";

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

// holidayholiday
export const isDateHoliday = (date: string, holidays: any[]): boolean => {
    if (!date || holidays.length === 0) return false;

    // Parse date string (expecting YYYY-MM-DD format)
    let checkDate: Date;
    try {
        if (date.includes('-') && date.length >= 10) {
            checkDate = new Date(date + 'T00:00:00');
        } else {
            checkDate = new Date(date);
        }

        if (isNaN(checkDate.getTime())) {
            return false;
        }
    } catch (e) {
        return false;
    }

    const checkYear = checkDate.getFullYear();
    const checkMonth = checkDate.getMonth();
    const checkDay = checkDate.getDate();
    const checkDateNum = checkYear * 10000 + checkMonth * 100 + checkDay;

    for (const holiday of holidays) {
        if (!holiday.date) continue;

        try {
            const holidayDateStr = holiday.date.split('T')[0];
            const holidayDate = new Date(holidayDateStr + 'T00:00:00');

            if (isNaN(holidayDate.getTime())) {
                continue;
            }

            let holidayStart = new Date(holidayDate);

            // Handle recurring holidays
            if (holiday.isRecurring) {
                holidayStart.setFullYear(checkYear);
                if (holidayStart.getMonth() !== holidayDate.getMonth() ||
                    holidayStart.getDate() !== holidayDate.getDate()) {
                    continue;
                }
            }

            const holidayStartYear = holidayStart.getFullYear();
            const holidayStartMonth = holidayStart.getMonth();
            const holidayStartDay = holidayStart.getDate();

            const holidayEnd = new Date(holidayStart);
            holidayEnd.setDate(holidayEnd.getDate() + (holiday.duration || 1) - 1);
            const holidayEndYear = holidayEnd.getFullYear();
            const holidayEndMonth = holidayEnd.getMonth();
            const holidayEndDay = holidayEnd.getDate();

            const holidayStartNum = holidayStartYear * 10000 + holidayStartMonth * 100 + holidayStartDay;
            const holidayEndNum = holidayEndYear * 10000 + holidayEndMonth * 100 + holidayEndDay;

            // Check if date falls within holiday range
            if (checkDateNum >= holidayStartNum && checkDateNum <= holidayEndNum) {
                return true; // Có holiday (global hoặc clinic-specific)
            }
        } catch (e) {
            continue;
        }
    }
    return false;
};

// Helper function to check if a clinic has holiday on a specific date
export const isClinicHoliday = (clinicId: number, date: string, holidays: any[]): boolean => {
    if (!date || holidays.length === 0) return false;

    // Parse date string (expecting YYYY-MM-DD format)
    let checkDate: Date;
    try {
        if (date.includes('-') && date.length >= 10) {
            checkDate = new Date(date + 'T00:00:00');
        } else {
            checkDate = new Date(date);
        }

        if (isNaN(checkDate.getTime())) {
            return false;
        }
    } catch (e) {
        return false;
    }

    const checkYear = checkDate.getFullYear();
    const checkMonth = checkDate.getMonth();
    const checkDay = checkDate.getDate();
    const checkDateNum = checkYear * 10000 + checkMonth * 100 + checkDay;

    for (const holiday of holidays) {
        if (!holiday.date) continue;

        try {
            const holidayDateStr = holiday.date.split('T')[0];
            const holidayDate = new Date(holidayDateStr + 'T00:00:00');

            if (isNaN(holidayDate.getTime())) {
                continue;
            }

            let holidayStart = new Date(holidayDate);

            // Handle recurring holidays
            if (holiday.isRecurring) {
                holidayStart.setFullYear(checkYear);
                if (holidayStart.getMonth() !== holidayDate.getMonth() ||
                    holidayStart.getDate() !== holidayDate.getDate()) {
                    continue;
                }
            }

            const holidayStartYear = holidayStart.getFullYear();
            const holidayStartMonth = holidayStart.getMonth();
            const holidayStartDay = holidayStart.getDate();

            const holidayEnd = new Date(holidayStart);
            holidayEnd.setDate(holidayEnd.getDate() + (holiday.duration || 1) - 1);
            const holidayEndYear = holidayEnd.getFullYear();
            const holidayEndMonth = holidayEnd.getMonth();
            const holidayEndDay = holidayEnd.getDate();

            const holidayStartNum = holidayStartYear * 10000 + holidayStartMonth * 100 + holidayStartDay;
            const holidayEndNum = holidayEndYear * 10000 + holidayEndMonth * 100 + holidayEndDay;

            // Check if date falls within holiday range
            if (checkDateNum >= holidayStartNum && checkDateNum <= holidayEndNum) {
                // Global holiday (clinicId is null/undefined) applies to all clinics
                if (holiday.clinicId == null || holiday.clinicId === undefined) {
                    return true;
                }
                // Specific clinic holiday
                if (holiday.clinicId === clinicId) {
                    return true;
                }
            }
        } catch (e) {
            continue;
        }
    }
    return false;
};

export const validateScheduleFrontend = (
    tableSchedules: TableSchedule,
    daysOfWeek: any[],
    clinics: any[],
    doctors: any[],
    holidays: any[] = []
): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const clinicIds = clinics.map((c) => c.id).sort();
    if (clinicIds.length !== 2) {
        errors.push(`There must be exactly 2 clinics but got ${clinics.length}.`);
        return { isValid: false, errors };
    }

    daysOfWeek.forEach((day) => {
        // Check for holidays first - if a clinic is on holiday, it should not be assigned
        const dayDate = day.dateStringISO || day.dateString;
        
        // Get available clinics for this day (not on holiday)
        const availableClinicIds = clinics
            .filter(clinic => !isClinicHoliday(clinic.id, dayDate, holidays))
            .map(clinic => clinic.id);
        
        if (availableClinicIds.length === 0) {
            errors.push(
                `Cannot create schedule on ${day.label} (${day.dateString}) - all clinics are on holiday.`
            );
            return;
        }

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
                // Check if clinic is on holiday
                if (isClinicHoliday(clinicId, dayDate, holidays)) {
                    const clinicName = clinics.find((c) => c.id === clinicId)?.name || `Clinic ${clinicId}`;
                    const holidayName = holidays.find((h: any) => {
                        if (!h.date) return false;
                        const hDate = new Date(h.date.split('T')[0] + 'T00:00:00');
                        const dayDateObj = new Date(dayDate + 'T00:00:00');
                        if (h.isRecurring) {
                            hDate.setFullYear(dayDateObj.getFullYear());
                        }
                        return hDate.toDateString() === dayDateObj.toDateString() && 
                               (h.clinicId == null || h.clinicId === clinicId);
                    })?.name || "Holiday";
                    errors.push(
                        `Cannot assign doctors to ${clinicName} on ${day.label} (${day.dateString}) - it is a holiday (${holidayName}).`
                    );
                    return;
                }
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
                // Check if clinic is on holiday
                if (isClinicHoliday(clinicId, dayDate, holidays)) {
                    const clinicName = clinics.find((c) => c.id === clinicId)?.name || `Clinic ${clinicId}`;
                    const holidayName = holidays.find((h: any) => {
                        if (!h.date) return false;
                        const hDate = new Date(h.date.split('T')[0] + 'T00:00:00');
                        const dayDateObj = new Date(dayDate + 'T00:00:00');
                        if (h.isRecurring) {
                            hDate.setFullYear(dayDateObj.getFullYear());
                        }
                        return hDate.toDateString() === dayDateObj.toDateString() && 
                               (h.clinicId == null || h.clinicId === clinicId);
                    })?.name || "Holiday";
                    errors.push(
                        `Cannot assign doctors to ${clinicName} on ${day.label} (${day.dateString}) - it is a holiday (${holidayName}).`
                    );
                    return;
                }
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

        // validate: phải có đúng 2 clinic hoạt động mỗi ngày (chỉ tính các clinic không nghỉ)
        const workingClinicIds = Object.keys(clinicShifts)
            .map(Number)
            .filter(clinicId => availableClinicIds.includes(clinicId));
        
        if (workingClinicIds.length === 0) {
            return; // No assignments, skip validation for this day
        }
        
        // Check if we have exactly 2 available clinics (not on holiday)
        // If less than 2 clinics are available, validation will be adjusted accordingly
        
        if (workingClinicIds.length !== 2 && availableClinicIds.length >= 2) {
            if (workingClinicIds.length === 1) {
                const clinicName = clinics.find((c) => c.id === workingClinicIds[0])?.name || `Clinic ${workingClinicIds[0]}`;
                const missingClinicId = availableClinicIds.find(id => !workingClinicIds.includes(id));
                const missingClinicName = missingClinicId ? 
                    (clinics.find((c) => c.id === missingClinicId)?.name || `Clinic ${missingClinicId}`) : 
                    "another clinic";
                errors.push(
                    `Only 1 clinic (${clinicName}) has assignments on ${day.label} (${day.dateString}). Both available clinics (${clinicName} and ${missingClinicName}) must have assignments.`
                );
            } else {
                errors.push(
                    `Too many clinics (${workingClinicIds.length}) have assignments on ${day.label} (${day.dateString}). Exactly 2 clinics must have assignments.`
                );
            }
            return;
        }

        // validate: mỗi clinic available (không nghỉ) phải có bác sĩ cả sáng và chiều
        availableClinicIds.forEach((clinicId) => {
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

        // validate: mỗi specialty phải có bác sĩ ở mỗi clinic available mỗi ngày
        Object.entries(specialtyClinicDoctors).forEach(([specialtyName, clinicDoctorsMap]) => {
            const clinicIdsForSpecialty = Object.keys(clinicDoctorsMap)
                .map(Number)
                .filter(clinicId => availableClinicIds.includes(clinicId));
            
            if (clinicIdsForSpecialty.length !== availableClinicIds.length) {
                errors.push(
                    `Specialty "${specialtyName}" must have doctors assigned to all available clinics (${availableClinicIds.length}) on ${day.label} (${day.dateString}). Found in ${clinicIdsForSpecialty.length} clinic(s).`
                );
            } else {
                availableClinicIds.forEach((clinicId) => {
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

