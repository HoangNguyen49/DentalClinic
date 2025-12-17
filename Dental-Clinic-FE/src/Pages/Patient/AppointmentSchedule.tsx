import type { PatientAppointment } from "../types/patient";
import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import Header from "../../widgets/Header/Header";
import Footer from "../../widgets/Footer/Footer";

// --- HELPER FUNCTIONS ---
const formatDate = (isoString: string) => {
  const date = new Date(isoString);
  return {
    day: date.getDate(),
    month: `THG ${date.getMonth() + 1}`,
    time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    fullDate: date.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  };
};

const StatusBadge = ({ status }: { status: string }) => {
  const normalized = status?.toUpperCase() || "";

  const styles: { [key: string]: string } = {
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
    SCHEDULED: "bg-blue-100 text-blue-800 border-blue-200",
    CONFIRMED: "bg-blue-100 text-blue-800 border-blue-200",
    IN_PROGRESS: "bg-purple-100 text-purple-800 border-purple-200",
    PROCESSING: "bg-purple-100 text-purple-800 border-purple-200",
    COMPLETED: "bg-green-100 text-green-800 border-green-200",
    CANCELLED: "bg-red-100 text-red-800 border-red-200",
    CANCELED: "bg-red-100 text-red-800 border-red-200",
    NOSHOW: "bg-gray-200 text-gray-600 border-gray-300",
    NO_SHOW: "bg-gray-200 text-gray-600 border-gray-300",
  };
  
  const labels: { [key: string]: string } = {
    PENDING: "Chờ xác nhận",
    SCHEDULED: "Đã lên lịch",
    CONFIRMED: "Đã lên lịch",
    IN_PROGRESS: "Đang khám",
    PROCESSING: "Đang khám",
    COMPLETED: "Hoàn thành",
    CANCELLED: "Đã hủy",
    CANCELED: "Đã hủy",
    NOSHOW: "Vắng mặt",
    NO_SHOW: "Vắng mặt"
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[normalized] || styles.PENDING}`}>
      {labels[normalized] || status}
    </span>
  );
};

function AppointmentSchedule() {
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'UPCOMING' | 'HISTORY' | 'CANCELLED'>('UPCOMING');
  
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/login");
      return;
    }
    try {
      const res = await axios.get<PatientAppointment[]>(`${API_URL}/api/patient/appointments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAppointments(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải danh sách lịch hẹn.");
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIC LỌC ---
  const filteredList = appointments.filter(apt => {
    const s = apt.status?.toUpperCase();

    if (filter === 'UPCOMING') {
        return ['PENDING', 'SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'PROCESSING'].includes(s);
    }
    if (filter === 'HISTORY') {
        return ['COMPLETED'].includes(s);
    }
    return ['CANCELLED', 'CANCELED', 'NOSHOW', 'NO_SHOW'].includes(s);
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3366FF]"></div></div>;

  return (
    <>
      <Header />
      <ToastContainer />
      <div className="min-h-screen bg-gray-50 py-10 px-4 font-instrument">
        <div className="max-w-5xl mx-auto">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">📅 Lịch Hẹn Của Tôi</h1>
              <p className="text-gray-500 mt-1">Quản lý và theo dõi quá trình điều trị</p>
            </div>
            <Link to="/booking" className="bg-[#3366FF] text-white px-6 py-2.5 rounded-full font-bold shadow hover:bg-blue-700 transition transform hover:scale-105">
              + Đặt Lịch Mới
            </Link>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto">
            {[
              { key: 'UPCOMING', label: 'Sắp tới & Đang khám' },
              { key: 'HISTORY', label: 'Lịch sử khám' },
              { key: 'CANCELLED', label: 'Đã hủy / Vắng mặt' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`px-6 py-3 font-semibold text-sm whitespace-nowrap border-b-2 transition-colors ${
                  filter === tab.key 
                    ? 'border-[#3366FF] text-[#3366FF]' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* List Content */}
          <div className="space-y-4">
            {filteredList.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="text-5xl mb-4">📭</div>
                <p className="text-gray-500 text-lg">Bạn không có lịch hẹn nào trong mục này.</p>
                {filter === 'UPCOMING' && (
                  <Link to="/booking" className="text-[#3366FF] font-bold hover:underline mt-2 inline-block">Đặt lịch ngay &rarr;</Link>
                )}
              </div>
            ) : (
              filteredList.map((apt) => {
                const dateInfo = formatDate(apt.startDateTime);
                return (
                  <div key={apt.appointmentId} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 hover:shadow-md transition duration-300">
                    
                    {/* Date Block */}
                    <div className="flex-shrink-0 w-full md:w-28 bg-blue-50 rounded-xl flex flex-col items-center justify-center p-4 text-[#3366FF] border border-blue-100">
                      <span className="text-3xl font-bold">{dateInfo.day}</span>
                      <span className="text-xs font-bold uppercase tracking-wide">{dateInfo.month}</span>
                      <div className="mt-2 w-full border-t border-blue-200 pt-2 text-center">
                          <span className="text-sm font-bold text-gray-700">{dateInfo.time}</span>
                      </div>
                    </div>

                    {/* Info Block */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-xl font-bold text-gray-800 line-clamp-1">{apt.serviceName}</h3>
                          {apt.variantName && <span className="text-sm text-gray-500 font-medium">{apt.variantName}</span>}
                        </div>
                        <StatusBadge status={apt.status} />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-600 mt-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">👨‍⚕️</span>
                          <span>Bác sĩ: <strong className="text-gray-800">{apt.doctorName}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🏥</span>
                          <span>{apt.clinicName}</span>
                        </div>
                        <div className="md:col-span-2 flex items-start gap-2">
                          <span className="text-lg">📍</span>
                          <span className="line-clamp-1">{apt.clinicAddress}</span>
                        </div>
                        {apt.note && (
                           <div className="md:col-span-2 flex items-start gap-2 text-gray-500 italic">
                             <span className="text-lg">📝</span>
                             <span className="line-clamp-2">{apt.note}</span>
                           </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default AppointmentSchedule;