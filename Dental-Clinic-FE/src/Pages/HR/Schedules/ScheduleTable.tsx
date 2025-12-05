import React from "react";
import { useTranslation } from "react-i18next";

import type { TableSchedule, DaySchedule } from "./utils/scheduleUtils";

type Holiday = {
    id: number;
    date: string;
    name: string;
    isRecurring: boolean;
    duration: number;
    clinicId?: number; // NULL = All clinics
};

type ScheduleTableProps = {
    doctors: any[];
    daysOfWeek: any[];
    clinics: any[];
    tableSchedules: TableSchedule;
    onUpdateShiftClinic: (
        doctorId: number,
        dayKey: string,
        shiftType: "morning" | "afternoon",
        clinicId: number | null
    ) => void;
    holidays?: Holiday[];
};

const ScheduleTable: React.FC<ScheduleTableProps> = ({
    doctors,
    daysOfWeek,
    clinics,
    tableSchedules,
    onUpdateShiftClinic,
    holidays = [],
}) => {
    const { t } = useTranslation("schedules");
    // Sort doctors by name
    const sortedDoctors = [...doctors].sort((a, b) => {
        const nameA = a.fullName || a.name || `Dr. ${a.id}`;
        const nameB = b.fullName || b.name || `Dr. ${b.id}`;
        return nameA.localeCompare(nameB);
    });

    const getDaySchedule = (doctorId: number, dayKey: string): DaySchedule => {
        return tableSchedules[doctorId]?.[dayKey] || {};
    };

    // Check if a clinic has holiday on a specific date
    const isClinicHoliday = (clinicId: number, date: string): boolean => {
        if (!date || holidays.length === 0) return false;

        // Parse date string (expecting YYYY-MM-DD format)
        let checkDate: Date;
        try {
            // Try parsing as ISO format first (YYYY-MM-DD)
            if (date.includes('-') && date.length >= 10) {
                checkDate = new Date(date + 'T00:00:00');
            } else {
                // Fallback: try parsing as locale format
                checkDate = new Date(date);
            }

            // Validate date
            if (isNaN(checkDate.getTime())) {
                console.warn('Invalid date format:', date);
                return false;
            }
        } catch (e) {
            console.warn('Error parsing date:', date, e);
            return false;
        }

        const checkYear = checkDate.getFullYear();
        const checkMonth = checkDate.getMonth();
        const checkDay = checkDate.getDate();
        const checkDateNum = checkYear * 10000 + checkMonth * 100 + checkDay;

        for (const holiday of holidays) {
            if (!holiday.date) continue;

            try {
                // Parse holiday date (assuming format YYYY-MM-DD)
                const holidayDateStr = holiday.date.split('T')[0]; // Remove time if present
                const holidayDate = new Date(holidayDateStr + 'T00:00:00');

                if (isNaN(holidayDate.getTime())) {
                    continue;
                }

                let holidayStart = new Date(holidayDate);

                // Handle recurring holidays
                if (holiday.isRecurring) {
                    holidayStart.setFullYear(checkYear);
                    // Handle leap year case (Feb 29)
                    if (holidayStart.getMonth() !== holidayDate.getMonth() ||
                        holidayStart.getDate() !== holidayDate.getDate()) {
                        continue; // Skip if date doesn't exist in this year
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

                // Compare dates (year, month, day only - ignore time)
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
                console.warn('Error processing holiday:', holiday, e);
                continue;
            }
        }
        return false;
    };

    // Get available clinics for a specific date (filter out clinics on holiday)
    const getAvailableClinics = (date: string) => {
        return clinics.filter(clinic => !isClinicHoliday(clinic.id, date));
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
                <thead>
                    <tr className="bg-blue-50">
                        <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700 sticky left-0 bg-blue-50 z-10">
                            {t("create.table.no")}
                        </th>
                        <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700 sticky left-12 bg-blue-50 z-10 min-w-[200px]">
                            {t("create.table.doctor")}
                        </th>
                        {daysOfWeek.map((day) => (
                            <th
                                key={day.key}
                                className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700 min-w-[150px]"
                            >
                                <div className="flex flex-col">
                                    <span>{day.label}</span>
                                    <span className="text-xs font-normal text-gray-600 mt-1">
                                        {day.dateString}
                                    </span>
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {doctors.length === 0 ? (
                        <tr>
                            <td
                                colSpan={daysOfWeek.length + 2}
                                className="border border-gray-300 px-4 py-8 text-center text-gray-500"
                            >
                                {t("create.table.loadingDoctors")}
                            </td>
                        </tr>
                    ) : (
                        sortedDoctors.map((doctor, index) => {
                            return (
                                <tr key={doctor.id} className="hover:bg-gray-50">
                                    <td className="border border-gray-300 px-4 py-3 text-center font-medium text-gray-700 sticky left-0 bg-white z-10">
                                        {String(index + 1).padStart(2, "0")}
                                    </td>
                                    <td className="border border-gray-300 px-4 py-3 font-medium text-gray-800 sticky left-12 bg-white z-10">
                                        <div>
                                            <div className="font-medium">
                                                {doctor.fullName || doctor.name || `Dr. ${doctor.id}`}
                                            </div>
                                            {/* Danh sách chuyên khoa của bác sĩ */}
                                            {(() => {
                                                const doctorSpecialties: string[] =
                                                    doctor.specialties &&
                                                        Array.isArray(doctor.specialties) &&
                                                        doctor.specialties.length > 0
                                                        ? doctor.specialties
                                                        : doctor.specialty || doctor.specialtyName
                                                            ? [doctor.specialty || doctor.specialtyName]
                                                            : [];
                                                if (doctorSpecialties.length > 0) {
                                                    return (
                                                        <div className="mt-1 flex flex-wrap gap-1">
                                                            {doctorSpecialties.map((spec, idx) => (
                                                                <span
                                                                    key={idx}
                                                                    className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600"
                                                                    title={spec}
                                                                >
                                                                    {spec}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </div>
                                    </td>
                                    {daysOfWeek.map((day) => {
                                        const daySchedule = getDaySchedule(doctor.id, day.key);
                                        return (
                                            <td
                                                key={day.key}
                                                className="border border-gray-300 px-4 py-3"
                                            >
                                                <div className="space-y-2">
                                                    <div className="p-2 bg-blue-50 rounded border border-blue-200">
                                                        <div className="text-xs font-semibold text-blue-700 mb-1">
                                                            {t("create.shifts.morning")} (08:00 - 11:00)
                                                        </div>
                                                        <select
                                                            value={daySchedule.morning?.clinicId || ""}
                                                            onChange={(e) =>
                                                                onUpdateShiftClinic(
                                                                    doctor.id,
                                                                    day.key,
                                                                    "morning",
                                                                    e.target.value ? Number(e.target.value) : null
                                                                )
                                                            }
                                                            className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            aria-label={`${doctor.fullName || doctor.name
                                                                } - ${day.label} - Morning Shift - Clinic`}
                                                            disabled={getAvailableClinics(day.dateStringISO || day.dateString).length === 0}
                                                        >
                                                            <option value="">
                                                                {getAvailableClinics(day.dateStringISO || day.dateString).length === 0
                                                                    ? t("list.off")
                                                                    : t("create.table.selectClinic")}
                                                            </option>
                                                            {getAvailableClinics(day.dateStringISO || day.dateString).map((clinic) => (
                                                                <option key={clinic.id} value={clinic.id}>
                                                                    {clinic.name || `Clinic ${clinic.id}`}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="p-2 bg-orange-50 rounded border border-orange-200">
                                                        <div className="text-xs font-semibold text-orange-700 mb-1">
                                                            {t("create.shifts.afternoon")} (13:00 - 18:00)
                                                        </div>
                                                        <select
                                                            value={daySchedule.afternoon?.clinicId || ""}
                                                            onChange={(e) =>
                                                                onUpdateShiftClinic(
                                                                    doctor.id,
                                                                    day.key,
                                                                    "afternoon",
                                                                    e.target.value ? Number(e.target.value) : null
                                                                )
                                                            }
                                                            className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            aria-label={`${doctor.fullName || doctor.name
                                                                } - ${day.label} - Afternoon Shift - Clinic`}
                                                            disabled={getAvailableClinics(day.dateStringISO || day.dateString).length === 0}
                                                        >
                                                            <option value="">
                                                                {getAvailableClinics(day.dateStringISO || day.dateString).length === 0
                                                                    ? t("list.off")
                                                                    : t("create.table.selectClinic")}
                                                            </option>
                                                            {getAvailableClinics(day.dateStringISO || day.dateString).map((clinic) => (
                                                                <option key={clinic.id} value={clinic.id}>
                                                                    {clinic.name || `Clinic ${clinic.id}`}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default ScheduleTable;
