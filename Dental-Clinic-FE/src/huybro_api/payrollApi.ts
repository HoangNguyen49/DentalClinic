import axiosClient from "./axiosClient";

// --- DTO VIEW (LIST) ---
export interface PayslipSnapshotDto {
  id: number;
  userId: number;
  userFullName: string;
  userEmail: string;
  userCode: string;
  month: number;
  year: number;
  status: 'DRAFT' | 'FINALIZED' | 'PAID';
  actualWorkDays: number;
  actualShifts: number;
  standardWorkDaysSnapshot: number;
  standardShiftsSnapshot: number;
  baseSalarySnapshot: number;
  salaryAmount: number;
  otSalaryAmount: number;
  bonusAmount: number;
  allowanceAmount: number;
  grossSalary: number;
  latePenaltyAmount: number;
  insuranceDeduction: number;
  taxDeduction: number;
  advancePayment: number;
  otherDeductionAmount: number;
  netSalary: number;
  note?: string;
  createdAt: string;
  allowanceDetails: PayslipAllowanceDto[];
}
export interface ManualItemRequest {
  name: string;
  amount: number;
  type: 'INCOME' | 'DEDUCTION';
  note?: string;
}
// --- DTO VIEW (ALLOWANCE) ---
export interface PayslipAllowanceDto {
  id: number;
  name: string;
  amount: number;
  type: 'INCOME' | 'DEDUCTION';
  isSystemGenerated: boolean; // true = Từ Config (Lock), false = Nhập tay (Edit/Delete)
  note?: string;
}
// --- DTO VIEW (DETAIL) ---
export interface PayslipDetailResponse {
  id: number;
  userFullName: string;
  userCode: string;
  userEmail: string;
  roleName: string;
  month: number;
  year: number;
  status: string;
  createdAt: string;

  // Work Info
  workType: string;
  workActual: string;
  workStandard: string;
  workFormula: string;

  // Lists (Backend đã xử lý text và số liệu)
  incomeItems: LineItemDto[];
  totalIncome: number;

  deductionItems: LineItemDto[];
  totalDeduction: number;

  // Tax Info (Backend đã tính toán breakdown)
  taxBreakdown: {
    grossIncome: number;
    insuranceDeduction: number;
    selfRelief: number; 
    taxableIncome: number;
    taxAmount: number;
    details: Array<{   
      label: string;
      amount: number;
    }>;
  };

  netSalary: number;
  note?: string;
  
}
// --- DTO VIEW (LINE ITEM) ---
export interface LineItemDto {
  name: string;
  amount: number;
  description: string;
  isHighlight: boolean;
}

// --- DTO REQUEST & CONFIG ---
export interface AllowanceResponseDto {
  id: number;
  allowanceName: string;
  amount: number;
  type: 'INCOME' | 'DEDUCTION';
  note: string;
}

export interface SalaryProfileResponseDto {
  id: number;
  userId: number;
  userFullName: string;
  userEmail: string;
  calculationType: 'MONTHLY' | 'SHIFT_BASED';
  baseSalary: number;
  standardWorkDays: number;
  standardShifts: number;
  otRate: number;
  overShiftRate: number;
  lateDeductionRate: number;
  insuranceAmount: number;
  allowances: AllowanceResponseDto[];
}

export interface AllowanceRequestDto {
  allowanceName: string;
  amount: number;
  type: 'INCOME' | 'DEDUCTION';
  note: string;
}

export interface SalaryProfileRequest {
  userId: number;
  calculationType: 'MONTHLY' | 'SHIFT_BASED';
  baseSalary: number;
  standardWorkDays?: number;
  standardShifts?: number;
  otRate: number;
  overShiftRate?: number;
  lateDeductionRate: number;
  insuranceAmount: number;
  allowances: AllowanceRequestDto[];
}

export interface PayrollSearchParams {
  month: number;
  year: number;
  keyword?: string;
  page?: number;
  size?: number;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

export interface UserSnapshot {
  id: number;
  fullName: string;
  email: string;
  code?: string; 
  roleName?: string; 
  phone?: string;
}

// --- API METHODS ---

export const payrollApi = {
  calculatePayroll: (month: number, year: number) => {
    return axiosClient.post<PayslipSnapshotDto[]>("/api/payroll/calculate", { month, year });
  },

  getPayslips: (params: PayrollSearchParams) => {
    return axiosClient.get<PageResponse<PayslipSnapshotDto>>("/api/payroll/payslips", { params });
  },

  updateAdvancePayment: (payslipId: number, amount: number) => {
    return axiosClient.patch<PayslipSnapshotDto>(`/api/payroll/payslips/${payslipId}/advance`, null, {
      params: { amount }
    });
  },

  finalizeCycle: (month: number, year: number) => {
    return axiosClient.post<string>("/api/payroll/finalize", null, {
      params: { month, year }
    });
  },

  getProfileByUser: (userId: number) => {
    return axiosClient.get<SalaryProfileResponseDto>(`/api/payroll/config/${userId}`);
  },

  saveProfile: (data: SalaryProfileRequest) => {
    return axiosClient.post<SalaryProfileResponseDto>("/api/payroll/config", data);
  },

  getPayslipDetail: (id: number) => {
    return axiosClient.get<PayslipDetailResponse>(`/api/payroll/payslips/${id}/detail`);
  },

  searchEmployees: (keyword: string) => {
    return axiosClient.get<UserSnapshot[]>("/api/payroll/employees/search", { params: { keyword } });
  },

  addManualItem: (payslipId: number, data: ManualItemRequest) => {
    return axiosClient.post<PayslipSnapshotDto>(`/api/payroll/payslips/${payslipId}/items`, data);
  },

  removeManualItem: (payslipId: number, itemId: number) => {
    return axiosClient.delete<PayslipSnapshotDto>(`/api/payroll/payslips/${payslipId}/items/${itemId}`);
  },
 getMissingConfigs: () => {
    return axiosClient.get<UserSnapshot[]>("/api/payroll/missing-configs");
  },

  exportExcel: (month: number, year: number) => {
    return axiosClient.get(`/api/payroll/export`, {
      params: { month, year },
      responseType: 'blob', 
    });
  },
};