import { useState, useCallback } from "react"
import { toast } from "react-toastify"
import { extractErrorMessage, isNetworkError, isUnauthorizedError, logError } from "../utils/errorHandler"

// Custom hook xử lý gọi API cho HR, có sẵn xử lý lỗi
export function useHrApi<T>() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Hàm execute dùng để gọi API, có thể truyền các option (onSuccess, onError, errorMessage, showErrorToast)
  const execute = useCallback(
    async (
      apiCall: () => Promise<{ data: T }>,
      options?: {
        showErrorToast?: boolean
        errorMessage?: string
        onSuccess?: (data: T) => void
        onError?: (error: unknown) => void
      }
    ): Promise<T | null> => {
      setLoading(true)
      setError(null)

      try {
        const response = await apiCall()
        const data = response.data

        if (options?.onSuccess) {
          options.onSuccess(data)
        }

        return data
      } catch (err) {
        // Không log lỗi 401 (unauthorized) - lỗi này interceptor đã xử lý rồi
        if (!isUnauthorizedError(err)) {
          logError("useHrApi", err)
        }

        const errorMessage = extractErrorMessage(err, options?.errorMessage || "Đã xảy ra lỗi")

        setError(errorMessage)

        // Hiển thị toast lỗi nếu không phải network error (tránh spam toast khi mất mạng)
        if (options?.showErrorToast !== false && !isNetworkError(err)) {
          toast.error(errorMessage)
        }

        if (options?.onError) {
          options.onError(err)
        }

        return null
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return {
    loading,
    error,
    execute,
  }
}

