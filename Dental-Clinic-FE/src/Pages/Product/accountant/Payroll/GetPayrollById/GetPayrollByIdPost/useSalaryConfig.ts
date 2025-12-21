import { useState, useEffect, useCallback } from "react";
import {
  payrollApi,
  type SalaryProfileRequest,
  type AllowanceRequestDto,
  type UserSnapshot
} from "../../../../../../huybro_api/payrollApi";
import { useNavigate, useLocation } from "react-router-dom";

// 1. Bộ khung chuẩn (Template) - Luôn hiện ra để người dùng điền số
const MANDATORY_ITEMS: AllowanceRequestDto[] = [
  { allowanceName: 'BHXH', amount: 8, type: 'DEDUCTION', note: 'insurance salary' },
  { allowanceName: 'BHYT', amount: 1.5, type: 'DEDUCTION', note: 'insurance salary' },
  { allowanceName: 'BHTN', amount: 1, type: 'DEDUCTION', note: 'insurance salary' },
  { allowanceName: 'DEPENDENTS', amount: 0, type: 'DEDUCTION', note: 'Number of dependents' },
  { allowanceName: 'Meal allowance', amount: 0, type: 'INCOME', note: 'fixed allowance' },
  { allowanceName: 'Transportation allowance', amount: 0, type: 'INCOME', note: 'fixed allowance' },
  { allowanceName: 'Equipment allowance', amount: 0, type: 'INCOME', note: 'fixed allowance' },
];

const DEFAULT_FORM: SalaryProfileRequest = {
  userId: 0,
  calculationType: 'MONTHLY',
  baseSalary: 0,
  standardWorkDays: 26,
  standardShifts: 0,
  otRate: 150,
  overShiftRate: 0,
  lateDeductionRate: 0,
  insuranceAmount: 0,
  allowances: [...MANDATORY_ITEMS] // Khởi tạo với bộ khung trắng
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
        const apiData = res.data;
        
        // --- LOGIC SMART MERGE: TRỘN DỮ LIỆU DB VÀ TEMPLATE ---
        
        // 1. Lấy danh sách phụ cấp thực tế từ API
        const existingAllowances = apiData.allowances || [];

        // 2. Tạo mảng kết quả dựa trên MANDATORY_ITEMS (Bộ khung)
        const mergedAllowances = MANDATORY_ITEMS.map(templateItem => {
          // Tìm xem trong DB đã có khoản này chưa (so khớp tên không phân biệt hoa thường)
          const foundInApi = existingAllowances.find(
            a => a.allowanceName.toUpperCase() === templateItem.allowanceName.toUpperCase()
          );

          // Nếu có: Lấy data từ DB. Nếu chưa: Lấy bộ khung template (số tiền = 0)
          return foundInApi ? {
            allowanceName: foundInApi.allowanceName,
            amount: foundInApi.amount,
            type: foundInApi.type,
            note: foundInApi.note
          } : { ...templateItem };
        });

        // 3. Bổ sung những khoản "ngoại lai" mà người dùng đã tự thêm trước đó nhưng không nằm trong Template
        existingAllowances.forEach(apiItem => {
          const isInTemplate = MANDATORY_ITEMS.some(
            t => t.allowanceName.toUpperCase() === apiItem.allowanceName.toUpperCase()
          );
          if (!isInTemplate) {
            mergedAllowances.push({
              allowanceName: apiItem.allowanceName,
              amount: apiItem.amount,
              type: apiItem.type,
              note: apiItem.note
            });
          }
        });

        setFormData({
          userId: user.id,
          calculationType: apiData.calculationType,
          baseSalary: apiData.baseSalary,
          standardWorkDays: apiData.standardWorkDays || 0,
          standardShifts: apiData.standardShifts || 0,
          otRate: apiData.otRate || 0,
          overShiftRate: apiData.overShiftRate || 0,
          lateDeductionRate: apiData.lateDeductionRate || 0,
          insuranceAmount: apiData.insuranceAmount || 0,
          allowances: mergedAllowances // Đã trộn xong!
        });
      }
    } catch (error: any) {
      // Nếu 404 hoặc lỗi (nhân viên mới toanh), hiện Template mặc định
      setFormData({ ...DEFAULT_FORM, userId: user.id });
    } finally {
      setLoading(false);
    }
  }, []);

  // --- CÁC HÀM XỬ LÝ SỰ KIỆN KHÔNG THAY ĐỔI ---
  const handleChange = (field: keyof SalaryProfileRequest, value: any) => {
    setFormData(prev => {
        const newData = { ...prev, [field]: value };

        if (field === 'baseSalary') {
            newData.insuranceAmount = value;
        }

        return newData;
    });
};

  const addAllowance = () => {
    setFormData(prev => ({
      ...prev,
      allowances: [...prev.allowances, { allowanceName: "", amount: 0, type: 'INCOME', note: "Phụ cấp mới" }]
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
    setIsSaving(true);
    try {
      await payrollApi.saveProfile(formData);
      setNotification({ type: 'success', message: "Salary profile saved successfully!" });
    } catch (error: any) {
      setNotification({ type: 'error', message: error.response?.data?.message || "An error occurred" });
    } finally {
      setIsSaving(false);
    }
  };

  return {
    formData, loading, isSaving, selectedUser, notification,
    handleUserSelect, handleChange, addAllowance, removeAllowance, updateAllowance, handleSubmit, handleCancel: () => navigate(-1)
  };
};