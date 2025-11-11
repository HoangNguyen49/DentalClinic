import React from "react";
import { Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

type HrDocDto = {
  id: number;
  fullName: string;
};

type ScheduleItem = {
  id: number;
  doctor: HrDocDto | null;
  clinic: any;
  workDate: string;
  startTime: string;
  endTime: string;
  note?: string;
};

type DoctorDaySchedule = {
  doctor: HrDocDto | null;
  morning?: ScheduleItem;
  afternoon?: ScheduleItem;
};

type WeekDay = {
  date: string;
  dayName: string;
  dayNum: number;
  isToday: boolean;
};

type WeeklyScheduleViewProps = {
  weekDays: WeekDay[];
  schedulesByDateAndDoctor: Record<string, Record<number, DoctorDaySchedule>>;
  doctorDepartmentMap: Map<number, string>;
  formatTime: (time: string) => string;
};

export default function WeeklyScheduleView({
  weekDays,
  schedulesByDateAndDoctor,
  doctorDepartmentMap,
  formatTime,
}: WeeklyScheduleViewProps) {
  const { t } = useTranslation("schedules");
  const navigate = useNavigate();

  if (weekDays.length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center">
        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg mb-2">
          {t("list.noSchedules")}
        </p>
        <button
          onClick={() => navigate("/hr/schedules/create")}
          className="mt-4 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
        >
          {t("list.createNewSchedule")}
        </button>
      </div>
    );
  }

  // Tạo cấu trúc nhóm lịch theo khoa/phòng ban và bác sĩ
  type DoctorWeekSchedule = {
    doctor: { id: number; fullName: string } | null;
    daySchedules: Record<string, DoctorDaySchedule>;
  };

  // Lấy danh sách tất cả bác sĩ từ các ngày được truyền vào, loại bỏ trùng lặp
  const allDoctorIds = new Set<number>();
  Object.values(schedulesByDateAndDoctor).forEach((daySchedules) => {
    Object.values(daySchedules).forEach((docSchedule) => {
      if (docSchedule.doctor?.id) {
        allDoctorIds.add(docSchedule.doctor.id);
      }
    });
  });

  // Nhóm bác sĩ theo department
  const doctorsByDepartment: Record<string, DoctorWeekSchedule[]> = {};

  allDoctorIds.forEach((doctorId) => {
    const deptName = doctorDepartmentMap.get(doctorId) || t("create.table.uncategorized");
    const doctor = Object.values(schedulesByDateAndDoctor)
      .flatMap(daySchedules => Object.values(daySchedules))
      .find(ds => ds.doctor?.id === doctorId)?.doctor || null;

    if (!doctorsByDepartment[deptName]) {
      doctorsByDepartment[deptName] = [];
    }

    // Kiểm tra trùng lặp bác sĩ trong department
    const existingDoctor = doctorsByDepartment[deptName].find(
      d => d.doctor?.id === doctorId
    );

    if (!existingDoctor) {
      // Duyệt từng ngày trong tuần để lấy lịch làm việc của bác sĩ này từng ngày
      const daySchedules: Record<string, DoctorDaySchedule> = {};
      weekDays.forEach((day) => {
        const daySchedule = schedulesByDateAndDoctor[day.date]?.[doctorId];
        if (daySchedule) {
          daySchedules[day.date] = daySchedule;
        }
      });

      doctorsByDepartment[deptName].push({
        doctor,
        daySchedules,
      });
    }
  });

  // Lấy danh sách khoa/phòng ban (department) và sort tăng dần alphabet
  const departmentNames = Object.keys(doctorsByDepartment).sort();

  // Sắp xếp bác sĩ theo tên từng department
  departmentNames.forEach(deptName => {
    doctorsByDepartment[deptName].sort((a, b) => {
      const nameA = a.doctor?.fullName || "";
      const nameB = b.doctor?.fullName || "";
      return nameA.localeCompare(nameB);
    });
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
      <table className="w-full border-collapse min-w-[1200px]">
        <thead>
          <tr>
            <th className="border border-gray-300 px-4 py-3 bg-gray-50 font-semibold text-gray-800 sticky left-0 z-20">
              Doctor
            </th>
            {weekDays.map((day) => (
              <th
                key={day.date}
                className={`border border-gray-300 px-4 py-3 bg-gray-50 font-semibold text-gray-800 ${
                  day.isToday ? "bg-purple-50 text-purple-700" : ""
                }`}
              >
                <div className="text-center">
                  <div className="text-xs font-semibold text-gray-500 mb-1">
                    {day.dayName}
                  </div>
                  <div className="text-sm font-medium">
                    {day.dayNum}
                  </div>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {departmentNames.map((deptName, deptIndex) => {
            const deptDoctors = doctorsByDepartment[deptName];

            // Tính global index cho department, trường hợp cần dùng
            let globalIndex = 0;
            for (let i = 0; i < deptIndex; i++) {
              globalIndex += doctorsByDepartment[departmentNames[i]].length;
            }

            return (
              <React.Fragment key={deptName}>
                {/* Department Header Row */}
                <tr className="bg-gray-100">
                  <td
                    colSpan={weekDays.length + 1}
                    className="border border-gray-300 px-4 py-2 font-semibold text-gray-800 bg-gray-100"
                  >
                    {deptName} ({deptDoctors.length} Doctors)
                  </td>
                </tr>
                {/* Doctor Rows */}
                {deptDoctors.map((doctorWeekSchedule, localIndex) => {
                  return (
                    <tr key={doctorWeekSchedule.doctor?.id || localIndex} className="hover:bg-gray-50">
                      {/* Tên bác sĩ */}
                      <td className="border border-gray-300 px-4 py-3 font-medium text-gray-800 sticky left-0 bg-white z-10">
                        {doctorWeekSchedule.doctor?.fullName ||
                          `Doctor #${doctorWeekSchedule.doctor?.id || localIndex}`}
                      </td>
                      {/* Duyệt qua các ngày trong tuần */}
                      {weekDays.map((day) => {
                        const daySchedule = doctorWeekSchedule.daySchedules[day.date];
                        const isWeekend = day.dayName === t("list.days.sat") || day.dayName === t("list.days.sun");

                        return (
                          <td
                            key={day.date}
                            className={`border border-gray-300 px-4 py-3 ${
                              day.isToday ? "bg-purple-50" : ""
                            }`}
                          >
                            {!daySchedule && isWeekend ? (
                              <div className="text-gray-400 text-sm text-center py-4">
                                No sessions
                              </div>
                            ) : !daySchedule ? (
                              <div className="min-h-[80px]"></div>
                            ) : (
                              <div className="space-y-2 min-h-[80px]">
                                {/* Hiển thị ca sáng */}
                                {daySchedule.morning ? (
                                  <div className="p-2.5 bg-blue-100 rounded-lg shadow-sm border-l-4 border-blue-500 hover:shadow-md transition-shadow">
                                    <div className="text-xs font-semibold text-blue-900 mb-1">
                                      {t("list.shifts.morning")}
                                    </div>
                                    <div className="text-xs text-blue-700 mb-1">
                                      {formatTime(daySchedule.morning.startTime)} - {formatTime(daySchedule.morning.endTime)}
                                    </div>
                                    {daySchedule.morning.clinic && (
                                      <div className="text-xs text-blue-900 font-medium truncate">
                                        {daySchedule.morning.clinic.clinicName}
                                      </div>
                                    )}
                                    {daySchedule.morning.note && (
                                      <div className="text-xs text-blue-700 mt-1 italic truncate" title={daySchedule.morning.note}>
                                         {daySchedule.morning.note}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 opacity-50">
                                    <div className="text-xs font-semibold text-gray-500 mb-1">
                                      {t("list.shifts.morning")}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                      {t("list.noSessions")}
                                    </div>
                                  </div>
                                )}

                                {/* Hiển thị ca chiều */}
                                {daySchedule.afternoon ? (
                                  <div className="p-2.5 bg-orange-100 rounded-lg shadow-sm border-l-4 border-orange-500 hover:shadow-md transition-shadow">
                                    <div className="text-xs font-semibold text-orange-900 mb-1">
                                      {t("list.shifts.afternoon")}
                                    </div>
                                    <div className="text-xs text-orange-700 mb-1">
                                      {formatTime(daySchedule.afternoon.startTime)} - {formatTime(daySchedule.afternoon.endTime)}
                                    </div>
                                    {daySchedule.afternoon.clinic && (
                                      <div className="text-xs text-orange-900 font-medium truncate">
                                        {daySchedule.afternoon.clinic.clinicName}
                                      </div>
                                    )}
                                    {daySchedule.afternoon.note && (
                                      <div className="text-xs text-orange-700 mt-1 italic truncate" title={daySchedule.afternoon.note}>
                                        📝 {daySchedule.afternoon.note}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 opacity-50">
                                    <div className="text-xs font-semibold text-gray-500 mb-1">
                                      {t("list.shifts.afternoon")}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                      {t("list.noSessions")}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
