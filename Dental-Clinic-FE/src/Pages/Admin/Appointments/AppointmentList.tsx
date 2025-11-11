import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import type { View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, addMinutes } from "date-fns";
import { vi } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useTranslation } from "react-i18next";
import CreateAppointmentForm from "./CreateAppointmentForm";

/** ====== Types từ BE (bạn có thể mở rộng thêm nếu có) ====== */
type Appointment = {
  appointmentId: number;
  appointmentDateTime: string; // ISO start
  // Nếu BE có endTime/duration => thêm vào đây để thay thế giả định 60'
  status: string;
  note?: string;
  patient?: { fullName: string };
  doctor?: { id?: number; fullName: string };
  service?: { serviceName: string };
  room?: { roomName: string };
  chair?: { chairNumber: string };
};

type RBEvent = {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resourceId?: string | number; // doctorId/roomId...
  meta: Appointment;
};

type Resource = {
  resourceId: string | number;
  resourceTitle: string;
};

const locales = { vi };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

function Toolbar({
  label,
  onNavigate,
  onView,
  view,
  date,
  setDate,
}: {
  label: string;
  onNavigate: (action: "TODAY" | "PREV" | "NEXT") => void;
  onView: (v: View) => void;
  view: View;
  date: Date;
  setDate: (d: Date) => void;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onNavigate("TODAY")}
          className="px-3 py-1 rounded border hover:bg-gray-100"
        >
          Today
        </button>
        <button
          onClick={() => onNavigate("PREV")}
          className="px-3 py-1 rounded border hover:bg-gray-100"
        >
          ‹
        </button>
        <button
          onClick={() => onNavigate("NEXT")}
          className="px-3 py-1 rounded border hover:bg-gray-100"
        >
          ›
        </button>
      </div>

      <div className="font-semibold text-[#0D1B3E]">{label}</div>

      <div className="ml-auto flex items-center gap-2">
        <input
          type="date"
          value={format(date, "yyyy-MM-dd")}
          onChange={(e) => {
            const parts = e.target.value.split("-");
            const d = new Date(
              Number(parts[0]),
              Number(parts[1]) - 1,
              Number(parts[2])
            );
            setDate(d);
          }}
          className="border rounded px-3 py-1"
        />
        <select
          value={view}
          onChange={(e) => onView(e.target.value as View)}
          className="border rounded px-3 py-1"
        >
          <option value={Views.DAY}>Day</option>
          <option value={Views.WEEK}>Week</option>
          <option value={Views.AGENDA}>Agenda</option>
        </select>
      </div>
    </div>
  );
}

export default function AppointmentCalendar() {
  const { t, i18n } = useTranslation("admin");
  const apiBase = useMemo(() => import.meta.env.VITE_API_URL, []);
  const [date, setDate] = useState<Date>(new Date());
  const [view, setView] = useState<View>(Views.DAY);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [events, setEvents] = useState<RBEvent[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [showCreate, setShowCreate] = useState<{
    open: boolean;
    defaultStart?: Date;
    defaultDoctorName?: string;
  }>({ open: false });

  const fetchAppointments = useCallback(async () => {
    try {
      // Backend nhận param date (ISO) — bạn đã có sẵn trong List.tsx
      const res = await axios.get<Appointment[]>(
        `${apiBase}/appointments?date=${date.toISOString()}`
      );
      setAppointments(res.data);
    } catch (err) {
      console.error("Lỗi khi lấy lịch hẹn:", err);
    }
  }, [apiBase, date]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Map doctor => resources (cột)
  useEffect(() => {
    const uniqueDoctors = Array.from(
      new Map(
        appointments
          .filter((a) => a.doctor?.fullName)
          .map((a) => [
            a.doctor?.fullName ?? "Unknown",
            {
              resourceId: a.doctor?.fullName ?? "Unknown",
              resourceTitle: a.doctor?.fullName ?? "Unknown",
            } as Resource,
          ])
      ).values()
    );
    // Nếu bạn muốn chia theo "Phòng" hoặc "Ghế", chỉ cần đổi key ở đây
    setResources(uniqueDoctors.length ? uniqueDoctors : [{ resourceId: "All", resourceTitle: "All" }]);

    // Map appointments -> events
    const mapped: RBEvent[] = appointments.map((a) => {
      const start = new Date(a.appointmentDateTime);

      // GIẢ ĐỊNH THỜI LƯỢNG 60p nếu BE chưa có trường end/duration
      // Nếu BE có `appointmentEndTime` hoặc `durationMinutes`, thay dòng dưới
      const end = addMinutes(start, 60);

      const title =
        `${a.patient?.fullName ?? ""}` +
        (a.service?.serviceName ? ` - ${a.service?.serviceName}` : "");

      return {
        id: a.appointmentId,
        title: title || t("appointment.untitled") || "Appointment",
        start,
        end,
        resourceId: a.doctor?.fullName ?? "All",
        meta: a,
      };
    });

    setEvents(mapped);
  }, [appointments, t]);

  // Style theo trạng thái
  const eventPropGetter = useCallback(
    (event: RBEvent) => {
      const s = event.meta.status?.toLowerCase() || "";
      let className = "";
      if (s.includes("cancel")) className = "border-red-400";
      else if (s.includes("done") || s.includes("complete")) className = "border-green-500";
      else if (s.includes("confirm")) className = "border-blue-500";
      else className = "border-orange-400";
      return {
        className: `!border-2 ${className} !rounded-lg !shadow`,
      };
    },
    []
  );

  const onSelectSlot = useCallback(
    (slotInfo: { start: Date; end: Date; resourceId?: string | number }) => {
      // Mở form tạo lịch, truyền mặc định thời điểm bắt đầu và bác sĩ (nếu có)
      setShowCreate({
        open: true,
        defaultStart: slotInfo.start,
        defaultDoctorName: String(slotInfo.resourceId || ""),
      });
    },
    []
  );

  const onSelectEvent = useCallback((event: RBEvent) => {
    // Tùy ý: mở modal chi tiết, hoặc đi tới trang detail
    const a = event.meta;
    alert(
      `${a.patient?.fullName ?? ""}\n` +
      `${format(event.start, "HH:mm")} - ${format(event.end, "HH:mm")}\n` +
      `${a.service?.serviceName ?? ""}\n` +
      `${a.room?.roomName ?? ""} • ${a.chair?.chairNumber ?? ""}\n` +
      `${a.status ?? ""}\n` +
      `${a.note ?? ""}`
    );
  }, []);

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#0D1B3E]">
          {t("pageTitles.appointmentCalendar") || "Appointment Calendar"}
        </h1>

        <button
          onClick={() => setShowCreate({ open: true })}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
        >
          + {t("actions.create") || "Create"}
        </button>
      </div>

      {/* Form tạo lịch (tái sử dụng component bạn đã có) */}
      {showCreate.open && (
        <CreateAppointmentForm
          onClose={() => setShowCreate({ open: false })}
          onSubmitSuccess={() => {
            setShowCreate({ open: false });
            fetchAppointments();
          }}
          // nếu bạn muốn: truyền defaultStart/defaultDoctorName vào form qua props
          // defaultStart={showCreate.defaultStart}
          // defaultDoctorName={showCreate.defaultDoctorName}
        />
      )}

      {/* Toolbar custom */}
      <Toolbar
        label={
          view === Views.AGENDA
            ? format(date, "PPP", { locale: i18n.language === "vi" ? vi : undefined })
            : format(date, "PPPP", { locale: i18n.language === "vi" ? vi : undefined })
        }
        onNavigate={(action) => {
          if (action === "TODAY") setDate(new Date());
          if (action === "PREV")
            setDate((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1));
          if (action === "NEXT")
            setDate((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1));
        }}
        onView={(v) => setView(v)}
        view={view}
        date={date}
        setDate={setDate}
      />

      <div className="bg-white rounded-xl border shadow overflow-hidden">
        <Calendar
          localizer={localizer}
          date={date}
          onNavigate={setDate}
          view={view}
          onView={setView}
          selectable
          popup
          step={15}
          timeslots={4} // 15' * 4 = 1h
          min={new Date(1970, 0, 1, 8, 0)}
          max={new Date(1970, 0, 1, 20, 0)}
          defaultView={Views.DAY}
          events={events}
          startAccessor="start"
          endAccessor="end"
          titleAccessor="title"
          onSelectSlot={onSelectSlot}
          onSelectEvent={onSelectEvent}
          eventPropGetter={eventPropGetter}
          // Resource theo Bác sĩ (cột)
          resources={resources}
          resourceIdAccessor="resourceId"
          resourceTitleAccessor="resourceTitle"
          style={{ height: "78vh" }}
        />
      </div>
    </div>
  );
}
