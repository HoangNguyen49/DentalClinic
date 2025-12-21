import React, { useState } from 'react';
import {
    X, Plus, Trash2, Lock, TrendingUp, TrendingDown, DollarSign, Loader2
} from 'lucide-react';
import { formatMoney } from '../../../../../utils/format';
import type { PayslipAllowanceDto } from '../../../../../huybro_api/payrollApi';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    employeeName: string;
    items: PayslipAllowanceDto[];
    loading: boolean;
    onAdd: (name: string, amount: number, type: 'INCOME' | 'DEDUCTION') => Promise<void>;
    onRemove: (itemId: number) => Promise<void>;
}

const AdvancePaymentModal: React.FC<Props> = ({
    isOpen, onClose, employeeName, items, loading, onAdd, onRemove
}) => {
    const [newName, setNewName] = useState('');
    const [newAmount, setNewAmount] = useState<string>('');
    const [newType, setNewType] = useState<'INCOME' | 'DEDUCTION'>('INCOME');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(newAmount);
        if (!newName.trim() || isNaN(amount) || amount <= 0) return;

        await onAdd(newName, amount, newType);

        // Reset form sau khi add thành công
        setNewName('');
        setNewAmount('');
        setNewType('INCOME');
    };

    // --- LỌC NHẸ: Loại bỏ DEPENDENTS ra khỏi danh sách hiển thị ---
    const displayItems = items.filter(item => item.name.toUpperCase() !== 'DEPENDENTS');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* HEADER */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Monthly Adjustments</h3>
                        <p className="text-sm text-gray-500">Employee: <span className="font-semibold text-blue-600">{employeeName}</span></p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200">
                        <X size={20} />
                    </button>
                </div>

                {/* BODY - SCROLLABLE LIST */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                    <div className="space-y-3">
                        {displayItems.length === 0 && (
                            <div className="text-center py-8 text-gray-400 italic border-2 border-dashed border-gray-200 rounded-lg">
                                No adjustments recorded for this month.
                            </div>
                        )}

                        {displayItems.map((item) => (
                            <div
                                key={item.id}
                                className={`flex items-center justify-between p-3 rounded-lg border ${item.isSystemGenerated
                                    ? 'bg-gray-100 border-gray-200 text-gray-500' // Style cho Config (Lock)
                                    : 'bg-white border-blue-100 shadow-sm'        // Style cho Manual (Edit)
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${item.type === 'INCOME' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                                        }`}>
                                        {item.type === 'INCOME' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                    </div>
                                    <div>
                                        <div className="font-medium text-sm text-gray-900">{item.name}</div>
                                        <div className="text-xs flex items-center gap-1">
                                            {item.isSystemGenerated ? (
                                                <span className="flex items-center gap-1 text-gray-400"><Lock size={10} /> From Contract</span>
                                            ) : (
                                                <span className="text-blue-600">Manual Entry</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <span className={`font-bold text-sm ${item.type === 'INCOME' ? 'text-green-700' : 'text-orange-700'}`}>
                                        {item.type === 'INCOME' ? '+' : '-'}{formatMoney(item.amount)}
                                    </span>

                                    {/* Chỉ hiện nút xóa nếu là Manual Item */}
                                    {!item.isSystemGenerated && (
                                        <button
                                            onClick={() => onRemove(item.id)}
                                            disabled={loading}
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                            title="Remove adjustment"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                    {item.isSystemGenerated && <div className="w-7"></div>} {/* Spacer */}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* FOOTER - ADD FORM */}
                <div className="p-6 border-t border-gray-100 bg-white z-10">
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Add New Adjustment</h4>
                    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 items-end">

                        {/* Type Select */}
                        <div className="w-full sm:w-32">
                            <label className="block text-xs text-gray-500 mb-1">Type</label>
                            <select
                                value={newType}
                                onChange={(e) => setNewType(e.target.value as 'INCOME' | 'DEDUCTION')}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="INCOME">Income</option>
                                <option value="DEDUCTION">Deduction</option>

                            </select>
                        </div>

                        {/* Name Input */}
                        <div className="flex-1 w-full">
                            <label className="block text-xs text-gray-500 mb-1">Description</label>
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="e.g. Advance Payment, Bonus..."
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        {/* Amount Input */}
                        <div className="w-full sm:w-48 relative">
                            <label className="block text-xs text-gray-500 mb-1">Amount</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={newAmount}
                                    onChange={(e) => setNewAmount(e.target.value)}
                                    placeholder="0"
                                    className="w-full px-4 pr-12 py-2.5 border border-gray-300 rounded-lg text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <span className="text-gray-400 text-xs font-bold">VND</span>
                                </div>
                            </div>
                        </div>

                        {/* Add Button */}
                        <button
                            type="submit"
                            disabled={loading || !newName || !newAmount}
                            className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            Add
                        </button>
                    </form>
                </div>

            </div>
        </div>
    );
};

export default AdvancePaymentModal;