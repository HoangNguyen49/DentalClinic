import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaSearch, FaTimes } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

interface Props {
    onClose: () => void;
    onSuccess: () => void;
}

export default function QuickBookingModal({ onClose, onSuccess }: Props) {
    
    const [keyword, setKeyword] = useState('');
    const [patients, setPatients] = useState<any[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    
    const [services, setServices] = useState<any[]>([]);
    const [selectedServiceId, setSelectedServiceId] = useState<number | ''>('');
    const [loading, setLoading] = useState(false);

    // 1. Load danh sách dịch vụ
    useEffect(() => {
        axios.get(`${API_BASE_URL}/api/public/services`)
             // --- FIX LỖI 1: Ép kiểu thành mảng any ---
             .then(res => setServices(res.data as any[]))
             .catch(err => console.error(err));
    }, []);

    // 2. Tìm kiếm bệnh nhân
    useEffect(() => {
        const timer = setTimeout(() => {
            if (keyword.length >= 2) {
                const token = localStorage.getItem("accessToken");
                axios.get(`${API_BASE_URL}/api/reception/patients`, {
                    params: { keyword, page: 0, size: 5 },
                    headers: { Authorization: `Bearer ${token}` }
                })
                // --- FIX LỖI 2: Ép kiểu res.data thành any để truy cập .content ---
                .then(res => setPatients((res.data as any).content || []));
            } else {
                setPatients([]);
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [keyword]);

    const handleCreateTicket = async () => {
        if (!selectedPatient || !selectedServiceId) {
            toast.warning("Vui lòng chọn Khách hàng và Dịch vụ!");
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            
            const payload = {
                clinicId: 1, // TODO: Lấy dynamic clinicId nếu cần
                patientId: selectedPatient.id,
                doctorId: null,
                roomId: null,
                startDateTime: new Date().toISOString(), 
                status: "CONFIRMED",
                channel: "WALK_IN",
                note: "Khách vãng lai - Chờ xếp bác sĩ",
                appointmentType: "STANDARD",
                services: [{ serviceId: selectedServiceId, quantity: 1 }]
            };

            await axios.post(`${API_BASE_URL}/api/reception/appointments`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success("Đã thêm vào Hàng Chờ! 👋");
            onSuccess();
            onClose();

        } catch (error: any) {
            toast.error(error.response?.data?.message || "Lỗi tạo phiếu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn font-instrument">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100">
                
                <div className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-lg">Tạo Phiếu Hẹn Nhanh</h3>
                        <p className="text-gray-400 text-xs">Thêm khách vào hàng chờ</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition">
                        <FaTimes size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    
                    {/* 1. CHỌN KHÁCH HÀNG */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">1. Khách Hàng</label>
                        
                        {!selectedPatient ? (
                            <div className="relative group">
                                <input 
                                    type="text" 
                                    className="w-full border-2 border-gray-200 p-3 pl-10 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all"
                                    placeholder="Tìm tên hoặc SĐT..."
                                    value={keyword}
                                    onChange={e => setKeyword(e.target.value)}
                                    autoFocus
                                />
                                <FaSearch className="absolute left-3.5 top-4 text-gray-400 text-lg group-focus-within:text-blue-500" />
                                
                                {patients.length > 0 && (
                                    <div className="absolute w-full bg-white border border-gray-100 rounded-xl shadow-xl mt-2 max-h-60 overflow-y-auto z-50 py-2">
                                        {patients.map(p => (
                                            <div 
                                                key={p.id} 
                                                onClick={() => { setSelectedPatient(p); setKeyword(''); }} 
                                                className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0 flex justify-between items-center"
                                            >
                                                <div>
                                                    <div className="font-bold text-gray-800">{p.fullName}</div>
                                                    <div className="text-xs text-gray-500">{p.phone}</div>
                                                </div>
                                                <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">{p.patientCode}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                {keyword.length > 2 && patients.length === 0 && (
                                    <div className="absolute w-full bg-white border border-gray-100 rounded-xl shadow-xl mt-2 p-4 text-center z-50">
                                        <p className="text-sm text-gray-500 mb-2">Không tìm thấy khách hàng.</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold">
                                        {selectedPatient.fullName.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-900">{selectedPatient.fullName}</div>
                                        <div className="text-xs text-blue-600 font-mono">{selectedPatient.patientCode}</div>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedPatient(null)} className="text-sm text-gray-500 hover:text-red-500 font-medium underline decoration-dashed">
                                    Thay đổi
                                </button>
                            </div>
                        )}
                    </div>

                    {/* 2. CHỌN DỊCH VỤ */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">2. Dịch Vụ</label>
                        <div className="relative">
                            <select 
                                className="w-full border-2 border-gray-200 p-3 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all appearance-none bg-white"
                                onChange={(e) => setSelectedServiceId(Number(e.target.value))}
                                value={selectedServiceId}
                            >
                                <option value="">-- Chọn dịch vụ khám --</option>
                                {services.map((s: any) => (
                                    <optgroup key={s.id} label={s.serviceName}>
                                        {s.variants?.map((v: any) => (
                                            <option key={v.variantId} value={v.variantId}>
                                                {v.variantName} - {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v.price)}
                                            </option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                            <div className="absolute right-4 top-4 pointer-events-none text-gray-500">▼</div>
                        </div>
                    </div>

                    {/* FOOTER */}
                    <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                        <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-gray-600 bg-gray-100 hover:bg-gray-200 font-medium transition">
                            Hủy bỏ
                        </button>
                        <button 
                            onClick={handleCreateTicket} 
                            disabled={!selectedPatient || !selectedServiceId || loading}
                            className="px-6 py-2.5 rounded-lg bg-[#3366FF] text-white font-bold hover:bg-blue-700 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                        >
                            {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                            Tạo Phiếu
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}