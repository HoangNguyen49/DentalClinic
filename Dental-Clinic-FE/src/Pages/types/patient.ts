export interface PatientAppointment {
  appointmentId: number;
  startDateTime: string; // ISO string từ BE
  endDateTime: string | null;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NOSHOW';
  note: string | null;
  
  clinicName: string;
  clinicAddress: string;
  
  doctorName: string;
  doctorAvatar: string | null;
  
  serviceName: string;
  variantName: string;

  // --- BẮT BUỘC CÓ TRƯỜNG NÀY ---
  canCancel: boolean; 
}