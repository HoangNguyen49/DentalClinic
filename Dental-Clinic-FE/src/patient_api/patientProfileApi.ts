import axiosClient from '../huybro_api/axiosClient';
import type { PatientProfile } from '../Pages/types/patientProfile';


const patientProfileApi = {
    getProfile: async (): Promise<PatientProfile> => {
        const url = '/api/patient/profile';
        const response = await axiosClient.get<PatientProfile>(url);
        return response.data;
    },

    updateProfile: async (data: Partial<PatientProfile>) => {
        const url = '/api/patient/profile';
        return await axiosClient.put(url, data);
    }
};

export default patientProfileApi;