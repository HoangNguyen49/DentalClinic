import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, PackagePlus, Plus, Minus, Warehouse, AlertTriangle, CheckCircle2, Shield, ShieldCheck } from 'lucide-react';
import { useUpdateInventory } from './useUpdateInventory';
import { getProductImageSrc } from '../../../../../../huybro_api/productApi';

const UpdateInventory: React.FC = () => {
    const navigate = useNavigate();
    const {
        data, loading, loadError, submitting,
        finalQuantity,
        adjustMode, setAdjustMode,
        adjustValue, setAdjustValue,
        importPrice, setImportPrice,
        profitMargin, setProfitMargin,
        currency, setCurrency,
        finalRetailPrice,
        note, setNote,
        fieldErrors, globalError,
        handleSubmit, handleCancel
    } = useUpdateInventory();

    const isBusy = loading || submitting;

    const renderFieldErrors = (field: string) =>
        fieldErrors[field]?.map((msg) => (
            <div key={msg} className="mt-1 text-xs text-red-600 font-medium">{msg}</div>
        ));

    // Loading State
    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 font-medium">
            <div className="animate-pulse flex flex-col items-center">
                <div className="h-8 w-8 bg-gray-200 rounded-full mb-2"></div>
                Loading details...
            </div>
        </div>
    );

    // Error State
    if (loadError || !data) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
            <div className="text-red-500 font-bold text-lg">{loadError || "Inventory record not found"}</div>
            <button onClick={handleCancel} className="text-blue-600 hover:underline flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" /> Go Back
            </button>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20">
            {/* HEADER */}
            <div className="border-b border-gray-200 bg-white">
                <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-5">
                    <div className="text-sm font-medium uppercase tracking-wide text-gray-400">
                        Inventory Adjustment
                    </div>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                                <PackagePlus className="w-6 h-6 text-gray-700" />
                                Update Inventory
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Adjust stock quantity and update pricing logic for this warehouse.
                            </p>
                        </div>
                        <button
                            onClick={handleCancel}
                            disabled={isBusy}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back
                        </button>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* LEFT COLUMN: Info & Quantity (2/3 width) */}
                    <div className="lg:col-span-2">
                        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100 space-y-8">

                            {/* 1. TARGET INFORMATION (Read-only) */}
                            <div>
                                <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-6">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-sm">1</div>
                                    <h2 className="text-lg font-semibold text-gray-900">Target Information</h2>
                                </div>

                                <div className="bg-blue-50/50 rounded-xl border border-blue-100 overflow-hidden">
                                    <div className="p-5 flex items-start gap-5">
                                        {/* Image */}
                                        <div className="h-20 w-20 bg-white rounded-lg border border-blue-200 flex-shrink-0 shadow-sm overflow-hidden">
                                            {data.image ? (
                                                <img
                                                    src={getProductImageSrc(data.image)}
                                                    className="w-full h-full object-cover rounded"
                                                    alt={data.productName}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 font-bold bg-gray-50">NO IMG</div>
                                            )}
                                        </div>

                                        {/* Text Info */}
                                        <div className="flex-1">
                                            <h2 className="text-lg font-bold text-gray-900 mb-2">{data.productName}</h2>
                                            <div className="flex flex-wrap items-center gap-3 text-sm">
                                                <div className="flex items-center gap-2 text-gray-700 bg-white px-2 py-1 rounded border border-gray-200 shadow-sm">
                                                    <span className="text-gray-400 font-medium text-xs uppercase">SKU</span>
                                                    <span className="font-mono font-semibold">{data.sku}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-blue-700 bg-blue-100 px-2 py-1 rounded border border-blue-200 shadow-sm">
                                                    <Warehouse className="w-3.5 h-3.5" />
                                                    <span className="font-medium">{data.clinicName}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Current Stock Badge */}
                                        <div className="text-right">
                                            <span className="text-xs uppercase text-gray-400 font-bold block mb-1">Current</span>
                                            <span className="font-bold text-xl text-gray-900">{data.quantity}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 2. UPDATE STOCK - ICON TOGGLE STYLE */}
                            <div className="pt-8 border-t border-gray-100">
                                <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-6">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-sm">2</div>
                                    <h2 className="text-lg font-semibold text-gray-900">Update Stock</h2>
                                </div>

                                <div className="space-y-4">
                                    <label className="block text-sm font-medium text-gray-700">Adjustment</label>

                                    {/* ROW: [ (+) | (-) ] [ Input Number ] [ UNIT ] */}
                                    <div className="flex rounded-lg shadow-sm ring-1 ring-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 transition-all bg-white h-[50px]">

                                        {/* Cụm nút chọn Mode bằng Icon */}
                                        <div className="flex border-r border-gray-300">
                                            {/* Nút Import (+) */}
                                            <button
                                                type="button"
                                                onClick={() => { setAdjustMode('ADD'); setAdjustValue(''); }}
                                                className={`px-4 flex items-center justify-center transition-colors w-[50px]
                        ${adjustMode === 'ADD'
                                                        ? 'bg-green-100 text-green-700' // Active: Xanh
                                                        : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`} // Inactive: Xám
                                                title="Import Stock"
                                            >
                                                <Plus className="w-6 h-6" />
                                            </button>

                                            {/* Nút Export (-) */}
                                            <button
                                                type="button"
                                                onClick={() => { setAdjustMode('SUBTRACT'); setAdjustValue(''); }}
                                                className={`px-4 flex items-center justify-center border-l border-gray-200 transition-colors w-[50px]
                        ${adjustMode === 'SUBTRACT'
                                                        ? 'bg-red-100 text-red-700' // Active: Đỏ
                                                        : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`} // Inactive: Xám
                                                title="Export Stock"
                                            >
                                                <Minus className="w-6 h-6" />
                                            </button>
                                        </div>

                                        {/* Input nhập số */}
                                        <input
                                            type="number" min="0"
                                            placeholder={adjustMode === 'ADD' ? "Quantity to Add..." : "Quantity to Remove..."}
                                            className={`flex-1 border-none py-3 px-4 outline-none bg-transparent
                    ${adjustMode === 'ADD' ? 'text-green-700 placeholder:text-gray-300' : 'text-red-700 placeholder:text-gray-300'}`}
                                            value={adjustValue}
                                            onChange={(e) => setAdjustValue(e.target.value ? Number(e.target.value) : '')}
                                        />

                                        {/* Đuôi: Đơn vị tính */}
                                        <div className="bg-gray-50 px-5 flex items-center border-l border-gray-200">
                                            <span className="text-xs font-bold text-gray-400 tracking-wider">UNITS</span>
                                        </div>
                                    </div>

                                    {/* Chỉ hiện lỗi nếu có (Đã bỏ phần tính toán thừa) */}
                                    {renderFieldErrors('newQuantity')}
                                </div>
                            </div>

                            {/* 3. NOTES */}
                            <div className="pt-8 border-t border-gray-100">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Note / Reason</label>
                                <textarea
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 outline-none min-h-[80px]"
                                    placeholder="Why are you updating this? (e.g. Stock Correction, Re-pricing)..."
                                    value={note} onChange={(e) => setNote(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: PRICING CONFIGURATION (1/3 width) */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="rounded-xl border shadow-sm h-fit bg-white border-blue-100 ring-1 ring-blue-50">

                            {/* Header Pricing */}
                            <div className="px-5 py-4 border-b flex items-center justify-between border-blue-100 bg-blue-50/50">
                                <h3 className="font-bold text-sm uppercase tracking-wide flex items-center gap-2 text-blue-700">
                                    <ShieldCheck className="w-4 h-4" />
                                    Re-Pricing Logic
                                </h3>
                            </div>

                            <div className="p-5 space-y-5">
                                {/* Instruction */}
                                <div className="bg-blue-50 text-blue-700 px-3 py-2 rounded text-xs flex items-start gap-2 border border-blue-100">
                                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    <span>
                                        <b>Update Global Price.</b> <br />
                                        Enter new Cost & Margin to recalculate the Retail Price for ALL warehouses.
                                    </span>
                                </div>

                                {/* 1. IMPORT PRICE (Cost) */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                        Base Import Cost
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number" step="0.01" min="0"
                                            className="w-full rounded-lg border px-3 py-2 text-sm font-medium outline-none transition-colors bg-white border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                            value={importPrice}
                                            onChange={(e) => setImportPrice(e.target.value ? Number(e.target.value) : '')}
                                            placeholder="Enter cost..."
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* 2. MARGIN */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                            Margin (%)
                                        </label>
                                        <input
                                            type="number" step="0.1" min="0"
                                            className="w-full rounded-lg border px-3 py-2 text-sm font-medium outline-none bg-white border-gray-300 focus:border-blue-500"
                                            value={profitMargin}
                                            onChange={(e) => setProfitMargin(e.target.value ? Number(e.target.value) : '')}
                                            placeholder="e.g. 20"
                                        />
                                    </div>

                                    {/* 3. CURRENCY */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                            Currency
                                        </label>
                                        <select
                                            className="w-full rounded-lg border px-2 py-2 text-sm font-medium outline-none bg-white border-gray-300 focus:border-blue-500"
                                            value={currency}
                                            onChange={(e) => setCurrency(e.target.value)}
                                        >
                                            <option value="USD">USD</option>
                                            <option value="VND">VND</option>
                                        </select>
                                    </div>
                                </div>

                                {/* 4. FINAL RETAIL PRICE (PREVIEW) */}
                                <div className="mt-4 pt-4 border-t border-dashed border-blue-200">
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-xs font-bold text-gray-500 uppercase">New Retail Price</span>
                                        <span className="text-xl font-bold text-blue-600">
                                            {finalRetailPrice ? new Intl.NumberFormat('en-US').format(Number(finalRetailPrice)) : '0'}
                                            <span className="text-xs text-gray-400 ml-1 font-medium">{currency}</span>
                                        </span>
                                    </div>
                                    {renderFieldErrors('newRetailPrice')}

                                    <div className="flex gap-1.5 text-[10px] text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-100 items-center justify-center">
                                        <AlertTriangle className="w-3 h-3" />
                                        Warning: Affects all warehouses.
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* --- ACTION BUTTONS (Static) --- */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                {/* CANCEL BUTTON */}
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    disabled={isBusy}
                                    className="flex-1 py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition-all shadow-sm disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                {/* SAVE BUTTON */}
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-200 transition-all disabled:opacity-50 disabled:shadow-none flex justify-center items-center gap-2"
                                >
                                    {submitting ? (
                                        <span className="animate-pulse">Saving...</span>
                                    ) : (
                                        <>
                                            Updates Inventory
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* ERROR MESSAGES */}
                            {globalError && (
                                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-start gap-2">
                                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                                    <span>{globalError}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UpdateInventory;