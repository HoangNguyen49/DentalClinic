import { Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { transformScheduleData } from "../../../utils/hr/scheduleUtils";
import type { DoctorDaySchedule, WeekDay } from "../../../utils/hr/scheduleUtils";
import ScheduleShiftCard from "../../../components/hr/ScheduleShiftCard";

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

  // Use utility function to transform data
  const allDoctors = transformScheduleData(schedulesByDateAndDoctor, weekDays);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
      <table className="w-full border-collapse min-w-[1200px]">
        <thead>
          <tr>
            <th className="border border-gray-300 px-4 py-3 bg-gray-50 font-semibold text-gray-800 sticky left-0 z-20">
              {t("common.doctor")}
            </th>
            {weekDays.map((day) => (
              <th
                key={day.date}
                className={`border border-gray-300 px-4 py-3 bg-gray-50 font-semibold text-gray-800 ${day.isToday ? "bg-purple-50 text-purple-700" : ""
                  }`}
              >
                <div className="text-center">
                  <div className="text-xs font-semibold text-gray-500 mb-1">
                    {day.dayName}
                  </div>
                  <div className="text-sm font-medium">{day.dayNum}</div>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {allDoctors.map((doctorWeekSchedule, index) => {
            return (
              <tr
                key={doctorWeekSchedule.doctor?.id || index}
                className="hover:bg-gray-50"
              >
                {/* Doctor Name */}
                <td className="border border-gray-300 px-4 py-3 font-medium text-gray-800 sticky left-0 bg-white z-10">
                  {doctorWeekSchedule.doctor?.fullName ||
                    `${t("common.doctor")} #${doctorWeekSchedule.doctor?.id || index}`}
                </td>
                {/* Daily Schedules */}
                {weekDays.map((day) => {
                  const daySchedule = doctorWeekSchedule.daySchedules[day.date];
                  const isWeekend =
                    day.dayName === t("list.days.sat") ||
                    day.dayName === t("list.days.sun");

                  return (
                    <td
                      key={day.date}
                      className={`border border-gray-300 px-4 py-3 ${day.isToday ? "bg-purple-50" : ""
                        }`}
                    >
                      {!daySchedule && isWeekend ? (
                        <div className="text-gray-400 text-sm text-center py-4">
                          {t("list.noSessions")}
                        </div>
                      ) : !daySchedule ? (
                        <div className="min-h-[80px]"></div>
                      ) : (
                        <div className="space-y-2 min-h-[80px]">
                          {/* Morning Shift */}
                          <ScheduleShiftCard
                            shiftType="morning"
                            shiftLabel={t("list.shifts.morning")}
                            scheduleItem={daySchedule.morning}
                            formatTime={formatTime}
                          />

                          {/* Afternoon Shift */}
                          <ScheduleShiftCard
                            shiftType="afternoon"
                            shiftLabel={t("list.shifts.afternoon")}
                            scheduleItem={daySchedule.afternoon}
                            formatTime={formatTime}
                          />
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
