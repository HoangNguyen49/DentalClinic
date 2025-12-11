import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import scheduleService from "../../../../services/hr/scheduleService";
import leaveRequestService from "../../../../services/hr/leaveRequestService";

export const useScheduleData = (weekStart: string) => {
    const [doctors, setDoctors] = useState<any[]>([]);
    const [clinics, setClinics] = useState<any[]>([]);
    const [holidays, setHolidays] = useState<any[]>([]);
    const [approvedLeaves, setApprovedLeaves] = useState<any[]>([]);

    // Fetch holidays
    const fetchHolidays = async () => {
        try {
            const holidaysRes = await scheduleService.getHolidays();
            setHolidays(holidaysRes.data || []);
        } catch (err: any) {
            // Silent fail
        }
    };

    // Lấy danh sách bác sĩ nghỉ phép đã được duyệt trong tuần
    const fetchApprovedLeaves = async () => {
        if (!weekStart) return;
        try {
            // Parse with explicit time to avoid timezone issues
            const monday = new Date(weekStart + 'T00:00:00');
            const saturday = new Date(monday);
            saturday.setDate(monday.getDate() + 5);

            const startDate = monday.toISOString().split("T")[0];
            const endDate = saturday.toISOString().split("T")[0];

            const response = await leaveRequestService.getApprovedLeaveRequestsInRange(startDate, endDate);
            setApprovedLeaves(response.data || []);
        } catch (err: any) {
            console.error("Failed to fetch approved leaves:", err);
        }
    };

    // Refresh clinics
    const refreshClinics = async () => {
        try {
            const clinicsRes = await scheduleService.getClinics();
            const clinicsData = (clinicsRes.data || [])
                .map((c: any) => ({
                    id: c.id,
                    name: c.clinicName || c.name,
                    isActive: c.isActive !== undefined ? c.isActive : true,
                }))
                .filter((c: any) => c.isActive === true);
            setClinics(clinicsData);
        } catch (err: any) {
            // Silent fail
        }
    };

    // Lấy danh sách bác sĩ và cơ sở
    const fetchDataFromAPI = async () => {
        try {
            try {
                const doctorsRes = await scheduleService.getEmployees({ size: 100, isActive: true });

                const allEmployees = doctorsRes.data?.content || [];
                const doctorEmployees = allEmployees.filter((emp: any) => {
                    const roleName = emp.role?.roleName || emp.role?.name || "";
                    return roleName && roleName.toUpperCase().includes("DOCTOR");
                });

                if (doctorEmployees.length === 0) {
                    setDoctors(allEmployees);
                } else {
                    setDoctors(doctorEmployees);
                }
            } catch (err: any) {
                toast.error("Could not load doctors.");
            }

            await refreshClinics();
        } catch (err: any) {
            toast.error("Error loading schedule data.");
        }
    };

    useEffect(() => {
        fetchDataFromAPI();
        fetchHolidays();
    }, []);

    useEffect(() => {
        refreshClinics();
        fetchHolidays();
    }, [weekStart]);

    useEffect(() => {
        fetchApprovedLeaves();
    }, [weekStart]);

    return {
        doctors,
        clinics,
        holidays,
        approvedLeaves,
        fetchDataFromAPI,
        refreshClinics,
        fetchHolidays,
        fetchApprovedLeaves
    };
};
