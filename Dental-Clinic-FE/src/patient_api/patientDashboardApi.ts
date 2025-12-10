import axiosClient from '../huybro_api/axiosClient'; 
import type { PatientDashboardDTO } from '../Pages/types/patientDashboard'; 

const patientDashboardApi = {
    getDashboardSummary: async (): Promise<PatientDashboardDTO> => {
        // --- SỬA LỖI TẠI ĐÂY: Thêm /api vào đầu ---
        const url = '/api/patient/dashboard/summary'; 
        
        const response = await axiosClient.get<PatientDashboardDTO>(url);
        return response.data; 
    }
};

export default patientDashboardApi;