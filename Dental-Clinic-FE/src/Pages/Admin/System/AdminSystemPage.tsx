import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Calendar, FileText } from "lucide-react";
import HolidaysTab from "./Tabs/HolidaysTab";
import AuditLogsTab from "./Tabs/AuditLogsTab";

export default function AdminSystemPage() {
    const { t } = useTranslation("admin");
    // State cho tab đang chọn
    const [activeTab, setActiveTab] = useState<"holidays" | "logs">("holidays");

    // Danh sách tabs của hệ thống
    const tabs = [
        {
            id: "holidays",
            label: "Ngày nghỉ lễ",
            icon: Calendar,
            component: <HolidaysTab />,
        },
        {
            id: "logs",
            label: "Nhật ký hệ thống",
            icon: FileText,
            component: <AuditLogsTab />,
        },
    ] as const;

    return (
        <div className="p-6 min-h-screen bg-slate-50">
            <div className="max-w-7xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        {t("system.title", "Thiết lập hệ thống")}
                    </h1>
                    <p className="text-slate-500 mt-1">
                        {t("system.subtitle", "Quản lý tham số, ngày nghỉ và nhật ký hoạt động")}
                    </p>
                </div>
                {/* Khung giao diện có tabs và nội dung tab */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="border-b border-slate-200">
                        {/* Thanh tab menu */}
                        <nav className="flex gap-1 p-1" aria-label="Tabs">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    // Bấm để chuyển tab
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors
                                        ${activeTab === tab.id
                                            ? "bg-blue-50 text-blue-700"
                                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                                        }
                                    `}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                    {/* Hiển thị nội dung của tab đang được chọn */}
                    <div className="p-6">
                        {tabs.find((t) => t.id === activeTab)?.component}
                    </div>
                </div>
            </div>
        </div>
    );
}
