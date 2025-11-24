import { useState, useEffect, useRef } from 'react';
import axios from 'axios'; // Dùng axios trực tiếp

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const START_HOUR = 8; // 7:00 sáng
const END_HOUR = 18;  // 19:00 tối
const HOUR_WIDTH = 160; // Độ rộng 1 tiếng (px)

export interface DoctorScheduleDTO {
  id: number;
  doctor: {
    id: number;
    fullName: string;
    specialty: string;
    avatarUrl: string;
  };
  clinic: {
    id: number;
    clinicName: string;
  };
  room: {
    id: number;
    roomName: string;
  } | null; // Room có thể null
  workDate: string;
  startTime: string;
  endTime: string;
  status: string;
}

export interface AppointmentDTO {
  id: number;
  patient: {
    id: number;
    fullName: string;
    patientCode: string;
    phone: string;
  };
  doctor: {
    id: number;
    fullName: string;
  };
  startDateTime: string;
  endDateTime: string;
  status: string;
  services: { serviceName: string }[];
  note?: string;
}

const getPositionStyle = (startStr: string, endStr: string) => {
    let startH, startM, endH, endM;
    if (startStr.includes('T')) { 
        const startDate = new Date(startStr);
        const endDate = new Date(endStr);
        startH = startDate.getHours();
        startM = startDate.getMinutes();
        endH = endDate.getHours();
        endM = endDate.getMinutes();
    } else { 
        [startH, startM] = startStr.split(':').map(Number);
        [endH, endM] = endStr.split(':').map(Number);
    }
    const startOffset = ((startH - START_HOUR) * HOUR_WIDTH) + ((startM / 60) * HOUR_WIDTH);
    const durationHours = (endH + endM/60) - (startH + startM/60);
    const width = durationHours * HOUR_WIDTH;
    return { left: `${startOffset}px`, width: `${width}px` };
};

const getStatusColor = (status: string) => {
    switch(status) {
        case 'CONFIRMED': return 'bg-blue-100 border-blue-500 text-blue-700';
        case 'PENDING': return 'bg-yellow-50 border-yellow-400 text-yellow-700';
        case 'IN_PROGRESS': return 'bg-green-100 border-green-500 text-green-700 animate-pulse';
        case 'COMPLETED': return 'bg-gray-100 border-gray-400 text-gray-500';
        case 'CANCELLED': return 'bg-red-50 border-red-400 text-red-500 decoration-slice';
        default: return 'bg-blue-50 border-blue-300 text-blue-600';
    }
};

