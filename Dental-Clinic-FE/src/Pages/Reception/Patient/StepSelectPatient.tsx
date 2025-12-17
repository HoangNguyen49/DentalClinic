import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next"; 
import {
  FaSearch,
  FaUserPlus,
  FaUserCheck,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaEnvelope,
} from "react-icons/fa";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export interface PatientDTO {
  id: number;
  fullName: string;
  patientCode: string;
  phone: string;
  gender?: string;
  dateOfBirth?: string;
  address?: string;
  email?: string;
}

interface StepProps {
  updateData: (data: any) => void;
  onNext: () => void;
}

interface SuccessModalProps {
  open: boolean;
  patientCode: string;
  onConfirm: () => void;
  t: any; // Truyen t() vao modal
}

// --- MINI SUCCESS MODAL ---
function SuccessModal({ open, patientCode, onConfirm, t }: SuccessModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
        <h2 className="text-xl font-bold text-gray-800 text-center">
           {t("stepSelectPatient.successModal.title")}
        </h2>

        <p className="text-center text-gray-600 mt-3">{t("stepSelectPatient.successModal.codeLabel")}</p>

        <p className="text-center font-mono text-blue-600 text-2xl font-bold mt-1">
          {patientCode}
        </p>

        <button
          onClick={onConfirm}
          className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition"
        >
          {t("stepSelectPatient.successModal.continue")}
        </button>
      </div>
    </div>
  );
}

