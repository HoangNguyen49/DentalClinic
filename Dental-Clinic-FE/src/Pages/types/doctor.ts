// Common types for Doctor pages

export interface ServiceVariantDTO {
  variantId?: number;
  id?: number; // Support both variantId and id for compatibility
  variantName: string;
  description?: string;
  price?: number;
  duration?: number;
  currency?: string;
  isActive?: boolean;
}

export interface ServiceDTO {
  id: number;
  serviceName: string;
  category?: string;
  description?: string;
  defaultDuration?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  variants?: ServiceVariantDTO[];
}

export interface AppointmentServiceDTO {
  id?: number;
  appointmentServiceId?: number;
  service?: ServiceDTO;
  serviceVariant?: ServiceVariantDTO;
}

export interface ClinicDTO {
  id: number;
  clinicName: string;
  address?: string;
}

export interface PatientDTO {
  id: number;
  patientCode: string;
  fullName: string;
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  gender?: string;
}

export interface DoctorDTO {
  id: number;
  fullName: string;
  email?: string;
  phone?: string;
}

export interface RoomDTO {
  id: number;
  roomName: string;
}

export interface ChairDTO {
  id: number;
  chairNumber: string;
}

export interface DoctorAppointmentDTO {
  appointmentId: number;
  clinic?: ClinicDTO;
  patient?: PatientDTO;
  doctor?: DoctorDTO;
  room?: RoomDTO;
  chair?: ChairDTO;
  startDateTime: string;
  endDateTime?: string;
  status: string;
  channel?: string;
  note?: string;
  createdById?: number;
  createdByName?: string;
  createdAt?: string;
  updatedAt?: string;
  
  // ⚠️ CẬP NHẬT: Service và Variant từ AppointmentService
  service?: ServiceDTO | null;
  serviceVariant?: ServiceVariantDTO | null; // ⭐ MỚI: Variant từ AppointmentService
  
  appointmentServiceId?: number; // ID của AppointmentService để lấy cả service và variant
  appointmentServices?: AppointmentServiceDTO[]; // Array of appointment services (if multiple)
  // Optional raw variant names from appointment (legacy / simplified API)
  serviceDetails?: string[];
  
  appointmentType?: string; // "VIP" hoặc "STANDARD"
  bookingFee?: number;
}

export interface MedicalRecordImage {
  imageId: number;
  imageUrl: string;
  description?: string;
  aiTag?: string;
  createdAt?: string;
}

export interface MedicalRecordDTO {
  recordId: number;
  clinic?: ClinicDTO;
  patient?: PatientDTO;
  doctor?: DoctorDTO;
  appointmentId?: number | null;
  
  // ⚠️ CẬP NHẬT: Service và Variant từ AppointmentService
  service?: ServiceDTO | null;
  serviceVariant?: ServiceVariantDTO | null;
  
  diagnosis: string;
  treatmentPlan?: string;
  prescriptionNote?: string;
  note?: string;
  recordDate: string;
  createdAt?: string;
  updatedAt?: string;
  images?: MedicalRecordImage[];
  
  // Legacy fields for backward compatibility
  serviceId?: number;
  serviceName?: string;
  appointmentDateTime?: string;
}

export interface MedicalRecordRequest {
  clinicId: number;
  doctorId: number;
  appointmentId?: number | null;
  serviceId?: number | null;
  variantId?: number | null;
  appointmentServiceId?: number | null; // ⭐ MỚI: Ưu tiên sử dụng
  diagnosis: string;
  treatmentPlan?: string | null;
  prescriptionNote?: string | null;
  note?: string | null;
  recordDate?: string | null; // "yyyy-MM-dd" format
}

