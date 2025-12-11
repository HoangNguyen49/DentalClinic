import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useExplanations } from "./hrservice/useExplanations";
import { Filters } from "./Filters";
import { Table } from "./Table";
import { useTranslation } from "react-i18next";

export default function HrAttendanceManagement() {
  const { t } = useTranslation("web");
  // Lấy dữ liệu giải trình chấm công và các handler
  const {
    clinics,
    pendingExplanations,
    loadingExplanations,
    explanationClinicFilter,
    setExplanationClinicFilter,
    actionNotes,
    customTimes,
    highlightedAttendanceId,
    explanationsTableRef,
    fetchPendingExplanations,
    handleProcessExplanation,      // Duyệt hoặc từ chối giải trình
    handleNoteChange,              // Thay đổi ghi chú giải trình
    handleCustomTimeChange,        // Thay đổi giờ thủ công
  } = useExplanations();

  const palette = {
    background: "bg-slate-50",
    heading: "text-slate-900",
    subtleText: "text-slate-500",
  };

  return (
    <div className={`min-h-screen ${palette.background} p-6`}>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="max-w-7xl mx-auto space-y-8">
        <section className="space-y-4">
          <p className="text-xs font-semibold tracking-[0.35em] uppercase text-slate-400">
            {t("attendance.hrManagement.breadcrumb")}
          </p>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <h1 className={`text-4xl font-bold ${palette.heading}`}>{t("attendance.hrManagement.title")}</h1>
              <p className={`text-base leading-relaxed ${palette.subtleText}`}>
                {t("attendance.hrManagement.subtitle")}
              </p>
            </div>
          </div>
        </section>

        {/* Bộ lọc phòng khám và refresh */}
        <Filters
          clinics={clinics}
          selectedClinic={explanationClinicFilter}
          onClinicChange={setExplanationClinicFilter}
          onRefresh={fetchPendingExplanations}
        />

        {/* Bảng giải trình chấm công */}
        <Table
          explanations={pendingExplanations}
          loading={loadingExplanations}
          highlightedAttendanceId={highlightedAttendanceId}
          actionNotes={actionNotes}
          customTimes={customTimes}
          onNoteChange={handleNoteChange}
          onTimeChange={handleCustomTimeChange}
          onProcess={handleProcessExplanation}
          tableRef={explanationsTableRef}
        />
      </div>
    </div>
  );
}
