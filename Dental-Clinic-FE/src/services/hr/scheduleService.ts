import axiosClient from '../../huybro_api/axiosClient';

// Payload tạo lịch làm việc tuần
export interface CreateScheduleRequest {
    weekStart: string;
    dailyAssignments: {
        // key: yyyy-mm-dd, value: danh sách phân công
        [key: string]: Array<{
            doctorId: number;
            clinicId: number;
            roomId: number;
            chairId: number;
            startTime: string;
            endTime: string;
            note?: string;
        }>;
    };
    note?: string;
}

// Một ca làm việc cụ thể trong lịch
export interface ScheduleItem {
    id: number;
    doctor: any;
    clinic: any;
    room: any;
    chair: any;
    workDate: string;
    startTime: string;
    endTime: string;
    status: string;
    note?: string;
}

const scheduleService = {
    getHolidays: () => {
        // lấy danh sách ngày nghỉ
        return axiosClient.get<any[]>('/api/hr/management/holidays');
    },

    getClinics: () => {
        return axiosClient.get<Array<{ id: number; clinicName: string; isActive?: boolean }>>('/api/hr/management/clinics');
    },

    getEmployees: (params: { size?: number; isActive?: boolean }) => {
        return axiosClient.get<{ content: any[]; totalElements: number }>('/api/hr/employees', { params });
    },

    validateSchedule: (request: CreateScheduleRequest) => {
        // kiểm tra lịch xếp có trùng, hợp lệ không
        return axiosClient.post<{ isValid: boolean; errors: string[] }>('/api/hr/schedules/validate', request);
    },

    createSchedule: (request: CreateScheduleRequest) => {
        // tạo hoặc lưu xác nhận lịch tuần
        return axiosClient.post<ScheduleItem[]>('/api/hr/schedules/create', request);
    },

    generateScheduleAi: (weekStart: string, description: string) => {
        // AI gợi ý lịch tự động theo tuần
        return axiosClient.post<CreateScheduleRequest>('/api/hr/schedules/ai/generate', {
            weekStart,
            description
        });
    }
};

export default scheduleService;