// --- MAIN COMPONENT ---
export default function StepSelectPatient({ updateData, onNext }: StepProps) {
  const { t } = useTranslation("reception"); // Hook
  const [keyword, setKeyword] = useState("");
  const [patients, setPatients] = useState<PatientDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [newPatient, setNewPatient] = useState({
    fullName: "",
    phone: "",
    gender: "Nam",
    email: "",
    dateOfBirth: "",
    address: "",
  });

  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [createdPatient, setCreatedPatient] = useState<PatientDTO | null>(null);

  // --- 1. TÌM KIẾM ---
  useEffect(() => {
    const timer = setTimeout(() => {
      if (keyword.length >= 2) {
        handleSearch();
      } else {
        setPatients([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [keyword]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`${API_BASE_URL}/api/reception/patients`, {
        params: { keyword, page: 0, size: 5 },
        headers: { Authorization: `Bearer ${token}` },
      });
      setPatients((response.data as any).content || []);
    } catch (err) {
      console.error(err);
      toast.error(t("stepSelectPatient.messages.searchError"));
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (patient: PatientDTO) => {
    updateData({
      patientId: patient.id,
      patientName: patient.fullName,
      patientCode: patient.patientCode,
      patientPhone: patient.phone,
    });
    onNext();
  };

  // --- 2. TẠO MỚI ---
  const handleCreate = async () => {
    if (!newPatient.fullName || !newPatient.phone) {
      return toast.warn(t("stepSelectPatient.messages.validation"));
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");

      const payload = {
        fullName: newPatient.fullName.trim(),
        phone: newPatient.phone.trim(),
        gender: newPatient.gender,
        email: newPatient.email.trim() || null,
        dateOfBirth: newPatient.dateOfBirth || null,
        address: newPatient.address.trim() || null,
      };

      const response = await axios.post<PatientDTO>(
        `${API_BASE_URL}/api/reception/patients`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const created = response.data;
      setCreatedPatient(created);
      setSuccessModalOpen(true);
    } catch (error: any) {
      const msg = error?.response?.data?.message || t("stepSelectPatient.messages.createError");
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessConfirm = () => {
    if (createdPatient) {
      handleSelect(createdPatient); 
    }
    setSuccessModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn relative">
      {!showCreateForm ? (
        <>
          {/* SEARCH MODE */}
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-800">{t("stepSelectPatient.search.title")}</h3>
            <p className="text-gray-500">{t("stepSelectPatient.search.subtitle")}</p>
          </div>

          <div className="relative max-w-lg mx-auto">
            <input
              type="text"
              className="w-full p-4 pl-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none text-lg"
              placeholder={t("stepSelectPatient.search.placeholder")}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              autoFocus
            />
            <FaSearch className="absolute left-4 top-5 text-gray-400 text-xl" />

            {loading && (
              <div className="absolute right-4 top-5">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          {/* RESULT LIST */}
          <div className="max-w-lg mx-auto space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
            {patients.map((p) => (
              <div
                key={p.id}
                onClick={() => handleSelect(p)}
                className="p-3 border rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-pointer flex justify-between items-center group transition-all"
              >
                <div>
                  <div className="font-bold text-gray-800">{p.fullName}</div>
                  <div className="text-xs text-gray-500">
                    {p.phone} •{" "}
                    <span className="font-mono text-blue-600">{p.patientCode}</span>
                  </div>
                </div>
                <FaUserCheck className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}

            {patients.length === 0 && keyword.length > 1 && !loading && (
              <div className="text-center p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <p className="text-gray-500 mb-3">{t("stepSelectPatient.search.notFound")}</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="text-white bg-[#3366FF] px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 mx-auto shadow-md"
                >
                  <FaUserPlus /> {t("stepSelectPatient.search.createNew")}
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* CREATE MODE (FORM ĐẦY ĐỦ) */}
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl border shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">
              {t("stepSelectPatient.create.title")}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cột 1 */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    {t("patientDetail.labels.fullName")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                    value={newPatient.fullName}
                    onChange={(e) =>
                      setNewPatient({ ...newPatient, fullName: e.target.value })
                    }
                    placeholder="NGUYỄN VĂN A"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    {t("patientDetail.labels.phone")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newPatient.phone}
                    onChange={(e) =>
                      setNewPatient({ ...newPatient, phone: e.target.value })
                    }
                    placeholder="09..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    {t("patientDetail.labels.gender")}
                  </label>
                  <select
                    className="w-full border p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    value={newPatient.gender}
                    onChange={(e) =>
                      setNewPatient({ ...newPatient, gender: e.target.value })
                    }
                  >
                    <option value="Nam">{t("patientDetail.gender.male")}</option>
                    <option value="Nữ">{t("patientDetail.gender.female")}</option>
                    <option value="Khác">{t("patientDetail.gender.other")}</option>
                  </select>
                </div>
              </div>

              {/* Cột 2 */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    {t("patientDetail.labels.dob")}
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={newPatient.dateOfBirth}
                      onChange={(e) =>
                        setNewPatient({
                          ...newPatient,
                          dateOfBirth: e.target.value,
                        })
                      }
                    />
                    <FaCalendarAlt className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    {t("patientDetail.labels.email")}
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={newPatient.email}
                      onChange={(e) =>
                        setNewPatient({ ...newPatient, email: e.target.value })
                      }
                      placeholder="email@example.com"
                    />
                    <FaEnvelope className="absolute right-3 top-3.5 text-gray-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    {t("patientDetail.labels.address")}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={newPatient.address}
                      onChange={(e) =>
                        setNewPatient({
                          ...newPatient,
                          address: e.target.value,
                        })
                      }
                      placeholder="TP.HCM"
                    />
                    <FaMapMarkerAlt className="absolute right-3 top-3.5 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-6 mt-4 border-t">
              <button
                onClick={() => setShowCreateForm(false)}
                className="flex-1 py-3 bg-gray-100 rounded-xl text-gray-600 font-bold hover:bg-gray-200 transition"
                disabled={loading}
              >
                {t("stepSelectPatient.create.cancel")}
              </button>
              <button
                onClick={handleCreate}
                className="flex-1 py-3 bg-[#3366FF] rounded-xl text-white font-bold hover:bg-blue-700 transition shadow-lg disabled:opacity-70 flex justify-center items-center gap-2"
                disabled={loading}
              >
                {loading && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                {t("stepSelectPatient.create.submit")}
              </button>
            </div>
          </div>
        </>
      )}

      {/* MODAL THÔNG BÁO THÀNH CÔNG */}
      <SuccessModal
        open={successModalOpen}
        patientCode={createdPatient?.patientCode ?? ""}
        onConfirm={handleSuccessConfirm}
        t={t}
      />
    </div>
  );
}