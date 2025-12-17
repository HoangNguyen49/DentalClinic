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
  // Dữ liệu local để hiển thị ngay lập tức
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

  // Mở modal và nạp dữ liệu từ dòng Payslip được chọn
  const openModal = (slip: PayslipSnapshotDto) => {
    setState({
      isOpen: true,
      payslipId: slip.id,
      employeeName: slip.userFullName,
      items: slip.allowanceDetails || [] // Lấy list từ DTO
    });
  };

  const closeModal = () => {
    setState(prev => ({ ...prev, isOpen: false, payslipId: null }));
  };

  // Thêm item mới (Ứng lương, Thưởng...)
  const handleAddItem = async (name: string, amount: number, type: 'INCOME' | 'DEDUCTION') => {
    if (!state.payslipId) return;
    setLoading(true);
    try {
      const res = await payrollApi.addManualItem(state.payslipId, {
        name,
        amount,
        type,
        note: "Manual Adjustment"
      });
      
      // Cập nhật list local từ response BE trả về (đã bao gồm tính toán lại)
      setState(prev => ({ ...prev, items: res.data.allowanceDetails }));
      
      // Callback để refresh bảng lương bên ngoài (Update Net Salary)
      if (onSuccess) onSuccess(); 
    } catch (error) {
      console.error("Failed to add item", error);
      alert("Failed to add item. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Xóa item
  const handleRemoveItem = async (itemId: number) => {
    if (!state.payslipId) return;
    // Confirm đơn giản
    if (!window.confirm("Are you sure you want to remove this item?")) return;

    setLoading(true);
    try {
      const res = await payrollApi.removeManualItem(state.payslipId, itemId);
      
      // Cập nhật list local
      setState(prev => ({ ...prev, items: res.data.allowanceDetails }));
      
      if (onSuccess) onSuccess();
    } catch (error: any) {
        // Hiển thị lỗi từ BE (VD: Không cho xóa System Generated)
        alert(error.response?.data?.message || "Failed to remove item");
    } finally {
      setLoading(false);
    }
  };

  return {
    isOpen: state.isOpen,
    payslipId: state.payslipId,
    employeeName: state.employeeName,
    items: state.items,
    loading,
    openModal,
    closeModal,
    handleAddItem,
    handleRemoveItem
  };
};