export default function ReceptionDashboard() {
  const [schedules, setSchedules] = useState<DoctorScheduleDTO[]>([]);
  const [appointments, setAppointments] = useState<AppointmentDTO[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClinicId, setSelectedClinicId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      // 1. Lấy token
      const token = localStorage.getItem("accessToken");
      if (!token) return; // Hoặc redirect login

      setLoading(true);
      try {
        const params: any = { date: selectedDate };
        if (selectedClinicId) params.clinicId = selectedClinicId;

        // 2. Gửi Header Authorization
        const config = {
            params,
            headers: { Authorization: `Bearer ${token}` }
        };

        const [schedRes, apptRes] = await Promise.all([
            axios.get(`${API_BASE_URL}/api/reception/schedules`, config),
            axios.get(`${API_BASE_URL}/api/reception/appointments`, config)
        ]);

        setSchedules(schedRes.data);
        setAppointments(apptRes.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedDate, selectedClinicId]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    if (scrollRef.current) {
        const currentHour = new Date().getHours();
        if (currentHour > START_HOUR) {
             scrollRef.current.scrollLeft = (currentHour - START_HOUR) * HOUR_WIDTH - 50;
        }
    }
    return () => clearInterval(timer);
  }, []);

  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);
  const currentHourPos = (currentTime.getHours() - START_HOUR) * HOUR_WIDTH + (currentTime.getMinutes() / 60) * HOUR_WIDTH;
  
  const uniqueDoctors = Array.from(new Set(schedules.map(s => s.doctor.id)))
    .map(id => schedules.find(s => s.doctor.id === id)?.doctor);

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col font-instrument bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      
      <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center shadow-sm z-30 relative">
        <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-800">Lịch Tổng Quát</h2>
            <div className="relative">
                <input 
                    type="date" 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#3366FF] outline-none font-medium text-gray-700 cursor-pointer"
                />
                <span className="absolute left-3 top-2.5 text-gray-400">📅</span>
            </div>
            <select 
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-[#3366FF] outline-none font-medium text-gray-700 cursor-pointer"
                onChange={(e) => setSelectedClinicId(e.target.value ? Number(e.target.value) : undefined)}
                value={selectedClinicId || ""}
            >
                <option value="">🏥 Phòng khám của tôi</option>
                <option value="1">📍 Clinic Q1</option>
                <option value="2">📍 Clinic Q9</option>
            </select>
        </div>
        <div className="flex gap-3">
             <button className="bg-[#3366FF] text-white px-5 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-blue-700 transition active:scale-95">
                + Đặt Lịch Nhanh
             </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-gray-50/50">
                <p>Đang tải dữ liệu...</p>
            </div>
        ) : schedules.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-gray-50/50">
                <p className="text-lg font-medium">Không có lịch làm việc nào.</p>
            </div>
        ) : (
            <div className="flex flex-1 overflow-hidden">
                <div className="w-64 bg-white border-r border-gray-200 shadow-lg z-20 flex flex-col shrink-0">
                    <div className="h-12 border-b border-gray-100 bg-gray-50 flex items-center px-4 font-bold text-gray-400 text-[11px] uppercase tracking-wider">
                        Bác sĩ & Chuyên khoa
                    </div>
                    <div className="flex-1 overflow-y-auto no-scrollbar"> 
                        {uniqueDoctors.map(doc => (
                            <div key={doc?.id} className="h-28 px-4 border-b border-gray-100 flex items-center gap-3 hover:bg-blue-50/30 transition group">
                                <div className="relative">
                                    <img 
                                        src={doc?.avatarUrl || "https://via.placeholder.com/150"} 
                                        alt={doc?.fullName}
                                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-100 group-hover:border-blue-200 transition" 
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-gray-800 text-sm truncate" title={doc?.fullName}>{doc?.fullName}</div>
                                    <div className="text-xs text-blue-500 bg-blue-50 inline-block px-1.5 py-0.5 rounded mt-1 truncate max-w-full">
                                        {doc?.specialty}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-auto bg-gray-50/30 relative" ref={scrollRef}>
                    <div className="min-w-max relative">
                        <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10 h-12 shadow-sm">
                            {hours.map(h => (
                                <div key={h} style={{ width: `${HOUR_WIDTH}px` }} className="border-r border-gray-100 px-2 py-3 text-xs font-medium text-gray-400 flex items-center">
                                    {h}:00
                                </div>
                            ))}
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 flex pointer-events-none z-0">
                                {hours.map(h => (
                                    <div key={h} style={{ width: `${HOUR_WIDTH}px` }} className="border-r border-gray-200/50 h-full"></div>
                                ))}
                            </div>

                            {currentHourPos > 0 && (
                                <div className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none opacity-60" style={{ left: `${currentHourPos}px` }}></div>
                            )}

                            <div className="flex flex-col relative z-0">
                                {uniqueDoctors.map(doc => {
                                    if (!doc) return null;
                                    const docSchedules = schedules.filter(s => s.doctor.id === doc.id);
                                    const docAppointments = appointments.filter(a => a.doctor.id === doc.id);

                                    return (
                                        <div key={doc.id} className="h-28 border-b border-gray-100 relative group hover:bg-white/80 transition-colors">
                                            {docSchedules.map(sche => (
                                                <div 
                                                    key={`sch-${sche.id}`}
                                                    className="absolute top-1 bottom-1 bg-white border border-gray-200 rounded-md pattern-diagonal-lines" 
                                                    style={getPositionStyle(sche.startTime, sche.endTime)}
                                                    title={`Ca làm việc tại ${sche.clinic.clinicName}`}
                                                >
                                                    <div className="absolute bottom-1 right-2 text-[10px] text-gray-300 font-bold uppercase tracking-wider select-none">
                                                        {sche.room ? sche.room.roomName : "Chưa xếp phòng"}
                                                    </div>
                                                </div>
                                            ))}

                                            {docAppointments.map(appt => (
                                                <div
                                                    key={`appt-${appt.id}`}
                                                    className={`
                                                        absolute top-3 bottom-3 rounded-lg border-l-4 px-3 py-1.5 text-xs shadow-sm cursor-pointer 
                                                        hover:shadow-md hover:-translate-y-0.5 transition-all select-none flex flex-col justify-center overflow-hidden whitespace-nowrap
                                                        ${getStatusColor(appt.status)}
                                                    `}
                                                    style={{
                                                        ...getPositionStyle(appt.startDateTime, appt.endDateTime),
                                                        zIndex: 10 
                                                    }}
                                                    title={`${appt.patient.fullName} (${appt.status})`}
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-bold truncate mr-1">{appt.patient.fullName}</span>
                                                        <span className="text-[9px] opacity-70 bg-white/30 px-1 rounded">{appt.patient.patientCode}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}