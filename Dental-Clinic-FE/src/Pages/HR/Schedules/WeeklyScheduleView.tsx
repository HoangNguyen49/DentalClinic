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

type WeekDay = {
  date: string;
  dayName: string;
  dayNum: number;
  isToday: boolean;
};

type WeeklyScheduleViewProps = {
  weekDays: WeekDay[];
  schedulesByDateAndDoctor: Record<string, Record<number, DoctorDaySchedule>>;
  formatTime: (time: string) => string;
};

export default function WeeklyScheduleView({
  weekDays,
  schedulesByDateAndDoctor,
  formatTime,
}: WeeklyScheduleViewProps) {
  const { t } = useTranslation("schedules");
  const navigate = useNavigate();

  if (weekDays.length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center">
        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg mb-2">
          No work schedules for this week
        </p>
        <button
          onClick={() => navigate("/hr/schedules/create")}
          className="mt-4 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
        >
          Create new work schedule
        </button>
      </div>
    );
  }

  // Lấy toàn bộ danh sách bác sĩ duy nhất trong tuần và tạo cấu trúc lịch cho từng bác sĩ  
  type DoctorWeekSchedule = {
    doctor: { id: number; fullName: string } | null;
    daySchedules: Record<string, DoctorDaySchedule>;
  };

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
          {allDoctors.map((doctorWeekSchedule, index) => {
            return (
              <tr key={doctorWeekSchedule.doctor?.id || index} className="hover:bg-gray-50">
                {/* Tên bác sĩ */}
                <td className="border border-gray-300 px-4 py-3 font-medium text-gray-800 sticky left-0 bg-white z-10">
                  {doctorWeekSchedule.doctor?.fullName ||
                    `Doctor #${doctorWeekSchedule.doctor?.id || index}`}
                </td>
                {/* Lặp qua từng ngày để hiển thị lịch làm việc theo ngày */}
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
                          {/* Ca sáng */}
                          {daySchedule.morning ? (
                            <div className="p-2.5 bg-blue-100 rounded-lg shadow-sm border-l-4 border-blue-500 hover:shadow-md transition-shadow">
                              <div className="text-xs font-semibold text-blue-900 mb-1">
                                Morning
                              </div>
                              <div className="text-xs text-blue-700 mb-1 font-medium">
                                {formatTime(daySchedule.morning.startTime)} - {formatTime(daySchedule.morning.endTime)}
                              </div>
                              {daySchedule.morning.clinic && (
                                <div className="text-xs text-blue-900 font-medium truncate mb-0.5">
                                  🏥 {daySchedule.morning.clinic.clinicName}
                                </div>
                              )}
                              {daySchedule.morning.room && (
                                <div className="text-xs text-blue-800 truncate mb-0.5">
                                  🚪 {daySchedule.morning.room.roomName}
                                </div>
                              )}
                              {daySchedule.morning.status && (
                                <div className="text-xs text-blue-600 mt-1">
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                    daySchedule.morning.status.toLowerCase() === 'active' 
                                      ? 'bg-green-200 text-green-800' 
                                      : daySchedule.morning.status.toLowerCase() === 'cancelled'
                                      ? 'bg-red-200 text-red-800'
                                      : 'bg-gray-200 text-gray-800'
                                  }`}>
                                    {daySchedule.morning.status}
                                  </span>
                                </div>
                              )}
                              {daySchedule.morning.note && (
                                <div className="text-xs text-blue-700 mt-1 italic truncate" title={daySchedule.morning.note}>
                                  📝 {daySchedule.morning.note}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 opacity-50">
                              <div className="text-xs font-semibold text-gray-500 mb-1">
                                Morning
                              </div>
                              <div className="text-xs text-gray-400">
                                No sessions
                              </div>
                            </div>
                          )}

                          {/* Ca chiều */}
                          {daySchedule.afternoon ? (
                            <div className="p-2.5 bg-orange-100 rounded-lg shadow-sm border-l-4 border-orange-500 hover:shadow-md transition-shadow">
                              <div className="text-xs font-semibold text-orange-900 mb-1">
                                Afternoon
                              </div>
                              <div className="text-xs text-orange-700 mb-1 font-medium">
                                {formatTime(daySchedule.afternoon.startTime)} - {formatTime(daySchedule.afternoon.endTime)}
                              </div>
                              {daySchedule.afternoon.clinic && (
                                <div className="text-xs text-orange-900 font-medium truncate mb-0.5">
                                  🏥 {daySchedule.afternoon.clinic.clinicName}
                                </div>
                              )}
                              {daySchedule.afternoon.room && (
                                <div className="text-xs text-orange-800 truncate mb-0.5">
                                  🚪 {daySchedule.afternoon.room.roomName}
                                </div>
                              )}
                              {daySchedule.afternoon.status && (
                                <div className="text-xs text-orange-600 mt-1">
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                    daySchedule.afternoon.status.toLowerCase() === 'active' 
                                      ? 'bg-green-200 text-green-800' 
                                      : daySchedule.afternoon.status.toLowerCase() === 'cancelled'
                                      ? 'bg-red-200 text-red-800'
                                      : 'bg-gray-200 text-gray-800'
                                  }`}>
                                    {daySchedule.afternoon.status}
                                  </span>
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
                                Afternoon
                              </div>
                              <div className="text-xs text-gray-400">
                                No sessions
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
        </tbody>
      </table>
    </div>
  );
}
