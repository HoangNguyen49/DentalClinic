import { Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

type HrDocDto = {
  id: number;
  fullName: string;
};

type RoomResponse = {
  id: number;
  roomName: string;
  clinicId?: number;
  clinicName?: string;
};

type ScheduleItem = {
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
  formatTime: (time: string) => string;
};

export default function DailyScheduleView({
  selectedDate,
  selectedDayInfo,
  schedulesByDate,
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

  // Lấy danh sách lịch bác sĩ theo ngày đã chọn
  const doctorSchedules = schedulesByDate[selectedDate] || [];
  const isWeekend =
    selectedDayInfo.dayName === "Saturday" ||
    selectedDayInfo.dayName === "Sunday";

  // Nếu không có lịch làm việc trong ngày đã chọn
  if (doctorSchedules.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full border-collapse min-w-[800px]">
          <thead>
            <tr>
              <th className="border border-gray-300 px-4 py-3 bg-gray-50 font-semibold text-gray-800 sticky left-0 z-20">
                {t("common.doctor")}
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

  // Sắp xếp lịch bác sĩ theo tên
  const sortedDoctorSchedules = [...doctorSchedules].sort((a, b) => {
    const nameA = a.doctor?.fullName || "";
    const nameB = b.doctor?.fullName || "";
    return nameA.localeCompare(nameB);
  });

  // Hiển thị bảng lịch làm việc trong ngày
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
      <table className="w-full border-collapse min-w-[800px]">
        <thead>
          <tr>
            <th className="border border-gray-300 px-4 py-3 bg-gray-50 font-semibold text-gray-800 sticky left-0 z-20">
              {t("common.doctor")}
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
          {sortedDoctorSchedules.map((docSchedule, index) => {
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
                    (() => {
                      const isCancelled = docSchedule.morning.status?.toLowerCase() === 'cancelled';
                      const bgColor = isCancelled ? 'bg-red-50' : 'bg-blue-100';
                      const borderColor = isCancelled ? 'border-red-400' : 'border-blue-500';
                      const textColor = isCancelled ? 'text-red-900' : 'text-blue-900';
                      const clinicColor = isCancelled ? 'text-red-800' : 'text-blue-900';
                      const roomColor = isCancelled ? 'text-red-700' : 'text-blue-800';
                      const statusColor = isCancelled ? 'text-red-700' : 'text-blue-600';
                      const noteColor = isCancelled ? 'text-red-700' : 'text-blue-700';
                      return (
                        <div 
                          className={`p-2.5 ${bgColor} rounded-lg shadow-sm border-l-4 ${borderColor} ${isCancelled ? 'opacity-75' : ''}`}
                          title={isCancelled ? t("list.scheduleCancelledDueToHoliday", "Lịch đã bị hủy do ngày nghỉ lễ") : undefined}
                        >
                          <div className={`text-xs font-semibold ${textColor} mb-1 flex items-center gap-1`}>
                            {formatTime(
                              docSchedule.morning.startTime
                            )}{" "}
                            -{" "}
                            {formatTime(
                              docSchedule.morning.endTime
                            )}
                            {isCancelled && (
                              <span className="text-[10px]" title={t("list.scheduleCancelledDueToHoliday", "Lịch đã bị hủy do ngày nghỉ lễ")}>
                                🚫
                              </span>
                            )}
                          </div>
                          {docSchedule.morning.clinic && (
                            <div className={`text-xs ${clinicColor} font-medium truncate mb-0.5`}>
                              🏥 {docSchedule.morning.clinic.clinicName}
                            </div>
                          )}
                          {docSchedule.morning.room && (
                            <div className={`text-xs ${roomColor} truncate mb-0.5`}>
                              {docSchedule.morning.room.roomName}
                            </div>
                          )}
                          {docSchedule.morning.status && (
                            <div className={`text-xs ${statusColor} mt-1`}>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${docSchedule.morning.status.toLowerCase() === 'active'
                                ? 'bg-green-200 text-green-800'
                                : docSchedule.morning.status.toLowerCase() === 'cancelled'
                                  ? 'bg-red-300 text-red-900 border border-red-400'
                                  : 'bg-gray-200 text-gray-800'
                                }`}>
                                {docSchedule.morning.status}
                              </span>
                            </div>
                          )}
                          {docSchedule.morning.note && (
                            <div className={`text-xs ${noteColor} mt-1 italic truncate`} title={docSchedule.morning.note}>
                              {docSchedule.morning.note}
                            </div>
                          )}
                        </div>
                      );
                    })()
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
                    (() => {
                      const isCancelled = docSchedule.afternoon.status?.toLowerCase() === 'cancelled';
                      const bgColor = isCancelled ? 'bg-red-50' : 'bg-orange-100';
                      const borderColor = isCancelled ? 'border-red-400' : 'border-orange-500';
                      const textColor = isCancelled ? 'text-red-900' : 'text-orange-900';
                      const clinicColor = isCancelled ? 'text-red-800' : 'text-orange-900';
                      const roomColor = isCancelled ? 'text-red-700' : 'text-orange-800';
                      const statusColor = isCancelled ? 'text-red-700' : 'text-orange-600';
                      const noteColor = isCancelled ? 'text-red-700' : 'text-orange-700';
                      return (
                        <div 
                          className={`p-2.5 ${bgColor} rounded-lg shadow-sm border-l-4 ${borderColor} ${isCancelled ? 'opacity-75' : ''}`}
                          title={isCancelled ? t("list.scheduleCancelledDueToHoliday", "Lịch đã bị hủy do ngày nghỉ lễ") : undefined}
                        >
                          <div className={`text-xs font-semibold ${textColor} mb-1 flex items-center gap-1`}>
                            {formatTime(
                              docSchedule.afternoon.startTime
                            )}{" "}
                            -{" "}
                            {formatTime(
                              docSchedule.afternoon.endTime
                            )}
                            {isCancelled && (
                              <span className="text-[10px]" title={t("list.scheduleCancelledDueToHoliday", "Lịch đã bị hủy do ngày nghỉ lễ")}>
                                🚫
                              </span>
                            )}
                          </div>
                          {docSchedule.afternoon.clinic && (
                            <div className={`text-xs ${clinicColor} font-medium truncate mb-0.5`}>
                              🏥 {docSchedule.afternoon.clinic.clinicName}
                            </div>
                          )}
                          {docSchedule.afternoon.room && (
                            <div className={`text-xs ${roomColor} truncate mb-0.5`}>
                              {docSchedule.afternoon.room.roomName}
                            </div>
                          )}
                          {docSchedule.afternoon.status && (
                            <div className={`text-xs ${statusColor} mt-1`}>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${docSchedule.afternoon.status.toLowerCase() === 'active'
                                ? 'bg-green-200 text-green-800'
                                : docSchedule.afternoon.status.toLowerCase() === 'cancelled'
                                  ? 'bg-red-300 text-red-900 border border-red-400'
                                  : 'bg-gray-200 text-gray-800'
                                }`}>
                                {docSchedule.afternoon.status}
                              </span>
                            </div>
                          )}
                          {docSchedule.afternoon.note && (
                            <div className={`text-xs ${noteColor} mt-1 italic truncate`} title={docSchedule.afternoon.note}>
                              {docSchedule.afternoon.note}
                            </div>
                          )}
                        </div>
                      );
                    })()
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
        </tbody>
      </table>
    </div>
  );
}
