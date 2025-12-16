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
import { needsExplanation } from "./empAtt/utils";

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
    // Nếu có explanationTypeOverride (từ schedule chưa check-in), dùng nó
    // Nếu không, kiểm tra từ attendance
    const explanationInfo = explanationTypeOverride
      ? { needs: true, explanationType: explanationTypeOverride }
      : needsExplanation(attendance);

    if (!explanationInfo.needs || !explanationInfo.explanationType) return;

    // Nếu chưa có attendanceId (từ schedule), cần tạo attendance record trước
    // Hoặc backend sẽ tự tạo khi submit explanation
    const explanation: ExplanationResponse = {
      attendanceId: attendance.id && attendance.id > 0 ? attendance.id : 0, // 0 nếu chưa có attendance
      userId: attendance.userId,
      userName: attendance.userName,
      clinicId: attendance.clinicId,
      clinicName: attendance.clinicName,
      workDate: attendance.workDate,
      checkInTime: attendance.checkInTime,
      checkOutTime: attendance.checkOutTime,
      attendanceStatus: attendance.attendanceStatus,
      explanationType: explanationInfo.explanationType,
      employeeReason: null,
      explanationStatus: "PENDING",
      adminNote: null,
      note: attendance.note,
      shiftType: attendance.shiftType,
    };

    setSelectedExplanation(explanation);
    setExplanationReason("");
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
