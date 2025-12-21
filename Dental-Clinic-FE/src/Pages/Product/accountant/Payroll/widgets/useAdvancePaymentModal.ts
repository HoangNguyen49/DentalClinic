import { useState } from 'react';
import { 
  payrollApi, 
  type PayslipSnapshotDto, 
  type PayslipAllowanceDto 
} from '../../../../../huybro_api/payrollApi';

interface ModalState {
  isOpen: boolean;
  payslipId: number | null;
  employeeName: string;
  // Danh sách các khoản biến động hiện có trong phiếu lương này
  items: PayslipAllowanceDto[]; 
}

export const useAdvancePaymentModal = (onSuccess?: () => void) => {
  const [state, setState] = useState<ModalState>({
    isOpen: false,
    payslipId: null,
    employeeName: '',
    items: [],
  });

  const [loading, setLoading] = useState(false);

  // Mở modal: Nạp dữ liệu từ row được chọn trong bảng lương
  const openModal = (slip: PayslipSnapshotDto) => {
    setState({
      isOpen: true,
      payslipId: slip.id,
      employeeName: slip.userFullName,
      items: slip.allowanceDetails || [] 
    });
  };

  const closeModal = () => {
    setState(prev => ({ ...prev, isOpen: false, payslipId: null }));
  };

  // THÊM BIẾN ĐỘNG (Ứng tiền, Thưởng dự án...)
  const handleAddItem = async (name: string, amount: number, type: 'INCOME' | 'DEDUCTION') => {
    if (!state.payslipId) return;
    setLoading(true);
    try {
      const res = await payrollApi.addManualItem(state.payslipId, {
        name: name.trim(),
        amount,
        type,
        note: "Manual Adjustment"
      });
      
      setState(prev => ({ ...prev, items: res.data.allowanceDetails }));
      
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error: any) {
      console.error("Failed to add adjustment:", error);
      alert(error.response?.data?.message || "Lỗi khi thêm khoản biến động");
    } finally {
      setLoading(false);
    }
  };

  // XÓA BIẾN ĐỘNG
  const handleRemoveItem = async (itemId: number) => {
    if (!state.payslipId) return;
    if (!window.confirm("Bạn có chắc chắn muốn xóa khoản điều chỉnh này không?")) return;

    setLoading(true);
    try {
      const res = await payrollApi.removeManualItem(state.payslipId, itemId);
      
      setState(prev => ({ ...prev, items: res.data.allowanceDetails }));

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
        alert(error.response?.data?.message || "Lỗi khi xóa khoản biến động");
    } finally {
      setLoading(false);
    }
  };

  return {
    ...state, 
    loading,
    openModal,
    closeModal,
    handleAddItem,
    handleRemoveItem
  };
};