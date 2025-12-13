export interface PatientProfile {
    patientId: number;
    fullName: string;
    phone: string;
    email: string;
    gender: string;
    dateOfBirth: string; // ISO String "YYYY-MM-DD"
    address: string;
    note: string;
    patientCode: string;
}