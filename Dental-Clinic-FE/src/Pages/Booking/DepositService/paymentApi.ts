import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Hàm lấy Token trực tiếp từ LocalStorage
const getAuthHeader = () => {
  const token = localStorage.getItem("accessToken");
  return {
    headers: {
      'Authorization': `Bearer ${token}`, 
      'Content-Type': 'application/json'
    }
  };
};

// 1. Lấy URL thanh toán VNPay
export const getVnpayUrl = async (appointmentId: number) => {
  const response = await axios.get(`${API_BASE}/api/booking/payment/vnpay/url`, {
    params: { appointmentId },
    ...getAuthHeader() // Gửi kèm Header
  });
  
  // Ép kiểu as any để tránh lỗi TypeScript
  return (response.data as any).paymentUrl; 
};

// 2. Xác thực kết quả VNPay
export const verifyVnpay = async (params: any) => {
  const response = await axios.post(
    `${API_BASE}/api/booking/payment/vnpay/verify`, 
    params,
    getAuthHeader()
  );
  return response.data;
};

// 3. Tạo PayPal Order
export const createPaypalOrder = async (appointmentId: number) => {
  const response = await axios.post(
      `${API_BASE}/api/booking/payment/paypal/create`, 
      null, 
      {
        params: { appointmentId },
        ...getAuthHeader()
      }
  );
  return response.data as any; 
};

// 4. Capture PayPal Order
export const capturePaypalOrder = async (orderId: string, appointmentId: number) => {
  const response = await axios.post(
      `${API_BASE}/api/booking/payment/paypal/capture`, 
      null, 
      {
        params: { orderId, appointmentId },
        ...getAuthHeader()
      }
  );
  return response.data;
};