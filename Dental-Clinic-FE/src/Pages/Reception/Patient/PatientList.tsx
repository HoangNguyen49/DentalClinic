import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  FaSearch,
  FaUserPlus,
  FaEdit,
  FaHistory,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";
import PatientDetailModal from "./PatientDetailModal";
import PatientHistoryModal from "./PatientHistoryModal";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export interface PatientResponse {
  id: number;
  patientCode: string;
  fullName: string;
  gender?: string;
  dateOfBirth?: string;
  phone: string;
  email?: string;
  address?: string;
  isActive: boolean;
}

interface PageResponse<T> {
  content: T[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}

const formatDate = (dateString?: string) => {
  if (!dateString) return "--/--/----";
  return new Date(dateString).toLocaleDateString("vi-VN");
};

export default function PatientList() {
  const { t } = useTranslation("reception");

  const [patients, setPatients] = useState<PatientResponse[]>([]);
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);

  const [selectedPatient, setSelectedPatient] =
    useState<PatientResponse | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyPatientId, setHistoryPatientId] = useState<number | null>(null);

  const fetchData = async (currentPage: number, searchKeyword: string) => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    setLoading(true);
    try {
      const response = await axios.get<PageResponse<PatientResponse>>(
        `${API_BASE_URL}/api/reception/patients`,
        {
          params: {
            keyword: searchKeyword,
            page: currentPage,
            size: 6,
          },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = response.data;
      setPatients(data.content ?? []);

      if (data.page) {
        setTotalPages(Math.max(1, data.page.totalPages));
        setTotalElements(data.page.totalElements ?? 0);
      } else {
        setTotalPages(1);
        setTotalElements(0);
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
      toast.error(t("patients.messages.loadError"));
    } finally {
      setLoading(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      fetchData(0, keyword);
    }, 500);
    return () => clearTimeout(timer);
  }, [keyword]);

  // Pagination
  useEffect(() => {
    fetchData(page, keyword);
  }, [page]);

  const handleOpenDetail = (patient: PatientResponse) => {
    setSelectedPatient(patient);
    setIsDetailOpen(true);
  };

  const handleOpenHistory = (id: number) => {
    setHistoryPatientId(id);
    setIsHistoryOpen(true);
  };

  const handleUpdateSuccess = () => {
    fetchData(page, keyword);
  };

  return (
    <div className="min-h-0 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden font-instrument animate-fadeIn">
      
      {/* HEADER */}
      <div className="p-5 border-b border-gray-200 bg-white flex justify-between items-center shadow-sm z-10">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            {t("patients.title")}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {t("patients.totalRecords")}:{" "}
            <span className="font-semibold text-[#3366FF]">
              {totalElements}
            </span>
          </p>
        </div>

        <div className="flex gap-3">
          <div className="relative group">
            <input
              type="text"
              placeholder={t("patients.searchPlaceholder")}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm w-72 focus:ring-2 focus:ring-[#3366FF] focus:border-[#3366FF] outline-none transition-all font-medium text-gray-700"
            />
            <FaSearch className="absolute left-3.5 top-3.5 text-gray-400 group-focus-within:text-[#3366FF]" />
          </div>

          <button className="bg-[#3366FF] text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-700 shadow-md transition">
            <FaUserPlus /> {t("patients.addNew")}
          </button>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="flex-1 min-h-0 overflow-auto bg-gray-50 relative custom-scrollbar">
        {loading && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center z-50">
            <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        )}

        <table className="w-full text-left border-collapse">
          <thead className="bg-white sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase border-b">
                {t("patients.table.code")}
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase border-b">
                {t("patients.table.name")}
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase border-b">
                {t("patients.table.contact")}
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase border-b">
                {t("patients.table.genderDob")}
              </th>
              <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase border-b">
                {t("patients.table.status")}
              </th>
              <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase border-b w-24">
                {t("patients.table.actions")}
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {patients.length === 0 && !loading ? (
              <tr>
                <td colSpan={6} className="p-24 text-center text-gray-400 italic">
                  {t("patients.messages.noData")}
                </td>
              </tr>
            ) : (
              patients.map((p) => (
                <tr key={p.id} className="bg-white hover:bg-blue-50/40">
                  <td className="px-6 py-4">
                    <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs border">
                      {p.patientCode}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900 text-sm">
                      {p.fullName}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                      <FaMapMarkerAlt />
                      {p.address || "---"}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <FaPhone className="text-green-500" />
                      {p.phone}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-gray-400">
                      <FaEnvelope />
                      {p.email || "---"}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="text-xs font-bold">
                      {p.gender || t("patientDetail.gender.unspecified")}
                    </div>
                    <div className="text-[11px] text-gray-400">
                      NS: {formatDate(p.dateOfBirth)}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black border ${
                        p.isActive
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-50 text-gray-500"
                      }`}
                    >
                      {p.isActive
                        ? t("patients.status.active")
                        : t("patients.status.inactive")}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => handleOpenDetail(p)}>
                        <FaEdit />
                      </button>
                      <button onClick={() => handleOpenHistory(p.id)}>
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

      {/* FOOTER PAGINATION */}
      <div className="px-8 py-4 border-t border-gray-100 flex justify-between items-center bg-white">
        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
          {t("patients.pagination.page")}
          <span className="text-blue-600 mx-1">{page + 1}</span> / {totalPages}
        </div>

        <div className="flex gap-3">
          <button
            disabled={page === 0 || loading}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="px-5 py-2.5 border rounded-2xl text-[10px] font-black disabled:opacity-30"
          >
            {t("patients.pagination.prev")}
          </button>

          <button
            disabled={page >= totalPages - 1 || loading}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            className="px-5 py-2.5 border rounded-2xl text-[10px] font-black disabled:opacity-30"
          >
            {t("patients.pagination.next")}
          </button>
        </div>
      </div>

      {/* MODALS */}
      <PatientDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        patient={selectedPatient}
        onUpdateSuccess={handleUpdateSuccess}
      />

      <PatientHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        patientId={historyPatientId}
      />
    </div>
  );
}
