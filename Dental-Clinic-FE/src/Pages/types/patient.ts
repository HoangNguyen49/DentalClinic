export interface PatientAppointment {
  appointmentId: number;
  startDateTime: string; // ISO string
  endDateTime: string | null;
  
  // Vẫn giữ đồng bộ status với team member
  status: 
    | 'PENDING'       
    | 'SCHEDULED'     
    | 'CONFIRMED'     
    | 'IN_PROGRESS'   
    | 'PROCESSING'    
    | 'COMPLETED'     
    | 'CANCELLED'     
    | 'CANCELED'      
    | 'NOSHOW'        
    | 'NO_SHOW';      

  note: string | null;
  
  clinicName: string;
  clinicAddress: string;
  
  doctorName: string;
  doctorAvatar: string | null;
  
  serviceName: string;
  variantName: string;

  // Đã bỏ canCancel
}