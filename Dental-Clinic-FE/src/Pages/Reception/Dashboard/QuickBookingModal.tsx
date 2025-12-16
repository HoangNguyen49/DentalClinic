import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaSearch, FaTimes, FaPlus, FaTrash } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

interface Props {
    onClose: () => void;
    onSuccess: () => void;
}

// Interface định nghĩa 1 dòng dịch vụ được chọn
interface SelectedService {
    localId: number; // ID tạm để React render list
    variantId: number | '';
    price: number;
}

export default function QuickBookingModal({ onClose, onSuccess }: Props) {
    
    // --- STATE KHÁCH HÀNG ---
    const [keyword, setKeyword] = useState('');
    const [patients, setPatients] = useState<any[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    
    // --- STATE DỊCH VỤ (NÂNG CẤP) ---
    const [servicesList, setServicesList] = useState<any[]>([]); // Danh sách gốc từ API
    // Mặc định có sẵn 1 dòng trống đầu tiên
    const [selectedServices, setSelectedServices] = useState<SelectedService[]>([
        { localId: Date.now(), variantId: '', price: 0 }
    ]);
    
    const [loading, setLoading] = useState(false);

    // 1. Load danh sách dịch vụ từ API
    useEffect(() => {
        axios.get(`${API_BASE_URL}/api/public/services`)
             .then(res => setServicesList(res.data as any[]))
             .catch(err => console.error(err));
    }, []);

    // 2. Tìm kiếm bệnh nhân (Giữ nguyên)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (keyword.length >= 2) {
                const token = localStorage.getItem("accessToken");
                axios.get(`${API_BASE_URL}/api/reception/patients`, {
                    params: { keyword, page: 0, size: 5 },
                    headers: { Authorization: `Bearer ${token}` }
                })
                .then(res => setPatients((res.data as any).content || []));
            } else {
                setPatients([]);
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [keyword]);

    // --- LOGIC XỬ LÝ DỊCH VỤ ---
    
    // Thêm dòng dịch vụ mới
    const addServiceRow = () => {
        setSelectedServices(prev => [
            ...prev, 
            { localId: Date.now(), variantId: '', price: 0 }
        ]);
    };

    // Xóa dòng dịch vụ
    const removeServiceRow = (localId: number) => {
        if (selectedServices.length === 1) {
            // Nếu còn 1 dòng thì chỉ reset về rỗng chứ không xóa
            setSelectedServices([{ localId: Date.now(), variantId: '', price: 0 }]);
            return;
        }
        setSelectedServices(prev => prev.filter(s => s.localId !== localId));
    };

    // Thay đổi dịch vụ trong dòng
    const handleServiceChange = (localId: number, newVariantId: string) => {
        const variantIdNum = Number(newVariantId);
        
        // Tìm giá tiền của dịch vụ vừa chọn
        let newPrice = 0;
        if (variantIdNum) {
            servicesList.forEach(group => {
                group.variants?.forEach((v: any) => {
                    if (v.variantId === variantIdNum) newPrice = v.price;
                });
            });
        }

        setSelectedServices(prev => prev.map(item => 
            item.localId === localId 
                ? { ...item, variantId: variantIdNum || '', price: newPrice }
                : item
        ));
    };

    // Tính tổng tiền tạm tính
    const totalEstimated = selectedServices.reduce((sum, item) => sum + item.price, 0);

    // --- SUBMIT ---
    const handleCreateTicket = async () => {
        // Lọc bỏ những dòng chưa chọn dịch vụ
        const validServices = selectedServices.filter(s => s.variantId !== '');

        if (!selectedPatient || validServices.length === 0) {
            toast.warning("Vui lòng chọn Khách hàng và ít nhất 1 Dịch vụ!");
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            
            const payload = {
                clinicId: 1, // Mặc định Clinic 1 (sau này có thể dynamic)
                patientId: selectedPatient.id,
                doctorId: null,
                roomId: null,
                startDateTime: new Date().toISOString(), 
                status: "CONFIRMED",
                channel: "WALK_IN",
                note: "Khách vãng lai - Chờ xếp bác sĩ",
                appointmentType: "STANDARD",
                // Map sang format API yêu cầu
                services: validServices.map(s => ({ 
                    serviceId: s.variantId, 
                    quantity: 1 
                }))
            };

            await axios.post(`${API_BASE_URL}/api/reception/appointments`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success(`Đã tạo phiếu cho ${validServices.length} dịch vụ! 👋`);
            onSuccess();
            onClose();

        } catch (error: any) {
            toast.error(error.response?.data?.message || "Lỗi tạo phiếu.");
        } finally {
            setLoading(false);
        }
    };

    // Format tiền
    const formatMoney = (amount: number) => 
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn font-instrument">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="font-bold text-lg">Tạo Phiếu Hẹn Nhanh</h3>
                        <p className="text-gray-400 text-xs">Thêm khách vào hàng chờ (Walk-in)</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition">
                        <FaTimes size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                    
                    {/* 1. CHỌN KHÁCH HÀNG (Giữ nguyên) */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">1. Khách Hàng <span className="text-red-500">*</span></label>
                        
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
                            </div>
                        ) : (
                            <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-xl animate-fadeIn">
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

                    {/* 2. CHỌN DỊCH VỤ (NÂNG CẤP) */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-bold text-gray-700">2. Dịch Vụ <span className="text-red-500">*</span></label>
                            <button 
                                onClick={addServiceRow}
                                className="text-xs flex items-center gap-1 font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition"
                            >
                                <FaPlus size={10} /> Thêm dịch vụ
                            </button>
                        </div>
                        
                        <div className="space-y-3">
                            {selectedServices.map((item, index) => (
                                <div key={item.localId} className="flex gap-2 items-center animate-fadeIn">
                                    <div className="relative flex-1">
                                        <select 
                                            className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 text-sm appearance-none bg-white truncate pr-8"
                                            onChange={(e) => handleServiceChange(item.localId, e.target.value)}
                                            value={item.variantId}
                                        >
                                            <option value="">-- Chọn dịch vụ {index + 1} --</option>
                                            {servicesList.map((s: any) => (
                                                <optgroup key={s.id} label={s.serviceName}>
                                                    {s.variants?.map((v: any) => (
                                                        <option key={v.variantId} value={v.variantId}>
                                                            {v.variantName} - {formatMoney(v.price)}
                                                        </option>
                                                    ))}
                                                </optgroup>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-3 pointer-events-none text-gray-400 text-xs">▼</div>
                                    </div>

                                    {/* Nút Xóa */}
                                    <button 
                                        onClick={() => removeServiceRow(item.localId)}
                                        className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                        title="Xóa dòng này"
                                    >
                                        <FaTrash size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Tổng tiền tạm tính */}
                        {totalEstimated > 0 && (
                            <div className="mt-4 flex justify-between items-center border-t border-dashed border-gray-200 pt-3">
                                <span className="text-sm text-gray-500">Tạm tính:</span>
                                <span className="font-bold text-blue-700 text-lg">{formatMoney(totalEstimated)}</span>
                            </div>
                        )}
                    </div>

                    {/* FOOTER */}
                    <div className="pt-4 border-t border-gray-100 flex justify-end gap-3 mt-auto">
                        <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-gray-600 bg-gray-100 hover:bg-gray-200 font-medium transition">
                            Hủy bỏ
                        </button>
                        <button 
                            onClick={handleCreateTicket} 
                            disabled={!selectedPatient || selectedServices.every(s => s.variantId === '') || loading}
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