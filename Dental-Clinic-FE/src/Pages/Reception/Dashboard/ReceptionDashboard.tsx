import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next"; // 1. Import i18n
import QuickBookingModal from "./QuickBookingModal";
import AppointmentEditModal from "./AppointmentEditModal";
import RoomSelectionModal from "./RoomSelectionModal";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
const START_HOUR = 8;
const END_HOUR = 18;
const HOUR_HEIGHT = 140;

export interface DoctorScheduleDTO {
  id: number;
  doctor: {
    id: number;
    fullName: string;
    specialty: string;
    avatarUrl: string;
  };
  clinic: { id: number; clinicName: string };
  room: { id: number; roomName: string } | null;
  workDate: string;
  startTime: string;
  endTime: string;
  status: string;
}

export interface AppointmentDTO {
  id: number;
  patient: { id: number; fullName: string; patientCode: string; phone: string };
  doctor: { id: number; fullName: string } | null;

  room?: { id: number; roomName: string; isPrivate: boolean } | null;

  // Thêm các trường cho List View
  clinic?: { id: number; clinicName: string };
  createdByUserName?: string;

  startDateTime: string;
  endDateTime: string;
  status: string;
  services: { serviceName: string }[];
  note?: string;
  appointmentType: string;
}

// =====================
// Helper functions
// =====================
const pad = (n: number) => n.toString().padStart(2, "0");

const formatDateTime = (isoString: string) => {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const getVerticalStyle = (startStr: string, endStr: string) => {
  let startH, startM, endH, endM;

  if (startStr.includes("T")) {
    const s = new Date(startStr);
    const e = new Date(endStr);
    startH = s.getHours();
    startM = s.getMinutes();
    endH = e.getHours();
    endM = e.getMinutes();
  } else {
    [startH, startM] = startStr.split(":").map(Number);
    [endH, endM] = endStr.split(":").map(Number);
  }

  const startOffset =
    (startH - START_HOUR) * HOUR_HEIGHT + (startM / 60) * HOUR_HEIGHT;
  const durationHours = endH + endM / 60 - (startH + startM / 60);

  return {
    top: `${startOffset}px`,
    height: `${durationHours * HOUR_HEIGHT}px`,
  };
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "CONFIRMED":
      return "bg-blue-50 border-l-4 border-blue-500 text-blue-700";
    case "PENDING":
      return "bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800";
    case "IN_PROGRESS":
      return "bg-green-50 border-l-4 border-green-500 text-green-700 animate-pulse";
    case "COMPLETED":
      return "bg-gray-100 border-l-4 border-gray-400 text-gray-500 grayscale";
    default:
      return "bg-white border-l-4 border-gray-300";
  }
};

// =====================
// Custom drag state
// =====================
type DragState = {
  appt: AppointmentDTO;
  sourceDoctorId: number | null;
  currentX: number;
  currentY: number;
  offsetX: number;
  offsetY: number;
  cardWidth: number;
};

