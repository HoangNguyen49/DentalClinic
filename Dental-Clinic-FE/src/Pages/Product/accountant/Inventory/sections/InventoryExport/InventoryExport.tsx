import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    Filter,
    Edit3,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    ArrowUpDown,
    MoreVertical, // Icon 3 chấm
    History       // Icon lịch sử
} from 'lucide-react';
import { useInventoryExport } from './useInventoryExport';
import { getProductImageSrc } from '../../../../../../huybro_api/productApi';
import { formatVNDateTime, formatMoney } from '../../../../../../utils/format';
import ProductPagination from '../../../Product/widgets/ProductPagination';

const InventoryExport: React.FC = () => {
    const navigate = useNavigate();
    const {
        inventoryList,
        clinics,
        loading,
        error,
        page, setPage,
        size, setSize,
        totalPages,
        totalElements,
        keyword, setKeyword,
        selectedClinic, setSelectedClinic,
        sortBy, setSortBy,
        refreshData
    } = useInventoryExport();

    // [NEW] State quản lý dropdown nào đang mở (lưu inventoryId)
    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

    // Logic hiển thị trạng thái kho (giữ nguyên)
    const renderStatus = (qty: number, minStock: number) => {
        if (qty === 0) {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                    <XCircle className="w-3 h-3 mr-1" /> Out of Stock
                </span>
            );
        }
        if (qty <= (minStock || 5)) {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                    <AlertTriangle className="w-3 h-3 mr-1" /> Low Stock
                </span>
            );
        }
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                <CheckCircle2 className="w-3 h-3 mr-1" /> In Stock
            </span>
        );
    };

    return (
        <div className="p-6 min-h-screen bg-gray-100 font-sans text-gray-900">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* TOOLBAR AREA */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            Inventory Overview
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Manage stock levels & pricing across all warehouses.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search Input */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input
                                type="text"
                                className="block w-full sm:w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-shadow shadow-sm"
                                placeholder="Search SKU or Product..."
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                            />
                        </div>

                        {/* Sort Filter */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <ArrowUpDown className="h-4 w-4 text-gray-400" />
                            </div>
                            <select
                                className="block w-full sm:w-40 pl-10 pr-8 py-2 border border-gray-300 rounded-lg leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm shadow-sm appearance-none cursor-pointer font-medium text-gray-700"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="updated">Latest Updated</option>
                                <option value="quantity">Highest Quantity</option>
                            </select>
                        </div>

                        {/* Clinic Filter */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Filter className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <select
                                className="block w-full sm:w-48 pl-10 pr-8 py-2 border border-gray-300 rounded-lg leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm shadow-sm appearance-none cursor-pointer"
                                value={selectedClinic || ''}
                                onChange={(e) => setSelectedClinic(e.target.value ? Number(e.target.value) : undefined)}
                            >
                                <option value="">All Warehouses</option>
                                {clinics.map((c) => (
                                    <option key={c.clinicId} value={c.clinicId}>
                                        {c.clinicName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* TABLE AREA */}
                <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden min-h-[400px]">
                    {error && (
                        <div className="p-4 bg-red-50 text-red-700 text-sm border-b border-red-100">
                            {error}
                        </div>
                    )}

                    <div className="overflow-x-visible"> {/* overflow-visible để dropdown không bị che */}
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Product Info</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Warehouse</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Quantity {sortBy === 'quantity' && '↓'}
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Retail Price</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Last Updated {sortBy === 'updated' && '↓'}
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="p-12 text-center">
                                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                            <p className="mt-2 text-sm text-gray-500">Loading inventory...</p>
                                        </td>
                                    </tr>
                                ) : inventoryList.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-12 text-center text-gray-500 italic">
                                            No inventory records found matching your criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    inventoryList.map((item) => (
                                        <tr key={item.inventoryId} className="hover:bg-blue-50/50 transition-colors group">
                                            {/* Product */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden">
                                                        {item.image ? (
                                                            <img
                                                                src={getProductImageSrc(item.image)}
                                                                alt=""
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="h-full w-full flex items-center justify-center text-xs text-gray-400 font-bold">IMG</div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900 text-sm line-clamp-1" title={item.productName}>
                                                            {item.productName}
                                                        </div>
                                                        <div className="text-xs text-gray-500 font-mono mt-0.5">
                                                            {item.sku}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Warehouse */}
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                                    {item.clinicName}
                                                </div>
                                            </td>

                                            {/* Quantity */}
                                            <td className="px-6 py-4 text-right">
                                                <span className={`font-mono text-sm font-bold ${item.quantity === 0 ? 'text-gray-400' : 'text-gray-900'}`}>
                                                    {item.quantity}
                                                </span>
                                            </td>

                                            {/* Price */}
                                            <td className="px-6 py-4 text-right">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {formatMoney(item.currentRetailPrice, item.currency)}
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="px-6 py-4 text-center">
                                                {renderStatus(item.quantity, item.minStockLevel)}
                                            </td>

                                            {/* Updated */}
                                            <td className="px-6 py-4 text-right text-xs text-gray-500">
                                                {formatVNDateTime(item.lastUpdated)}
                                            </td>

                                            {/* --- [NEW] ACTION COLUMN WITH DROPDOWN --- */}
                                            <td className="px-6 py-4 text-center relative">
                                                <div className="relative inline-block text-left">
                                                    {/* Toggle Button */}
                                                    <button
                                                        onClick={() => setOpenDropdownId(openDropdownId === item.inventoryId ? null : item.inventoryId)}
                                                        className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none"
                                                    >
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>

                                                    {/* Dropdown Menu */}
                                                    {openDropdownId === item.inventoryId && (
                                                        <>
                                                            {/* Backdrop trong suốt để click ra ngoài thì đóng */}
                                                            <div
                                                                className="fixed inset-0 z-10 cursor-default"
                                                                onClick={() => setOpenDropdownId(null)}
                                                            ></div>

                                                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-20 py-1 origin-top-right animate-in fade-in zoom-in-95 duration-100">

                                                                {/* Option 1: Update Stock */}
                                                                <button
                                                                    onClick={() => {
                                                                        navigate(`/accountant/inventory/update/${item.inventoryId}`);
                                                                        setOpenDropdownId(null);
                                                                    }}
                                                                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-3 transition-colors border-b border-gray-50"
                                                                >
                                                                    <Edit3 className="w-4 h-4" />
                                                                    Update Stock
                                                                </button>

                                                                {/* Option 2: View History */}
                                                                <button
                                                                    onClick={() => {
                                                                        // Logic: InventoryViewDto có chứa productId
                                                                        navigate(`/accountant/inventory/history/${item.productId}`);
                                                                        setOpenDropdownId(null);
                                                                    }}
                                                                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-3 transition-colors"
                                                                >
                                                                    <History className="w-4 h-4" />
                                                                    View History
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {!loading && inventoryList.length > 0 && (
                        <ProductPagination
                            page={page}
                            size={size}
                            totalPages={totalPages}
                            totalElements={totalElements}
                            onPageChange={setPage}
                            onSizeChange={setSize}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default InventoryExport;