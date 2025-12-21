import { useState, useEffect } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import Header from "../../widgets/Header/Header";
import Footer from "../../widgets/Footer/Footer";
import type { AttendanceResponse, ExplanationResponse } from "./empAtt/types";
import {
  AttendanceHeader,
  TodayAttendanceCard,
  ExplanationList,
  MonthlyAttendanceHistory,
  ExplanationDialog,
} from "./empAtt/components";
import { useEmployeeAttendance, useExplanationActions } from "./empAtt/useAttendanceLogic";

export default function EmployeeAttendanceView() {
  const navigate = useNavigate();
  const accessToken = localStorage.getItem("accessToken");
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const userId = user?.userId || user?.id;

  // Kiểm tra user có phải là bác sĩ không
  const [isDoctor, setIsDoctor] = useState(false);
  useEffect(() => {
    if (user?.roles) {
      const roles = Array.isArray(user.roles) ? user.roles : [user.roles];
      const isDoctorRole = roles.some((r: string) => r.toUpperCase() === "DOCTOR");
      setIsDoctor(isDoctorRole);
    }
  }, [user]);

  // Kiểm tra quyền admin và điều hướng (admin không được quyền truy cập màn này)
  useEffect(() => {
    if (user?.roles) {
      const roles = Array.isArray(user.roles) ? user.roles : [user.roles];
      const isAdmin = roles.some((r: string) => r.toUpperCase() === "ADMIN");
      if (isAdmin) {
        navigate("/admin/attendance");
        return;
      }
    }
    if (!accessToken || !userId) {
      navigate("/login");
    }
  }, [user, accessToken, userId, navigate]);

  // Sử dụng custom hook để quản lý data và logic
  const {
    todayAttendance,
    todayAttendanceList,
    todaySchedules,
    explanationsNeeding,
    monthlyAttendances,
    loading,
    loadingMonthly,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    fetchTodayAttendance,
    fetchExplanationsNeeding,
    fetchMonthlyAttendances,
  } = useEmployeeAttendance(userId, isDoctor);

  // State cho explanation dialog
  const [showExplanationDialog, setShowExplanationDialog] = useState(false);
  const [selectedExplanation, setSelectedExplanation] = useState<ExplanationResponse | null>(null);
  const [explanationReason, setExplanationReason] = useState("");
  const [selectedExplanationDate, setSelectedExplanationDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // Sử dụng custom hook để xử lý submit explanation
  const { submitting, submitExplanation } = useExplanationActions(() => {
    fetchExplanationsNeeding();
    fetchTodayAttendance();
  });

  // Mở dialog giải trình từ attendance record (không phải từ explanation list)
  const openExplanationDialogFromAttendance = (
    attendance: AttendanceResponse,
    explanationTypeOverride?: string
  ) => {
    // Kiểm tra trực tiếp: có check-in nhưng không có check-out
    const hasCheckIn = attendance.checkInTime != null;
    const hasCheckOut = attendance.checkOutTime != null;
    const needsMissingCheckOut = hasCheckIn && !hasCheckOut;
    
    // Nếu không có check-in hoặc đã có check-out, không cần giải trình
    if (!needsMissingCheckOut && !explanationTypeOverride) {
      return;
    }

    // Xác định explanation type
    const explanationType = explanationTypeOverride || "MISSING_CHECK_OUT";
    
    // Kiểm tra xem có pending explanation không (để lấy reason nếu có)
    const hasPendingExplanation = attendance.note && attendance.note.includes("[EXPLANATION_REQUEST:");
    const hasProcessedExplanation = attendance.note && (attendance.note.includes("[APPROVED]") || attendance.note.includes("[REJECTED]"));
    
    let employeeReason = "";
    
    // Nếu có pending explanation, extract reason từ note (nếu có)
    if (hasPendingExplanation && !hasProcessedExplanation) {
      const note = attendance.note || "";
      // Extract employee reason (phần sau ] và trước | hoặc [HR: hoặc [APPROVED] hoặc [REJECTED]
      const reasonMatch = note.match(/\[EXPLANATION_REQUEST:[^\]]+\]\s*(.*?)(?:\s*\|.*|\s*\[HR:.*|\s*\[APPROVED\].*|\s*\[REJECTED\].*)?$/);
      employeeReason = reasonMatch ? reasonMatch[1].trim() : "";
    }

    // Tạo explanation object để mở form
    const explanation: ExplanationResponse = {
      attendanceId: attendance.id && attendance.id > 0 ? attendance.id : 0,
      userId: attendance.userId,
      userName: attendance.userName,
      clinicId: attendance.clinicId,
      clinicName: attendance.clinicName,
      workDate: attendance.workDate,
      checkInTime: attendance.checkInTime,
      checkOutTime: attendance.checkOutTime,
      attendanceStatus: attendance.attendanceStatus,
      explanationType: explanationType,
      employeeReason: employeeReason,
      explanationStatus: hasPendingExplanation ? "PENDING" : "PENDING",
      adminNote: null,
      note: attendance.note,
      shiftType: attendance.shiftType,
    };

    setSelectedExplanation(explanation);
    setExplanationReason(employeeReason);
    setShowExplanationDialog(true);
  };

  // Mở dialog gửi giải trình
  const openExplanationDialog = (explanation: ExplanationResponse) => {
    setSelectedExplanation(explanation);
    setExplanationReason(explanation.employeeReason || "");
    setShowExplanationDialog(true);
  };

  // Xử lý submit explanation
  const handleSubmitExplanation = async () => {
    await submitExplanation(selectedExplanation, explanationReason, () => {
      setShowExplanationDialog(false);
      setExplanationReason("");
      setSelectedExplanation(null);
    });
  };

  // Refresh handler
  const handleRefresh = () => {
    fetchTodayAttendance();
    fetchExplanationsNeeding();
    fetchMonthlyAttendances();
  };

  if (!accessToken || !userId) {
    return null;
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-100">
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          <ToastContainer position="top-right" autoClose={3000} />

          <AttendanceHeader onRefresh={handleRefresh} />

          <TodayAttendanceCard
            loading={loading}
            isDoctor={isDoctor}
            todayAttendance={todayAttendance}
            todayAttendanceList={todayAttendanceList}
            todaySchedules={todaySchedules}
            userId={userId}
            userName={user?.fullName || ""}
            onOpenExplanation={openExplanationDialogFromAttendance}
          />

          {explanationsNeeding.length > 0 && (
            <ExplanationList
              explanationsNeeding={explanationsNeeding}
              selectedExplanationDate={selectedExplanationDate}
              setSelectedExplanationDate={setSelectedExplanationDate}
              onOpenExplanation={openExplanationDialog}
            />
          )}

          <MonthlyAttendanceHistory
            loadingMonthly={loadingMonthly}
            monthlyAttendances={monthlyAttendances}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
          />

          <ExplanationDialog
            isOpen={showExplanationDialog}
            onClose={() => {
              setShowExplanationDialog(false);
              setExplanationReason("");
              setSelectedExplanation(null);
            }}
            selectedExplanation={selectedExplanation}
            explanationReason={explanationReason}
            setExplanationReason={setExplanationReason}
            onSubmit={handleSubmitExplanation}
            submitting={submitting}
          />
        </div>
      </div>
      <Footer />
    </>
  );
}
