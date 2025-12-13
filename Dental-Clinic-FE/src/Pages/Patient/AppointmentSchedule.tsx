import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import Header from "../../widgets/Header/Header";
import Footer from "../../widgets/Footer/Footer";
import type { PatientAppointment } from "../types/patient";

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
  const styles: { [key: string]: string } = {
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
    CONFIRMED: "bg-blue-100 text-blue-800 border-blue-200",
    COMPLETED: "bg-green-100 text-green-800 border-green-200",
    CANCELLED: "bg-red-100 text-red-800 border-red-200",
    // Thêm style cho NOSHOW (Quá hạn)
    NOSHOW: "bg-gray-200 text-gray-600 border-gray-300",
  };
  
  const labels: { [key: string]: string } = {
    PENDING: "Chờ xác nhận",
    CONFIRMED: "Đã xác nhận",
    COMPLETED: "Hoàn thành",
    CANCELLED: "Đã hủy",
    // Label thân thiện
    NOSHOW: "Quá hạn / Vắng mặt"
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[status] || styles.PENDING}`}>
      {labels[status] || status}
    </span>
  );
};

// --- MAIN COMPONENT ---
function AppointmentSchedule() {
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  // Filter có 3 trạng thái
  const [filter, setFilter] = useState<'UPCOMING' | 'HISTORY' | 'CANCELLED'>('UPCOMING');
  
  // State cho Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApptId, setSelectedApptId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState("Bận việc đột xuất");
  const [isCancelling, setIsCancelling] = useState(false);

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
    } finally {
      setLoading(false);
    }
  };

  // Mở Modal xác nhận
  const openCancelModal = (id: number) => {
    setSelectedApptId(id);
    setCancelReason("Bận việc đột xuất");
    setIsModalOpen(true);
  };

  // Xử lý khi bấm "Xác nhận hủy"
  const handleConfirmCancel = async () => {
    if (!selectedApptId) return;

    const token = localStorage.getItem("accessToken");
    setIsCancelling(true);

    try {
      await axios.put(`${API_URL}/api/patient/appointments/${selectedApptId}/cancel`, 
        { reason: cancelReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success("Hủy lịch thành công! Vui lòng kiểm tra email.");
      
      // Optimistic Update
      setAppointments(prev => prev.map(appt => {
        if (appt.appointmentId === selectedApptId) {
          return { ...appt, status: 'CANCELLED', canCancel: false };
        }
        return appt;
      }));
      
      setIsModalOpen(false);
      
    } catch (error: any) {
      toast.error(error.response?.data || "Hủy thất bại. Vui lòng thử lại sau.");
    } finally {
      setIsCancelling(false);
    }
  };

  // --- LOGIC LỌC DANH SÁCH QUAN TRỌNG ---
  const filteredList = appointments.filter(apt => {
    // Sắp tới: Chỉ hiện Pending/Confirmed thực sự (chưa quá hạn)
    if (filter === 'UPCOMING') return ['PENDING', 'CONFIRMED'].includes(apt.status);
    
    // Lịch sử: Đã hoàn thành
    if (filter === 'HISTORY') return ['COMPLETED'].includes(apt.status);
    
    // Đã hủy / Quá hạn: Gộp Cancelled và NOSHOW vào đây
    return ['CANCELLED', 'NOSHOW'].includes(apt.status);
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3366FF]"></div></div>;

  return (
    <>
      <Header />
      <ToastContainer />
      
      <div className="min-h-screen bg-gray-50 py-10 px-4 font-instrument">
        <div className="max-w-5xl mx-auto">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">📅 Lịch Hẹn Của Tôi</h1>
              <p className="text-gray-500">Quản lý và theo dõi quá trình điều trị</p>
            </div>
            <Link to="/booking" className="bg-[#3366FF] text-white px-6 py-2.5 rounded-full font-bold shadow hover:bg-blue-700 transition transform hover:scale-105">
              + Đặt Lịch Mới
            </Link>
          </div>

          {/* Tabs Filter */}
          <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto">
            {[
              { key: 'UPCOMING', label: 'Sắp tới' },
              { key: 'HISTORY', label: 'Lịch sử khám' },
              { key: 'CANCELLED', label: 'Đã hủy / Quá hạn' } // Đổi tên Tab
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

          {/* Danh sách */}
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
                    
                    {/* Ngày giờ */}
                    <div className="flex-shrink-0 w-full md:w-28 bg-blue-50 rounded-xl flex flex-col items-center justify-center p-4 text-[#3366FF] border border-blue-100">
                      <span className="text-3xl font-bold">{dateInfo.day}</span>
                      <span className="text-xs font-bold uppercase tracking-wide">{dateInfo.month}</span>
                      <div className="mt-2 w-full border-t border-blue-200 pt-2 text-center">
                         <span className="text-sm font-bold text-gray-700">{dateInfo.time}</span>
                      </div>
                    </div>

                    {/* Thông tin */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
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
                        </div>
                      </div>

                      {/* Nút Hủy (Chỉ hiện khi canCancel = true) */}
                      {apt.canCancel && (
                        <div className="mt-5 pt-4 border-t border-gray-100 flex justify-end">
                          <button 
                            onClick={() => openCancelModal(apt.appointmentId)}
                            className="flex items-center gap-2 text-red-500 text-sm font-bold hover:text-white hover:bg-red-500 px-4 py-2 rounded-lg transition-all border border-red-100 hover:border-red-500 hover:shadow-md"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Hủy cuộc hẹn
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Modal Confirm */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all scale-100 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Xác nhận hủy lịch hẹn?</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-500 text-sm mb-4">
                Hành động này sẽ hủy lịch hẹn của bạn và không thể hoàn tác.
              </p>
              
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Lý do hủy</label>
              <select 
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#3366FF] focus:border-transparent outline-none"
              >
                <option value="Bận việc đột xuất">Bận việc đột xuất</option>
                <option value="Đã khỏi bệnh / Không còn nhu cầu">Đã khỏi bệnh / Không còn nhu cầu</option>
                <option value="Muốn dời sang ngày khác">Muốn dời sang ngày khác</option>
                <option value="Tìm được phòng khám khác">Tìm được phòng khám khác</option>
                <option value="Lý do cá nhân khác">Lý do cá nhân khác</option>
              </select>
            </div>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                disabled={isCancelling}
                className="px-4 py-2 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition"
              >
                Quay lại
              </button>
              <button 
                onClick={handleConfirmCancel}
                disabled={isCancelling}
                className="px-4 py-2 rounded-lg bg-red-500 text-white font-bold hover:bg-red-600 shadow-md transition flex items-center gap-2 disabled:opacity-70"
              >
                {isCancelling ? "Đang xử lý..." : "Đồng ý Hủy"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}

export default AppointmentSchedule;