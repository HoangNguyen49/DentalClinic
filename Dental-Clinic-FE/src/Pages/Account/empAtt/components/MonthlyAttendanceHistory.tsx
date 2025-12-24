import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { AttendanceResponse } from "../types";
import { calculateWorkedHours } from "../utils";
import { MonthlySummaryCards } from "./MonthlySummaryCards";
import { MonthlyAttendanceTable } from "./MonthlyAttendanceTable";

interface MonthlyAttendanceHistoryProps {
    loadingMonthly: boolean;
    monthlyAttendances: AttendanceResponse[];
    selectedMonth: number;
    setSelectedMonth: (month: number) => void;
    selectedYear: number;
    setSelectedYear: (year: number) => void;
}

export const MonthlyAttendanceHistory: React.FC<MonthlyAttendanceHistoryProps> = ({
    loadingMonthly,
    monthlyAttendances,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
}) => {
    const { t } = useTranslation("web");

    const monthlySummary = useMemo(() => {
        if (!monthlyAttendances.length) {
            return {
                totalDays: 0,
                presentDays: 0,
                lateDays: 0,
                absentDays: 0,
                approvedDays: 0,
                totalHours: 0,
                avgHours: 0,
                totalLateMinutes: 0,
                totalEarlyMinutes: 0,
                totalActualWorkHours: 0,
            };
        }

        const uniqueWorkDates = new Set<string>();
        // Map để lưu trữ tất cả status của các ca trong một ngày (cho lateDays và presentDays)
        const workDateStatusMap = new Map<string, { 
            hasPresent: boolean; 
            hasLate: boolean; 
            hasApproved: boolean;
            hasAbsent: boolean; // Để đếm số ngày có absent records
            hasLeave: boolean; // Để đếm số ngày có leave records
        }>();

        // Kiểm tra xem có phải bác sĩ không (có shiftType MORNING hoặc AFTERNOON)
        const isDoctor = monthlyAttendances.some(a => 
            a.shiftType === "MORNING" || a.shiftType === "AFTERNOON"
        );

        const stats = monthlyAttendances.reduce(
            (acc, attendance) => {
                const workDate = attendance.workDate ? new Date(attendance.workDate).toISOString().split("T")[0] : "";
                const status = (attendance.attendanceStatus || "").toUpperCase();

                // Đếm số ngày unique (cho totalDays) - chỉ đếm lần đầu tiên gặp ngày này
                if (workDate && !uniqueWorkDates.has(workDate)) {
                    uniqueWorkDates.add(workDate);
                    // Không tăng totalDays ở đây nữa, sẽ tính sau theo tỷ lệ ca
                    
                    // Khởi tạo trạng thái cho ngày mới (cho lateDays và presentDays)
                    const isPresent = status === "ON_TIME" || status === "APPROVED_PRESENT" || status === "APPROVED_LATE" || status === "APPROVED_EARLY_LEAVE";
                    const isLate = status === "LATE" || status === "APPROVED_LATE";
                    const isAbsent = status === "ABSENT";
                    const isLeave = status === "APPROVED_ABSENCE";
                    
                    workDateStatusMap.set(workDate, {
                        hasPresent: isPresent,
                        hasLate: isLate,
                        hasApproved: status.startsWith("APPROVED"),
                        hasAbsent: isAbsent,
                        hasLeave: isLeave,
                    });
                }

                // Cập nhật trạng thái của ngày khi xử lý các ca tiếp theo (cho lateDays và presentDays)
                if (workDate && workDateStatusMap.has(workDate)) {
                    const dayStatus = workDateStatusMap.get(workDate)!;
                    const isPresent = status === "ON_TIME" || status === "APPROVED_PRESENT" || status === "APPROVED_LATE" || status === "APPROVED_EARLY_LEAVE";
                    const isLate = status === "LATE" || status === "APPROVED_LATE";
                    const isAbsent = status === "ABSENT";
                    const isLeave = status === "APPROVED_ABSENCE";
                    
                    if (isPresent) dayStatus.hasPresent = true;
                    if (isLate) dayStatus.hasLate = true;
                    if (status.startsWith("APPROVED")) dayStatus.hasApproved = true;
                    if (isAbsent) dayStatus.hasAbsent = true;
                    if (isLeave) dayStatus.hasLeave = true;
                }

                // Đếm absentDays và lateDays theo số records (giống backend)
                // Backend logic:
                // - ABSENT → absentDays++ (mỗi record ABSENT = 1 absentDay)
                // - APPROVED_ABSENCE → leaveDays++ (nhưng ta đếm vào absentDays để hiển thị)
                // - LATE → lateDays++ (mỗi record LATE = 1 lateDay)
                if (status === "ABSENT") {
                    acc.absentDays += 1;
                } else if (status === "APPROVED_ABSENCE") {
                    // APPROVED_ABSENCE được đếm vào absentDays để hiển thị (backend đếm vào leaveDays riêng)
                    acc.absentDays += 1;
                } else if (status === "LATE") {
                    // LATE được đếm riêng (backend: lateDays++)
                    acc.lateDays += 1;
                }
                // Note: APPROVED_LATE được đếm vào presentDays (theo ngày unique), không phải lateDays

                // Chỉ tính giờ làm nếu status không phải ABSENT hoặc APPROVED_ABSENCE
                // ABSENT/APPROVED_ABSENCE nghĩa là vắng mặt/nghỉ phép, không nên tính giờ làm dù có check-in/check-out
                const isAbsentOrLeave = status === "ABSENT" || status === "APPROVED_ABSENCE";
                
                if (!isAbsentOrLeave) {
                    acc.totalHours += calculateWorkedHours(attendance);
                    
                    if (attendance.actualWorkHours != null && attendance.actualWorkHours > 0) {
                        acc.totalActualWorkHours += attendance.actualWorkHours;
                    } else {
                        acc.totalActualWorkHours += calculateWorkedHours(attendance);
                    }
                }
                
                // Tính tổng phút đi trễ và ra sớm (chỉ tính cho các record không phải ABSENT)
                if (!isAbsentOrLeave) {
                    acc.totalLateMinutes += attendance.lateMinutes || 0;
                    acc.totalEarlyMinutes += attendance.earlyMinutes || 0;
                }

                return acc;
            },
            {
                totalDays: 0,
                presentDays: 0,
                lateDays: 0,
                absentDays: 0,
                approvedDays: 0,
                totalHours: 0,
                avgHours: 0,
                totalLateMinutes: 0,
                totalEarlyMinutes: 0,
                totalActualWorkHours: 0,
            }
        );

        // Tính totalDays và presentDays theo tỷ lệ ca cho bác sĩ
        if (isDoctor) {
            // Bác sĩ: group theo workDate và đếm số ca (tất cả records, không chỉ có check-in)
            const allShiftsByDate = new Map<string, number>();
            monthlyAttendances.forEach(attendance => {
                if (attendance.workDate) {
                    const workDate = new Date(attendance.workDate).toISOString().split("T")[0];
                    allShiftsByDate.set(workDate, (allShiftsByDate.get(workDate) || 0) + 1);
                }
            });
            
            // Tính totalDays: nếu có 2 ca = 1.0 ngày, 1 ca = 0.5 ngày
            // totalDays = tổng số ngày có records (theo tỷ lệ ca)
            stats.totalDays = Array.from(allShiftsByDate.values())
                .reduce((sum, count) => sum + (count >= 2 ? 1.0 : 0.5), 0);
            
            // Tính presentDays: group theo workDate và đếm số ca present trên từng ngày
            const presentShiftsByDate = new Map<string, number>();
            monthlyAttendances.forEach(attendance => {
                const status = (attendance.attendanceStatus || "").toUpperCase();
                const isPresent = status === "ON_TIME" || status === "APPROVED_PRESENT" || 
                                 status === "APPROVED_LATE" || status === "APPROVED_EARLY_LEAVE";
                if (isPresent && attendance.workDate) {
                    const workDate = new Date(attendance.workDate).toISOString().split("T")[0];
                    presentShiftsByDate.set(workDate, (presentShiftsByDate.get(workDate) || 0) + 1);
                }
            });
            
            // Tính presentDays: nếu có 2 ca = 1.0 ngày, 1 ca = 0.5 ngày
            stats.presentDays = Array.from(presentShiftsByDate.values())
                .reduce((sum, count) => sum + (count >= 2 ? 1.0 : 0.5), 0);
        } else {
            // Nhân viên: đếm theo ngày unique
            stats.totalDays = uniqueWorkDates.size;
        }

        // Đếm approvedDays theo ngày unique
        stats.approvedDays = 0;
        let absentDaysByDate = 0; // Số ngày có absent records (theo ngày unique)
        let leaveDaysByDate = 0; // Số ngày có leave records (theo ngày unique)

        workDateStatusMap.forEach((dayStatus) => {
            // Một ngày được coi là "present day" nếu có ít nhất một ca present (chỉ cho nhân viên)
            if (!isDoctor && dayStatus.hasPresent) {
                stats.presentDays += 1;
            }
            
            // Một ngày được coi là "approved day" nếu có ít nhất một ca trong ngày có status bắt đầu bằng "APPROVED"
            if (dayStatus.hasApproved) {
                stats.approvedDays += 1;
            }
            
            // Đếm số ngày có absent records (theo ngày unique)
            if (dayStatus.hasAbsent) {
                absentDaysByDate += 1;
            }
            
            // Đếm số ngày có leave records (theo ngày unique)
            if (dayStatus.hasLeave) {
                leaveDaysByDate += 1;
            }
        });

        // Tính số ngày làm việc từ đầu tháng đến ngày hiện tại (không phải đến cuối tháng)
        // Chỉ tính đến ngày hiện tại vì chưa đến các ngày tương lai
        const year = selectedYear;
        const month = selectedMonth;
        const startDate = new Date(year, month - 1, 1);
        const today = new Date();
        const endDateOfMonth = new Date(year, month, 0); // Ngày cuối cùng của tháng
        // Chỉ tính đến ngày hiện tại nếu tháng được chọn là tháng hiện tại
        const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1;
        const effectiveEndDate = isCurrentMonth && today < endDateOfMonth ? today : endDateOfMonth;
        
        let workingDaysInMonth = 0;
        const currentDate = new Date(startDate);
        while (currentDate <= effectiveEndDate) {
            const dayOfWeek = currentDate.getDay();
            // Chủ nhật = 0, không tính vào working days
            if (dayOfWeek !== 0) {
                workingDaysInMonth++;
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // absentDays đã được đếm trong reduce loop (theo số records, giống backend)
        // Tuy nhiên, nếu không có records nào (một tháng không check-in/check-out),
        // thì absentDays = 0, nhưng thực tế nhân viên đó vắng cả tháng
        // Do đó, cần thêm logic fallback:
        
        // Nếu không có records nào (totalDays = 0) và có workingDays > 0,
        // thì nhân viên đó vắng cả tháng → absentDays = workingDays
        if (stats.totalDays === 0 && workingDaysInMonth > 0) {
            stats.absentDays = workingDaysInMonth;
            stats.totalDays = workingDaysInMonth;
        } else if (stats.totalDays < workingDaysInMonth) {
            // Nếu có một số records nhưng ít hơn số ngày làm việc,
            // thì những ngày chưa có records được coi là absent
            // absentDays (từ records) + (workingDays - totalDays - leaveDaysByDate)
            const missingDays = workingDaysInMonth - stats.totalDays;
            // Trừ đi số ngày đã có leave records (vì leave không phải absent)
            stats.absentDays += Math.max(0, missingDays - leaveDaysByDate);
            // Cập nhật totalDays để phản ánh đúng tổng số ngày làm việc
            stats.totalDays = workingDaysInMonth;
        }

        const avgHours = stats.presentDays > 0 ? stats.totalActualWorkHours / stats.presentDays : 0;

        return { ...stats, avgHours };
    }, [monthlyAttendances]);

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">{t("attendance.monthlyHistory.title", "Monthly Attendance History")}</h2>
                <div className="flex gap-2">
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        className="px-3 py-2 border rounded-lg"
                        title={t("attendance.monthlyHistory.selectMonth", "Select Month")}
                        aria-label={t("attendance.monthlyHistory.selectMonth", "Select Month")}
                    >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                            <option key={month} value={month}>
                                {t("attendance.monthlyHistory.month", "Month")} {month}
                            </option>
                        ))}
                    </select>
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="px-3 py-2 border rounded-lg"
                        title={t("attendance.monthlyHistory.selectYear", "Select Year")}
                        aria-label={t("attendance.monthlyHistory.selectYear", "Select Year")}
                    >
                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                            <option key={year} value={year}>
                                {year}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            {monthlyAttendances.length > 0 && <MonthlySummaryCards monthlySummary={monthlySummary} />}
            {loadingMonthly ? (
                <div className="text-center py-8">{t("attendance.loading", "Loading...")}</div>
            ) : monthlyAttendances.length > 0 ? (
                <MonthlyAttendanceTable monthlyAttendances={monthlyAttendances} />
            ) : (
                <div className="text-center py-8 text-gray-500">
                    {t("attendance.monthlyHistory.noData", "No attendance data for this month")}
                </div>
            )}
        </div>
    );
};

