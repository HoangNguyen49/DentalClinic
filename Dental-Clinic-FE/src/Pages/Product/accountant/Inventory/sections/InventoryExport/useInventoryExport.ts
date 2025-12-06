import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    fetchInventoryPage,
    fetchClinicsForDropdown,
    type InventoryViewDto,
    type ClinicCustomDto
} from '../../../../../../huybro_api/inventoryApi';

export function useInventoryExport() {
    const [searchParams, setSearchParams] = useSearchParams();

    // Data State
    const [inventoryList, setInventoryList] = useState<InventoryViewDto[]>([]);
    const [clinics, setClinics] = useState<ClinicCustomDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Pagination State
    const [page, setPage] = useState(Number(searchParams.get('page') ?? 0));
    const [size, setSize] = useState(Number(searchParams.get('size') ?? 8));
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    // Filter State
    const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
    const [selectedClinic, setSelectedClinic] = useState<number | undefined>(
        searchParams.get('clinicId') ? Number(searchParams.get('clinicId')) : undefined
    );

    // --- [NEW] SORT STATE ---
    // Mặc định là 'updated' (Mới nhất), user có thể đổi sang 'quantity' (Nhiều nhất)
    const [sortBy, setSortBy] = useState<'updated' | 'quantity'>('updated');

    // Debounce keyword
    const [debouncedKeyword, setDebouncedKeyword] = useState(keyword);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedKeyword(keyword), 500);
        return () => clearTimeout(handler);
    }, [keyword]);

    // 1. Load Clinics
    useEffect(() => {
        fetchClinicsForDropdown().then(setClinics).catch(console.error);
    }, []);

    // 2. Load Inventory Data
    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setError(null);

        fetchInventoryPage({
            page,
            size,
            keyword: debouncedKeyword,
            clinicId: selectedClinic,
            sortBy: sortBy // [NEW] Truyền giá trị sort động
        })
            .then(res => {
                if (mounted) {
                    setInventoryList(res.content);
                    setTotalPages(res.totalPages);
                    setTotalElements(res.totalElements);
                }
            })
            .catch(err => {
                if (mounted) setError("Failed to load inventory data.");
                console.error(err);
            })
            .finally(() => { if (mounted) setLoading(false); });

        // Sync URL Params
const params: Record<string, string> = {};

// --- SỬA Ở ĐÂY: Bỏ IF, luôn luôn gán giá trị ---
params.page = String(page); 
params.size = String(size); 
// ----------------------------------------------

if (debouncedKeyword) params.keyword = debouncedKeyword;
if (selectedClinic) params.clinicId = String(selectedClinic);
if (sortBy !== 'updated') params.sortBy = sortBy;

setSearchParams(params, { replace: true });

        return () => { mounted = false; };
    }, [page, size, debouncedKeyword, selectedClinic, sortBy, setSearchParams]); // [NEW] Thêm sortBy vào dependency

    const handleFilterChange = (clinicId?: number) => {
        setSelectedClinic(clinicId);
        setPage(0);
    };

    const handleSearchChange = (val: string) => {
        setKeyword(val);
        setPage(0);
    };

    // [NEW] Handle Sort Change
    const handleSortChange = (val: string) => {
        if (val === 'quantity' || val === 'updated') {
            setSortBy(val);
            setPage(0); // Reset về trang 1 khi đổi cách sắp xếp
        }
    };

    // Refresh trick
    const refreshData = () => {
        // Tạm thời set loading true để trigger UI loading, 
        // useEffect sẽ tự chạy lại vì bản chất data thay đổi nhưng ở đây ta chỉ cần giả lập reload
        // Cách tốt nhất là tách hàm fetch ra, nhưng để nhanh ta dùng cách set lại sort chính nó
        setSortBy(prev => prev);
    };

    return {
        inventoryList,
        clinics,
        loading,
        error,
        page, setPage,
        size, setSize,
        totalPages,
        totalElements,
        keyword, setKeyword: handleSearchChange,
        selectedClinic, setSelectedClinic: handleFilterChange,
        sortBy, setSortBy: handleSortChange, // [NEW] Export ra ngoài
        refreshData
    };
}