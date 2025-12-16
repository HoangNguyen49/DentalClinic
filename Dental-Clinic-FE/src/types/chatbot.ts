export interface ChatbotRequest {
  question: string;
  patientId?: number;
  recordId?: number | string;
  appointmentId?: number | string;
  patientCode?: string;
}

export interface ChatbotResponse {
  answer: string | null;
  question: string;
  success: boolean;
  errorMessage: string | null;
}