export default function ReceptionDashboard() {
  const { t } = useTranslation("reception"); // 2. Khởi tạo hook translation

  // VIEW MODE STATE
  const [viewMode, setViewMode] = useState<"TIMELINE" | "LIST">("TIMELINE");
  const [showQuickBooking, setShowQuickBooking] = useState(false);
  const [schedules, setSchedules] = useState<DoctorScheduleDTO[]>([]);
  const [appointments, setAppointments] = useState<AppointmentDTO[]>([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedClinicId, setSelectedClinicId] = useState<number | undefined>(
    undefined
  );
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // custom drag
  const [dragState, setDragState] = useState<DragState | null>(null);
  const dragStateRef = useRef<DragState | null>(null);

  // confirm modal
  const [pendingReschedule, setPendingReschedule] = useState<{
    appt: AppointmentDTO;
    targetDoctorId: number;
    newStartDate: Date;
  } | null>(null);

  // slot highlight
  const [hoverSlotTop, setHoverSlotTop] = useState<number | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [editingAppt, setEditingAppt] = useState<AppointmentDTO | null>(null);

  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [apptToAssignRoom, setApptToAssignRoom] =
    useState<AppointmentDTO | null>(null);

  // 3. DI CHUYỂN HÀM getStatusBadge VÀO TRONG ĐỂ DÙNG t()
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return (
          <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200">
            {t("status.CONFIRMED")}
          </span>
        );
      case "PENDING":
        return (
          <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-700 text-xs font-bold border border-yellow-200">
            {t("status.PENDING")}
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-bold border border-green-200">
            {t("status.IN_PROGRESS")}
          </span>
        );
      case "COMPLETED":
        return (
          <span className="px-2 py-1 rounded bg-gray-100 text-gray-600 text-xs font-bold border border-gray-200">
            {t("status.COMPLETED")}
          </span>
        );
      case "CANCELLED":
        return (
          <span className="px-2 py-1 rounded bg-red-100 text-red-600 text-xs font-bold border border-red-200">
            {t("status.CANCELLED")}
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 rounded bg-gray-100 text-gray-600 text-xs">
            {status}
          </span>
        );
    }
  };

  // HÀM MỞ MODAL (Dùng cho nút trong List View)
  const handleOpenRoomModal = (appt: AppointmentDTO) => {
    // Chặn nếu lịch đã huỷ
    const restrictedStatuses = ["COMPLETED", "CANCELLED", "IN_PROGRESS"];

    if (restrictedStatuses.includes(appt.status)) {
      toast.warning(
        `Không thể xếp phòng cho lịch hẹn đang ở trạng thái ${t(
          `status.${appt.status}`
        )}`
      );
      return;
    }
    setApptToAssignRoom(appt);
    setIsRoomModalOpen(true);
  };

  // HÀM UPDATE SAU KHI XẾP PHÒNG XONG
  const handleRoomAssignSuccess = (updatedAppt: AppointmentDTO) => {
    // Cập nhật ngay vào danh sách appointments (List View tự đổi màu)
    setAppointments((prev) =>
      prev.map((a) => (a.id === updatedAppt.id ? updatedAppt : a))
    );
    
  };

  // =====================
  // API calls
  // =====================
  const fetchData = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    setLoading(true);
    try {
      const params: any = { date: selectedDate };
      if (selectedClinicId) params.clinicId = selectedClinicId;

      const config = {
        params,
        headers: { Authorization: `Bearer ${token}` },
      };

      const [schedRes, apptRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/reception/schedules`, config),
        axios.get(`${API_BASE_URL}/api/reception/appointments`, config),
      ]);

      setSchedules(schedRes.data as DoctorScheduleDTO[]);
      setAppointments(apptRes.data as AppointmentDTO[]);
    } catch (error) {
      console.error(error);
      toast.error("Lỗi tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate, selectedClinicId]);

  useEffect(() => {
    // Chỉ chạy timer khi ở mode Timeline
    if (viewMode === "LIST") return;

    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    if (scrollRef.current) {
      const currentHour = new Date().getHours();
      if (currentHour > START_HOUR) {
        scrollRef.current.scrollTop =
          (currentHour - START_HOUR) * HOUR_HEIGHT - 50;
      }
    }
    return () => clearInterval(timer);
  }, [viewMode]);

  // =====================
  // Data prep
  // =====================
  const hours = Array.from(
    { length: END_HOUR - START_HOUR + 1 },
    (_, i) => START_HOUR + i
  );

  const currentHourPos =
    (currentTime.getHours() - START_HOUR) * HOUR_HEIGHT +
    (currentTime.getMinutes() / 60) * HOUR_HEIGHT;

  const uniqueDoctors = Array.from(
    new Set(schedules.map((s) => s.doctor.id))
  ).map((id) => schedules.find((s) => s.doctor.id === id)?.doctor);

  const doctorsList = uniqueDoctors.filter(
    (d): d is NonNullable<(typeof uniqueDoctors)[number]> => !!d
  );
  // Chỉ lấy những lịch KHÁC 'CANCELLED' (và 'REJECTED' nếu có)
  const activeAppointments = appointments.filter(
    (a) => a.status !== "CANCELLED" && a.status !== "REJECTED"
  );

  const assignedAppointments = activeAppointments.filter(
    (a) => a.doctor !== null
  );

  const queueAppointments = activeAppointments.filter((a) => a.doctor === null);

  // 2. Dữ liệu cho List View (Giữ nguyên tất cả để xem lịch sử)
  const sortedAppointments = [...appointments].sort(
    (a, b) =>
      new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
  );

  // =====================
  // Custom drag helpers
  // =====================
  const handleDragMove = (e: MouseEvent) => {
    setDragState((prev) => {
      if (!prev) return prev;
      const next: DragState = {
        ...prev,
        currentX: e.clientX,
        currentY: e.clientY,
      };
      dragStateRef.current = next;

      if (gridRef.current) {
        const rect = gridRef.current.getBoundingClientRect();
        const yInside = e.clientY - rect.top;
        const slotHeight = HOUR_HEIGHT / 4;

        if (yInside < 0 || yInside > rect.height) {
          setHoverSlotTop(null);
        } else {
          const slotIndex = Math.round(yInside / slotHeight);
          setHoverSlotTop(slotIndex * slotHeight);
        }
      }
      return next;
    });
  };

  const getDoctorAndTimeFromPointer = (clientX: number, clientY: number) => {
    if (!gridRef.current || doctorsList.length === 0) return null;
    const rect = gridRef.current.getBoundingClientRect();
    const xInside = clientX - rect.left;
    const yInside = clientY - rect.top;
    if (xInside < 0 || yInside < 0) return null;

    const colWidth = rect.width / doctorsList.length;
    const colIndex = Math.min(
      doctorsList.length - 1,
      Math.max(0, Math.floor(xInside / colWidth))
    );
    const targetDoctor = doctorsList[colIndex];
    if (!targetDoctor) return null;

    const hourDecimal = START_HOUR + yInside / HOUR_HEIGHT;
    const snappedHourDecimal = Math.round(hourDecimal * 4) / 4;
    const newStartHour = Math.floor(snappedHourDecimal);
    const newStartMinute = (snappedHourDecimal - newStartHour) * 60;
    const newStartIsoLocal = `${selectedDate}T${pad(newStartHour)}:${pad(
      newStartMinute
    )}:00`;

    return {
      targetDoctorId: targetDoctor.id,
      newStartDate: new Date(newStartIsoLocal),
    };
  };

  const cleanupDrag = () => {
    dragStateRef.current = null;
    setDragState(null);
    setHoverSlotTop(null);
    window.removeEventListener("mousemove", handleDragMove);
    window.removeEventListener("mouseup", handleDragEnd);
  };

  const handleDragEnd = (e: MouseEvent) => {
    const current = dragStateRef.current;
    if (!current) {
      cleanupDrag();
      return;
    }
    const info = getDoctorAndTimeFromPointer(e.clientX, e.clientY);
    cleanupDrag();
    if (!info) return;
    setPendingReschedule({
      appt: current.appt,
      targetDoctorId: info.targetDoctorId,
      newStartDate: info.newStartDate,
    });
  };

  const startDrag = (
    e: React.MouseEvent<HTMLDivElement>,
    appt: AppointmentDTO,
    sourceDoctorId: number | null
  ) => {
    if (appt.status === "IN_PROGRESS" || appt.status === "COMPLETED") {
      toast.info(
        t("dashboard.cannotMoveStatus", {
          status: t(`status.${appt.status}`),
        }) || `Không thể dời lịch đang ở trạng thái ${appt.status}`
      );
      return;
    }
    e.preventDefault();
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const baseState: DragState = {
      appt,
      sourceDoctorId,
      currentX: e.clientX,
      currentY: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      cardWidth: rect.width,
    };
    dragStateRef.current = baseState;
    setDragState(baseState);
    window.addEventListener("mousemove", handleDragMove);
    window.addEventListener("mouseup", handleDragEnd);
  };

  const handleConfirmReschedule = async () => {
    if (!pendingReschedule) return;
    const { appt, targetDoctorId, newStartDate } = pendingReschedule;
    try {
      const token = localStorage.getItem("accessToken");
      const newStatus = appt.status === "PENDING" ? "SCHEDULED" : appt.status;
      const payload: any = {
        newStartDateTime: newStartDate.toISOString(),
        newDoctorId: targetDoctorId,
        status: newStatus,
        reason: "Drag & Drop",
      };
      await axios.patch(
        `${API_BASE_URL}/api/reception/appointments/${appt.id}/reschedule`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(t("dashboard.moveSuccess"));
      fetchData();
    } catch (error: any) {
      const serverMessage = error?.response?.data?.message;

      if (serverMessage) {
        toast.error(serverMessage);
      } else {
        toast.error(t("dashboard.moveError"));
      }
      console.error("Reschedule Detail Error:", error.response?.data);
    } finally {
      setPendingReschedule(null);
    }
  };

  const handleCancelReschedule = () => {
    setPendingReschedule(null);
  };

  // =====================
  // Render
  // =====================
  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col bg-gray-50 rounded-xl shadow-sm border border-gray-200 overflow-hidden font-instrument">
      {/* HEADER */}
      <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center shadow-sm z-30">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-gray-800">
            {t("dashboard.title")}
          </h2>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border p-2 rounded-lg text-sm shadow-sm"
          />
          <select
            onChange={(e) =>
              setSelectedClinicId(
                e.target.value ? Number(e.target.value) : undefined
              )
            }
            value={selectedClinicId || ""}
            className="border p-2 rounded-lg text-sm shadow-sm"
          >
            <option value="">🏥 {t("dashboard.myClinic")}</option>
            <option value="1">📍 Clinic Q1</option>
            <option value="2">📍 Clinic Q9</option>
          </select>

          {/* --- NÚT CHUYỂN ĐỔI VIEW --- */}
          <div className="flex bg-gray-100 rounded-lg p-1 ml-4 border border-gray-200">
            <button
              onClick={() => setViewMode("TIMELINE")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === "TIMELINE"
                  ? "bg-white text-[#3366FF] shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                  clipRule="evenodd"
                />
              </svg>
              {t("dashboard.timeline")}
            </button>
            <button
              onClick={() => setViewMode("LIST")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === "LIST"
                  ? "bg-white text-[#3366FF] shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {t("dashboard.list")}
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowQuickBooking(true)}
          className="bg-[#3366FF] text-white px-4 py-2 rounded-lg font-bold shadow-md hover:bg-blue-700 transition"
        >
          + {t("dashboard.addBooking")}
        </button>
      </div>

      {/* BODY CONTAINER */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {loading ? (
          <div className="p-20 text-center text-gray-500">
            {t("list.loading")}
          </div>
        ) : (
          <>
            {/* === OPTION 1: TIMELINE VIEW === */}
            {viewMode === "TIMELINE" && (
              <>
                {/* QUEUE BAR */}
                <div className="bg-orange-50 border-b border-orange-200 p-3 flex items-center min-h-[90px] relative shadow-inner z-20 overflow-x-auto">
                  <div className="flex flex-col items-center justify-center px-4 shrink-0 border-r border-orange-200 mr-2 h-full">
                    <span className="font-bold text-orange-800 text-xs uppercase tracking-wider">
                      {t("dashboard.queue")}
                    </span>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[10px] text-orange-600">
                        {t("dashboard.unassigned")}:
                      </span>
                      <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                        {queueAppointments.length}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-3 px-2 items-center">
                    {queueAppointments.length === 0 ? (
                      <span className="text-sm text-gray-400 italic ml-2">
                        {t("dashboard.emptyQueue")}
                      </span>
                    ) : (
                      queueAppointments.map((appt) => (
                        <div
                          key={appt.id}
                          onMouseDown={(e) => startDrag(e, appt, null)}
                          onClick={() => setEditingAppt(appt)}
                          className="w-52 bg-white border-l-4 border-orange-400 rounded-lg shadow-sm p-2 cursor-grab active:cursor-grabbing hover:shadow-md hover:-translate-y-0.5 transition-all select-none shrink-0 flex flex-col gap-1 group"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-xs text-gray-900 truncate max-w-[120px]">
                              {appt.patient.fullName}
                            </span>
                            <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono">
                              {appt.patient.patientCode}
                            </span>
                          </div>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-[10px] text-gray-500 truncate max-w-[100px]">
                              {appt.services[0]?.serviceName}
                            </span>
                            <span className="text-[9px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">
                              {new Date(appt.startDateTime).getHours() < 12
                                ? t("dashboard.morningShift")
                                : t("dashboard.afternoonShift")}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* TIMELINE GRID */}
                <div className="flex flex-1 overflow-hidden">
                  <div
                    className="flex-1 overflow-y-auto relative flex flex-col"
                    ref={scrollRef}
                  >
                    <div className="sticky top-0 z-20 flex bg-white border-b border-gray-200 shadow-sm">
                      <div className="w-16 shrink-0 bg-white border-r border-gray-200" />
                      <div className="flex flex-1">
                        {uniqueDoctors.map((doc) =>
                          doc ? (
                            <div
                              key={doc.id}
                              className="flex-1 min-w-[220px] border-r border-gray-200 flex justify-center px-1 pt-1"
                            >
                              <div className="w-full bg-gray-900 text-white text-xs font-semibold py-2 rounded-t-md text-center shadow-sm">
                                {doc.fullName}
                              </div>
                            </div>
                          ) : null
                        )}
                      </div>
                    </div>
                    <div
                      className="flex flex-1 relative min-w-max"
                      ref={gridRef}
                    >
                      <div className="w-16 shrink-0 bg-white border-r border-gray-200 z-10 relative">
                        {hours.map((h) => (
                          <div
                            key={h}
                            style={{ height: `${HOUR_HEIGHT}px` }}
                            className="relative border-b border-gray-100"
                          >
                            <span className="absolute top-1 right-1 text-xs font-bold text-gray-500">
                              {h}:00
                            </span>
                            {dragState && (
                              <>
                                <span className="absolute top-1/4 right-1 text-[10px] text-gray-400">
                                  {h}:15
                                </span>
                                <span className="absolute top-1/2 right-1 text-[10px] text-gray-400">
                                  {h}:30
                                </span>
                                <span className="absolute top-3/4 right-1 text-[10px] text-gray-400">
                                  {h}:45
                                </span>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="absolute inset-0 flex flex-col pointer-events-none z-0">
                        {hours.map((h) => (
                          <div
                            key={h}
                            style={{ height: `${HOUR_HEIGHT}px` }}
                            className="border-b border-gray-200 w-full relative"
                          >
                            <div className="absolute top-1/2 w-full border-b border-dotted border-gray-100" />
                          </div>
                        ))}
                      </div>
                      {dragState && hoverSlotTop !== null && (
                        <div
                          className="absolute left-0 right-0 z-10 pointer-events-none"
                          style={{ top: hoverSlotTop, height: HOUR_HEIGHT / 4 }}
                        >
                          <div className="h-full w-full bg-blue-400/20 border-y border-blue-500/50" />
                        </div>
                      )}
                      {currentHourPos > 0 && (
                        <div
                          className="absolute left-0 right-0 h-0.5 bg-red-500 z-30 pointer-events-none"
                          style={{ top: `${currentHourPos}px` }}
                        >
                          <div className="absolute left-0 -ml-1 w-2 h-2 bg-red-500 rounded-full" />
                        </div>
                      )}

                      {/* DOCTOR COLUMNS */}
                      {uniqueDoctors.map((doc) => {
                        if (!doc) return null;
                        const docSchedules = schedules.filter(
                          (s) => s.doctor.id === doc.id
                        );
                        const docAppointments = assignedAppointments.filter(
                          (a) => a.doctor && a.doctor.id === doc.id
                        );
                        return (
                          <div
                            key={doc.id}
                            className="flex-1 min-w-[220px] border-r border-gray-200 relative hover:bg-blue-50/5 transition-colors"
                          >
                            {docSchedules.map((sche) => (
                              <div
                                key={`sch-${sche.id}`}
                                className="absolute left-2 right-2 bg-blue-50 border border-blue-100 rounded-lg flex flex-col justify-end p-1 pointer-events-none"
                                style={getVerticalStyle(
                                  sche.startTime,
                                  sche.endTime
                                )}
                              >
                                <span className="text-[9px] text-blue-300 font-bold uppercase text-right tracking-wide">
                                  {sche.room?.roomName}
                                </span>
                              </div>
                            ))}
                            {docAppointments.map((appt) => {
                              const isDraggingThis =
                                dragState?.appt.id === appt.id;

                              return (
                                <div
                                  key={`appt-${appt.id}`}
                                  onMouseDown={(e) =>
                                    startDrag(e, appt, doc.id)
                                  }
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingAppt(appt);
                                  }}
                                  className={`absolute left-1 right-1 rounded shadow-sm cursor-grab hover:shadow-md hover:z-50 transition-all select-none flex flex-col justify-between p-1.5 border-l-4 bg-white ${getStatusColor(
                                    appt.status
                                  )} ${
                                    isDraggingThis ? "opacity-0" : "opacity-100"
                                  } text-xs overflow-hidden leading-tight`}
                                  style={getVerticalStyle(
                                    appt.startDateTime,
                                    appt.endDateTime
                                  )}
                                >
                                  {/* 1. Tên Bệnh Nhân (Đậm, tự cắt nếu dài) */}
                                  <div className="flex justify-between items-start gap-1">
                                    <div>
                                      <div className="text-[13px] font-bold text-gray-900 truncate">
                                        {appt.patient.fullName}
                                      </div>
                                      <div className="text-[13px] text-slate-700 font-bold tracking-tight">
                                        {appt.patient.phone}
                                      </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                      <span
                                        className={`shrink-0 text-[12px] px-1 rounded border font-bold ${
                                          appt.appointmentType === "VIP"
                                            ? "bg-amber-100..."
                                            : "bg-slate-100..."
                                        }`}
                                      >
                                        {appt.appointmentType}
                                      </span>
                                      {/* Hiện icon note nếu có dữ liệu */}
                                      {appt.note && (
                                        <span
                                          title={appt.note}
                                          className="text-gray-400 cursor-help"
                                        >
                                          📝
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* 2. Badge Phòng (Thu nhỏ hết cỡ) */}
                                  {appt.room && (
                                    <div className="mt-0.5 shrink-0">
                                      <span
                                        className={`px-1 rounded border inline-flex items-center gap-1 max-w-full truncate text-[10px]
                                        ${
                                          appt.room.isPrivate
                                            ? "bg-purple-50 text-purple-700 border-purple-100"
                                            : "bg-blue-50 text-blue-700 border-blue-100"
                                        }
                                      `}
                                      >
                                        {appt.room.isPrivate ? "VIP" : "STD"}{" "}
                                        {appt.room.roomName}
                                      </span>
                                    </div>
                                  )}

                                  {/* 3. Tên Dịch Vụ (Màu xám, tự cắt) */}
                                  <div
                                    className="text-gray-600 truncate mt-0.5"
                                    title={appt.services[0]?.serviceName}
                                  >
                                    {appt.services[0]?.serviceName}
                                  </div>

                                  {/* 4. Thời gian (Luôn đẩy xuống đáy) */}
                                  <div className="text-gray-500 font-mono font-semibold mt-auto pt-1 text-[16px]">
                                    {new Date(appt.startDateTime).getHours()}:
                                    {pad(
                                      new Date(appt.startDateTime).getMinutes()
                                    )}{" "}
                                    - {new Date(appt.endDateTime).getHours()}:
                                    {pad(
                                      new Date(appt.endDateTime).getMinutes()
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* === OPTION 2: LIST VIEW === */}
            {viewMode === "LIST" && (
              <div className="flex-1 overflow-auto bg-gray-50 p-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm text-left text-gray-500 border-collapse">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0 z-10 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 font-bold">
                          {t("list.colTime")}
                        </th>
                        <th className="px-6 py-3 font-bold">
                          {t("list.colStatus")}
                        </th>
                        <th className="px-6 py-3 font-bold">
                          {t("roomModal.title")}
                        </th>
                        <th className="px-6 py-3 font-bold">Chi nhánh</th>
                        <th className="px-6 py-3 font-bold">
                          {t("list.colDoctor")}
                        </th>
                        <th className="px-6 py-3 font-bold">
                          {t("editModal.labelService")}
                        </th>
                        <th className="px-6 py-3 font-bold">
                          {t("list.colPatient")}
                        </th>
                        <th className="px-6 py-3 font-bold">Người lập</th>
                        <th className="px-6 py-3 text-center font-bold">
                          {t("list.colAction")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {sortedAppointments.map((appt) => (
                        <tr
                          key={appt.id}
                          className="bg-white hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                            {formatDateTime(appt.startDateTime)}
                          </td>
                          <td className="px-6 py-4">
                            {getStatusBadge(appt.status)}
                          </td>
                          {/* 👇 Ô HIỂN THỊ NÚT CHỌN PHÒNG */}
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => handleOpenRoomModal(appt)}
                              disabled={[
                                "COMPLETED",
                                "CANCELLED",
                                "IN_PROGRESS",
                              ].includes(appt.status)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1 mx-auto shadow-sm
                              ${
                                [
                                  "COMPLETED",
                                  "CANCELLED",
                                  "IN_PROGRESS",
                                ].includes(appt.status)
                                  ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                  : appt.room
                                  ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                                  : "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100 animate-pulse"
                              }
                          `}
                            >
                              {appt.room ? (
                                <>
                                  <span className="text-[10px] uppercase tracking-tighter opacity-80">
                                    {appt.room.isPrivate ? "Priv" : "Std"}
                                  </span>
                                  <span className="w-[1px] h-3 bg-current opacity-20 mx-1"></span>
                                  <span>{appt.room.roomName}</span>
                                </>
                              ) : (
                                <>
                                  <span>⚠️ {t("list.selectRoom")}</span>
                                </>
                              )}
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            {appt.clinic?.clinicName || "Clinic Q1"}
                          </td>
                          <td className="px-6 py-4">
                            {appt.doctor ? (
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">
                                  Dr
                                </div>
                                <span className="font-semibold text-gray-800">
                                  {appt.doctor.fullName}
                                </span>
                              </div>
                            ) : (
                              <span className="text-orange-500 italic text-xs bg-orange-50 px-2 py-1 rounded border border-orange-100">
                                {t("list.unassignedDoc")}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 max-w-xs">
                            <div
                              className="truncate"
                              title={appt.services[0]?.serviceName}
                            >
                              {appt.services[0]?.serviceName}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-gray-900">
                              {appt.patient.fullName}
                            </div>
                            <div className="text-xs text-gray-400 font-mono">
                              {appt.patient.patientCode}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-gray-600">
                              {appt.createdByUserName || "Admin"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => setEditingAppt(appt)}
                              className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition"
                              title="Chỉnh sửa"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {sortedAppointments.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                      <p>{t("list.noData")}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* DRAG OVERLAY (Giữ nguyên) */}
      {dragState && (
        <div
          className="pointer-events-none fixed z-[9999]"
          style={{
            left: dragState.currentX - dragState.offsetX,
            top: dragState.currentY - dragState.offsetY,
            width: dragState.cardWidth,
          }}
        >
          <div className="rounded shadow-xl bg-white border-2 border-blue-500 p-2 opacity-90 transform rotate-2 cursor-grabbing">
            <div className="font-bold text-sm text-gray-900 truncate">
              {dragState.appt.patient.fullName}
            </div>
            <div className="text-xs text-gray-600">
              {dragState.appt.services[0]?.serviceName}
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRM (Giữ nguyên) */}
      {pendingReschedule && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-800">
              {t("dashboard.dragConfirmTitle")}
            </h3>
            <p className="text-sm text-gray-600">
              <span
                dangerouslySetInnerHTML={{
                  __html: t("dashboard.dragConfirmDesc", {
                    patient: pendingReschedule.appt.patient.fullName,
                  }),
                }}
              />{" "}
              <span className="font-bold text-blue-600">
                {pad(pendingReschedule.newStartDate.getHours())}:
                {pad(pendingReschedule.newStartDate.getMinutes())}
              </span>
              ?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelReschedule}
                className="px-4 py-2 rounded-lg text-gray-600 bg-gray-100 hover:bg-gray-200"
              >
                {t("dashboard.cancel")}
              </button>
              <button
                onClick={handleConfirmReschedule}
                className="px-4 py-2 rounded-lg text-white bg-[#3366FF] hover:bg-blue-700 shadow-lg"
              >
                {t("dashboard.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      {showQuickBooking && (
        <QuickBookingModal
          onClose={() => setShowQuickBooking(false)}
          onSuccess={() => {
            setShowQuickBooking(false);
            fetchData();
          }}
        />
      )}

      {/* MODAL CHỈNH SỬA */}
      {editingAppt && (
        <AppointmentEditModal
          appointment={editingAppt}
          onClose={() => setEditingAppt(null)}
          onSuccess={() => {
            setEditingAppt(null);
            fetchData();
          }}
        />
      )}

      {/* MODAL CHỌN PHÒNG */}
      <RoomSelectionModal
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        appointment={apptToAssignRoom}
        onSuccess={handleRoomAssignSuccess}
      />
    </div>
  );
}
