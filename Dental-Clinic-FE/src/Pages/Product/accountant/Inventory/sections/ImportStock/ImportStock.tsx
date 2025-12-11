import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, PackagePlus, Lock, Info, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useImportStock } from './useImportStock';
import ProductSearchAutocomplete from '../../widgets/ProductSearchAutocomplete';
import InventoryStatusDashboard from '../../widgets/InventoryStatusDashboard';

const ImportStock: React.FC = () => {
    const navigate = useNavigate();
    const {
        form,
        clinicList,
        loadingData,
        inventoryStatus,
        loadingInventory,
        submitting,
        successMsg,
        fieldErrors,
        globalErrors,
        isFixedProduct,
        selectedProductDetail,
        isPriceConfigured,
        displayValues,
        handleProductSelect,
        handleChange,
        handleSubmit,
    } = useImportStock();

    const isBusy = submitting || loadingData;

    const renderFieldErrors = (field: string) =>
        fieldErrors[field]?.map((msg) => (
            <div key={msg} className="mt-1 text-xs text-red-600 font-medium">{msg}</div>
        ));

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20">
            {/* HEADER */}
            <div className="border-b border-gray-200 bg-white">
                <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-5">
                    <div className="text-sm font-medium uppercase tracking-wide text-gray-400">
                        Inventory Management
                    </div>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                                <PackagePlus className="w-6 h-6 text-gray-700" />
                                Import Stock
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Receive products into warehouse.
                            </p>
                        </div>
                        {isFixedProduct && (
                            <Link to="/accountant/inventory/view" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
                                <ArrowLeft className="w-4 h-4" /> Back
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* LEFT COLUMN: Product, Stock Info & Notes */}
                    <div className="lg:col-span-2">
                        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100 space-y-8">
                            
                            {/* 1. PRODUCT SELECTION */}
                            <div>
                                <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-6">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-sm">1</div>
                                    <h2 className="text-lg font-semibold text-gray-900">Select Product</h2>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <ProductSearchAutocomplete 
                                            selectedProductId={form.productId}
                                            initialProduct={selectedProductDetail}
                                            disabled={isFixedProduct} 
                                            onSelect={handleProductSelect}
                                        />
                                        {renderFieldErrors('productId')}
                                    </div>
                                    {(form.productId || loadingInventory) && (
                                        <InventoryStatusDashboard status={inventoryStatus} loading={loadingInventory} />
                                    )}
                                </div>
                            </div>

                            {/* 2. STOCK DESTINATION */}
                            <div className="pt-8 border-t border-gray-100">
                                <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-6">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-sm">2</div>
                                    <h2 className="text-lg font-semibold text-gray-900">Destination & Quantity</h2>
                                </div>

                                <div className="grid gap-6 md:grid-cols-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse <span className="text-red-500">*</span></label>
                                        <select 
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                            value={form.clinicId} onChange={(e) => handleChange('clinicId', e.target.value)} disabled={loadingData}
                                        >
                                            <option value="">-- Select Warehouse --</option>
                                            {clinicList.map((c) => (
                                                <option key={c.clinicId} value={c.clinicId}>{c.clinicName}</option>
                                            ))}
                                        </select>
                                        {renderFieldErrors('clinicId')}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <input type="number" min="1" 
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all font-bold text-gray-900"
                                                value={form.quantityAdded} onChange={(e) => handleChange('quantityAdded', Number(e.target.value))} 
                                            />
                                            <span className="absolute right-3 top-2.5 text-xs font-bold text-gray-400 uppercase">UNITS</span>
                                        </div>
                                        {renderFieldErrors('quantityAdded')}
                                    </div>
                                </div>
                            </div>

                             {/* 3. NOTES */}
                             <div className="pt-8 border-t border-gray-100">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                                <textarea 
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 outline-none min-h-[80px]"
                                    placeholder="Supplier info, batch number..."
                                    value={form.note} onChange={(e) => handleChange('note', e.target.value)} 
                                />
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: PRICING CONFIGURATION (Dynamic Lock) */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className={`rounded-xl border shadow-sm h-fit transition-all duration-300 ${isPriceConfigured ? 'bg-gray-50 border-gray-200' : 'bg-white border-blue-100 ring-1 ring-blue-50'}`}>
                            
                            {/* Header Pricing */}
                            <div className={`px-5 py-4 border-b flex items-center justify-between ${isPriceConfigured ? 'border-gray-200 bg-gray-100/50' : 'border-blue-100 bg-blue-50/50'}`}>
                                <h3 className={`font-bold text-sm uppercase tracking-wide flex items-center gap-2 ${isPriceConfigured ? 'text-gray-500' : 'text-blue-700'}`}>
                                    {isPriceConfigured ? <Lock className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                                    Pricing Logic
                                </h3>
                                {isPriceConfigured && (
                                    <span className="text-[10px] font-bold bg-gray-200 text-gray-600 px-2 py-1 rounded border border-gray-300">
                                        LOCKED
                                    </span>
                                )}
                            </div>

                            <div className="p-5 space-y-5">
                                {!form.productId ? (
                                    <div className="text-center py-10 text-gray-400 italic text-sm">
                                        Select a product first to configure pricing.
                                    </div>
                                ) : (
                                    <>
                                        {/* Notification Bar */}
                                        {isPriceConfigured ? (
                                            <div className="bg-green-50 text-green-700 px-3 py-2 rounded text-xs flex items-start gap-2 border border-green-100">
                                                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                                <span>
                                                    <b>System Price Active.</b> <br/>
                                                    Cost & Margin inputs are disabled to maintain consistency.
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="bg-blue-50 text-blue-700 px-3 py-2 rounded text-xs flex items-start gap-2 border border-blue-100">
                                                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                                <span>
                                                    <b>First-time Setup.</b> <br/>
                                                    Please set the Base Cost & Margin. This will establish the Global Retail Price.
                                                </span>
                                            </div>
                                        )}

                                        {/* 1. IMPORT PRICE (Cost) */}
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex justify-between">
                                                Base Import Cost
                                                {isPriceConfigured && <Lock className="w-3 h-3" />}
                                            </label>
                                            <div className="relative">
                                                <input 
                                                    type="number" 
                                                    className={`w-full rounded-lg border px-3 py-2 text-sm font-medium outline-none transition-colors
                                                        ${isPriceConfigured 
                                                            ? 'bg-gray-100 border-gray-300 text-gray-700 font-bold cursor-not-allowed' 
                                                            : 'bg-white border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                                                        }`}
                                                    value={form.importPrice} 
                                                    onChange={(e) => handleChange('importPrice', e.target.value)}
                                                    placeholder={isPriceConfigured && !form.importPrice ? "---" : "0.00"}
                                                    disabled={isPriceConfigured}
                                                />
                                            </div>
                                            {!isPriceConfigured && renderFieldErrors('importPrice')}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            {/* 2. MARGIN */}
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex justify-between">
                                                    Margin (%)
                                                    {isPriceConfigured && <Lock className="w-3 h-3" />}
                                                </label>
                                                <input 
                                                    type="number" 
                                                    className={`w-full rounded-lg border px-3 py-2 text-sm font-medium outline-none
                                                        ${isPriceConfigured 
                                                            ? 'bg-gray-100 border-gray-300 text-gray-700 font-bold cursor-not-allowed' 
                                                            : 'bg-white border-gray-300 focus:border-blue-500'
                                                        }`}
                                                    value={form.profitMargin} 
                                                    onChange={(e) => handleChange('profitMargin', e.target.value)}
                                                    placeholder="20"
                                                    disabled={isPriceConfigured}
                                                />
                                            </div>

                                            {/* 3. CURRENCY */}
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex justify-between">
                                                    Currency
                                                    {isPriceConfigured && <Lock className="w-3 h-3" />}
                                                </label>
                                                <select 
                                                    className={`w-full rounded-lg border px-2 py-2 text-sm font-medium outline-none
                                                        ${isPriceConfigured 
                                                            ? 'bg-gray-200 border-gray-300 text-gray-500 cursor-not-allowed appearance-none' 
                                                            : 'bg-white border-gray-300 focus:border-blue-500'
                                                        }`}
                                                    value={form.currency} 
                                                    onChange={(e) => handleChange('currency', e.target.value as any)}
                                                    disabled={isPriceConfigured}
                                                >
                                                    <option value="USD">USD </option>
                                                    <option value="VND">VND </option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* 4. FINAL RETAIL PRICE (DISPLAY ONLY) */}
                                        <div className={`mt-4 pt-4 border-t border-dashed ${isPriceConfigured ? 'border-gray-300' : 'border-blue-200'}`}>
                                            <div className="flex justify-between items-end">
                                                <span className="text-xs font-bold text-gray-500 uppercase">Final Retail Price</span>
                                                <span className={`text-xl font-bold ${isPriceConfigured ? 'text-gray-700' : 'text-blue-600'}`}>
                                                    {new Intl.NumberFormat('en-US').format(displayValues.retailPrice)}
                                                    <span className="text-xs text-gray-400 ml-1 font-medium">{form.currency}</span>
                                                </span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* --- ACTION BUTTONS & STATIC MESSAGES --- */}
                        <div className="space-y-4">
                            
                            <div className="flex items-center gap-3">
                                {/* CANCEL BUTTON */}
                                <button 
                                    type="button"
                                    onClick={() => navigate(-1)}
                                    disabled={isBusy}
                                    className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    Cancel
                                </button>

                                {/* CONFIRM BUTTON */}
                                <button 
                                    type="submit" 
                                    disabled={isBusy}
                                    className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-200 transition-all disabled:opacity-50 disabled:shadow-none flex justify-center items-center gap-2"
                                >
                                    {submitting ? (
                                        <span className="animate-pulse">Processing...</span>
                                    ) : (
                                        <>
                                            Import Stock
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* SUCCESS MESSAGE (STATIC) */}
                            {successMsg && (
                                <div className="p-3 bg-green-50 text-green-700 rounded-lg flex items-center gap-2 border border-green-100 animate-in fade-in">
                                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                                    <span className="text-sm font-medium">{successMsg}</span>
                                </div>
                            )}

                            {/* ERROR MESSAGES */}
                            {globalErrors.length > 0 && (
                                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                                    {globalErrors.map(e => <div key={e}>• {e}</div>)}
                                </div>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ImportStock;