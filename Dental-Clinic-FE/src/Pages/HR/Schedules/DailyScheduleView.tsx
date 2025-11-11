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

type DailyScheduleViewProps = {
  selectedDate: string;
  selectedDayInfo: {
    date: string;
    dayName: string;
    dayNum: number;
    isToday: boolean;
  } | null;
  schedulesByDate: Record<string, DoctorDaySchedule[]>;
  doctorDepartmentMap: Map<number, string>;
  formatTime: (time: string) => string;
};

export default function DailyScheduleView({
  selectedDate,
  selectedDayInfo,
  schedulesByDate,
  doctorDepartmentMap,
  formatTime,
}: DailyScheduleViewProps) {
  const { t } = useTranslation("schedules");
  const navigate = useNavigate();

  // Nếu chưa chọn ngày hợp lệ hoặc không có thông tin ngày
  if (!selectedDayInfo) {
    return (
      <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center">
        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg mb-2">
          {t("list.noSchedulesForDate")}
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

  const doctorSchedules = schedulesByDate[selectedDate] || [];
  const isWeekend =
    selectedDayInfo.dayName === t("list.days.sat") ||
    selectedDayInfo.dayName === t("list.days.sun");

  // Nếu không có lịch cho ngày đã chọn
  if (doctorSchedules.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full border-collapse min-w-[800px]">
          <thead>
            <tr>
              <th className="border border-gray-300 px-4 py-3 bg-gray-50 font-semibold text-gray-800 sticky left-0 z-20">
                {t("create.table.doctor")}
              </th>
              <th className="border border-gray-300 px-4 py-3 bg-gray-50 font-semibold text-gray-800">
                {t("list.shifts.morning")}
              </th>
              <th className="border border-gray-300 px-4 py-3 bg-gray-50 font-semibold text-gray-800">
                {t("list.shifts.afternoon")}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                colSpan={3}
                className="border border-gray-300 px-4 py-12 text-center text-gray-400"
              >
                {isWeekend
                  ? t("list.noSessions")
                  : t("list.noSchedulesForDate")}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  // Nhóm bác sĩ theo phòng ban (department)
  type DoctorDayScheduleWithDept = DoctorDaySchedule & { departmentName: string };
  const doctorsByDepartment: Record<string, DoctorDayScheduleWithDept[]> = {};

  doctorSchedules.forEach((docSchedule) => {
    const doctorId = docSchedule.doctor?.id;
    const deptName =
      doctorId
        ? doctorDepartmentMap.get(doctorId) || t("create.table.uncategorized")
        : t("create.table.uncategorized");

    if (!doctorsByDepartment[deptName]) {
      doctorsByDepartment[deptName] = [];
    }

    doctorsByDepartment[deptName].push({
      ...docSchedule,
      departmentName: deptName,
    });
  });

  // Sắp xếp lại các phòng ban theo alphabet
  const departmentNames = Object.keys(doctorsByDepartment).sort();

  // Sắp xếp lại bác sĩ trong từng phòng ban theo tên
  departmentNames.forEach((deptName) => {
    doctorsByDepartment[deptName].sort((a, b) => {
      const nameA = a.doctor?.fullName || "";
      const nameB = b.doctor?.fullName || "";
      return nameA.localeCompare(nameB);
    });
  });

  // Hiển thị bảng lịch làm việc theo ngày
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
      <table className="w-full border-collapse min-w-[800px]">
        <thead>
          <tr>
            <th className="border border-gray-300 px-4 py-3 bg-gray-50 font-semibold text-gray-800 sticky left-0 z-20">
              {t("create.table.doctor")}
            </th>
            <th className="border border-gray-300 px-4 py-3 bg-gray-50 font-semibold text-gray-800">
              {t("list.shifts.morning")}
            </th>
            <th className="border border-gray-300 px-4 py-3 bg-gray-50 font-semibold text-gray-800">
              {t("list.shifts.afternoon")}
            </th>
          </tr>
        </thead>
        <tbody>
          {departmentNames.map((deptName) => {
            const deptDoctors = doctorsByDepartment[deptName];

            return (
              <React.Fragment key={deptName}>
                {/* Hiển thị header của phòng ban */}
                <tr className="bg-gray-100">
                  <td
                    colSpan={3}
                    className="border border-gray-300 px-4 py-2 font-semibold text-gray-800 bg-gray-100"
                  >
                    {deptName} ({deptDoctors.length} {t("create.table.doctors")})
                  </td>
                </tr>
                {/* Hiển thị các dòng bác sĩ trong phòng ban đó */}
                {deptDoctors.map((docSchedule, index) => {
                  return (
                    <tr
                      key={docSchedule.doctor?.id || index}
                      className="hover:bg-gray-50"
                    >
                      {/* Hiển thị tên bác sĩ */}
                      <td className="border border-gray-300 px-4 py-3 font-medium text-gray-800 sticky left-0 bg-white z-10">
                        {docSchedule.doctor?.fullName ||
                          `${t("common.doctor")} #${docSchedule.doctor?.id || index}`}
                      </td>
                      {/* Hiển thị ca sáng */}
                      <td className="border border-gray-300 px-4 py-3">
                        {docSchedule.morning ? (
                          <div className="p-2.5 bg-blue-100 rounded-lg shadow-sm border-l-4 border-blue-500">
                            <div className="text-xs font-semibold text-blue-900 mb-1">
                              {formatTime(
                                docSchedule.morning.startTime
                              )}{" "}
                              -{" "}
                              {formatTime(
                                docSchedule.morning.endTime
                              )}
                            </div>
                            {docSchedule.morning.clinic && (
                              <div className="text-xs text-blue-900 font-medium truncate">
                                {docSchedule.morning.clinic.clinicName}
                              </div>
                            )}
                            {docSchedule.morning.note && (
                              <div className="text-xs text-blue-700 mt-1 italic truncate" title={docSchedule.morning.note}>
                                 {docSchedule.morning.note}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 opacity-50">
                            <div className="text-xs text-gray-400">
                              {t("list.noSessions")}
                            </div>
                          </div>
                        )}
                      </td>
                      {/* Hiển thị ca chiều */}
                      <td className="border border-gray-300 px-4 py-3">
                        {docSchedule.afternoon ? (
                          <div className="p-2.5 bg-orange-100 rounded-lg shadow-sm border-l-4 border-orange-500">
                            <div className="text-xs font-semibold text-orange-900 mb-1">
                              {formatTime(
                                docSchedule.afternoon.startTime
                              )}{" "}
                              -{" "}
                              {formatTime(
                                docSchedule.afternoon.endTime
                              )}
                            </div>
                            {docSchedule.afternoon.clinic && (
                              <div className="text-xs text-orange-900 font-medium truncate">
                                {docSchedule.afternoon.clinic.clinicName}
                              </div>
                            )}
                            {docSchedule.afternoon.note && (
                              <div className="text-xs text-orange-700 mt-1 italic truncate" title={docSchedule.afternoon.note}>
                                📝 {docSchedule.afternoon.note}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 opacity-50">
                            <div className="text-xs text-gray-400">
                              {t("list.noSessions")}
                            </div>
                          </div>
                        )}
                      </td>
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
