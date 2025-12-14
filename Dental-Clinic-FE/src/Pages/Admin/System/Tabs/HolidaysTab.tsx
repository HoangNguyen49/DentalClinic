import { useEffect, useState } from "react";
import { Trash2, Plus, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { type Holiday, systemService } from "../../../../services/admin/systemService";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

export default function HolidaysTab() {
    const { t } = useTranslation("admin");
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [loading, setLoading] = useState(true);

    // State phục vụ form nhập ngày lễ mới
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
            toast.error(t("system.holidays.messages.loadFailed"));
        } finally {
            setLoading(false);
        }
    };

    // Lấy danh sách tất cả các cơ sở trên hệ thống
    const loadClinics = async () => {
        try {
            const data = await systemService.getAllClinics();
            setClinics(data);
        } catch (error) {
            toast.error(t("system.holidays.messages.loadFailed"));
        }
    };

    // Thêm ngày lễ mới
    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!startDate || !newName || !endDate) return;

        const start = new Date(startDate);
        const end = new Date(endDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to compare dates only
        start.setHours(0, 0, 0, 0);

        // Kiểm tra ngày bắt đầu không được là quá khứ hoặc hiện tại
        if (start <= today) {
            toast.error(t("system.holidays.messages.startDateFuture"));
            return;
        }

        if (end < start) {
            toast.error(t("system.holidays.messages.endDateAfterStart"));
            return;
        }

        // Tính số ngày diễn ra kỳ nghỉ lễ
        // Nếu cùng một ngày thì duration = 1
        // Nếu khác ngày thì tính số ngày chênh lệch + 1
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const duration = diffDays + 1; // +1 để bao gồm cả ngày bắt đầu

        setAdding(true);
        try {
            const added = await systemService.addHoliday(startDate, newName, isRecurring, duration, selectedClinicId);
            setHolidays([...holidays, added]);
            setStartDate("");
            setEndDate("");
            setNewName("");
            setIsRecurring(false);
            setSelectedClinicId(null);
            toast.success(t("system.holidays.messages.addSuccess"));
        } catch (error: any) {
            // Hiển thị message từ backend nếu có
            const errorMessage = error?.response?.data?.message || 
                                error?.response?.data?.error || 
                                error?.message || 
                                t("system.holidays.messages.addFailed");
            toast.error(errorMessage);
        } finally {
            setAdding(false);
        }
    };

    // Xóa ngày lễ khỏi danh sách
    const handleDelete = async (id: number) => {
        if (!window.confirm(t("system.holidays.deleteConfirm"))) return;
        try {
            await systemService.deleteHoliday(id);
            setHolidays(holidays.filter((h) => h.id !== id));
            toast.success(t("system.holidays.messages.deleteSuccess"));
        } catch (error) {
            toast.error(t("system.holidays.messages.deleteFailed"));
        }
    };

    // Chọn cơ sở áp dụng cho ngày lễ, bỏ chọn nếu bấm lại
    const selectClinic = (clinicId: number) => {
        setSelectedClinicId(prev => prev === clinicId ? null : clinicId);
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mb-4"></div>
            <p className="text-base font-medium text-slate-600">{t("system.logs.messages.loading", "Loading...")}</p>
        </div>
    );

    return (
        <div className="space-y-8">
            {/* Form nhập ngày nghỉ lễ mới */}
            <div className="bg-gradient-to-br from-slate-50 to-gray-50 p-6 rounded-2xl border-2 border-slate-200 shadow-md">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gradient-to-br from-slate-600 to-gray-700 rounded-xl shadow-lg">
                        <Plus className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">
                        {t("system.holidays.addNew", "Add New Holiday")}
                </h3>
                </div>
                <form onSubmit={handleAdd} className="flex flex-col gap-6">
                    <div className="flex flex-wrap gap-4 items-end">
                        <div className="flex-1 min-w-[200px]">
                            <label 
                                htmlFor="holiday-name"
                                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2"
                            >
                                {t("system.holidays.name", "Holiday Name")}
                            </label>
                            <input
                                id="holiday-name"
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder={t("system.holidays.namePlaceholder", "Enter holiday name...")}
                                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-base focus:outline-none focus:ring-4 focus:ring-slate-100 focus:border-slate-500 transition-all bg-white"
                                required
                            />
                        </div>
                        <div className="w-48">
                            <label 
                                htmlFor="holiday-start-date"
                                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2"
                            >
                                {t("system.holidays.startDate", "Start Date")}
                            </label>
                            <input
                                id="holiday-start-date"
                                type="date"
                                value={startDate}
                                onChange={(e) => {
                                    setStartDate(e.target.value);
                                    // Nếu endDate chưa được set hoặc nhỏ hơn startDate, tự động set endDate = startDate
                                    if (!endDate || e.target.value > endDate) {
                                        setEndDate(e.target.value);
                                    }
                                }}
                                min={(() => {
                                    const tomorrow = new Date();
                                    tomorrow.setDate(tomorrow.getDate() + 1);
                                    return tomorrow.toISOString().split('T')[0];
                                })()}
                                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-base focus:outline-none focus:ring-4 focus:ring-slate-100 focus:border-slate-500 transition-all bg-white"
                                required
                            />
                        </div>
                        <div className="w-48">
                            <label 
                                htmlFor="holiday-end-date"
                                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2"
                            >
                                {t("system.holidays.endDate", "End Date")}
                            </label>
                            <input
                                id="holiday-end-date"
                                type="date"
                                value={endDate}
                                min={startDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-base focus:outline-none focus:ring-4 focus:ring-slate-100 focus:border-slate-500 transition-all bg-white"
                                required
                            />
                        </div>
                        <div className="flex items-center gap-2 pb-3">
                            <input
                                type="checkbox"
                                id="recurring"
                                checked={isRecurring}
                                onChange={(e) => setIsRecurring(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-300 text-slate-600 focus:ring-slate-500"
                            />
                            <label htmlFor="recurring" className="text-sm font-medium text-slate-700">{t("system.holidays.recurring", "Recurring")}</label>
                        </div>
                    </div>
                    {/* Chọn cơ sở áp dụng cho ngày lễ */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                            {t("system.holidays.applyTo", "Apply To")} <span className="text-slate-500 normal-case">({t("system.holidays.applyToAll", "Leave empty for all clinics")})</span>
                        </label>
                        <div className="flex flex-wrap gap-3">
                            {clinics.map(clinic => (
                                <button
                                    key={clinic.id}
                                    type="button"
                                    onClick={() => selectClinic(clinic.id)}
                                    className={`px-4 py-2.5 text-sm font-semibold rounded-xl border-2 transition-all ${selectedClinicId === clinic.id
                                        ? "bg-gradient-to-r from-slate-600 to-gray-700 border-slate-600 text-white shadow-lg shadow-slate-300/50"
                                        : "bg-white border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                                        }`}
                                >
                                    {clinic.clinicName}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-200">
                        <button
                            type="submit"
                            disabled={adding}
                            className="px-6 py-3 bg-gradient-to-r from-slate-600 to-gray-700 text-white text-base font-bold rounded-xl hover:shadow-lg disabled:opacity-50 transition-all shadow-md flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            {adding ? t("system.holidays.adding", "Adding...") : t("system.holidays.addButton", "Add Holiday")}
                        </button>
                    </div>
                </form>
            </div>

            {/* Bảng danh sách ngày nghỉ lễ */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden">
                <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-gray-50 to-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-slate-600 to-gray-700 rounded-xl shadow-lg">
                            <CalendarIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Holidays List</h2>
                            <p className="text-sm text-slate-600">Total: {holidays.length} holiday{holidays.length !== 1 ? 's' : ''}</p>
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-gradient-to-r from-slate-50 via-gray-50 to-slate-50">
                        <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">{t("system.holidays.table.time", "Time")}</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">{t("system.holidays.table.name", "Name")}</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">{t("system.holidays.table.clinic", "Clinic")}</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">{t("system.holidays.table.recurring", "Recurring")}</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">{t("system.holidays.table.actions", "Actions")}</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {holidays.map((holiday) => {
                            // Tính ngày kết thúc kỳ nghỉ lễ
                            const start = new Date(holiday.date);
                            const end = new Date(start);
                            end.setDate(start.getDate() + (holiday.duration - 1));

                            return (
                                    <tr key={holiday.id} className="hover:bg-gradient-to-r hover:from-slate-50/30 hover:to-gray-50/20 transition-all duration-200">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                            <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                    <div className="p-1.5 bg-slate-100 rounded-lg">
                                                        <CalendarIcon className="w-4 h-4 text-slate-600" />
                                                    </div>
                                                    <span className="font-bold text-base">{format(start, "dd/MM/yyyy")}</span>
                                            </div>
                                            {holiday.duration > 1 && (
                                                    <span className="text-xs text-slate-500 ml-8 font-medium">
                                                        {t("system.holidays.to", "to")} {format(end, "dd/MM/yyyy")} ({holiday.duration} {t("system.holidays.days", "days")})
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                        <td className="px-6 py-4 text-sm font-bold text-slate-900">
                                        {holiday.name}
                                    </td>
                                        <td className="px-6 py-4 text-sm">
                                        {holiday.clinicId ? (
                                                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-slate-500 to-gray-600 text-white shadow-md">
                                                {clinics.find(c => c.id === holiday.clinicId)?.clinicName || `ID: ${holiday.clinicId}`}
                                            </span>
                                        ) : (
                                                <span className="text-slate-500 italic font-medium">{t("system.holidays.allClinics", "All Clinics")}</span>
                                        )}
                                    </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {holiday.isRecurring ? (
                                                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md shadow-green-200/50">
                                                    {t("system.holidays.yes", "Yes")}
                                            </span>
                                        ) : (
                                                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-slate-400 to-gray-500 text-white shadow-md">
                                                    {t("system.holidays.no", "No")}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleDelete(holiday.id)}
                                                className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-all hover:shadow-md"
                                                aria-label={`Delete ${holiday.name}`}
                                                title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {holidays.length === 0 && (
                            <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="p-4 bg-slate-100 rounded-2xl">
                                                <CalendarIcon className="w-12 h-12 text-slate-400" />
                                            </div>
                                            <p className="text-slate-600 font-medium text-lg">{t("system.holidays.messages.noData", "No holidays found")}</p>
                                        </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                </div>
            </div>
        </div>
    );
}
