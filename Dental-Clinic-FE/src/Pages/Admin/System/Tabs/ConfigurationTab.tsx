import { useEffect, useState } from "react";
import { Save, Loader2 } from "lucide-react";
import { type SystemConfig, systemService } from "../../../../services/admin/systemService";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

export default function ConfigurationTab() {
    const { t } = useTranslation("admin");
    // State cho danh sách cấu hình hệ thống
    const [configs, setConfigs] = useState<SystemConfig[]>([]);
    // Loading khi lấy dữ liệu
    const [loading, setLoading] = useState(true);
    // Đang lưu cấu hình nào
    const [saving, setSaving] = useState<string | null>(null);

    useEffect(() => {
        loadConfigs();
    }, []);

    // Lấy toàn bộ cấu hình từ server (loại bỏ WORKING_HOURS_START và WORKING_HOURS_END vì backend không sử dụng)
    const loadConfigs = async () => {
        try {
            const data = await systemService.getAllConfigs();
            // Filter out WORKING_HOURS_START và WORKING_HOURS_END vì backend không sử dụng
            const filteredData = data.filter(
                (config) => 
                    config.configKey !== "WORKING_HOURS_START" && 
                    config.configKey !== "WORKING_HOURS_END"
            );
            setConfigs(filteredData);
        } catch (error) {
            toast.error(t("system.config.messages.loadFailed"));
        } finally {
            setLoading(false);
        }
    };

    // Lưu 1 cấu hình
    const handleSave = async (config: SystemConfig) => {
        setSaving(config.configKey);
        try {
            await systemService.updateConfig(config.configKey, config.configValue, config.description);
            toast.success(t("system.config.messages.saveSuccess"));
        } catch (error) {
            toast.error(t("system.config.messages.saveFailed"));
        } finally {
            setSaving(null);
        }
    };

    // Thay đổi giá trị cấu hình nhập liệu
    const handleChange = (key: string, value: string) => {
        setConfigs((prev) =>
            prev.map((c) => (c.configKey === key ? { ...c, configValue: value } : c))
        );
    };

    // Loading khi chưa xong thì hiển thị icon quay
    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-blue-600" /></div>;

    return (
        <div className="space-y-6 max-w-3xl">
            <div className="grid gap-6">
                {configs.map((config) => (
                    <div key={config.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                                <label 
                                    htmlFor={`config-${config.id}`}
                                    className="block text-sm font-medium text-slate-900 mb-1"
                                >
                                    {config.configKey}
                                </label>
                                <p className="text-xs text-slate-500 mb-3">{config.description}</p>
                                <input
                                    id={`config-${config.id}`}
                                    type="text"
                                    value={config.configValue}
                                    onChange={(e) => handleChange(config.configKey, e.target.value)}
                                    placeholder={`${t("system.config.valuePlaceholder")} ${config.configKey}`}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <button
                                onClick={() => handleSave(config)}
                                disabled={saving === config.configKey}
                                className="mt-8 p-2 text-blue-600 hover:bg-blue-100 rounded-md transition-colors disabled:opacity-50"
                                title={t("system.config.save")}
                            >
                                {saving === config.configKey ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Save className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    </div>
                ))}

                {configs.length === 0 && (
                    <p className="text-center text-slate-500 py-8">{t("system.config.messages.noData")}</p>
                )}
            </div>
        </div>
    );
}
