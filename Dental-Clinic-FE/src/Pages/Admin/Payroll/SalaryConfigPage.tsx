import React from "react";
import { useTranslation } from "react-i18next";
import { useSalaryConfig } from "./useSalaryConfig";
import UserSearchAutocomplete from "./widgets/UserSearchAutocomplete";
import {
  Save, Calendar, Clock, Plus, Trash2, Briefcase,
  CheckCircle2, AlertCircle
} from "lucide-react";

const SalaryConfigPage: React.FC = () => {
  const { t } = useTranslation("admin");
  const {
    formData, loading, isSaving, selectedUser, notification,
    handleUserSelect,
    handleChange, addAllowance, removeAllowance, updateAllowance, handleSubmit, handleCancel
  } = useSalaryConfig();

  // ADMIN chỉ quản lý trợ cấp hàng tháng (loại bỏ BHXH, BHYT, BHTN, DEPENDENTS - để ACCOUNTANT quản lý)
  const genericAllowances = formData.allowances.filter(a =>
    !['BHXH', 'BHYT', 'BHTN', 'DEPENDENTS'].includes(a.allowanceName.toUpperCase())
  );

  const isShiftBased = formData.calculationType === 'SHIFT_BASED';

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-900">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* HEADER GIỮ NGUYÊN */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t("salaryConfig.title", "Salary Configuration")}</h1>
            <p className="text-sm text-gray-500">{t("salaryConfig.subtitle", "Create or update salary contract")}</p>
          </div>
        </div>

        {/* 1. SELECT EMPLOYEE */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-sm">1</div>
            <h2 className="text-lg font-semibold text-gray-900">{t("salaryConfig.selectEmployee", "Select Employee")}</h2>
          </div>
          <div className="max-w-md">
            <UserSearchAutocomplete
              selectedUserId={formData.userId}
              onSelect={handleUserSelect}
              initialUser={selectedUser}
            />
          </div>
        </div>

        {selectedUser && !loading ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

            {/* --- Phần 2: Model --- */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-sm">2</div>
                <h2 className="text-lg font-semibold text-gray-900">{t("salaryConfig.calculationModel", "Calculation Model")}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">{t("salaryConfig.contractType", "Contract Type")}</label>
                  <div className={`p-4 rounded-xl border-2 flex items-center gap-3 ${isShiftBased ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-blue-500 bg-blue-50 text-blue-700'}`}>
                    {isShiftBased ? <Clock className="w-6 h-6" /> : <Calendar className="w-6 h-6" />}
                    <div>
                      <div className="font-bold text-lg">{isShiftBased ? t("salaryConfig.shiftBased", "Shift Based") : t("salaryConfig.monthlySalary", "Monthly Salary")}</div>
                      <div className="text-xs opacity-80">{t("salaryConfig.autoAssigned", "Auto-assigned by Role")}</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">{t("salaryConfig.grossBaseSalary", "Gross Base Salary")}</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"></div>
                    <input type="number" value={formData.baseSalary} onChange={(e) => handleChange('baseSalary', parseFloat(e.target.value))} className="block w-full px-4 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 text-lg font-bold text-gray-900" />
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 text-sm font-bold">VND</span>
                  </div>
                </div>
              </div>
            </div>

            {/* --- PHẦN 3: MONTHLY ALLOWANCES --- */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-sm">3</div>
                  <h2 className="text-lg font-semibold text-gray-900">{t("salaryConfig.monthlyAllowances", "Monthly Allowances")}</h2>
                </div>
                <button
                  onClick={addAllowance}
                  className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                >
                  <Plus className="w-5 h-5" /> {t("salaryConfig.add", "Add")}
                </button>
              </div>

              <div className="space-y-3">
                {genericAllowances.map((item) => {
                  const realIndex = formData.allowances.indexOf(item);
                  return (
                    <div key={realIndex} className="flex gap-4 items-center bg-white p-4 rounded-xl border border-gray-200 hover:border-blue-300 transition-all group">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={item.allowanceName}
                          onChange={(e) => updateAllowance(realIndex, 'allowanceName', e.target.value)}
                          placeholder={t("salaryConfig.allowanceNamePlaceholder", "Allowance name...")}
                          className="w-full bg-transparent border-none focus:ring-0 font-semibold text-gray-700 placeholder:text-gray-300"
                        />
                      </div>
                      <div className="relative w-48">
                        <input
                          type="number"
                          value={item.amount}
                          onChange={(e) => updateAllowance(realIndex, 'amount', parseFloat(e.target.value))}
                          className="w-full pr-12 py-2 border-b border-gray-200 focus:border-blue-500 font-bold text-right text-gray-800"
                        />
                        <span className="absolute inset-y-0 right-0 flex items-center text-gray-400 text-xs font-bold">VND</span>
                      </div>
                      <div className="px-3 py-1 bg-green-50 text-green-600 rounded-md text-[10px] font-bold">
                        {t("salaryConfig.income", "INCOME")}
                      </div>
                      <button
                        onClick={() => removeAllowance(realIndex)}
                        className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                        title={t("salaryConfig.remove", "Remove")}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  );
                })}
                {genericAllowances.length === 0 && (
                  <div className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 italic">
                    {t("salaryConfig.noAllowances", "No allowances configured yet.")}
                  </div>
                )}
              </div>
            </div>

            {/* --- FOOTER: ACTIONS --- */}
            <div className="p-6 bg-gray-50 border-t border-gray-100">
              {notification && (
                <div className={`mb-4 flex items-center gap-2 rounded-lg px-4 py-3 text-sm border ${notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
                  }`}>
                  {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  {notification.message}
                </div>
              )}
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={loading || isSaving}
                  onClick={handleCancel}
                  className="rounded-lg px-6 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 disabled:opacity-50 transition-colors"
                >
                  {t("salaryConfig.cancel", "Cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSaving || !formData.userId}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-8 py-2 text-sm font-bold text-white shadow-md hover:bg-blue-700 disabled:opacity-50 transition-all"
                >
                  <Save className="w-4 h-4" /> {isSaving ? t("salaryConfig.saving", "Saving...") : t("salaryConfig.save", "Save Configuration")}
                </button>
              </div>
            </div>
          </div>
        ) : !loading && (
          <div className="py-20 text-center bg-white rounded-xl border border-dashed border-gray-300">
            <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900">{t("salaryConfig.startConfiguration", "Start Configuration")}</h3>
            <p className="text-gray-500">{t("salaryConfig.selectEmployeeHint", "Select an employee from the search bar above to begin.")}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalaryConfigPage;

