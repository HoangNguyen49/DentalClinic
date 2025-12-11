import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaSearch, FaUserPlus, FaEdit, FaHistory, FaPhone, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';

// ==========================================
// 1. CẤU HÌNH & TYPES
// ==========================================
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export interface PatientResponse {
  id: number;
  patientCode: string;
  fullName: string;
  gender?: string;
  dateOfBirth?: string; // ISO Date (YYYY-MM-DD)
  phone: string;
  email?: string;
  address?: string;
  isActive: boolean;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number; // Current page index
  size: number;
}

// ==========================================
// 2. HELPER FUNCTIONS
// ==========================================
const formatDate = (dateString?: string) => {
    if (!dateString) return "--/--/----";
    return new Date(dateString).toLocaleDateString('vi-VN');
};

// ==========================================
// 3. MAIN COMPONENT
// ==========================================
export default function PatientList() {
  // --- STATE ---
  const [patients, setPatients] = useState<PatientResponse[]>([]);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(0); // Page index bắt đầu từ 0
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);

  // --- API CALL ---
  const fetchData = async (currentPage: number, searchKeyword: string) => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    setLoading(true);
    try {
      const response = await axios.get<PageResponse<PatientResponse>>(`${API_BASE_URL}/api/reception/patients`, {
        params: {
            keyword: searchKeyword,
            page: currentPage,
            size: 10 // Số lượng bản ghi mỗi trang
        },
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = response.data;
      setPatients(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (error) {
      console.error("Error fetching patients:", error);
      toast.error("Không thể tải danh sách bệnh nhân.");
    } finally {
      setLoading(false);
    }
  };

  // --- EFFECTS ---
  // Debounce search: Chỉ gọi API khi ngừng gõ 500ms
  useEffect(() => {
    const timer = setTimeout(() => {
        // Khi search đổi thì reset về trang 0
        setPage(0);
        fetchData(0, keyword);
    }, 500);
    return () => clearTimeout(timer);
  }, [keyword]);

  // Khi đổi trang (không phải do search)
  useEffect(() => {
      // Chỉ fetch nếu page > 0 hoặc (page=0 và keyword rỗng - load lần đầu)
      // Để tránh conflict với useEffect search ở trên
      if (page > 0) {
          fetchData(page, keyword);
      }
  }, [page]);


  // --- RENDER ---
  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden font-instrument">
      
      {/* HEADER TOOLBAR */}
      <div className="p-5 border-b border-gray-200 bg-white flex justify-between items-center shadow-sm z-10">
         <div>
            <h2 className="text-xl font-bold text-gray-800">Quản Lý Bệnh Nhân</h2>
            <p className="text-sm text-gray-500 mt-1">Tổng số: <span className="font-semibold text-[#3366FF]">{totalElements}</span> hồ sơ</p>
         </div>
         
         <div className="flex gap-3">
             {/* Search Box */}
             <div className="relative group">
                 <input 
                    type="text" 
                    placeholder="Tìm tên, SĐT, mã BN..." 
                    value={keyword}
                    onChange={e => setKeyword(e.target.value)}
                    className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm w-72 focus:ring-2 focus:ring-[#3366FF] focus:border-[#3366FF] outline-none transition-all"
                 />
                 <FaSearch className="absolute left-3 top-3 text-gray-400 group-focus-within:text-[#3366FF]" />
             </div>

             <button className="bg-[#3366FF] text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-700 shadow-md transition active:scale-95">
                 <FaUserPlus /> Thêm Mới
             </button>
         </div>
      </div>

      {/* TABLE LIST */}
      <div className="flex-1 overflow-auto bg-gray-50">
          <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-white sticky top-0 z-10 shadow-sm">
                  <tr>
                      <th className="px-6 py-4 font-semibold border-b">Mã Hồ Sơ</th>
                      <th className="px-6 py-4 font-semibold border-b">Họ và Tên</th>
                      <th className="px-6 py-4 font-semibold border-b">Thông Tin Liên Hệ</th>
                      <th className="px-6 py-4 font-semibold border-b">Giới tính / Ngày sinh</th>
                      <th className="px-6 py-4 text-center font-semibold border-b">Trạng thái</th>
                      <th className="px-6 py-4 text-center font-semibold border-b">Hành động</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                  {loading ? (
                      <tr><td colSpan={6} className="p-20 text-center text-gray-500">Đang tải dữ liệu...</td></tr>
                  ) : patients.length === 0 ? (
                      <tr><td colSpan={6} className="p-20 text-center text-gray-400 italic">Không tìm thấy bệnh nhân nào.</td></tr>
                  ) : (
                      patients.map(p => (
                          <tr key={p.id} className="bg-white hover:bg-blue-50/50 transition-colors group">
                              {/* Cột 1: Mã */}
                              <td className="px-6 py-4">
                                  <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs border border-blue-100">
                                    {p.patientCode}
                                  </span>
                              </td>

                              {/* Cột 2: Tên & Địa chỉ */}
                              <td className="px-6 py-4">
                                  <div className="font-bold text-gray-900 text-base mb-1">{p.fullName}</div>
                                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                      <FaMapMarkerAlt className="shrink-0 text-gray-400" />
                                      <span className="truncate max-w-[200px]" title={p.address}>{p.address || 'Chưa cập nhật'}</span>
                                  </div>
                              </td>

                              {/* Cột 3: Liên hệ */}
                              <td className="px-6 py-4">
                                  <div className="flex flex-col gap-1">
                                      <div className="flex items-center gap-2 text-gray-700 font-medium">
                                          <FaPhone className="text-green-500 text-xs" />
                                          {p.phone}
                                      </div>
                                      <div className="flex items-center gap-2 text-gray-500 text-xs">
                                          <FaEnvelope className="text-gray-400 text-xs" />
                                          {p.email || '---'}
                                      </div>
                                  </div>
                              </td>

                              {/* Cột 4: Thông tin cá nhân */}
                              <td className="px-6 py-4">
                                  <div className="text-gray-800">{p.gender || 'Unspecified'}</div>
                                  <div className="text-xs text-gray-500 mt-0.5">NS: {formatDate(p.dateOfBirth)}</div>
                              </td>

                              {/* Cột 5: Trạng thái */}
                              <td className="px-6 py-4 text-center">
                                  {p.isActive ? (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                          <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span> Active
                                      </span>
                                  ) : (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                          <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span> Inactive
                                      </span>
                                  )}
                              </td>

                              {/* Cột 6: Hành động */}
                              <td className="px-6 py-4 text-center">
                                  <div className="flex justify-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition tooltip" title="Chỉnh sửa">
                                          <FaEdit />
                                      </button>
                                      <button className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-100 rounded-lg transition tooltip" title="Lịch sử khám">
                                          <FaHistory />
                                      </button>
                                  </div>
                              </td>
                          </tr>
                      ))
                  )}
              </tbody>
          </table>
      </div>

      {/* FOOTER: PAGINATION */}
      <div className="p-4 border-t border-gray-200 flex justify-between items-center bg-white">
          <div className="text-sm text-gray-500">
              Trang <span className="font-bold text-gray-900">{page + 1}</span> / {totalPages > 0 ? totalPages : 1}
          </div>
          
          <div className="flex gap-2">
              <button 
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Trước
              </button>
              <button 
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Sau
              </button>
          </div>
      </div>
    </div>
  );
}