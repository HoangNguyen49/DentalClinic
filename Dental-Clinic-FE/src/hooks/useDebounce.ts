import { useState, useEffect } from "react";

// Hook debounce giá trị, trả về giá trị sau một khoảng delay
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Thiết lập timeout, chỉ cập nhật sau khi value không thay đổi trong 'delay' ms
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Xoá timeout nếu value hoặc delay bị thay đổi trước khi timeout chạy xong
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
