import { useState, useEffect, useCallback } from "react";
import {
  payrollApi,
  type SalaryProfileRequest,
  type AllowanceRequestDto,
  type UserSnapshot
} from "../../../../../../huybro_api/payrollApi";
import { useNavigate, useLocation } from "react-router-dom";

const DEFAULT_FORM: SalaryProfileRequest = {
  userId: 0,
  calculationType: 'MONTHLY',
  baseSalary: 0,
  standardWorkDays: 0,
  standardShifts: 0,
  otRate: 0,
  overShiftRate: 0,
  lateDeductionRate: 0,
  insuranceAmount: 0,
  allowances: []
};

type NotificationType = { type: 'success' | 'error', message: string } | null;

export const useSalaryConfig = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [formData, setFormData] = useState<SalaryProfileRequest>(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSnapshot | null>(null);
  const [notification, setNotification] = useState<NotificationType>(null);

  // [1] Định nghĩa hàm handleUserSelect TRƯỚC (Dùng useCallback)
  const handleUserSelect = useCallback(async (user: UserSnapshot | null) => {
    setSelectedUser(user);
    setNotification(null);

    if (!user) {
      setFormData(DEFAULT_FORM);
      return;
    }

    setLoading(true);
    try {
      const res = await payrollApi.getProfileByUser(user.id);
      if (res.data) {
        const data = res.data;
        setFormData({
          userId: user.id,
          calculationType: data.calculationType,
          baseSalary: data.baseSalary,
          standardWorkDays: data.standardWorkDays || 0,
          standardShifts: data.standardShifts || 0,
          otRate: data.otRate || 0,
          overShiftRate: data.overShiftRate || 0,
          lateDeductionRate: data.lateDeductionRate || 0,
          insuranceAmount: data.insuranceAmount || 0,
          allowances: data.allowances.map(a => ({
            allowanceName: a.allowanceName,
            amount: a.amount,
            type: a.type,
            note: a.note
          }))
        });
      }
    } catch (error: any) {
      console.error("No profile found, defaulting to new form", error);
      // Giữ userId để tạo mới
      setFormData({ ...DEFAULT_FORM, userId: user.id });
    } finally {
      setLoading(false);
    }
  }, []);

  // [2] Gọi useEffect SAU KHI handleUserSelect đã được định nghĩa
  useEffect(() => {
    if (location.state && location.state.preSelectedUser) {
      const preUser = location.state.preSelectedUser as UserSnapshot;
      
      // Chỉ gọi nếu user hiện tại chưa được chọn để tránh loop
      if (!selectedUser || selectedUser.id !== preUser.id) {
          console.log("Auto-filling user form:", preUser);
          handleUserSelect(preUser);
      }
      
      // Tạm thời comment dòng này để test xem dữ liệu có qua không
      // window.history.replaceState({}, document.title);
    }
  }, [location, handleUserSelect]); // Bỏ selectedUser khỏi dependency

  // ... (Phần logic handleChange, add/remove/update allowance, submit giữ nguyên) ...
  const handleChange = (field: keyof SalaryProfileRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (notification) setNotification(null);
  };

  const addAllowance = () => {
    setFormData(prev => ({
      ...prev,
      allowances: [...prev.allowances, { allowanceName: "", amount: 0, type: 'INCOME', note: "" }]
    }));
  };

  const removeAllowance = (index: number) => {
    setFormData(prev => ({
      ...prev,
      allowances: prev.allowances.filter((_, i) => i !== index)
    }));
  };

  const updateAllowance = (index: number, field: keyof AllowanceRequestDto, value: any) => {
    const newAllowances = [...formData.allowances];
    newAllowances[index] = { ...newAllowances[index], [field]: value };
    setFormData(prev => ({ ...prev, allowances: newAllowances }));
  };

  const handleSubmit = async () => {
    setNotification(null);
    if (!formData.userId) {
      setNotification({ type: 'error', message: "Please select an employee first!" });
      return;
    }
    setIsSaving(true);
    try {
      await payrollApi.saveProfile(formData);
      setNotification({ type: 'success', message: "Salary profile saved successfully!" });
    } catch (error: any) {
      setNotification({
        type: 'error',
        message: error.response?.data?.message || error.message || "An error occurred"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return {
    formData, loading, isSaving, selectedUser, notification,
    handleUserSelect, handleChange, addAllowance, removeAllowance, updateAllowance, handleSubmit, handleCancel
  };
};