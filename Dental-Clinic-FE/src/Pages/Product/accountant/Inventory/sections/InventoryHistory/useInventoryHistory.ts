import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
    fetchProductStockHistory, 
    type ProductStockHistoryDto 
} from '../../../../../../huybro_api/inventoryApi';
import { 
    fetchProductById, 
    type Product 
} from '../../../../../../huybro_api/productApi';

export function useInventoryHistory() {
    const { productId } = useParams<{ productId: string }>();
    
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
                // 1. Load Product Detail (Header info)
                if (!product) {
                    const productData = await fetchProductById(productId);
                    if (isMounted) setProduct(productData);
                }

                // 2. Load History Table
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

    return {
        product,
        historyList,
        loading,
        page, setPage,
        size, setSize,
        totalPages,
        totalElements
    };
}