import { useState, useEffect, useCallback } from "react";
import { invoiceApi, type ProductInvoiceDetailDto, type InvoiceStatus } from "../../../../../huybro_api/invoiceApi";

export const useInvoiceDetail = (invoiceIdStr: string | undefined) => {
  const [invoice, setInvoice] = useState<ProductInvoiceDetailDto | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const fetchDetail = useCallback(async () => {
    if (!invoiceIdStr) return;
    setLoading(true);
    try {
      const id = parseInt(invoiceIdStr);
      const data = await invoiceApi.getInvoiceDetail(id);
      setInvoice(data);
    } catch (err: any) {
      setError("Could not load invoice detail.");
    } finally {
      setLoading(false);
    }
  }, [invoiceIdStr]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const updateStatus = async (newStatus: InvoiceStatus, note: string = "") => {
    if (!invoice) return;
    setIsUpdating(true);
    try {
      await invoiceApi.updateInvoiceStatus(invoice.invoiceId, { newStatus, note });
      await fetchDetail(); // Load lại data mới nhất để UI cập nhật
      alert(`Success: Invoice is now ${newStatus}`);
    } catch (err: any) {
      // Hiển thị lỗi từ BE (Ví dụ: Hết hàng, sai luồng)
      const msg = err.response?.data?.message || "Update failed";
      alert(`Error: ${msg}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return { invoice, loading, error, isUpdating, updateStatus };
};