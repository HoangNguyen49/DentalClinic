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

export interface PatientDashboardDTO {
    fullName: string;
    patientCode: string;
    avatarUrl: string;
    
    // Khối 1: Wellness
    healthStatus: 'Excellent' | 'Warning' | 'Overdue' | 'New';
    healthMessage: string;
    daysSinceLastVisit: number;

    // Khối 2: Appointment
    nextAppointment: UpcomingAppointment | null;

    // Khối 3: Info
    latestAiTip: string;
    recentActivities: Activity[];
}