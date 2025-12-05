import React from "react";
import { useTranslation } from "react-i18next";
import type { HrClinic } from "./hrservice/useExplanations";

type FiltersProps = {
    clinics: HrClinic[];
    selectedClinic: string;
    onClinicChange: (clinicId: string) => void;
    onRefresh: () => void;
};

// Bộ lọc chọn clinic, có thể chọn lại clinic và làm mới dữ liệu
export const Filters: React.FC<FiltersProps> = ({
    clinics,
    selectedClinic,
    onClinicChange,
    onRefresh,
}) => {
    const { t } = useTranslation("web");
    return (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                    {t("attendance.filters.clinic")}
                    <select
                        value={selectedClinic}
                        onChange={(e) => onClinicChange(e.target.value)}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 shadow-inner focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        aria-label={t("attendance.filters.clinic")}
                    >
                        <option value="all">{t("attendance.filters.allClinics")}</option>
                        {clinics.map((clinic) => (
                            <option key={clinic.id} value={clinic.id}>
                                {clinic.clinicName}
                            </option>
                        ))}
                    </select>
                </label>
                <div className="flex items-end">
                    <button
                        onClick={onRefresh}
                        // Khi ấn sẽ gọi lại dữ liệu
                        className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:-translate-y-0.5 hover:bg-blue-700"
                    >
                        {t("attendance.refresh")}
                    </button>
                </div>
            </div>
        </section>
    );
};
