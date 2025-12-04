import axiosClient from '../huybro_api/axiosClient';

// Hàm cấu hình interceptor cho axiosClient (thêm token, xử lý 401)
export function setupAxiosInterceptors() {
  // Thêm Authorization header vào request nếu có token
  axiosClient.interceptors.request.use(
    (config) => {
      // Thêm token nếu có
      const token = localStorage.getItem('accessToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Xử lý response, cụ thể là khi gặp lỗi 401 (chưa đăng nhập hoặc token hết hạn)
  axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
      // Xử lý 401: xóa token và thông tin user trong localStorage
      if (error?.response?.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        // window.location.href = '/login'; // Có thể chuyển hướng người dùng về trang login nếu muốn
      }
      return Promise.reject(error);
    }
  );
}
