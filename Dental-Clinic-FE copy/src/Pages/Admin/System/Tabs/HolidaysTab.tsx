import { useEffect, useState } from "react";
import { Trash2, Plus, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { type Holiday, systemService } from "../../../../services/admin/systemService";
import { toast } from "react-toastify";
import { format } from "date-fns";

export default function HolidaysTab() {
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [loading, setLoading] = useState(true);

    // State quản lý form nhập ngày lễ
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [newName, setNewName] = useState("");
    const [isRecurring, setIsRecurring] = useState(false);
    const [selectedClinicId, setSelectedClinicId] = useState<number | null>(null);
    const [clinics, setClinics] = useState<{ id: number; clinicName: string }[]>([]);
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        loadHolidays();
        loadClinics();
    }, []);

    // Lấy danh sách ngày lễ từ server
    const loadHolidays = async () => {
        try {
            const data = await systemService.getAllHolidays();
            setHolidays(data);
        } catch (error) {
            toast.error("Không thể tải danh sách ngày lễ");
        } finally {
            setLoading(false);
        }
    };

    // Lấy danh sách cơ sở
    const loadClinics = async () => {
        try {
            const data = await systemService.getAllClinics();
            setClinics(data);
        } catch (error) {
            console.error("Failed to load clinics", error);
        }
    };

    // Xử lý thêm ngày lễ mới
    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!startDate || !newName || !endDate) return;

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (end < start) {
            toast.error("Ngày kết thúc phải sau ngày bắt đầu");
            return;
        }

        const diffTime = Math.abs(end.getTime() - start.getTime());
        const duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        setAdding(true);
        try {
            const added = await systemService.addHoliday(startDate, newName, isRecurring, duration, selectedClinicId);
            setHolidays([...holidays, added]);
            setStartDate("");
            setEndDate("");
            setNewName("");
            setIsRecurring(false);
            setSelectedClinicId(null);
            toast.success("Đã thêm ngày lễ");
        } catch (error) {
            toast.error("Thêm thất bại");
        } finally {
            setAdding(false);
        }
    };

    // Xử lý xóa ngày lễ
    const handleDelete = async (id: number) => {
        if (!window.confirm("Bạn có chắc muốn xóa ngày lễ này?")) return;
        try {
            await systemService.deleteHoliday(id);
            setHolidays(holidays.filter((h) => h.id !== id));
            toast.success("Đã xóa");
        } catch (error) {
            toast.error("Xóa thất bại");
        }
    };

    // Chọn cơ sở áp dụng ngày lễ
    const selectClinic = (clinicId: number) => {
        setSelectedClinicId(prev => prev === clinicId ? null : clinicId);
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-blue-600" /></div>;

    return (
        <div className="space-y-8">
            {/* Form thêm ngày lễ mới */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Thêm ngày nghỉ lễ mới
                </h3>
                <form onSubmit={handleAdd} className="flex flex-col gap-4">
                    <div className="flex flex-wrap gap-4 items-end">
                        <div className="flex-1 min-w-[200px]">
                            <label 
                                htmlFor="holiday-name"
                                className="block text-xs font-medium text-slate-700 mb-1"
                            >
                                Tên ngày lễ
                            </label>
                            <input
                                id="holiday-name"
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="Ví dụ: Nghỉ mát công ty"
                                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>
                        <div className="w-40">
                            <label 
                                htmlFor="holiday-start-date"
                                className="block text-xs font-medium text-slate-700 mb-1"
                            >
                                Từ ngày
                            </label>
                            <input
                                id="holiday-start-date"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>
                        <div className="w-40">
                            <label 
                                htmlFor="holiday-end-date"
                                className="block text-xs font-medium text-slate-700 mb-1"
                            >
                                Đến ngày
                            </label>
                            <input
                                id="holiday-end-date"
                                type="date"
                                value={endDate}
                                min={startDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>
                        <div className="flex items-center gap-2 pb-2">
                            <input
                                type="checkbox"
                                id="recurring"
                                checked={isRecurring}
                                onChange={(e) => setIsRecurring(e.target.checked)}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor="recurring" className="text-sm text-slate-700">Lặp lại hàng năm</label>
                        </div>
                    </div>

                    {/* Chọn cơ sở áp dụng */}
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-2">Áp dụng cho cơ sở (Để trống nếu áp dụng tất cả)</label>
                        <div className="flex flex-wrap gap-2">
                            {clinics.map(clinic => (
                                <button
                                    key={clinic.id}
                                    type="button"
                                    onClick={() => selectClinic(clinic.id)}
                                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${selectedClinicId === clinic.id
                                        ? "bg-blue-100 border-blue-200 text-blue-700"
                                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                                        }`}
                                >
                                    {clinic.clinicName}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={adding}
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            {adding ? "Đang thêm..." : "Thêm ngày lễ"}
                        </button>
                    </div>
                </form>
            </div>

            {/* Danh sách ngày lễ */}
            <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Thời gian</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tên ngày lễ</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Cơ sở</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Lặp lại</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {holidays.map((holiday) => {
                            // Tính toán ngày kết thúc kỳ nghỉ lễ
                            const start = new Date(holiday.date);
                            const end = new Date(start);
                            end.setDate(start.getDate() + (holiday.duration - 1));

                            return (
                                <tr key={holiday.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <CalendarIcon className="w-4 h-4 text-slate-400" />
                                                <span className="font-medium">{format(start, "dd/MM/yyyy")}</span>
                                            </div>
                                            {holiday.duration > 1 && (
                                                <span className="text-xs text-slate-500 ml-6">
                                                    đến {format(end, "dd/MM/yyyy")} ({holiday.duration} ngày)
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                        {holiday.name}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">
                                        {holiday.clinicId ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                                                {clinics.find(c => c.id === holiday.clinicId)?.clinicName || `ID: ${holiday.clinicId}`}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 italic">Tất cả</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {holiday.isRecurring ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                Có
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                                Không
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {/* Nút xóa ngày lễ */}
                                        <button
                                            onClick={() => handleDelete(holiday.id)}
                                            className="text-red-600 hover:text-red-900 transition-colors"
                                            aria-label={`Xóa ngày lễ ${holiday.name}`}
                                            title="Xóa ngày lễ"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {holidays.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-slate-500 text-sm">
                                    Chưa có ngày nghỉ lễ nào được thiết lập.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
