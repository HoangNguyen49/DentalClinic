import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useExplanations } from "./hrservice/useExplanations";
import { Filters } from "./Filters";
import { Table } from "./Table";

export default function HrAttendanceManagement() {
  // Hook quản lý và lấy dữ liệu giải trình chấm công
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
    handleProcessExplanation,      // Xử lý hành động duyệt hoặc từ chối giải trình
    handleNoteChange,              // Xử lý thay đổi ghi chú cho từng giải trình
    handleCustomTimeChange,        // Xử lý thay đổi giờ checkin/checkout thủ công
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
            HR • Attendance Explanations
          </p>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <h1 className={`text-4xl font-bold ${palette.heading}`}>Pending Explanations</h1>
              <p className={`text-base leading-relaxed ${palette.subtleText}`}>
                Review and process attendance explanations submitted by employees.
              </p>
            </div>
          </div>
        </section>

        <Filters
          clinics={clinics}
          selectedClinic={explanationClinicFilter}
          onClinicChange={setExplanationClinicFilter} // Đổi clinic lọc
          onRefresh={fetchPendingExplanations} // Làm mới danh sách giải trình
        />

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
