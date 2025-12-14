import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Calendar, FileText, Settings } from "lucide-react";
import HolidaysTab from "./Tabs/HolidaysTab";
import AuditLogsTab from "./Tabs/AuditLogsTab";

export default function AdminSystemPage() {
    const { t } = useTranslation("admin");
    const [searchParams, setSearchParams] = useSearchParams();
    
    // Đọc tab từ URL query param, mặc định là "holidays"
    const tabFromUrl = searchParams.get("tab");
    const initialTab = (tabFromUrl === "logs" ? "logs" : "holidays") as "holidays" | "logs";
    
    // State cho tab đang chọn
    const [activeTab, setActiveTab] = useState<"holidays" | "logs">(initialTab);
    
    // Cập nhật tab khi URL query param thay đổi
    useEffect(() => {
        const tabFromUrl = searchParams.get("tab");
        if (tabFromUrl === "logs") {
            setActiveTab("logs");
        } else if (tabFromUrl === "holidays" || !tabFromUrl) {
            setActiveTab("holidays");
        }
    }, [searchParams]);

    // Danh sách tabs của hệ thống
    const tabs = [
        {
            id: "holidays",
            label: t("system.tabs.holidays", "Ngày nghỉ lễ"),
            icon: Calendar,
            component: <HolidaysTab />,
        },
        {
            id: "logs",
            label: t("system.tabs.logs", "Nhật ký hệ thống"),
            icon: FileText,
            component: <AuditLogsTab />,
        },
    ] as const;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <section className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-slate-500 to-gray-600 rounded-2xl shadow-lg ring-4 ring-slate-200">
                        <Settings className="w-7 h-7 text-white" />
                        </div>
                        <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                            {t("system.title", "System Settings")}
                            </h1>
                        <p className="text-sm text-gray-600 font-medium mt-1">
                            {t("system.subtitle", "Manage system parameters, holidays and activity logs")}
                            </p>
                        </div>
                </section>

                {/* Khung giao diện có tabs và nội dung tab */}
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden">
                    <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-gray-50 to-slate-50">
                        {/* Thanh tab menu */}
                        <nav className="flex gap-2 p-4" aria-label="Tabs">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        setActiveTab(tab.id);
                                        setSearchParams({ tab: tab.id });
                                    }}
                                    className={`
                                        flex items-center gap-2 px-6 py-3 text-sm font-bold rounded-xl transition-all duration-200
                                        ${activeTab === tab.id
                                            ? "bg-gradient-to-r from-slate-600 to-gray-700 text-white shadow-lg shadow-slate-300/50"
                                            : "text-slate-600 hover:text-slate-900 hover:bg-white border border-slate-200"
                                        }
                                    `}
                                >
                                    <tab.icon className="w-5 h-5" />
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                    {/* Hiển thị nội dung của tab đang được chọn */}
                    <div className="p-8">
                        {tabs.find((t) => t.id === activeTab)?.component}
                    </div>
                </div>
            </div>
        </div>
    );
}
