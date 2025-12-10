/**
 * Các hàm tiện ích cho module Admin
 */

/**
 * Định dạng ngày tháng (dd/MM/yyyy)
 */
export function formatDate(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (isNaN(date.getTime())) return value ?? "-";
  return date.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/**
 * Định dạng ngày giờ (dd/MM/yyyy, HH:mm)
 */
export function formatDateTime(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (isNaN(date.getTime())) return value ?? "-";
  return date.toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Định dạng thời gian (HH:mm)
 */
export function formatTime(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (isNaN(date.getTime())) return value ?? "-";
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * Định dạng tiền tệ (VND hoặc USD)
 */
export function formatMoney(amount: number, currency: string = "VND"): string {
  if (!Number.isFinite(amount)) return "-";
  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Định dạng chuỗi ngày cho input[type="date"] (yyyy-MM-dd)
 */
export function formatDateInput(date: Date | string): string {
  if (typeof date === "string") {
    // Nếu đã là yyyy-MM-dd
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    // Nếu là chuỗi ISO hoặc có "T", tách lấy phần ngày
    return date.split("T")[0];
  }
  if (date instanceof Date) {
    if (isNaN(date.getTime())) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  return "";
}
