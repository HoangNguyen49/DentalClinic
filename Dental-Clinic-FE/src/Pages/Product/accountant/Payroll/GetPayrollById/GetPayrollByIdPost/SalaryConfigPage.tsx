import React from "react";
import { useSalaryConfig } from "./useSalaryConfig";
import UserSearchAutocomplete from "../../widgets/UserSearchAutocomplete";
import {
  Save, DollarSign, Calendar, Clock, Plus, Trash2, ShieldCheck, Briefcase,
  CheckCircle2, AlertCircle
} from "lucide-react";

const SalaryConfigPage: React.FC = () => {
  const {
    formData, loading, isSaving, selectedUser, notification,
    handleUserSelect,
    handleChange, addAllowance, removeAllowance, updateAllowance, handleSubmit, handleCancel
  } = useSalaryConfig();

  // Biến cờ render UI
  const isShiftBased = formData.calculationType === 'SHIFT_BASED';

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-900">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Salary Configuration</h1>
            <p className="text-sm text-gray-500">Create or update salary contract</p>
          </div>
        </div>

        {/* 1. SELECT USER */}
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

        {selectedUser ? (
          loading ? (
            <div className="p-10 text-center text-gray-500">Loading configuration...</div>
          ) : (
            <>
              {/* 2. MODEL & 3. CONFIG & 4. ALLOWANCE */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

                {/* --- Phần 2: Model --- */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center gap-3  mb-6">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-sm">2</div>
                    <h2 className="text-lg font-semibold text-gray-900">Calculation Model</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Contract Type */}
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
                    {/* Base Salary */}
                    <div className="space-y-4">
                      <label className="block text-sm font-medium text-gray-700">Gross Base Salary</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><DollarSign className="h-5 w-5 text-gray-400" /></div>
                        <input
                          type="number"
                          value={formData.baseSalary}
                          onChange={(e) => handleChange('baseSalary', parseFloat(e.target.value))}
                          className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 text-lg font-bold text-gray-900"
                        />
                        <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 text-sm font-bold">VND</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* --- Phần 3: Work Standards --- */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center gap-3  mb-6">
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
                          <label className="block text-xs font-bold text-blue-700 uppercase">OT Multiplier (n/100)</label>
                          <input type="number" step="0.1" value={formData.otRate} onChange={(e) => handleChange('otRate', parseFloat(e.target.value))} className="block w-full px-3 py-2 border border-blue-200 bg-blue-50 rounded-lg" />
                        </div>
                      </>
                    )}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-red-600 uppercase">Late Penalty (VND/minute)</label>
                      <input type="number" value={formData.lateDeductionRate} onChange={(e) => handleChange('lateDeductionRate', parseFloat(e.target.value))} className="block w-full px-3 py-2 border border-red-200 bg-red-50 rounded-lg text-red-700" />
                    </div>
                  </div>
                </div>

                {/* --- Phần 4: Allowances --- */}
                <div className="p-6">
                  <div className="flex items-center gap-3  mb-6">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-sm">4</div>
                    <h2 className="text-lg font-semibold text-gray-900">Allowances & Insurance</h2>
                  </div>
                  <div className="mb-6 max-w-md">
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-green-600" /> Insurance Deduction</label>
                    <input type="number" value={formData.insuranceAmount} onChange={(e) => handleChange('insuranceAmount', parseFloat(e.target.value))} className="block w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-gray-700">Allowances List</label>
                      <button onClick={addAllowance} className="text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1"><Plus className="w-4 h-4" /> Add Item</button>
                    </div>
                    {formData.allowances.map((item, index) => (
                      <div key={index} className="flex gap-2 items-center bg-gray-50 p-2 rounded border border-gray-200">
                        <input type="text" value={item.allowanceName} onChange={(e) => updateAllowance(index, 'allowanceName', e.target.value)} placeholder="Name" className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm" />
                        <input type="number" value={item.amount} onChange={(e) => updateAllowance(index, 'amount', parseFloat(e.target.value))} placeholder="Amount" className="w-28 px-3 py-2 border border-gray-300 rounded-md text-sm" />
                        <select value={item.type} onChange={(e) => updateAllowance(index, 'type', e.target.value)} className="w-24 px-3 py-2 border border-gray-300 rounded-md text-sm"><option value="INCOME">Income</option><option value="DEDUCTION">Deduct</option></select>
                        <button onClick={() => removeAllowance(index)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                    {formData.allowances.length === 0 && <div className="text-sm text-gray-400 italic text-center py-2">No allowances configured.</div>}
                  </div>
                   {/* --- FOOTER: NOTIFICATIONS & ACTIONS --- */}
                <div className="items-center justify-end gap-3 border-t border-gray-100 pt-4 mx-6">

                  {/* Hiển thị Notification từ Hook */}
                  {notification && (
                    <div className={`mb-4 flex items-center gap-2 rounded-lg px-4 py-3 text-sm border ${notification.type === 'success'
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : 'bg-red-50 border-red-200 text-red-700'
                      }`}>
                      {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                      {notification.message}
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      disabled={loading || isSaving}
                      onClick={handleCancel}
                      className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 disabled:opacity-60 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isSaving || !formData.userId}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
                    >
                      {isSaving ? 'Saving...' : <> Save Configuration</>}
                    </button>
                  </div>
                </div>
                </div>

               

              </div>
            </>
          )
        ) : (
          <div className="py-20 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900">Start Configuration</h3>
            <p className="text-gray-500">Select an employee to begin.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalaryConfigPage;