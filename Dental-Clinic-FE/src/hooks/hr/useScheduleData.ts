import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { hrApi } from "../../services/hr/hrApi";
import { useHrApi } from "../useHrApi";

export const useScheduleData = (weekStart: string) => {
    const { execute: executeApi } = useHrApi<any>();
    const [doctors, setDoctors] = useState<any[]>([]);
    const [clinics, setClinics] = useState<any[]>([]);
    const [holidays, setHolidays] = useState<any[]>([]);
    const [approvedLeaves, setApprovedLeaves] = useState<any[]>([]);

    // Fetch holidays
    const fetchHolidays = async () => {
        await executeApi(hrApi.schedules.getHolidays, {
            onSuccess: (data: any) => {
                setHolidays((data as any[]) || []);
            },
            showErrorToast: false,
        });
    };

    // Lấy danh sách bác sĩ nghỉ phép đã được duyệt trong tuần
    const fetchApprovedLeaves = async () => {
        if (!weekStart) return;
        
        // Parse with explicit time to avoid timezone issues
        const monday = new Date(weekStart + 'T00:00:00');
        const saturday = new Date(monday);
        saturday.setDate(monday.getDate() + 5);

        const startDate = monday.toISOString().split("T")[0];
        const endDate = saturday.toISOString().split("T")[0];

        await executeApi(() => hrApi.leaveRequests.getApprovedInRange(startDate, endDate), {
            onSuccess: (data: any) => {
                setApprovedLeaves((data as any[]) || []);
            },
            showErrorToast: false,
        });
    };

    // Refresh clinics
    const refreshClinics = async () => {
        await executeApi(hrApi.schedules.getClinics, {
            onSuccess: (data: any) => {
                const clinicsData = ((data as any[]) || [])
                    .map((c: any) => ({
                        id: c.id,
                        name: c.clinicName || c.name,
                        isActive: c.isActive !== undefined ? c.isActive : true,
                    }))
                    .filter((c: any) => c.isActive === true);
                setClinics(clinicsData);
            },
            showErrorToast: false,
        });
    };

    // Lấy danh sách bác sĩ và cơ sở
    const fetchDataFromAPI = async () => {
        await executeApi(() => hrApi.schedules.getEmployees({ size: 100, isActive: true }), {
            onSuccess: (data: any) => {
                const allEmployees = (data as any)?.content || [];
                const doctorEmployees = allEmployees.filter((emp: any) => {
                    const roleName = emp.role?.roleName || emp.role?.name || "";
                    return roleName && roleName.toUpperCase().includes("DOCTOR");
                });

                if (doctorEmployees.length === 0) {
                    setDoctors(allEmployees);
                } else {
                    setDoctors(doctorEmployees);
                }
            },
            onError: () => {
                toast.error("Could not load doctors.");
            },
            showErrorToast: false,
        });

        await refreshClinics();
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

