export interface UpcomingAppointment {
    appointmentId: number;
    doctorName: string;
    startDateTime: string;
    serviceName: string;
    status: string;
    roomName: string;
}

export interface Activity {
    title: string;
    date: string;
    type: string;
}

export interface MedicalRecordDTO {
    recordId: number;
    visitDate: string;
    diagnosis: string;
    treatment: string;
    doctorName: string;
    note: string;
    prescriptionNote: string;
    imageUrl: string | null;
}

export interface PatientDashboardDTO {
    fullName: string;
    patientCode: string;
    avatarUrl: string;
    
    // Membership
    memberTier: 'MEMBER' | 'SILVER' | 'GOLD' | 'DIAMOND';
    totalSpent: number;
    nextTierGoal: number | null;

    // Wellness
    healthStatus: 'Excellent' | 'Warning' | 'Overdue' | 'New';
    healthMessage: string;
    daysSinceLastVisit: number;

    nextAppointment: UpcomingAppointment | null;
    medicalHistory: MedicalRecordDTO[]; // Array
    latestAiTip: string;
    recentActivities: Activity[];
}