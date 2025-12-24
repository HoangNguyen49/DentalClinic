import React from "react";
import { useTranslation } from "react-i18next";

import type { TableSchedule, DaySchedule } from "../../../utils/hr/scheduleUtils";
import { isClinicHoliday, isDateHoliday } from "../../../utils/hr/scheduleUtils";

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

    // Get available clinics for a specific date (filter out clinics on holiday and inactive clinics)
    const getAvailableClinics = (date: string) => {
        // First, filter out any clinics that don't have isActive === true
        const activeClinics = clinics.filter(clinic => clinic.isActive === true);
        
        // Then filter out clinics on holiday
        return activeClinics.filter(clinic => !isClinicHoliday(clinic.id, date, holidays));
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
                        {daysOfWeek.map((day) => {
                            const dayDate = day.dateStringISO || day.dateString;
                            const isHoliday = isDateHoliday(dayDate, holidays);
                            return (
                                <th
                                    key={day.key}
                                    className={`border border-gray-300 px-4 py-3 text-center font-semibold min-w-[150px] ${
                                        isHoliday 
                                            ? "bg-red-100 text-red-800 border-red-300" 
                                            : "text-gray-700"
                                    }`}
                                >
                                    <div className="flex flex-col">
                                        <span>{day.label}</span>
                                        <span className={`text-xs font-normal mt-1 ${isHoliday ? "text-red-600" : "text-gray-600"}`}>
                                            {day.dateString}
                                        </span>
                                        {isHoliday && (
                                            <span className="text-xs font-bold text-red-700 mt-1">
                                                (Nghỉ lễ)
                                            </span>
                                        )}
                                    </div>
                                </th>
                            );
                        })}
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
                                        const dayDate = day.dateStringISO || day.dateString;
                                        const availableClinics = getAvailableClinics(dayDate);
                                        const availableClinicIds = availableClinics.map(c => c.id);
                                        const isHoliday = isDateHoliday(dayDate, holidays);
                                        
                                        // Only show selected clinic if it's available (not on holiday)
                                        const morningClinicId = daySchedule.morning?.clinicId;
                                        const afternoonClinicId = daySchedule.afternoon?.clinicId;
                                        const validMorningClinicId = morningClinicId && availableClinicIds.includes(morningClinicId) ? morningClinicId : "";
                                        const validAfternoonClinicId = afternoonClinicId && availableClinicIds.includes(afternoonClinicId) ? afternoonClinicId : "";
                                        
                                        return (
                                            <td
                                                key={day.key}
                                                className={`border px-4 py-3 ${
                                                    isHoliday 
                                                        ? "bg-red-50 border-red-200" 
                                                        : "border-gray-300"
                                                }`}
                                            >
                                                <div className="space-y-2">
                                                    <div className={`p-2 rounded border ${
                                                        isHoliday 
                                                            ? "bg-red-100 border-red-300" 
                                                            : "bg-blue-50 border-blue-200"
                                                    }`}>
                                                        <div className={`text-xs font-semibold mb-1 ${
                                                            isHoliday 
                                                                ? "text-red-700" 
                                                                : "text-blue-700"
                                                        }`}>
                                                            {t("create.shifts.morning")} (08:00 - 11:00)
                                                        </div>
                                                        <select
                                                            value={validMorningClinicId}
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
                                                            disabled={availableClinics.length === 0}
                                                        >
                                                            <option value="">
                                                                {availableClinics.length === 0
                                                                    ? t("list.off")
                                                                    : t("create.table.selectClinic")}
                                                            </option>
                                                            {availableClinics.map((clinic) => (
                                                                <option key={clinic.id} value={clinic.id}>
                                                                    {clinic.name || `Clinic ${clinic.id}`}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className={`p-2 rounded border ${
                                                        isHoliday 
                                                            ? "bg-red-100 border-red-300" 
                                                            : "bg-orange-50 border-orange-200"
                                                    }`}>
                                                        <div className={`text-xs font-semibold mb-1 ${
                                                            isHoliday 
                                                                ? "text-red-700" 
                                                                : "text-orange-700"
                                                        }`}>
                                                            {t("create.shifts.afternoon")} (13:00 - 18:00)
                                                        </div>
                                                        <select
                                                            value={validAfternoonClinicId}
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
                                                            disabled={availableClinics.length === 0}
                                                        >
                                                            <option value="">
                                                                {availableClinics.length === 0
                                                                    ? t("list.off")
                                                                    : t("create.table.selectClinic")}
                                                            </option>
                                                            {availableClinics.map((clinic) => (
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
