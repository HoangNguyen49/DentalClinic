import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";

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
  // cho phép null để phân biệt lịch đang ở hàng chờ
  doctor: { id: number; fullName: string } | null;
  startDateTime: string;
  endDateTime: string;
  status: string;
  services: { serviceName: string }[];
  note?: string;
}

// =====================
// Helper functions
// =====================
const pad = (n: number) => n.toString().padStart(2, "0");

const getVerticalStyle = (startStr: string, endStr: string) => {
  let startH: number, startM: number, endH: number, endM: number;

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
  // có thể null nếu kéo từ hàng chờ
  sourceDoctorId: number | null;
  currentX: number;
  currentY: number;
  offsetX: number;
  offsetY: number;
  cardWidth: number;
};

export default function ReceptionDashboard() {
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

  // slot highlight (top px tương ứng slot 15p đang hover)
  const [hoverSlotTop, setHoverSlotTop] = useState<number | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null); // vùng cột bác sĩ

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
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);

    // Auto scroll 1 lần khi mount
    if (scrollRef.current) {
      const currentHour = new Date().getHours();
      if (currentHour > START_HOUR) {
        scrollRef.current.scrollTop =
          (currentHour - START_HOUR) * HOUR_HEIGHT - 50;
      }
    }

    return () => clearInterval(timer);
  }, []);

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

  // các lịch chưa có doctor -> hàng chờ
  const queueAppointments = appointments.filter((a) => !a.doctor);

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

      // tính slot 15p đang hover để highlight
      if (gridRef.current) {
        const rect = gridRef.current.getBoundingClientRect();
        const yInside = e.clientY - rect.top;
        const slotHeight = HOUR_HEIGHT / 4; // 15 phút = 1/4 giờ

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

  const getDoctorAndTimeFromPointer = (
    clientX: number,
    clientY: number
  ): { targetDoctorId: number; newStartDate: Date } | null => {
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
    const newStartDate = new Date(newStartIsoLocal);

    return { targetDoctorId: targetDoctor.id, newStartDate };
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
    // kết thúc drag (ẩn overlay & bỏ listener, clear highlight)
    cleanupDrag();

    if (!info) return;

    const { targetDoctorId, newStartDate } = info;

    // mở modal confirm
    setPendingReschedule({
      appt: current.appt,
      targetDoctorId,
      newStartDate,
    });
  };

  const startDrag = (
    e: React.MouseEvent<HTMLDivElement>,
    appt: AppointmentDTO,
    sourceDoctorId: number | null
  ) => {
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

  // =====================
  // Confirm handlers
  // =====================
  const handleConfirmReschedule = async () => {
    if (!pendingReschedule) return;

    const { appt, targetDoctorId, newStartDate } = pendingReschedule;

    try {
      const token = localStorage.getItem("accessToken");
      await axios.patch(
        `${API_BASE_URL}/api/reception/appointments/${appt.id}/reschedule`,
        {
          newStartDateTime: newStartDate.toISOString(),
          newDoctorId: targetDoctorId,
          reason: "Drag & Drop",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Dời lịch thành công! ✅");
      fetchData();
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Không thể dời lịch.";
      toast.error(msg);
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
      {/* PAGE HEADER */}
      <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center shadow-sm z-30">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-gray-800">Lịch Tổng Quát</h2>
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
            <option value="">🏥 Phòng khám của tôi</option>
            <option value="1">📍 Clinic Q1</option>
            <option value="2">📍 Clinic Q9</option>
          </select>
        </div>
        <button className="bg-[#3366FF] text-white px-4 py-2 rounded-lg font-bold shadow-md hover:bg-blue-700 transition">
          + Đặt Lịch
        </button>
      </div>

      {/* === KHU VỰC HÀNG CHỜ (QUEUE BAR) === */}
      <div className="bg-orange-50 border-b border-orange-200 p-3 flex items-center min-h-[90px] relative shadow-inner z-20">
        {/* Label Hàng Chờ */}
        <div className="flex flex-col items-center justify-center px-4 shrink-0 border-r border-orange-200 mr-2 h-full">
          <span className="font-bold text-orange-800 text-xs uppercase tracking-wider">
            Hàng Chờ
          </span>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[10px] text-orange-600">Chưa xếp:</span>
            <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
              {queueAppointments.length}
            </span>
          </div>
        </div>

        {/* Danh sách Bong bóng (Scroll ngang) */}
        <div className="flex gap-3 px-2 items-center overflow-x-auto flex-1 no-scrollbar py-1">
          {queueAppointments.length === 0 ? (
            <span className="text-sm text-gray-400 italic ml-2">
              Hiện không có lịch hẹn nào cần xếp.
            </span>
          ) : (
            queueAppointments.map((appt) => (
              <div
                key={appt.id}
                // Kéo từ hàng chờ -> sourceDoctorId là NULL
                onMouseDown={(e) => startDrag(e, appt, null)}
                className="
                  w-52 bg-white border-l-4 border-orange-400 rounded-lg shadow-sm p-2 cursor-grab active:cursor-grabbing 
                  hover:shadow-md hover:-translate-y-0.5 transition-all select-none shrink-0 flex flex-col gap-1 group
                "
                title="Kéo thả xuống lịch bác sĩ để gán"
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

                  {/* Hiển thị buổi (Sáng/Chiều) dựa trên giờ placeholder (8h hoặc 13h) */}
                  <span className="text-[9px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">
                    {new Date(appt.startDateTime).getHours() < 12
                      ? "CA SÁNG"
                      : "CA CHIỀU"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {loading ? (
          <div className="p-20 text-center text-gray-500">Đang tải...</div>
        ) : (
          <div className="flex flex-1 overflow-hidden">
            {/* SCROLLABLE GRID */}
            <div
              className="flex-1 overflow-y-auto relative flex flex-col"
              ref={scrollRef}
            >
              {/* STICKY ROW: time header (blank) + doctor headers */}
              <div className="sticky top-0 z-20 flex bg-white border-b border-gray-200">
                {/* Blank cell cho cột giờ */}
                <div className="w-16 shrink-0 bg-white border-r border-gray-200" />
                {/* Header từng bác sĩ canh thẳng cột */}
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

              {/* MAIN GRID: time column + doctor columns */}
              <div className="flex flex-1">
                {/* TIME COLUMN */}
                <div className="w-16 shrink-0 bg-white border-r border-gray-200 z-10 relative">
                  {hours.map((h) => (
                    <div
                      key={h}
                      style={{ height: `${HOUR_HEIGHT}px` }}
                      className="relative border-b border-gray-100"
                    >
                      {/* giờ tròn */}
                      <span className="absolute top-1 right-1 text-xs font-bold text-gray-500">
                        {h}:00
                      </span>

                      {/* hiển thị thêm 8:15 / 8:30 / 8:45 khi đang kéo */}
                      {dragState && (
                        <>
                          <span className="absolute top-1/4 right-1 text-[10px] text-gray-400">
                            {h}:{pad(15)}
                          </span>
                          <span className="absolute top-1/2 right-1 text-[10px] text-gray-400">
                            {h}:{pad(30)}
                          </span>
                          <span className="absolute top-3/4 right-1 text-[10px] text-gray-400">
                            {h}:{pad(45)}
                          </span>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {/* DOCTOR COLUMNS + BACKGROUND GRID */}
                <div className="flex flex-1 relative min-w-max" ref={gridRef}>
                  {/* BACKGROUND GRID: ngang + 30p dotted */}
                  <div className="absolute inset-0 flex flex-col pointer-events-none z-0">
                    {hours.map((h) => (
                      <div
                        key={h}
                        style={{ height: `${HOUR_HEIGHT}px` }}
                        className="border-b border-gray-200 w-full relative"
                      >
                        {/* 30p */}
                        <div className="absolute top-1/2 w-full border-b border-dotted border-gray-200" />

                        {/* thêm vạch 15p & 45p khi đang drag */}
                        {dragState && (
                          <>
                            <div className="absolute top-1/4 w-full border-b border-dotted border-gray-100" />
                            <div className="absolute top-3/4 w-full border-b border-dotted border-gray-100" />
                          </>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* HIGHLIGHT SLOT 15P ĐANG HOVER*/}
                  {dragState && hoverSlotTop !== null && (
                    <div
                      className="absolute left-0 right-0 z-10 pointer-events-none"
                      style={{
                        top: hoverSlotTop,
                        height: HOUR_HEIGHT / 4,
                      }}
                    >
                      <div className="h-full w-full bg-blue-200/30 border-y border-blue-300/60 rounded-sm transform scale-y-110 transition-transform" />
                    </div>
                  )}

                  {/* CURRENT TIME LINE */}
                  {currentHourPos > 0 && (
                    <div
                      className="absolute left-0 right-0 h-0.5 bg-red-500 z-30 pointer-events-none flex items-center"
                      style={{ top: `${currentHourPos}px` }}
                    >
                      <div className="w-full bg-red-500 h-[1px]" />
                      <div className="absolute left-0 -ml-1 w-2 h-2 bg-red-500 rounded-full" />
                    </div>
                  )}

                  {/* CỘT TỪNG BÁC SĨ */}
                  {uniqueDoctors.map((doc) => {
                    if (!doc) return null;

                    const docSchedules = schedules.filter(
                      (s) => s.doctor.id === doc.id
                    );
                    const docAppointments = appointments.filter(
                      (a) => a.doctor && a.doctor.id === doc.id
                    );

                    return (
                      <div
                        key={doc.id}
                        className="flex-1 min-w-[220px] border-r border-gray-200 relative hover:bg-blue-50/10 transition-colors"
                      >
                        {/* Ca làm việc (nền màu nhạt) */}
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

                        {/* Lịch hẹn (cards) */}
                        {docAppointments.map((appt) => {
                          const isDraggingThis =
                            dragState?.appt.id === appt.id;

                          return (
                            <div
                              key={`appt-${appt.id}`}
                              onMouseDown={(e) => startDrag(e, appt, doc.id)}
                              className={`
                                absolute left-2 right-2 rounded-md shadow-sm cursor-grab 
                                hover:shadow-md hover:z-50 transition-all select-none flex flex-col p-3
                                bg-white border
                                ${getStatusColor(appt.status)}
                                ${
                                  isDraggingThis ? "opacity-0" : "opacity-100"
                                }
                              `}
                              style={getVerticalStyle(
                                appt.startDateTime,
                                appt.endDateTime
                              )}
                            >
                              {/* Tên bệnh nhân */}
                              <div className="text-[15px] font-semibold text-gray-900 truncate leading-tight">
                                {appt.patient.fullName}
                              </div>

                              {/* Dịch vụ */}
                              <div className="text-[13px] text-gray-700 mt-1 truncate">
                                {appt.services[0]?.serviceName}
                              </div>

                              {/* Giờ */}
                              <div className="text-[13px] text-gray-500 font-semibold mt-auto">
                                {new Date(appt.startDateTime).getHours()}:
                                {pad(
                                  new Date(appt.startDateTime).getMinutes()
                                )}{" "}
                                - {new Date(appt.endDateTime).getHours()}:
                                {pad(new Date(appt.endDateTime).getMinutes())}
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
          </div>
        )}
      </div>

      {/* OVERLAY CARD THEO CHUỘT */}
      {dragState && (
        <div
          className="pointer-events-none fixed z-[9999]"
          style={{
            left: dragState.currentX - dragState.offsetX,
            top: dragState.currentY - dragState.offsetY,
            width: dragState.cardWidth,
          }}
        >
          <div className="rounded-md shadow-lg bg-white border border-yellow-400 p-3 opacity-95">
            <div className="text-[15px] font-semibold text-gray-900 truncate leading-tight">
              {dragState.appt.patient.fullName}
            </div>
            <div className="text-[13px] text-gray-700 mt-1 truncate">
              {dragState.appt.services[0]?.serviceName}
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRM DỜI LỊCH */}
      {pendingReschedule && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-5 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Xác nhận dời lịch
            </h3>

            <p className="text-sm text-gray-600 leading-relaxed">
              Bạn có chắc muốn dời lịch của{" "}
              <span className="font-semibold">
                {pendingReschedule.appt.patient.fullName}
              </span>{" "}
              sang{" "}
              <span className="font-mono">
                {pad(pendingReschedule.newStartDate.getHours())}:
                {pad(pendingReschedule.newStartDate.getMinutes())}
              </span>{" "}
              cho bác sĩ{" "}
              <span className="font-semibold">
                {(
                  doctorsList.find(
                    (d) => d.id === pendingReschedule.targetDoctorId
                  ) || pendingReschedule.appt.doctor
                )?.fullName || "được chọn"}
              </span>
              ?
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={handleCancelReschedule}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmReschedule}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#3366FF] hover:bg-blue-700 transition shadow-sm"
              >
                Dời lịch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
