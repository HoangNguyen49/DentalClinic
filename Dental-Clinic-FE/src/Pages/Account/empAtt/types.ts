export type AttendanceResponse = {
    id: number;
    userId: number;
    userName: string;
    userAvatarUrl?: string;
    clinicId: number;
    clinicName?: string;
    workDate: string;
    checkInTime?: string | null;
    checkOutTime?: string | null;
    attendanceStatus?: string | null;
    note?: string | null;
    verificationStatus?: string | null;
    faceMatchScore?: number | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    // Thông tin tính toán giờ làm việc và đi trễ/ra sớm
    shiftType?: string | null; // MORNING, AFTERNOON, FULL_DAY
    startTime?: string | null; // Giờ bắt đầu ca theo lịch (HH:mm:ss)
    endTime?: string | null; // Giờ kết thúc ca theo lịch (HH:mm:ss)
    actualWorkHours?: number | null; // Số giờ làm việc thực tế (đã trừ đi trễ, ra sớm, nghỉ trưa)
    expectedWorkHours?: number | null; // Số giờ làm việc theo lịch
    lateMinutes?: number | null; // Số phút đi trễ
    earlyMinutes?: number | null; // Số phút ra sớm
    lunchBreakMinutes?: number | null; // Số phút nghỉ trưa
};

export type ExplanationResponse = {
    attendanceId: number;
    userId: number;
    userName?: string;
    clinicId: number;
    clinicName?: string;
    workDate: string;
    checkInTime?: string | null;
    checkOutTime?: string | null;
    attendanceStatus?: string | null;
    explanationType?: string | null;
    employeeReason?: string | null;
    explanationStatus?: string | null;
    adminNote?: string | null;
    note?: string | null;
    shiftType?: string | null; // MORNING, AFTERNOON, FULL_DAY (for doctors)
};
