import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Calendar, Check, X } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTranslation } from "react-i18next";

type ScheduleItem = {
  id: number;
  doctor: any;
  clinic: any;
  room: any;
  chair: any;
  workDate: string;
  startTime: string;
  endTime: string;
  status: string;
  note?: string;
};

type CreateScheduleRequest = {
  weekStart: string;
  dailyAssignments: {
    [key: string]: Array<{
      doctorId: number;
      clinicId: number;
      roomId: number;
      chairId: number;
      startTime: string;
      endTime: string;
      note?: string;
    }>;
  };
  note?: string;
};

// Định nghĩa các ca làm việc
type ShiftType = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
};

const SHIFTS: ShiftType[] = [
  { id: "morning", name: "Morning", startTime: "08:00", endTime: "11:00" },
  { id: "afternoon", name: "Afternoon", startTime: "13:00", endTime: "18:00" },
];

function CreateScheduleForm() {
  const { t, i18n } = useTranslation("schedules");
  const navigate = useNavigate();
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080";
  const accessToken = localStorage.getItem("accessToken");

  // Lấy thứ hai của tuần hiện tại
  const getMondayOfWeek = (date: Date): string => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().split("T")[0];
  };

  // Lấy thứ hai của tuần tiếp theo, dùng mặc định cho weekStart
  const getNextMonday = (): string => {
    const today = new Date();
    const mondayOfCurrentWeek = getMondayOfWeek(today);
    const nextMonday = new Date(mondayOfCurrentWeek);
    nextMonday.setDate(nextMonday.getDate() + 7);
    return nextMonday.toISOString().split("T")[0];
  };

  const [weekStart, setWeekStart] = useState<string>(getNextMonday());

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

  const [tableSchedules, setTableSchedules] = useState<TableSchedule>({});
  const [note, setNote] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [validating, setValidating] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [clinics, setClinics] = useState<any[]>([]);

  // Tính toán ngày trong tuần từ weekStart
  const getDaysOfWeek = (weekStartDate: string) => {
    const monday = new Date(weekStartDate);
    const days = [];
    for (let i = 0; i < 6; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const dayNames = [
        t("create.days.sunday"),
        t("create.days.monday"),
        t("create.days.tuesday"),
        t("create.days.wednesday"),
        t("create.days.thursday"),
        t("create.days.friday"),
        t("create.days.saturday"),
      ];
      const dayKey = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ][date.getDay()];

      days.push({
        key: dayKey,
        label: dayNames[date.getDay()],
        date: date,
        dayIndex: i,
        dateString: date.toLocaleDateString(i18n.language === "vi" ? "vi-VN" : "en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
      });
    }
    return days;
  };

  const daysOfWeek = getDaysOfWeek(weekStart);

  // Gom nhóm bác sĩ theo phòng ban
  const doctorsByDepartment = doctors.reduce(
    (acc: { [key: string]: any[] }, doctor: any) => {
      const deptName =
        doctor.department?.departmentName ||
        doctor.department?.name ||
        t("create.table.uncategorized");
      if (!acc[deptName]) {
        acc[deptName] = [];
      }
      acc[deptName].push(doctor);
      return acc;
    },
    {}
  );

  const departmentNames = Object.keys(doctorsByDepartment).sort();

  useEffect(() => {
    fetchDataFromAPI();
  }, []);

  // Lấy danh sách bác sĩ và cơ sở từ API
  const fetchDataFromAPI = async () => {
    if (!accessToken || !apiBase) {
      toast.error("Please login.");
      return;
    }
    try {
      try {
        const doctorsRes = await axios.get<{
          content: any[];
          totalElements: number;
        }>(`${apiBase}/api/hr/employees?size=100&isActive=true`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const allEmployees = doctorsRes.data?.content || [];
        const doctorEmployees = allEmployees.filter((emp: any) => {
          const roleName = emp.role?.roleName || emp.role?.name || "";
          return roleName && roleName.toUpperCase().includes("DOCTOR");
        });

        if (doctorEmployees.length === 0) {
          setDoctors(allEmployees);
        } else {
          setDoctors(doctorEmployees);
        }
      } catch (err: any) {
        toast.error("Could not load doctors.");
      }

      try {
        const clinicsRes = await axios.get<
          Array<{ id: number; clinicName: string; isActive?: boolean }>
        >(`${apiBase}/api/hr/management/clinics`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const clinicsData = (clinicsRes.data || []).map((c: any) => ({
          id: c.id,
          name: c.clinicName || c.name,
          isActive: c.isActive !== undefined ? c.isActive : true,
        }));
        setClinics(clinicsData);
      } catch (err: any) {
        toast.error("Could not load clinics.");
      }
    } catch (err: any) {
      toast.error("Error loading schedule data.");
    }
  };

  // Cập nhật cơ sở cho từng ca sáng/chiều - dùng cho thao tác chọn select của user
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
        // Xóa ca nếu không chọn clinic
        if (shiftType === "morning") {
          const { morning, ...rest } = newSchedule[doctorId][dayKey];
          newSchedule[doctorId][dayKey] = rest;
        } else {
          const { afternoon, ...rest } = newSchedule[doctorId][dayKey];
          newSchedule[doctorId][dayKey] = rest;
        }
        // Nếu cả sáng và chiều đều trống thì xóa luôn ngày đó khỏi lịch
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

  // Lấy lịch của bác sĩ theo ngày
  const getDaySchedule = (doctorId: number, dayKey: string): DaySchedule => {
    return tableSchedules[doctorId]?.[dayKey] || {};
  };

  // Chuyển dữ liệu bảng hiện tại sang request API
  const convertTableToAPIFormat = (): CreateScheduleRequest => {
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

          // Tạo assignment cho ca sáng
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

          // Tạo assignment cho ca chiều
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

  // Gửi request kiểm tra hợp lệ lịch với backend
  const validateSchedule = async () => {
    setValidating(true);
    try {
      const request = convertTableToAPIFormat();

      const response = await axios.post<{ isValid: boolean; errors: string[] }>(
        `${apiBase}/api/hr/schedules/validate`,
        request,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.isValid) {
        toast.success("Schedule is valid.");
      } else {
        const errors = response.data.errors || [];
        if (errors.length > 0) {
          if (errors.length > 5) {
            const firstErrors = errors.slice(0, 5);
            const remainingCount = errors.length - 5;
            toast.error(
              `There are ${errors.length} errors in the schedule.\n${firstErrors.join(
                "\n"
              )}\nAnd ${remainingCount} more...`,
              {
                autoClose: 8000,
                style: { whiteSpace: "pre-line" },
              }
            );
          } else {
            toast.error(
              `There are ${errors.length} errors in the schedule.\n${errors.join("\n")}`,
              {
                autoClose: 8000,
                style: { whiteSpace: "pre-line" },
              }
            );
          }
        }
      }
    } catch (err: any) {
      let errorMsg = "Error during validation.";
      if (err?.response?.data) {
        const errorData = err.response.data;
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const errors = errorData.errors;
          if (errors.length > 5) {
            errorMsg = `There are ${errors.length} errors in the schedule.\n${errors
              .slice(0, 5)
              .join("\n")}\nAnd ${errors.length - 5} more...`;
          } else {
            errorMsg = `There are ${errors.length} errors in the schedule.\n${errors.join("\n")}`;
          }
        } else {
          errorMsg = errorData.message || errorData.error || errorMsg;
        }
      } else if (err?.message) {
        errorMsg = err.message;
      }
      toast.error(errorMsg, {
        autoClose: 8000,
        style: { whiteSpace: "pre-line" },
      });
    } finally {
      setValidating(false);
    }
  };

  // Kiểm tra hợp lệ lịch ở frontend: Mỗi phòng ban phải phân bác sĩ ở tất cả cơ sở mỗi ngày
  const validateScheduleFrontend = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const clinicIds = clinics.map((c) => c.id).sort();
    if (clinicIds.length !== 2) {
      errors.push(`There must be exactly 2 clinics but got ${clinics.length}.`);
      return { isValid: false, errors };
    }
    const [clinic1Id, clinic2Id] = clinicIds;
    daysOfWeek.forEach((day) => {
      const dayAssignments: { [doctorId: number]: { clinicId: number } } = {};

      Object.entries(tableSchedules).forEach(([doctorIdStr, daySchedule]) => {
        const doctorId = Number(doctorIdStr);
        const dayScheduleData = daySchedule[day.key];
        if (dayScheduleData) {
          // Dùng clinic đầu tiên (morning/afternoon) đang có để check
          const firstClinicId = dayScheduleData.morning?.clinicId || dayScheduleData.afternoon?.clinicId;
          if (firstClinicId) {
            dayAssignments[doctorId] = { clinicId: firstClinicId };
          }
        }
      });

      const workingClinicIds = new Set<number>();
      Object.values(dayAssignments).forEach((assignment) => {
        if (assignment && assignment.clinicId) {
          workingClinicIds.add(assignment.clinicId);
        }
      });
      const numWorkingClinics = workingClinicIds.size;
      if (numWorkingClinics === 0) return; // ngày nghỉ

      departmentNames.forEach((deptName) => {
        const deptDoctors = doctorsByDepartment[deptName];
        if (!deptDoctors || deptDoctors.length === 0) return;
        const deptDoctorIds = deptDoctors.map((d: any) => d.id);
        const assignedDoctorsInDept = deptDoctorIds.filter((id: number) =>
          dayAssignments.hasOwnProperty(id)
        );

        if (numWorkingClinics === 1) {
          const workingClinicId = Array.from(workingClinicIds)[0];
          const hasDoctorInWorkingClinic = assignedDoctorsInDept.some(
            (doctorId: number) => dayAssignments[doctorId]?.clinicId === workingClinicId
          );
          if (!hasDoctorInWorkingClinic) {
            const clinicName =
              clinics.find((c) => c.id === workingClinicId)?.name ||
              `Clinic ${workingClinicId}`;
            errors.push(
              `Department "${deptName}" on ${day.label} (${day.dateString}) has no doctor at ${clinicName}.`
            );
          }
        } else if (numWorkingClinics === 2) {
          const hasClinic1 = assignedDoctorsInDept.some(
            (doctorId: number) => dayAssignments[doctorId]?.clinicId === clinic1Id
          );
          const hasClinic2 = assignedDoctorsInDept.some(
            (doctorId: number) => dayAssignments[doctorId]?.clinicId === clinic2Id
          );

          if (!hasClinic1) {
            const clinic1Name =
              clinics.find((c) => c.id === clinic1Id)?.name ||
              `Clinic ${clinic1Id}`;
            errors.push(
              `Department "${deptName}" on ${day.label} (${day.dateString}) has no doctor at ${clinic1Name}.`
            );
          }
          if (!hasClinic2) {
            const clinic2Name =
              clinics.find((c) => c.id === clinic2Id)?.name ||
              `Clinic ${clinic2Id}`;
            errors.push(
              `Department "${deptName}" on ${day.label} (${day.dateString}) has no doctor at ${clinic2Name}.`
            );
          }
        }
      });
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  // Submit tạo lịch mới, bao gồm kiểm tra hợp lệ và gửi dữ liệu lên server
  const handleSubmit = async () => {
    // Lấy tất cả những assignment đã phân công
    const assignmentDetails: Array<{
      day: string;
      date: string;
      clinicId?: number;
      clinicName?: string;
    }> = [];

    Object.entries(tableSchedules).forEach(([_doctorId, daySchedule]) => {
      Object.entries(daySchedule).forEach(([dayKey, dayScheduleData]) => {
        if (dayScheduleData) {
          const dayInfo = daysOfWeek.find((d) => d.key === dayKey);
          if (dayInfo) {
            const morningClinicId = dayScheduleData.morning?.clinicId;
            if (morningClinicId) {
              const clinic = clinics.find((c) => c.id === morningClinicId);
              assignmentDetails.push({
                day: dayInfo.label,
                date: dayInfo.dateString,
                clinicId: morningClinicId,
                clinicName: clinic?.name || clinic?.clinicName || `Clinic ${morningClinicId}`,
              });
            }
            const afternoonClinicId = dayScheduleData.afternoon?.clinicId;
            if (afternoonClinicId) {
              const clinic = clinics.find((c) => c.id === afternoonClinicId);
              assignmentDetails.push({
                day: dayInfo.label,
                date: dayInfo.dateString,
                clinicId: afternoonClinicId,
                clinicName: clinic?.name || clinic?.clinicName || `Clinic ${afternoonClinicId}`,
              });
            }
          }
        }
      });
    });

    if (assignmentDetails.length === 0) {
      toast.error("No doctor has been assigned.", { autoClose: 6000 });
      return;
    }

    // Chỉ báo lỗi nếu tất cả các ngày đều không phân bác sĩ
    const daysWithAssignments = new Set(assignmentDetails.map((a) => a.day));
    const daysWithoutDoctors = daysOfWeek.filter((day) => !daysWithAssignments.has(day.label));
    if (daysWithoutDoctors.length === daysOfWeek.length) {
      toast.error("No doctor has been assigned.", { autoClose: 6000 });
      return;
    }

    // Kiểm tra nếu 2 clinic mà chỉ có bác sĩ tại 1 clinic
    const errors: string[] = [];
    daysOfWeek.forEach((day) => {
      const dayAssignments = assignmentDetails.filter((a) => a.day === day.label);
      const clinicIdsSet = new Set(dayAssignments.map((a) => a.clinicId).filter((id) => id !== undefined));
      if (clinics.length === 2 && clinicIdsSet.size === 1) {
        const assignedClinicId = Array.from(clinicIdsSet)[0];
        const missingClinic = clinics.find((c) => c.id !== assignedClinicId);
        if (missingClinic) {
          errors.push(
            `On ${day.label} (${day.dateString}) no doctor has been assigned to ${missingClinic.name || missingClinic.clinicName || `Clinic ${missingClinic.id}`}.`
          );
        }
      }
    });

    if (errors.length > 0) {
      errors.forEach((error, index) => {
        setTimeout(() => {
          toast.error(error, { autoClose: 6000 });
        }, index * 200);
      });
      return;
    }

    const validation = validateScheduleFrontend();
    if (!validation.isValid) {
      validation.errors.forEach((error) =>
        toast.error(error, { autoClose: 5000 })
      );
      return;
    }

    setSubmitting(true);
    try {
      const request = convertTableToAPIFormat();

      const response = await axios.post<ScheduleItem[]>(
        `${apiBase}/api/hr/schedules/create`,
        request,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      toast.success(`Successfully created ${response.data.length} schedule(s).`);
      setTimeout(() => {
        // Chuyển về trang danh sách lịch, đồng thời chuyển state tuần để tự động filter tuần mới
        navigate("/hr/schedules", {
          state: {
            refresh: true,
            weekStart: weekStart,
          },
        });
      }, 1500);
    } catch (err: any) {
      // Lỗi từ server, show chi tiết từng lỗi nếu có
      if (err?.response?.data) {
        const errorData = err.response.data;
        if (errorData.errors && Array.isArray(errorData.errors)) {
          errorData.errors.forEach((error: string, index: number) => {
            setTimeout(() => {
              toast.error(error, {
                autoClose: 6000,
                position: "top-right",
              });
            }, index * 100);
          });
        } else if (errorData.validationErrors && Array.isArray(errorData.validationErrors)) {
          errorData.validationErrors.forEach((error: string, index: number) => {
            setTimeout(() => {
              toast.error(error, {
                autoClose: 6000,
                position: "top-right",
              });
            }, index * 100);
          });
        } else if (errorData.message) {
          toast.error(errorData.message, {
            autoClose: 6000,
            position: "top-right",
          });
        } else if (errorData.error) {
          toast.error(errorData.error, {
            autoClose: 6000,
            position: "top-right",
          });
        } else {
          toast.error("Could not create schedule.", {
            autoClose: 6000,
            position: "top-right",
          });
        }
      } else if (err?.message) {
        toast.error(err.message, {
          autoClose: 6000,
          position: "top-right",
        });
      } else {
        toast.error("Could not create schedule.", {
          autoClose: 6000,
          position: "top-right",
        });
      }
      // DỮ LIỆU FORM GIỮ NGUYÊN ĐỂ NGƯỜI DÙNG SỬA
    } finally {
      setSubmitting(false);
    }
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
                      const date = new Date(selectedDate);
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
                    aria-label={t("create.startWeek.label")}
                  />
                  <button
                    onClick={() => {
                      // Lấy thứ 2 của tuần tiếp theo từ weekStart hiện tại
                      const currentMonday = new Date(weekStart);
                      const nextMonday = new Date(currentMonday);
                      nextMonday.setDate(currentMonday.getDate() + 7);
                      const nextMondayStr = nextMonday.toISOString().split("T")[0];
                      setWeekStart(nextMondayStr);
                    }}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm font-medium"
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

          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 mb-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                {t("create.assignClinics.title")}
              </h2>
              <p className="text-sm text-gray-600">
                {t("create.assignClinics.description")}
              </p>
            </div>

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
                    departmentNames.map((deptName, deptIndex) => {
                      const deptDoctors = doctorsByDepartment[deptName];
                      let globalIndex = 0;
                      for (let i = 0; i < deptIndex; i++) {
                        globalIndex += doctorsByDepartment[departmentNames[i]].length;
                      }
                      return (
                        <React.Fragment key={deptName}>
                          <tr className="bg-gray-100">
                            <td
                              colSpan={daysOfWeek.length + 2}
                              className="border border-gray-300 px-4 py-2 font-semibold text-gray-800 bg-gray-100"
                            >
                              {deptName} ({deptDoctors.length} {t("create.table.doctors")})
                            </td>
                          </tr>
                          {deptDoctors.map((doctor, localIndex) => {
                            const currentIndex = globalIndex + localIndex;
                            return (
                              <tr key={doctor.id} className="hover:bg-gray-50">
                                <td className="border border-gray-300 px-4 py-3 text-center font-medium text-gray-700 sticky left-0 bg-white z-10">
                                  {String(currentIndex + 1).padStart(2, "0")}
                                </td>
                                <td className="border border-gray-300 px-4 py-3 font-medium text-gray-800 sticky left-12 bg-white z-10">
                                  {doctor.fullName ||
                                    doctor.name ||
                                    `Dr. ${doctor.id}`}
                                </td>
                                {daysOfWeek.map((day) => {
                                  const daySchedule = getDaySchedule(doctor.id, day.key);
                                  return (
                                    <td
                                      key={day.key}
                                      className="border border-gray-300 px-4 py-3"
                                    >
                                      <div className="space-y-2">
                                        {/* Ca sáng */}
                                        <div className="p-2 bg-blue-50 rounded border border-blue-200">
                                          <div className="text-xs font-semibold text-blue-700 mb-1">
                                            {t("create.shifts.morning")} (08:00 - 11:00)
                                          </div>
                                          <select
                                            value={daySchedule.morning?.clinicId || ""}
                                            onChange={(e) =>
                                              updateShiftClinic(
                                                doctor.id,
                                                day.key,
                                                "morning",
                                                e.target.value ? Number(e.target.value) : null
                                              )
                                            }
                                            className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            aria-label={`${
                                              doctor.fullName || doctor.name
                                            } - ${day.label} - Morning Shift - Clinic`}
                                          >
                                            <option value="">
                                              {t("create.table.selectClinic")}
                                            </option>
                                            {clinics.map((clinic) => (
                                              <option key={clinic.id} value={clinic.id}>
                                                {clinic.name || `${t("common.clinic")} ${clinic.id}`}
                                              </option>
                                            ))}
                                          </select>
                                        </div>
                                        
                                        {/* Ca chiều */}
                                        <div className="p-2 bg-orange-50 rounded border border-orange-200">
                                          <div className="text-xs font-semibold text-orange-700 mb-1">
                                            {t("create.shifts.afternoon")} (13:00 - 18:00)
                                          </div>
                                          <select
                                            value={daySchedule.afternoon?.clinicId || ""}
                                            onChange={(e) =>
                                              updateShiftClinic(
                                                doctor.id,
                                                day.key,
                                                "afternoon",
                                                e.target.value ? Number(e.target.value) : null
                                              )
                                            }
                                            className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            aria-label={`${
                                              doctor.fullName || doctor.name
                                            } - ${day.label} - Afternoon Shift - Clinic`}
                                          >
                                            <option value="">
                                              {t("create.table.selectClinic")}
                                            </option>
                                            {clinics.map((clinic) => (
                                              <option key={clinic.id} value={clinic.id}>
                                                {clinic.name || `${t("common.clinic")} ${clinic.id}`}
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
                          })}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
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
