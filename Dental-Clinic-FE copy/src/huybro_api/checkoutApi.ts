import axiosClient from "./axiosClient";

export interface CheckoutContactInfoDto {
  fullName: string;
  email: string;
  phone: string;
}

/**
 * Gọi Be để lấy fullname,email,phone của user cho bước checkout, 
 * huhu biết a Hoàng có nhưng mà code ở đâu e không biết, lười mò code và đọc code bởi vì đã quá tải thông tin
 * - Nếu user đã đăng nhập: trả về DTO ( fullName, email, phone )
 * - Nếu 401 là khách vãng: trả về null
 */
export async function fetchCheckoutContactInfo(): Promise<CheckoutContactInfoDto | null> {
  try {
    const res = await axiosClient.get<CheckoutContactInfoDto>(
      "/api/checkout/contact-info"
    );
    return res.data;
  } catch (err: any) {
    if (err?.response?.status === 401) {
      return null; // Guest
    }
    throw err;
  }
}