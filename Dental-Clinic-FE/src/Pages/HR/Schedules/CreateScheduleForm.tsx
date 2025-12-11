import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Check, X, User, CalendarX, Info } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTranslation } from "react-i18next";
import ScheduleTable from "./ScheduleTable";
import { getNextMonday, getDaysOfWeek } from "../../../utils/dateUtils";
import { type TableSchedule, isClinicHoliday } from "../../../utils/hr/scheduleUtils";
import { useScheduleData } from "../../../hooks/hr/useScheduleData";
import { useScheduleActions } from "../../../hooks/hr/useScheduleActions";

function CreateScheduleForm() {
  const { t, i18n } = useTranslation("schedules");
  const navigate = useNavigate();

  const [weekStart, setWeekStart] = useState<string>(getNextMonday());
  const [tableSchedules, setTableSchedules] = useState<TableSchedule>({});
  const [note, setNote] = useState<string>("");
  const [aiDescription, setAiDescription] = useState<string>("");

  const { doctors, clinics, holidays, approvedLeaves } = useScheduleData(weekStart);
  const daysOfWeek = getDaysOfWeek(weekStart, i18n.language === "vi" ? "vi-VN" : "en-GB");

  const {
    handleSubmit,
    handleAiGenerate,
    validateSchedule,
    submitting,
    validating,
    aiGenerating,
    aiResult,
    setAiResult
  } = useScheduleActions(
    tableSchedules,
    setTableSchedules,
    daysOfWeek,
    clinics,
    doctors,
    weekStart,
    note,
    navigate,
    t,
    holidays
  );

  // Ensure weekStart is always a Monday
  useEffect(() => {
    if (weekStart) {
      const date = new Date(weekStart + 'T00:00:00');
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 1) {
        // Not Monday, auto-correct to nearest Monday
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        date.setDate(date.getDate() + diff);
        const correctedMonday = date.toISOString().split("T")[0];
        if (correctedMonday >= getNextMonday()) {
          setWeekStart(correctedMonday);
        } else {
          setWeekStart(getNextMonday());
        }
      }
    }
  }, [weekStart]);

  // Clear clinic assignments if clinic is on holiday or inactive
  useEffect(() => {
    if (holidays.length === 0 || clinics.length === 0) return;

    const daysOfWeekData = getDaysOfWeek(weekStart, i18n.language === "vi" ? "vi-VN" : "en-GB");
    
    setTableSchedules((prev) => {
      const newSchedule = { ...prev };
      let hasChanges = false;

      // Get active clinic IDs - strict filter: only explicitly active clinics
      const activeClinicIds = new Set(
        clinics
          .filter(clinic => clinic.isActive === true) // Strict filter: only active clinics
          .map(clinic => clinic.id)
      );

      Object.entries(newSchedule).forEach(([doctorIdStr, daySchedule]) => {
        const doctorId = Number(doctorIdStr);
        Object.entries(daySchedule).forEach(([dayKey, scheduleData]: [string, any]) => {
          const dayInfo = daysOfWeekData.find((d) => d.key === dayKey);
          if (!dayInfo) return;

          const dayDate = dayInfo.dateStringISO || dayInfo.dateString;
          
          // Check available clinics for this day (not on holiday and active)
          const availableClinicIds = clinics
            .filter(clinic => {
              // Strict filter: only explicitly active clinics
              const isActive = clinic.isActive === true; // No default to true
              return isActive && !isClinicHoliday(clinic.id, dayDate, holidays);
            })
            .map(clinic => clinic.id);

          // Clear morning shift if clinic is on holiday or inactive
          if (scheduleData.morning?.clinicId) {
            const clinicId = scheduleData.morning.clinicId;
            if (!availableClinicIds.includes(clinicId) || !activeClinicIds.has(clinicId)) {
              const { morning, ...rest } = scheduleData;
              newSchedule[doctorId][dayKey] = rest;
              hasChanges = true;
            }
          }

          // Clear afternoon shift if clinic is on holiday or inactive
          if (scheduleData.afternoon?.clinicId) {
            const clinicId = scheduleData.afternoon.clinicId;
            if (!availableClinicIds.includes(clinicId) || !activeClinicIds.has(clinicId)) {
              const { afternoon, ...rest } = scheduleData;
              newSchedule[doctorId][dayKey] = rest;
              hasChanges = true;
            }
          }

          // Remove day if no shifts left
          if (Object.keys(newSchedule[doctorId][dayKey] || {}).length === 0) {
            const { [dayKey]: removed, ...rest } = newSchedule[doctorId];
            newSchedule[doctorId] = rest;
            hasChanges = true;
          }
        });
      });

      return hasChanges ? newSchedule : prev;
    });
  }, [holidays, weekStart, clinics, i18n.language]);

  // Cập nhật cơ sở cho từng ca sáng/chiều
  const updateShiftClinic = (
    doctorId: number,
    dayKey: string,
    shiftType: "morning" | "afternoon",
    clinicId: number | null
  ) => {
    setTableSchedules((prev) => {
      const newSchedule = { ...prev };
      if (!newSchedule[doctorId]) {
        newSchedule[doctorId] = {};
      }
      if (!newSchedule[doctorId][dayKey]) {
        newSchedule[doctorId][dayKey] = {};
      }

      if (clinicId === null || clinicId === 0) {
        // Xóa ca khỏi schedule khi không chọn clinic
        if (shiftType === "morning") {
          const { morning, ...rest } = newSchedule[doctorId][dayKey];
          newSchedule[doctorId][dayKey] = rest;
        } else {
          const { afternoon, ...rest } = newSchedule[doctorId][dayKey];
          newSchedule[doctorId][dayKey] = rest;
        }
        // Nếu ngày đó không còn ca nào thì xóa ngày đó khỏi schedule của bác sĩ
        if (Object.keys(newSchedule[doctorId][dayKey]).length === 0) {
          const { [dayKey]: removed, ...rest } = newSchedule[doctorId];
          newSchedule[doctorId] = rest;
        }
      } else {
        // Thêm hoặc cập nhật ca
        newSchedule[doctorId][dayKey] = {
          ...newSchedule[doctorId][dayKey],
          [shiftType]: { clinicId },
        };
      }
      return newSchedule;
    });
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="p-6 min-h-screen bg-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#0D1B3E] mb-2">
                {t("create.title")}
              </h1>
              <p className="text-gray-600">
                {t("create.subtitle")}
              </p>
            </div>
            <button
              onClick={() => navigate("/hr/schedules")}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              {t("create.back")}
            </button>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 mb-6">
            <div className="flex items-center gap-4 flex-wrap">
              <Calendar className="w-6 h-6 text-blue-600" />
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("create.startWeek.label")}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="date"
                    value={weekStart}
                    onChange={(e) => {
                      const selectedDate = e.target.value;
                      // Parse with explicit time to avoid timezone issues
                      const date = new Date(selectedDate + 'T00:00:00');
                      if (date.getDay() !== 1) {
                        toast.warning(t("create.startWeek.selectMonday"));
                        const day = date.getDay();
                        const diff = day === 0 ? -6 : 1 - day;
                        date.setDate(date.getDate() + diff);
                        const correctedMonday = date.toISOString().split("T")[0];
                        if (correctedMonday < getNextMonday()) {
                          toast.error(t("create.startWeek.onlyNextWeek"));
                          setWeekStart(getNextMonday());
                        } else {
                          setWeekStart(correctedMonday);
                        }
                      } else {
                        if (selectedDate < getNextMonday()) {
                          toast.error(t("create.startWeek.onlyNextWeek"));
                          setWeekStart(getNextMonday());
                        } else {
                          setWeekStart(selectedDate);
                        }
                      }
                    }}
                    min={getNextMonday()}
                    className="border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Week start"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Next week button clicked!');
                      console.log('Current weekStart:', weekStart);
                      
                      // Nhảy đến Monday tiếp theo
                      const currentMonday = new Date(weekStart + 'T00:00:00');
                      const nextMonday = new Date(currentMonday);
                      nextMonday.setDate(currentMonday.getDate() + 7);
                      
                      // Format date properly to avoid timezone issues
                      const year = nextMonday.getFullYear();
                      const month = String(nextMonday.getMonth() + 1).padStart(2, '0');
                      const day = String(nextMonday.getDate()).padStart(2, '0');
                      const nextMondayStr = `${year}-${month}-${day}`;
                      
                      console.log('Setting weekStart to:', nextMondayStr);
                      setWeekStart(nextMondayStr);
                    }}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm font-medium cursor-pointer"
                  >
                    {t("create.startWeek.button")}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {t("create.startWeek.hint")}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 shadow-md border border-blue-200 mb-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                <span className="text-2xl">🤖</span>
                {t("create.aiGeneration.title")}
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                {t("create.aiGeneration.description")}
              </p>
            </div>
            <div className="flex gap-3">
              <textarea
                value={aiDescription}
                onChange={(e) => {
                  setAiDescription(e.target.value);
                  setAiResult(null);
                }}
                placeholder={t("create.aiGeneration.placeholder")}
                className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
                disabled={aiGenerating}
              />
              <button
                onClick={() => handleAiGenerate(aiDescription, setAiDescription)}
                disabled={aiGenerating || !aiDescription.trim()}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {aiGenerating ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    {t("create.aiGeneration.generating")}
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    {t("create.aiGeneration.button")}
                  </>
                )}
              </button>
            </div>
            {aiResult && (
              <div className={`mt-4 p-3 rounded-lg ${aiResult.success
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
                }`}>
                <div className="flex items-center gap-2">
                  {aiResult.success ? (
                    <span className="text-green-600">✓</span>
                  ) : (
                    <span className="text-red-600">✗</span>
                  )}
                  <p className={`text-sm ${aiResult.success ? "text-green-800" : "text-red-800"
                    }`}>
                    {aiResult.message}
                  </p>
                </div>
              </div>
            )}
          </div>


          {(() => {
            // Filter chỉ lấy các đơn nghỉ của bác sĩ
            const doctorIds = new Set(doctors.map((doc: any) => doc.id || doc.userId));
            const doctorLeaves = approvedLeaves.filter((leave: any) =>
              doctorIds.has(leave.userId)
            );

            if (doctorLeaves.length === 0) return null;

            return (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm mb-8 overflow-hidden">
                <div className="bg-gradient-to-r from-red-50 to-pink-50 px-6 py-4 border-b border-red-100 flex items-center gap-4">
                  <div className="p-2 bg-white rounded-lg shadow-sm border border-red-100">
                    <CalendarX className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      {t("create.unavailable.title")}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {t("create.unavailable.description")}
                    </p>
                  </div>
                </div>

                <div className="p-6 bg-gray-50/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {doctorLeaves.map((leave: any, index: number) => {
                      const startDate = new Date(leave.startDate);
                      const endDate = new Date(leave.endDate);
                      const isSameDay = startDate.toDateString() === endDate.toDateString();
                      const dateRange = isSameDay
                        ? startDate.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
                        : `${startDate.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })} - ${endDate.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}`;

                      const shiftTypeLabel = leave.shiftType === "MORNING" ? t("create.shifts.morning")
                        : leave.shiftType === "AFTERNOON" ? t("create.shifts.afternoon")
                          : t("create.shifts.fullDay");

                      return (
                        <div key={leave.id || index} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                          <div className="absolute top-0 left-0 w-1 h-full bg-red-400 group-hover:bg-red-500 transition-colors"></div>
                          <div className="flex items-start gap-3 pl-2">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm border border-gray-200">
                              {leave.userFullName ? leave.userFullName.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate" title={leave.userFullName}>
                                {leave.userFullName || `Bác sĩ ID: ${leave.userId}`}
                              </h3>
                              <div className="flex items-center gap-1 text-xs mt-1">
                                <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-700 font-medium border border-red-100">
                                  {shiftTypeLabel}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">{dateRange}</span>
                            </div>
                            {leave.reason && (
                              <div className="text-xs text-gray-500 italic flex items-start gap-1.5 bg-gray-50 p-2 rounded">
                                <Info className="w-3 h-3 mt-0.5 text-gray-400 flex-shrink-0" />
                                <span className="line-clamp-2">{leave.reason}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 mb-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                {t("create.assignClinics.title")}
              </h2>
              <p className="text-sm text-gray-600">
                {t("create.assignClinics.description")}
              </p>
            </div>

            <ScheduleTable
              doctors={doctors}
              daysOfWeek={daysOfWeek}
              clinics={clinics}
              tableSchedules={tableSchedules}
              onUpdateShiftClinic={updateShiftClinic}
              holidays={holidays}
            />
          </div>

          <div className="mb-6 bg-white rounded-xl p-6 shadow-md border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("create.note.label")}
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t("create.note.placeholder")}
            />
          </div>

          <div className="flex gap-4 justify-end">
            <button
              onClick={validateSchedule}
              disabled={validating || submitting}
              className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition disabled:opacity-50 flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              {validating ? t("create.buttons.validating") : t("create.buttons.validate")}
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || validating}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              {submitting ? t("create.buttons.creating") : t("create.buttons.create")}
            </button>
            <button
              onClick={() => navigate("/hr/schedules")}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              {t("create.cancel")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default CreateScheduleForm;
