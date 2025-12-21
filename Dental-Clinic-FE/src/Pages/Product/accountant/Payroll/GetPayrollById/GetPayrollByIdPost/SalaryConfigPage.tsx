import React from "react";
import { useSalaryConfig } from "./useSalaryConfig";
import UserSearchAutocomplete from "../../widgets/UserSearchAutocomplete";
import {
  Save, DollarSign, Calendar, Clock, Plus, Trash2, ShieldCheck, Briefcase,
  CheckCircle2, AlertCircle, Users
} from "lucide-react";

const SalaryConfigPage: React.FC = () => {
  const {
    formData, loading, isSaving, selectedUser, notification,
    handleUserSelect,
    handleChange, addAllowance, removeAllowance, updateAllowance, handleSubmit, handleCancel
  } = useSalaryConfig();

  // Logic lọc danh sách để hiển thị đúng khu vực
  const insuranceItems = formData.allowances.filter(a =>
    ['BHXH', 'BHYT', 'BHTN'].includes(a.allowanceName.toUpperCase())
  );

  const dependentItem = formData.allowances.find(a =>
    a.allowanceName.toUpperCase() === 'DEPENDENTS'
  );

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
            <h1 className="text-2xl font-bold text-gray-900">Salary Configuration</h1>
            <p className="text-sm text-gray-500">Create or update salary contract</p>
          </div>
        </div>

        {/* 1. SELECT EMPLOYEE */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-sm">1</div>
            <h2 className="text-lg font-semibold text-gray-900">Select Employee</h2>
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
                <h2 className="text-lg font-semibold text-gray-900">Calculation Model</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">Contract Type</label>
                  <div className={`p-4 rounded-xl border-2 flex items-center gap-3 ${isShiftBased ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-blue-500 bg-blue-50 text-blue-700'}`}>
                    {isShiftBased ? <Clock className="w-6 h-6" /> : <Calendar className="w-6 h-6" />}
                    <div>
                      <div className="font-bold text-lg">{isShiftBased ? 'Shift Based' : 'Monthly Salary'}</div>
                      <div className="text-xs opacity-80">Auto-assigned by Role</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">Gross Base Salary</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"></div>
                    <input type="number" value={formData.baseSalary} onChange={(e) => handleChange('baseSalary', parseFloat(e.target.value))} className="block w-full px-4 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 text-lg font-bold text-gray-900" />
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 text-sm font-bold">VND</span>
                  </div>
                </div>
              </div>
            </div>

            {/* --- Phần 3: Work Standards --- */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-sm">3</div>
                <h2 className="text-lg font-semibold text-gray-900">Work Standards</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {isShiftBased ? (
                  <>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-purple-700 uppercase">Standard Shifts</label>
                      <input type="number" value={formData.standardShifts} onChange={(e) => handleChange('standardShifts', parseInt(e.target.value))} className="block w-full px-3 py-2 border border-purple-200 bg-purple-50 rounded-lg" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-purple-700 uppercase">Over Shift Bonus (VND/shift)</label>
                      <input type="number" value={formData.overShiftRate} onChange={(e) => handleChange('overShiftRate', parseFloat(e.target.value))} className="block w-full px-3 py-2 border border-purple-200 bg-purple-50 rounded-lg" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-blue-700 uppercase">Standard Days</label>
                      <input type="number" value={formData.standardWorkDays} onChange={(e) => handleChange('standardWorkDays', parseFloat(e.target.value))} className="block w-full px-3 py-2 border border-blue-200 bg-blue-50 rounded-lg" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-blue-700 uppercase">OT Multiplier (%)</label>
                      <input type="number" value={formData.otRate} onChange={(e) => handleChange('otRate', parseFloat(e.target.value))} className="block w-full px-3 py-2 border border-blue-200 bg-blue-50 rounded-lg" />
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-red-600 uppercase">Late Penalty (VND/minute)</label>
                  <input type="number" value={formData.lateDeductionRate} onChange={(e) => handleChange('lateDeductionRate', parseFloat(e.target.value))} className="block w-full px-3 py-2 border border-red-200 bg-red-50 rounded-lg text-red-700" />
                </div>
              </div>
            </div>

            {/* --- PHẦN 4: INSURANCE & TAX RELIEF --- */}
            <div className="p-6 border-b border-gray-100 bg-blue-50/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-sm">4</div>
                <h2 className="text-lg font-semibold text-gray-900">Insurance & Tax Relief</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Mức lương đóng BH */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600" /> Insurance contribution salary base (VND)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.insuranceAmount}
                      onChange={(e) => handleChange('insuranceAmount', parseFloat(e.target.value) || 0)}
                      className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 font-bold text-gray-700"
                      placeholder="Mặc định lấy theo lương cơ bản"
                    />
                    <span className="absolute inset-y-0 right-3 flex items-center text-gray-400 text-xs font-bold">VND</span>
                  </div>
                </div>

                {/* Người phụ thuộc */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" /> Dependent (Family allowances)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      value={dependentItem?.amount || 0}
                      onChange={(e) => {
                        const idx = formData.allowances.findIndex(a => a.allowanceName.toUpperCase() === 'DEPENDENTS');
                        if (idx !== -1) updateAllowance(idx, 'amount', parseInt(e.target.value) || 0);
                      }}
                      className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 font-bold text-gray-700"
                    />
                    <span className="absolute inset-y-0 right-3 flex items-center text-gray-400 text-xs font-bold">Người</span>
                  </div>
                </div>
              </div>

              {/* Grid 3 khoản bảo hiểm */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {insuranceItems.map((item) => {
                  const realIndex = formData.allowances.findIndex(a => a.allowanceName === item.allowanceName);
                  return (
                    <div key={item.allowanceName} className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                      <label className="block text-xs font-bold text-blue-600 uppercase mb-2">{item.allowanceName} (%)</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={item.amount}
                          onChange={(e) => updateAllowance(realIndex, 'amount', parseFloat(e.target.value))}
                          className="w-full pr-8 py-2 border-b-2 border-blue-100 focus:border-blue-500 bg-transparent font-bold text-lg text-gray-800"
                        />
                        <span className="absolute right-0 bottom-2 text-gray-400 font-bold text-sm">%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* --- PHẦN 5: MONTHLY ALLOWANCES --- */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-sm">5</div>
                  <h2 className="text-lg font-semibold text-gray-900">Monthly Allowances</h2>
                </div>
                <button
                  onClick={addAllowance}
                  className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                >
                  <Plus className="w-5 h-5" /> Add
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
                          placeholder="Tên trợ cấp..."
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
                        INCOME
                      </div>
                      <button
                        onClick={() => removeAllowance(realIndex)}
                        className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  );
                })}
                {genericAllowances.length === 0 && (
                  <div className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 italic">
                    Chưa có trợ cấp nào được cấu hình.
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
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSaving || !formData.userId}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-8 py-2 text-sm font-bold text-white shadow-md hover:bg-blue-700 disabled:opacity-50 transition-all"
                >
                  <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </div>
          </div>
        ) : !loading && (
          <div className="py-20 text-center bg-white rounded-xl border border-dashed border-gray-300">
            <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900">Start Configuration</h3>
            <p className="text-gray-500">Select an employee from the search bar above to begin.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalaryConfigPage;