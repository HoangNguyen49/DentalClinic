import React from "react";

type DaySchedule = {
    morning?: {
        clinicId: number;
    };
    afternoon?: {
        clinicId: number;
    };
};

type TableSchedule = {
    [doctorId: number]: {
        [dayKey: string]: DaySchedule;
    };
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
};

const ScheduleTable: React.FC<ScheduleTableProps> = ({
    doctors,
    daysOfWeek,
    clinics,
    tableSchedules,
    onUpdateShiftClinic,
}) => {
    // Sort doctors by name
    const sortedDoctors = [...doctors].sort((a, b) => {
        const nameA = a.fullName || a.name || `Dr. ${a.id}`;
        const nameB = b.fullName || b.name || `Dr. ${b.id}`;
        return nameA.localeCompare(nameB);
    });

    const getDaySchedule = (doctorId: number, dayKey: string): DaySchedule => {
        return tableSchedules[doctorId]?.[dayKey] || {};
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
                <thead>
                    <tr className="bg-blue-50">
                        <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700 sticky left-0 bg-blue-50 z-10">
                            No.
                        </th>
                        <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700 sticky left-12 bg-blue-50 z-10 min-w-[200px]">
                            Doctor
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
                                Loading list of doctors...
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
                                                            Morning (08:00 - 11:00)
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
                                                        >
                                                            <option value="">Select clinic...</option>
                                                            {clinics.map((clinic) => (
                                                                <option key={clinic.id} value={clinic.id}>
                                                                    {clinic.name || `Clinic ${clinic.id}`}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="p-2 bg-orange-50 rounded border border-orange-200">
                                                        <div className="text-xs font-semibold text-orange-700 mb-1">
                                                            Afternoon (13:00 - 18:00)
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
                                                        >
                                                            <option value="">Select clinic...</option>
                                                            {clinics.map((clinic) => (
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
