import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Calendar, Check, X } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
  weekStart: string; // ISO date format (YYYY-MM-DD)
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

// Tính toán ngày tháng năm từ weekStart (Monday)
const getDaysOfWeek = (weekStartDate: string) => {
  const monday = new Date(weekStartDate);
  const days = [];
  for (let i = 0; i < 6; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
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
      dateString: date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
    });
  }
  return days;
};

// Ca mặc định của bác sĩ (sáng đến chiều)
const FULL_DAY_SHIFT = {
  startTime: "08:00",
  endTime: "17:00",
};

function CreateScheduleForm() {
  const navigate = useNavigate();
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080";
  const accessToken = localStorage.getItem("accessToken");

  // // Lấy thứ 2 của tuần hiện tại
  const getMondayOfWeek = (date: Date): string => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().split("T")[0];
  };

  // // Lấy thứ 2 của tuần tiếp theo (default)
  const getNextMonday = (): string => {
    const today = new Date();
    const mondayOfCurrentWeek = getMondayOfWeek(today);
    const nextMonday = new Date(mondayOfCurrentWeek);
    nextMonday.setDate(nextMonday.getDate() + 7);
    return nextMonday.toISOString().split("T")[0];
  };

  const [weekStart, setWeekStart] = useState<string>(getNextMonday());

  // Bảng kịch bản gán bác sĩ cho từng ngày
  type TableSchedule = {
    [doctorId: number]: {
      [dayKey: string]: number | null;
    };
  };

  const [tableSchedules, setTableSchedules] = useState<TableSchedule>({});
  const [note, setNote] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [validating, setValidating] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [clinics, setClinics] = useState<any[]>([]);

  const daysOfWeek = getDaysOfWeek(weekStart);

  // Gom nhóm bác sĩ theo phòng ban
  const doctorsByDepartment = doctors.reduce(
    (acc: { [key: string]: any[] }, doctor: any) => {
      const deptName =
        doctor.department?.departmentName ||
        doctor.department?.name ||
        "Uncategorized";
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

  // // Lấy dữ liệu danh sách bác sĩ và cơ sở từ API
  const fetchDataFromAPI = async () => {
    if (!accessToken || !apiBase) {
      toast.error("Please login and check API URL");
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
        console.error("Error fetching doctors:", err);
        const errorMsg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Cannot load doctors list";
        toast.error(errorMsg);
      }

      try {
        const clinicsRes = await axios.get<
          Array<{ id: number; clinicName: string }>
        >(`${apiBase}/api/hr/management/clinics`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const clinicsData = (clinicsRes.data || []).map((c: any) => ({
          id: c.id,
          name: c.clinicName || c.name,
        }));
        setClinics(clinicsData);
      } catch (err: any) {
        console.error("Error fetching clinics:", err);
        const errorMsg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Cannot load clinics list";
        toast.error(errorMsg);
      }
    } catch (err: any) {
      console.error("Error fetching data:", err);
      toast.error("Error occurred while loading data");
    }
  };

  // // Cập nhật phân công: chọn/huỷ clinic cho bác sĩ trong từng ngày
  const updateCell = (
    doctorId: number,
    dayKey: string,
    clinicId: number | null
  ) => {
    setTableSchedules((prev) => {
      const newSchedule = { ...prev };
      if (!newSchedule[doctorId]) {
        newSchedule[doctorId] = {};
      }
      if (clinicId === null || clinicId === 0) {
        const { [dayKey]: removed, ...rest } = newSchedule[doctorId];
        newSchedule[doctorId] = rest;
      } else {
        newSchedule[doctorId] = {
          ...newSchedule[doctorId],
          [dayKey]: clinicId,
        };
      }
      return newSchedule;
    });
  };

  const getCellValue = (doctorId: number, dayKey: string): number | null => {
    return tableSchedules[doctorId]?.[dayKey] || null;
  };

  // // Chuyển đổi dữ liệu bảng thành định dạng gửi lên API
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
        const clinicId = daySchedule[day.key];

        if (doctorId && clinicId) {
          const doctor = doctors.find((d: any) => d.id === doctorId);
          const roomId =
            doctor?.room?.id ||
            doctor?.roomId ||
            doctor?.defaultRoomId ||
            0;

          dailyAssignments[day.key].push({
            doctorId,
            clinicId,
            roomId,
            chairId: 0,
            startTime: FULL_DAY_SHIFT.startTime,
            endTime: FULL_DAY_SHIFT.endTime,
            note: undefined,
          });
        }
      });
    });

    return {
      weekStart,
      dailyAssignments,
      note: note || undefined,
    };
  };

  // // Kiểm tra hợp lệ lịch ở backend (nhận lỗi từ API)
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
        toast.success("Schedule is valid!");
      } else {
        const errors = response.data.errors || [];
        if (errors.length > 0) {
          if (errors.length > 5) {
            const firstErrors = errors.slice(0, 5);
            const remainingCount = errors.length - 5;
            toast.error(
              `Found ${errors.length} errors:\n${firstErrors.join(
                "\n"
              )}\n... and ${remainingCount} more errors.`,
              {
                autoClose: 8000,
                style: { whiteSpace: "pre-line" },
              }
            );
          } else {
            toast.error(
              `Found ${errors.length} errors:\n${errors.join("\n")}`,
              {
                autoClose: 8000,
                style: { whiteSpace: "pre-line" },
              }
            );
          }
        }
      }
    } catch (err: any) {
      console.error("Error validating schedule:", err);
      let errorMsg = "Error during validation";

      if (err?.response?.data) {
        const errorData = err.response.data;
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const errors = errorData.errors;
          if (errors.length > 5) {
            errorMsg = `Found ${errors.length} errors:\n${errors
              .slice(0, 5)
              .join("\n")}\n... and ${errors.length - 5} more errors.`;
          } else {
            errorMsg = `Found ${errors.length} errors:\n${errors.join("\n")}`;
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

  // // Kiểm tra hợp lệ lịch ở frontend: Mỗi phòng ban có bác sĩ ở tất cả cơ sở mỗi ngày
  const validateScheduleFrontend = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const clinicIds = clinics.map((c) => c.id).sort();
    if (clinicIds.length !== 2) {
      errors.push(
        `There must be exactly 2 clinics. Currently there are ${clinics.length}.`
      );
      return { isValid: false, errors };
    }
    const [clinic1Id, clinic2Id] = clinicIds;
    daysOfWeek.forEach((day) => {
      const dayAssignments: { [doctorId: number]: number } = {};

      Object.entries(tableSchedules).forEach(([doctorIdStr, daySchedule]) => {
        const doctorId = Number(doctorIdStr);
        const clinicId = daySchedule[day.key];
        if (clinicId) {
          dayAssignments[doctorId] = clinicId;
        }
      });

      const workingClinicIds = new Set<number>();
      Object.values(dayAssignments).forEach((clinicId) => {
        workingClinicIds.add(clinicId);
      });
      const numWorkingClinics = workingClinicIds.size;
      if (numWorkingClinics === 0) {
        return; // bỏ qua ngày nghỉ (không có bác sĩ làm)
      }

      departmentNames.forEach((deptName) => {
        const deptDoctors = doctorsByDepartment[deptName];
        if (!deptDoctors || deptDoctors.length === 0) {
          return; // bỏ qua phòng không có bác sĩ
        }
        const deptDoctorIds = deptDoctors.map((d: any) => d.id);
        const assignedDoctorsInDept = deptDoctorIds.filter((id: number) =>
          dayAssignments.hasOwnProperty(id)
        );

        if (numWorkingClinics === 1) {
          const workingClinicId = Array.from(workingClinicIds)[0];
          const hasDoctorInWorkingClinic = assignedDoctorsInDept.some(
            (doctorId: number) => dayAssignments[doctorId] === workingClinicId
          );
          if (!hasDoctorInWorkingClinic) {
            const clinicName =
              clinics.find((c) => c.id === workingClinicId)?.name ||
              `Clinic ${workingClinicId}`;
            errors.push(
              `${day.label} (${day.dateString}): Department "${deptName}" lacks doctor at ${clinicName}.`
            );
          }
        } else if (numWorkingClinics === 2) {
          const hasClinic1 = assignedDoctorsInDept.some(
            (doctorId: number) => dayAssignments[doctorId] === clinic1Id
          );
          const hasClinic2 = assignedDoctorsInDept.some(
            (doctorId: number) => dayAssignments[doctorId] === clinic2Id
          );

          if (!hasClinic1) {
            const clinic1Name =
              clinics.find((c) => c.id === clinic1Id)?.name ||
              `Clinic ${clinic1Id}`;
            errors.push(
              `${day.label} (${day.dateString}): Department "${deptName}" lacks doctor at ${clinic1Name}.`
            );
          }
          if (!hasClinic2) {
            const clinic2Name =
              clinics.find((c) => c.id === clinic2Id)?.name ||
              `Clinic ${clinic2Id}`;
            errors.push(
              `${day.label} (${day.dateString}): Department "${deptName}" lacks doctor at ${clinic2Name}.`
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

  // // Tạo lịch (submit + tạo API)
  const handleSubmit = async () => {
    const hasAnyAssignment = Object.values(tableSchedules).some((daySchedule) =>
      Object.values(daySchedule).some((clinicId) => clinicId !== null)
    );

    if (!hasAnyAssignment) {
      toast.error(
        "Please assign at least one doctor at one clinic for at least one day"
      );
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

      toast.success(
        `Successfully created ${response.data.length} work shifts!`
      );
      setTimeout(() => {
        navigate("/hr/schedules");
      }, 1500);
    } catch (err: any) {
      console.error("Error creating schedule:", err);
      let errorMsg = "Cannot create work schedule";

      if (err?.response?.data) {
        const errorData = err.response.data;
        if (errorData.errors && Array.isArray(errorData.errors)) {
          errorMsg = errorData.errors.join(", ");
        } else {
          errorMsg = errorData.message || errorData.error || errorMsg;
        }
      } else if (err?.message) {
        errorMsg = err.message;
      }

      toast.error(errorMsg);
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
                Create Weekly Schedule
              </h1>
              <p className="text-gray-600">
                Assign work schedule for doctors by week
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
                      // Kiểm tra có đúng là thứ 2 không, nếu không thì tự chuyển về thứ 2 gần nhất
                      if (date.getDay() !== 1) {
                        toast.warning(
                          "Please select a Monday. Automatically adjusted..."
                        );
                        const day = date.getDay();
                        const diff = day === 0 ? -6 : 1 - day;
                        date.setDate(date.getDate() + diff);
                        const correctedMonday = date
                          .toISOString()
                          .split("T")[0];
                        // Chỉ cho chọn tuần tiếp theo trở đi
                        if (correctedMonday < getNextMonday()) {
                          toast.error(
                            "Only allowed to schedule for next week and later. Defaulted to next week."
                          );
                          setWeekStart(getNextMonday());
                        } else {
                          setWeekStart(correctedMonday);
                        }
                      } else {
                        if (selectedDate < getNextMonday()) {
                          toast.error(
                            "Only allowed to schedule for next week and later. Defaulted to next week."
                          );
                          setWeekStart(getNextMonday());
                        } else {
                          setWeekStart(selectedDate);
                        }
                      }
                    }}
                    min={getNextMonday()}
                    className="border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Pick start week"
                  />
                  <button
                    onClick={() => {
                      const nextMonday = getNextMonday();
                      setWeekStart(nextMonday);
                    }}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm font-medium"
                  >
                    Next week
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Select Monday of the week to create schedule for. Only allowed for next week and later (current week is already scheduled).
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 mb-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Assign clinics
              </h2>
              <p className="text-sm text-gray-600">
                Specify a clinic for each doctor per day. Each doctor will work full day (08:00 - 17:00) at selected clinic.
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
                        Loading doctors...
                      </td>
                    </tr>
                  ) : (
                    departmentNames.map((deptName, deptIndex) => {
                      const deptDoctors = doctorsByDepartment[deptName];
                      let globalIndex = 0;
                      // tính global index
                      for (let i = 0; i < deptIndex; i++) {
                        globalIndex +=
                          doctorsByDepartment[departmentNames[i]].length;
                      }
                      return (
                        <React.Fragment key={deptName}>
                          <tr className="bg-gray-100">
                            <td
                              colSpan={daysOfWeek.length + 2}
                              className="border border-gray-300 px-4 py-2 font-semibold text-gray-800 bg-gray-100"
                            >
                              {deptName} ({deptDoctors.length} doctors)
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
                                {daysOfWeek.map((day) => (
                                  <td
                                    key={day.key}
                                    className="border border-gray-300 px-4 py-3"
                                  >
                                    <select
                                      value={getCellValue(doctor.id, day.key) || ""}
                                      onChange={(e) =>
                                        updateCell(
                                          doctor.id,
                                          day.key,
                                          e.target.value
                                            ? Number(e.target.value)
                                            : null
                                        )
                                      }
                                      className="w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      aria-label={`${
                                        doctor.fullName || doctor.name
                                      } - ${day.label}`}
                                    >
                                      <option value="">
                                        -- Select clinic --
                                      </option>
                                      {clinics.map((clinic) => (
                                        <option key={clinic.id} value={clinic.id}>
                                          {clinic.name || `Clinic ${clinic.id}`}
                                        </option>
                                      ))}
                                    </select>
                                  </td>
                                ))}
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
              General note (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Notes about this work schedule..."
            />
          </div>

          <div className="flex gap-4 justify-end">
            <button
              onClick={validateSchedule}
              disabled={validating || submitting}
              className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition disabled:opacity-50 flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              {validating ? "Validating..." : "Validate schedule"}
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || validating}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              {submitting ? "Creating..." : "Create schedule"}
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
