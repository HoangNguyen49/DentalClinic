import { useState, useEffect } from "react";
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

  // Lấy thứ hai của tuần tiếp theo
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
  const [aiDescription, setAiDescription] = useState<string>("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);

  // Calculate days of week for schedule table
  const getDaysOfWeek = (weekStartDate: string) => {
    const monday = new Date(weekStartDate);
    const days = [];
    for (let i = 0; i < 6; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const dayNames = [
        "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
      ];
      const dayKey = [
        "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"
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

  // Sort doctors by name
  const sortedDoctors = [...doctors].sort((a, b) => {
    const nameA = a.fullName || a.name || `Dr. ${a.id}`;
    const nameB = b.fullName || b.name || `Dr. ${b.id}`;
    return nameA.localeCompare(nameB);
  });

  useEffect(() => {
    fetchDataFromAPI();
  }, []);

  // Lấy danh sách bác sĩ và cơ sở
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

  // Lấy thông tin ca làm việc trong ngày cho một bác sĩ
  const getDaySchedule = (doctorId: number, dayKey: string): DaySchedule => {
    return tableSchedules[doctorId]?.[dayKey] || {};
  };

  // Chuyển đổi dữ liệu tableSchedules sang API format để gửi lên server
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

  // Gửi request validate schedule cho backend, thông báo lỗi nếu có
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

  // Kiểm tra hợp lệ schedule ở phía frontend phục vụ cảnh báo user
  const validateScheduleFrontend = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const clinicIds = clinics.map((c) => c.id).sort();
    if (clinicIds.length !== 2) {
      errors.push(`There must be exactly 2 clinics but got ${clinics.length}.`);
      return { isValid: false, errors };
    }
    const [clinic1Id, clinic2Id] = clinicIds;
    
    daysOfWeek.forEach((day) => {
      // Thu thập thông tin phân công cho mỗi ngày
      const clinicShifts: { [clinicId: number]: { morning: boolean; afternoon: boolean } } = {};
      const specialtyClinicDoctors: { [specialtyName: string]: { [clinicId: number]: Set<number> } } = {};

      Object.entries(tableSchedules).forEach(([doctorIdStr, daySchedule]) => {
        const doctorId = Number(doctorIdStr);
        const dayScheduleData = daySchedule[day.key];
        if (!dayScheduleData) return;

        const doctor = doctors.find((d: any) => d.id === doctorId);
        if (!doctor) return;

        const doctorSpecialties: string[] = 
          (doctor.specialties && Array.isArray(doctor.specialties) && doctor.specialties.length > 0)
            ? doctor.specialties
            : (doctor.specialty || doctor.specialtyName)
              ? [doctor.specialty || doctor.specialtyName]
              : ["Uncategorized"];

        if (dayScheduleData.morning?.clinicId) {
          const clinicId = dayScheduleData.morning.clinicId;
          if (!clinicShifts[clinicId]) {
            clinicShifts[clinicId] = { morning: false, afternoon: false };
          }
          clinicShifts[clinicId].morning = true;
          doctorSpecialties.forEach((specialtyName) => {
            if (!specialtyClinicDoctors[specialtyName]) {
              specialtyClinicDoctors[specialtyName] = {};
            }
            if (!specialtyClinicDoctors[specialtyName][clinicId]) {
              specialtyClinicDoctors[specialtyName][clinicId] = new Set();
            }
            specialtyClinicDoctors[specialtyName][clinicId].add(doctorId);
          });
        }

        if (dayScheduleData.afternoon?.clinicId) {
          const clinicId = dayScheduleData.afternoon.clinicId;
          if (!clinicShifts[clinicId]) {
            clinicShifts[clinicId] = { morning: false, afternoon: false };
          }
          clinicShifts[clinicId].afternoon = true;
          doctorSpecialties.forEach((specialtyName) => {
            if (!specialtyClinicDoctors[specialtyName]) {
              specialtyClinicDoctors[specialtyName] = {};
            }
            if (!specialtyClinicDoctors[specialtyName][clinicId]) {
              specialtyClinicDoctors[specialtyName][clinicId] = new Set();
            }
            specialtyClinicDoctors[specialtyName][clinicId].add(doctorId);
          });
        }
      });

      // validate: phải có đúng 2 clinic hoạt động mỗi ngày
      const workingClinicIds = Object.keys(clinicShifts).map(Number);
      if (workingClinicIds.length === 0) {
        return;
      }
      if (workingClinicIds.length !== 2) {
        if (workingClinicIds.length === 1) {
          const clinicName = clinics.find((c) => c.id === workingClinicIds[0])?.name || `Clinic ${workingClinicIds[0]}`;
          errors.push(
            `Only 1 clinic (${clinicName}) is active on ${day.label} (${day.dateString}). Both clinics must be active.`
          );
        } else {
          errors.push(
            `Too many clinics (${workingClinicIds.length}) are active on ${day.label} (${day.dateString}). Exactly 2 clinics must be active.`
          );
        }
        return;
      }

      // validate: mỗi clinic phải có bác sĩ cả sáng và chiều
      [clinic1Id, clinic2Id].forEach((clinicId) => {
        const shifts = clinicShifts[clinicId];
        const clinicName = clinics.find((c) => c.id === clinicId)?.name || `Clinic ${clinicId}`;
        if (!shifts) {
          errors.push(
            `${clinicName} must have doctors assigned on ${day.label} (${day.dateString}).`
          );
        } else {
          if (!shifts.morning) {
            errors.push(
              `${clinicName} must have doctors assigned in the morning shift (08:00-11:00) on ${day.label} (${day.dateString}).`
            );
          }
          if (!shifts.afternoon) {
            errors.push(
              `${clinicName} must have doctors assigned in the afternoon shift (13:00-18:00) on ${day.label} (${day.dateString}).`
            );
          }
        }
      });

      // validate: mỗi specialty phải có bác sĩ ở mỗi clinic mỗi ngày
      Object.entries(specialtyClinicDoctors).forEach(([specialtyName, clinicDoctorsMap]) => {
        const clinicIdsForSpecialty = Object.keys(clinicDoctorsMap).map(Number);
        if (clinicIdsForSpecialty.length !== 2) {
          errors.push(
            `Specialty "${specialtyName}" must have doctors assigned to both clinics on ${day.label} (${day.dateString}). Found in ${clinicIdsForSpecialty.length} clinic(s).`
          );
        } else {
          [clinic1Id, clinic2Id].forEach((clinicId) => {
            if (!clinicDoctorsMap[clinicId] || clinicDoctorsMap[clinicId].size === 0) {
              const clinicName = clinics.find((c) => c.id === clinicId)?.name || `Clinic ${clinicId}`;
              errors.push(
                `Specialty "${specialtyName}" must have at least one doctor assigned to ${clinicName} on ${day.label} (${day.dateString}).`
              );
            }
          });
        }
      });
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  // Gửi request tạo schedule mới (và validate)
  const handleSubmit = async () => {
    // Ghép tất cả assignment lại (dùng để validate phía trước)
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

    const daysWithAssignments = new Set(assignmentDetails.map((a) => a.day));
    const daysWithoutDoctors = daysOfWeek.filter((day) => !daysWithAssignments.has(day.label));
    if (daysWithoutDoctors.length === daysOfWeek.length) {
      toast.error("No doctor has been assigned.", { autoClose: 6000 });
      return;
    }

    // Check if there are only assignments in one clinic
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
        navigate("/hr/schedules", {
          state: {
            refresh: true,
            weekStart: weekStart,
          },
        });
      }, 1500);
    } catch (err: any) {
      // Thông báo lỗi cụ thể trả về từ backend
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
    } finally {
      setSubmitting(false);
    }
  };

  // Sinh lịch tự động dùng AI từ mô tả tiếng Anh
  const handleAiGenerate = async () => {
    if (!aiDescription.trim()) {
      toast.error("Please input a description for schedule AI generation.");
      return;
    }

    setAiGenerating(true);
    try {
      const response = await axios.post<CreateScheduleRequest>(
        `${apiBase}/api/hr/schedules/ai/generate`,
        {
          weekStart: weekStart,
          description: aiDescription,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const generatedRequest = response.data;
      
      // Convert AI result về format tableSchedules
      const newTableSchedules: TableSchedule = {};
      Object.entries(generatedRequest.dailyAssignments).forEach(([dayKey, assignments]) => {
        assignments.forEach((assignment) => {
          const doctorId = assignment.doctorId;
          const clinicId = assignment.clinicId;
          const startTime = assignment.startTime;
          const isMorning = startTime >= "08:00" && startTime < "12:00";
          const shiftKey = isMorning ? "morning" : "afternoon";
          if (!newTableSchedules[doctorId]) {
            newTableSchedules[doctorId] = {};
          }
          if (!newTableSchedules[doctorId][dayKey]) {
            newTableSchedules[doctorId][dayKey] = {};
          }
          newTableSchedules[doctorId][dayKey][shiftKey] = {
            clinicId: clinicId,
          };
        });
      });
      setTableSchedules(newTableSchedules);

      // Số lượng phân công đã tạo từ AI
      const totalAssignments = Object.values(generatedRequest.dailyAssignments)
        .reduce((sum, assignments) => sum + assignments.length, 0);

      setAiResult({
        success: true,
        message: `Created ${totalAssignments} assignments for ${Object.keys(generatedRequest.dailyAssignments).length} day(s).`,
        count: totalAssignments,
      });

      toast.success(`AI successfully created ${totalAssignments} assignments. Please review and edit if needed.`);
      setTimeout(() => {
        setAiDescription("");
        setAiResult(null);
      }, 5000);
    } catch (err: any) {
      console.error("AI generation error:", err);
      const errorMessage = err?.response?.data?.message || "Could not generate schedule via AI. Please try again.";
      setAiResult({
        success: false,
        message: errorMessage,
      });
      toast.error(errorMessage);
    } finally {
      setAiGenerating(false);
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
                Create New Schedule
              </h1>
              <p className="text-gray-600">
                Assign clinics to doctors for each day and shift of the upcoming week.
              </p>
            </div>
            <button
              onClick={() => navigate("/hr/schedules")}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Back
            </button>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 mb-6">
            <div className="flex items-center gap-4 flex-wrap">
              <Calendar className="w-6 h-6 text-blue-600" />
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start week (Monday)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="date"
                    value={weekStart}
                    onChange={(e) => {
                      const selectedDate = e.target.value;
                      const date = new Date(selectedDate);
                      if (date.getDay() !== 1) {
                        toast.warning("Please select a Monday.");
                        const day = date.getDay();
                        const diff = day === 0 ? -6 : 1 - day;
                        date.setDate(date.getDate() + diff);
                        const correctedMonday = date.toISOString().split("T")[0];
                        if (correctedMonday < getNextMonday()) {
                          toast.error("You can only select next week or later.");
                          setWeekStart(getNextMonday());
                        } else {
                          setWeekStart(correctedMonday);
                        }
                      } else {
                        if (selectedDate < getNextMonday()) {
                          toast.error("You can only select next week or later.");
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
                    onClick={() => {
                      // Nhảy đến Monday tiếp theo
                      const currentMonday = new Date(weekStart);
                      const nextMonday = new Date(currentMonday);
                      nextMonday.setDate(currentMonday.getDate() + 7);
                      const nextMondayStr = nextMonday.toISOString().split("T")[0];
                      setWeekStart(nextMondayStr);
                    }}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm font-medium"
                  >
                    Next week
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Please select the Monday to start the schedule week (must be next week or later).
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 shadow-md border border-blue-200 mb-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                <span className="text-2xl">🤖</span>
                AI Schedule Generation
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Describe your preferred weekly shift/assignment and let AI generate the table for you. You can edit the result for accuracy and compliance before saving.
              </p>
            </div>
            <div className="flex gap-3">
              <textarea
                value={aiDescription}
                onChange={(e) => {
                  setAiDescription(e.target.value);
                  setAiResult(null);
                }}
                placeholder="Describe or list desired assignments e.g. 'Dr. John works Monday to Friday mornings at Clinic 1, Dr. Jane alternates clinics every day...'"
                className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
                disabled={aiGenerating}
              />
              <button
                onClick={handleAiGenerate}
                disabled={aiGenerating || !aiDescription.trim()}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {aiGenerating ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Generating...
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    Generate by AI
                  </>
                )}
              </button>
            </div>
            {aiResult && (
              <div className={`mt-4 p-3 rounded-lg ${
                aiResult.success 
                  ? "bg-green-50 border border-green-200" 
                  : "bg-red-50 border border-red-200"
              }`}>
                <div className="flex items-center gap-2">
                  {aiResult.success ? (
                    <span className="text-green-600">✓</span>
                  ) : (
                    <span className="text-red-600">✗</span>
                  )}
                  <p className={`text-sm ${
                    aiResult.success ? "text-green-800" : "text-red-800"
                  }`}>
                    {aiResult.message}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 mb-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Assign Clinics to Doctors
              </h2>
              <p className="text-sm text-gray-600">
                For each doctor, assign morning and afternoon shifts for each day and select the corresponding clinic.
              </p>
            </div>

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
                                {doctor.fullName ||
                                  doctor.name ||
                                  `Dr. ${doctor.id}`}
                              </div>
                              {/* Danh sách chuyên khoa của bác sĩ */}
                              {(() => {
                                const doctorSpecialties: string[] = 
                                  (doctor.specialties && Array.isArray(doctor.specialties) && doctor.specialties.length > 0)
                                    ? doctor.specialties
                                    : (doctor.specialty || doctor.specialtyName)
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
                                        Select clinic...
                                      </option>
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
                                        Select clinic...
                                      </option>
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
          </div>

          <div className="mb-6 bg-white rounded-xl p-6 shadow-md border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional notes (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Type any note for this schedule..."
            />
          </div>

          <div className="flex gap-4 justify-end">
            <button
              onClick={validateSchedule}
              disabled={validating || submitting}
              className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition disabled:opacity-50 flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              {validating ? "Validating..." : "Validate"}
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || validating}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              {submitting ? "Creating..." : "Create Schedule"}
            </button>
            <button
              onClick={() => navigate("/hr/schedules")}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default CreateScheduleForm;
