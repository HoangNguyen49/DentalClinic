import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    fetchInventoryDetail, 
    updateInventory, 
    type InventoryViewDto, 
    type InventoryUpdateDto 
} from '../../../../../../huybro_api/inventoryApi';
import { 
    fetchProductById, // [NEW] Import thêm cái này
    extractValidationErrors 
} from '../../../../../../huybro_api/productApi';

export function useUpdateInventory() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // Data State (Thông tin tĩnh từ DB để hiển thị Info Card)
    const [data, setData] = useState<InventoryViewDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    // --- FORM STATE ---
    
    // 1. Quantity
    const [quantity, setQuantity] = useState<number | ''>('');
    
    // 2. Pricing Calculator
    const [importPrice, setImportPrice] = useState<number | ''>(''); 
    const [profitMargin, setProfitMargin] = useState<number | ''>(''); // Để trống ban đầu
    const [currency, setCurrency] = useState('USD');
    
    // 3. Final Price
    const [finalRetailPrice, setFinalRetailPrice] = useState<number | ''>('');

    // 4. Note
    const [note, setNote] = useState('');

    // Process State
    const [submitting, setSubmitting] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
    const [globalError, setGlobalError] = useState<string | null>(null);

    // --- EFFECTS ---

    // 1. Load Data ban đầu & Pre-fill Lịch sử
    useEffect(() => {
        if (!id) return;
        
        let isMounted = true;
        setLoading(true);

        (async () => {
            try {
                // A. Lấy thông tin tồn kho hiện tại
                const invData = await fetchInventoryDetail(id);
                
                if (!isMounted) return;
                
                setData(invData);
                
                // Fill dữ liệu kho hiện tại vào form
                setQuantity(invData.quantity);
                setCurrency(invData.currency || 'USD'); 

                // B. [NEW] Lấy thông tin Product gốc để lấy GIÁ LỊCH SỬ (Base Cost & Margin)
                // (Vì Inventory chỉ lưu giá bán cuối cùng, không lưu giá nhập)
                if (invData.productId) {
                    const productData = await fetchProductById(invData.productId);
                    
                    if (productData && isMounted) {
                        // Lấy giá nhập và margin lần cuối cùng (nếu có)
                        const historyImportPrice = productData.latestImportPrice ?? 0;
                        const historyMargin = productData.latestProfitMargin ?? 20; // Default 20% nếu chưa có

                        setImportPrice(historyImportPrice);
                        setProfitMargin(historyMargin);

                        // Tính toán ngay giá Final Price dựa trên lịch sử để hiển thị preview
                        // (User sẽ thấy ngay giá hợp lý thay vì số 0)
                        if (historyImportPrice > 0) {
                            const calculated = historyImportPrice * (1 + historyMargin / 100);
                            setFinalRetailPrice(parseFloat(calculated.toFixed(2)));
                        } else {
                            // Fallback: Nếu không có lịch sử thì lấy giá đang bán hiện tại
                            setFinalRetailPrice(invData.currentRetailPrice || 0);
                        }
                    }
                } else {
                    // Fallback nếu không lấy được product (hiếm gặp)
                    setFinalRetailPrice(invData.currentRetailPrice || 0);
                }

            } catch (err) {
                console.error(err);
                if (isMounted) setLoadError("Could not load inventory data.");
            } finally {
                if (isMounted) setLoading(false);
            }
        })();

        return () => { isMounted = false; };
    }, [id]);

    // 2. Logic Tự động tính giá bán (Auto Calculate)
    // Chạy khi user thay đổi Import Price hoặc Margin
    useEffect(() => {
        if (importPrice !== '' && typeof importPrice === 'number' && importPrice > 0) {
            const margin = (profitMargin === '' || typeof profitMargin !== 'number') ? 0 : profitMargin;
            const calculated = importPrice * (1 + margin / 100);
            setFinalRetailPrice(parseFloat(calculated.toFixed(2))); // Làm tròn 2 số thập phân
        }
    }, [importPrice, profitMargin]);

    // 3. Handle Submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!data) return;

        setSubmitting(true);
        setFieldErrors({});
        setGlobalError(null);

        const payload: InventoryUpdateDto = {
            inventoryId: data.inventoryId,
            newQuantity: quantity === '' ? undefined : Number(quantity),
            newRetailPrice: finalRetailPrice === '' ? undefined : Number(finalRetailPrice),
            newImportPrice: importPrice === '' ? 0 : Number(importPrice),
            newProfitMargin: profitMargin === '' ? 0 : Number(profitMargin),
            newCurrency: currency,
            note: note.trim()
        };

        try {
            await updateInventory(payload);
            navigate('/accountant/inventory'); 
        } catch (err) {
            const parsed = extractValidationErrors(err);
            setFieldErrors(parsed.fieldErrors);
            if (parsed.globalErrors.length > 0) setGlobalError(parsed.globalErrors[0]);
            else if (parsed.reasonIfNotAll) setGlobalError(parsed.reasonIfNotAll);
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = () => window.history.back();

    return {
        data, loading, loadError, submitting,
        
        // Form Getters & Setters
        quantity, setQuantity,
        importPrice, setImportPrice,
        profitMargin, setProfitMargin,
        currency, setCurrency,
        finalRetailPrice, // Giá cuối cùng (hiển thị preview)
        note, setNote,

        fieldErrors, globalError,
        handleSubmit, handleCancel
    };
}