
// Interface cho lỗi trả về từ API
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  data?: any;
}

// Hàm lấy message lỗi từ nhiều dạng error khác nhau
export function extractErrorMessage(error: unknown, defaultMessage: string = "Đã xảy ra lỗi"): string {
  if (error instanceof Error) {
    return error.message || defaultMessage;
  }
  
  if (typeof error === "object" && error !== null) {
    const apiError = error as any;

    // Trường hợp phổ biến của lỗi trả về từ axios
    if (apiError.response?.data?.message) {
      return apiError.response.data.message;
    }
    if (apiError.response?.data?.error) {
      return apiError.response.data.error;
    }
    if (apiError.message) {
      return apiError.message;
    }
  }

  if (typeof error === "string") {
    return error;
  }

  return defaultMessage;
}

// Kiểm tra lỗi mạng
export function isNetworkError(error: unknown): boolean {
  if (typeof error === "object" && error !== null) {
    const apiError = error as any;
    return (
      apiError.code === "ERR_NETWORK" ||
      apiError.code === "ERR_CONNECTION_REFUSED" ||
      apiError.message?.includes("Network Error")
    );
  }
  return false;
}

// Kiểm tra lỗi 401 (unauthorized)
export function isUnauthorizedError(error: unknown): boolean {
  if (typeof error === "object" && error !== null) {
    const apiError = error as any;
    return apiError.response?.status === 401;
  }
  return false;
}

// Log lỗi ra console ở môi trường phát triển
export function logError(context: string, error: unknown): void {
  if (import.meta.env.DEV) {
    console.error(`[${context}]`, error);
  }
}

