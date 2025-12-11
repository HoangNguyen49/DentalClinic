import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, History, Calendar, Warehouse, TrendingUp, TrendingDown } from 'lucide-react';
import { 
    fetchProductStockHistory, 
    type ProductStockHistoryDto 
} from '../../../../../../huybro_api/inventoryApi';
import { 
    fetchProductById, 
    getProductImageSrc, 
    type Product 
} from '../../../../../../huybro_api/productApi';
import { formatVNDateTime } from '../../../../../../utils/format';
import ProductPagination from '../../../Product/widgets/ProductPagination';

const InventoryHistory: React.FC = () => {
    const { productId } = useParams<{ productId: string }>();
    const navigate = useNavigate();

    const [product, setProduct] = useState<Product | null>(null);
    const [historyList, setHistoryList] = useState<ProductStockHistoryDto[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Pagination
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    useEffect(() => {
        if (!productId) return;
        
        let isMounted = true;
        setLoading(true);

        const loadData = async () => {
            try {
                if (!product) {
                    const productData = await fetchProductById(productId);
                    if (isMounted) setProduct(productData);
                }

                const historyData = await fetchProductStockHistory(productId, page, size);
                if (isMounted) {
                    setHistoryList(historyData.content);
                    setTotalPages(historyData.totalPages);
                    setTotalElements(historyData.totalElements);
                }
            } catch (error) {
                console.error("Failed to load history", error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadData();
        return () => { isMounted = false; };
    }, [productId, page, size]);

    // Helper: Render xu hướng thay đổi (Trend) cho Giá & Margin
    const renderTrend = (current: number, previous: number | undefined, format: (v: number) => string, suffix = '') => {
        if (previous === undefined) {
            return <span className="text-gray-900 font-medium">{format(current)}{suffix}</span>;
        }
        if (current === previous) {
            return <span className="text-gray-400">{format(current)}{suffix}</span>;
        }

        const diff = current - previous;
        const isUp = diff > 0;

        return (
            <div className="flex flex-col items-end">
                <span className="text-gray-900 font-medium">{format(current)}{suffix}</span>
                <span className={`text-[10px] flex items-center font-bold ${isUp ? 'text-green-600' : 'text-red-500'}`}>
                    {isUp ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                    {format(Math.abs(diff))}{suffix}
                </span>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20">
            {/* HEADER */}
            <div className="border-b border-gray-200 bg-white">
                <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-5">
                    <div className="text-sm font-medium uppercase tracking-wide text-gray-400">Inventory Audit</div>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                                <History className="w-6 h-6 text-gray-700" />
                                Stock History
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">Track all imports and adjustments.</p>
                        </div>
                        <button 
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back
                        </button>
                    </div>
                </div>
            </div>

            {/* CONTENT */}
            <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
                
                {/* 1. PRODUCT SUMMARY */}
                {product && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row gap-6 items-start">
                        <div className="h-24 w-24 flex-shrink-0 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden">
                            {product.image && product.image.length > 0 ? (
                                <img src={getProductImageSrc(product.image[0].imageUrl)} className="w-full h-full object-cover" alt="" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-400">IMG</div>
                            )}
                        </div>
                        <div className="flex-1 space-y-3">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{product.productName}</h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">SKU: {product.sku}</span>
                                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">Unit: {product.unit}</span>
                                </div>
                            </div>
                            <div className="text-sm text-gray-500 line-clamp-2 max-w-2xl">{product.productDescription}</div>
                        </div>
                        <div className="text-right bg-gray-50 p-4 rounded-lg border border-gray-100 min-w-[150px]">
                            <div className="text-xs text-gray-500 uppercase font-bold mb-1">Current Price</div>
                            <div className="text-2xl font-bold text-gray-900">
                                {new Intl.NumberFormat('en-US').format(product.defaultRetailPrice || 0)}
                                <span className="text-sm text-gray-500 ml-1 font-medium">{product.currency}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. HISTORY TABLE */}
                <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date & Time</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Warehouse</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Qty Change</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Import Cost</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Margin</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Note</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {loading ? (
                                    <tr><td colSpan={6} className="p-12 text-center text-sm text-gray-500">Loading...</td></tr>
                                ) : historyList.length === 0 ? (
                                    <tr><td colSpan={6} className="p-12 text-center text-gray-500 italic">No history found.</td></tr>
                                ) : (
                                    historyList.map((item, index) => {
                                        // Lấy item cũ hơn liền kề để so sánh trend giá
                                        const prevItem = historyList[index + 1];

                                        return (
                                            <tr key={item.receiptId} className="hover:bg-gray-50 transition-colors">
                                                {/* Date */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2 text-sm text-gray-900 font-medium">
                                                        <Calendar className="w-4 h-4 text-gray-400" />
                                                        {formatVNDateTime(item.createdAt)}
                                                    </div>
                                                </td>
                                                {/* Warehouse */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <Warehouse className="w-4 h-4 text-indigo-400" />
                                                        {item.clinicName}
                                                    </div>
                                                </td>
                                                
                                                {/* [UPDATED] Qty Change: Hiển thị 0 thay vì dấu gạch ngang */}
                                                <td className="px-6 py-4 text-right whitespace-nowrap">
                                                    {item.quantityAdded === 0 ? (
                                                        // Hiển thị số 0 màu xám đậm (neutral)
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
                                                            0
                                                        </span>
                                                    ) : (
                                                        // Hiển thị Tăng (Xanh) hoặc Giảm (Đỏ)
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${item.quantityAdded > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                            {item.quantityAdded > 0 ? '+' : ''}{item.quantityAdded}
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Import Cost Trend */}
                                                <td className="px-6 py-4 text-right whitespace-nowrap text-sm">
                                                    {renderTrend(
                                                        item.importPrice,
                                                        prevItem?.importPrice,
                                                        (v) => new Intl.NumberFormat('en-US').format(v)
                                                    )}
                                                </td>

                                                {/* Margin Trend */}
                                                <td className="px-6 py-4 text-right whitespace-nowrap text-sm">
                                                    {renderTrend(
                                                        item.profitMargin,
                                                        prevItem?.profitMargin,
                                                        (v) => v.toFixed(1),
                                                        '%'
                                                    )}
                                                </td>

                                                {/* Note */}
                                                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={item.note}>
                                                    {item.note || <span className="text-gray-300 italic">No note</span>}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {!loading && historyList.length > 0 && (
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

export default InventoryHistory;    