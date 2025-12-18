import axiosClient from "../../huybro_api/axiosClient";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export interface Room {
    id: number;
    roomName: string;
    isPrivate: boolean;
    isActive: boolean;
}

export interface BillInvoice {
    clinicName: string;
    clinicAddress: string;
    invoiceId: string;
    createdDate: string;
    patientName: string;
    patientPhone: string;
    patientCode: string;
    membershipRank: string;
    
    appointmentType: string;
    bookingFee: number;
    isBookingFeePaid: boolean;
    
    // Định nghĩa rõ kiểu cho mảng services
    services: {
        serviceName: string;
        quantity: number;
        unitPrice: number;
        total: number;
    }[];
    
    subTotal: number;
    discountAmount: number;
    totalAmount: number;
    totalPaid: number;
    remainingBalance: number;
}

//  INTERFACE CHO DỮ LIỆU LIST LỊCH HẸN
export interface AppointmentDTO {
    id: number;
    patientName: string;
    patientPhone: string;
    patientCode: string;
    doctorName: string;
    clinicName: string;
    startDateTime: string;
    endDateTime: string;
    status: string;
    paymentStatus: string;
    appointmentType: string;
}

// INTERFACE CHO DỮ LIỆU BỆNH NHÂN
export interface PatientResponse {
    id: number;
    patientCode: string;
    fullName: string;
    gender?: string;
    dateOfBirth?: string; 
    phone: string;
    email?: string;
    address?: string;
    isActive: boolean;
}

// INTERFACE CHO DỮ LIỆU LỊCH SỬ KHÁM BỆNH
export interface PatientHistoryDTO {
    appointmentId: number;
    visitDate: string;
    doctorName: string;
    diagnosis: string;
    serviceNames: string; // Chuỗi tên dịch vụ (VD: "Cạo vôi, Nhổ răng")
    totalAmount: number;
    status: string;
}

// INTERFACE CHO PHÂN TRANG (PAGE) 
export interface PageResponse<T> {
    content: T[];          // Danh sách dữ liệu
    totalPages: number;    // Tổng số trang
    totalElements: number; // Tổng số bản ghi
    size: number;
    number: number;
}

export const receptionApi = {
    // lấy danh sách phòng trống
    getAvailableRooms: (clinicId: number, start: string, end: string) => {
        return axiosClient.get<Room[]>("/api/reception/rooms/available", {
            params: { clinicId, start, end }
        });
    },

    // gán phòng cho lịch hẹn
    assignRoom:(appointmentId: number, roomId: number | null) => {
        return axiosClient.put(`/api/reception/appointments/${appointmentId}/assign-room`, null, {
            params: { roomId: roomId }
        });
    },

    // Lấy Lịch sử khám bệnh
    getPatientHistory: (patientId: number) => {
        // Trả về mảng PatientHistoryDTO
        return axiosClient.get<PatientHistoryDTO[]>(`/api/reception/patients/${patientId}/history`);
    },

    // 👇 MỚI: Cập nhật thông tin bệnh nhân
    updatePatient: (id: number, data: any) => {
        return axiosClient.put<PatientResponse>(`/api/reception/patients/${id}`, data);
    }
}

// phân trang lịch hẹn
export const searchAppointments = async (params: any) => {
    const res = await axiosClient.get<PageResponse<AppointmentDTO>>('/api/reception/appointments/search', {
        params: params
    });
    return res.data;
};

// 2. Lấy chi tiết hóa đơn 
export const getBillDetails = async (appointmentId: number) => {
    const res = await axiosClient.get<BillInvoice>(`/api/reception/appointments/${appointmentId}/bill`);
    return res.data;
};

// 3. Xác nhận thanh toán 
export const confirmPayment = async (appointmentId: number) => {
    const res = await axiosClient.post(`/api/reception/appointments/${appointmentId}/pay`);
    return res.data;
};

// 4. Lấy danh sách hóa đơn với phân trang và lọc
export const getInvoiceList = async (
  keyword: string,
  fromDate: string | null,
  toDate: string | null,
  paymentStatus: string,
  page: number,
  size: number
) => {
  const token = localStorage.getItem("accessToken");
  
  // Tạo đối tượng params để tự động loại bỏ các giá trị null/undefined/rỗng
  const params: Record<string, any> = {
    page,
    size,
  };

  if (keyword) params.keyword = keyword;
  if (fromDate) params.fromDate = fromDate;
  if (toDate) params.toDate = toDate;
  if (paymentStatus) params.paymentStatus = paymentStatus;

  const response = await axios.get(`${API_BASE_URL}/api/reception/invoices`, {
    params,
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};