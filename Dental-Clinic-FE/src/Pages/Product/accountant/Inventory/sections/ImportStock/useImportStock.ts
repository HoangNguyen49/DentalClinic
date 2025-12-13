import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  importStock,
  fetchClinicsForDropdown,
  fetchProductInventoryStatus,
  type ProductStockReceiptCreateDto,
  type ClinicCustomDto,
  type ProductInventoryStatusDto,
} from '../../../../../../huybro_api/inventoryApi';
import {
  fetchProductById,
  extractValidationErrors,
  type Product,
} from '../../../../../../huybro_api/productApi';

// Form interface
export interface ImportStockFormState {
  productId: number | '';
  clinicId: number | '';
  quantityAdded: number;
  importPrice: number | '';
  profitMargin: number;
  currency: 'USD' | 'VND';
  note: string;
}

const defaultForm: ImportStockFormState = {
  productId: '',
  clinicId: '',
  quantityAdded: 1,
  importPrice: '',
  profitMargin: 20,
  currency: 'USD',
  note: '',
};

export function useImportStock() {
  const [searchParams] = useSearchParams();
  const paramProductId = searchParams.get('productId');

  const [form, setForm] = useState<ImportStockFormState>(defaultForm);
  const [clinicList, setClinicList] = useState<ClinicCustomDto[]>([]);
  const [inventoryStatus, setInventoryStatus] = useState<ProductInventoryStatusDto | null>(null);

  // Loading & Error States
  const [loadingData, setLoadingData] = useState(false);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [globalErrors, setGlobalErrors] = useState<string[]>([]);

  // Context State
  const [selectedProductDetail, setSelectedProductDetail] = useState<Product | null>(null);
  const [isPriceConfigured, setIsPriceConfigured] = useState(false);

  // 1. Initial Load
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingData(true);
      try {
        const clinics = await fetchClinicsForDropdown();
        if (mounted) setClinicList(clinics);

        if (paramProductId) {
          const productData = await fetchProductById(Number(paramProductId));
          if (mounted && productData) {
            handleProductSelect(productData);
          }
        }
      } catch (err) {
        console.error('Failed to load initial data', err);
      } finally {
        if (mounted) setLoadingData(false);
      }
    })();
    return () => { mounted = false; };
  }, [paramProductId]);

  // 2. Fetch Inventory Status
  useEffect(() => {
    if (!form.productId) {
      setInventoryStatus(null);
      return;
    }
    let active = true;
    (async () => {
      try {
        const status = await fetchProductInventoryStatus(Number(form.productId));
        if (active) setInventoryStatus(status);
      } catch (error) {
        console.error('Cannot fetch inventory status', error);
      }
    })();
    return () => { active = false; };
  }, [form.productId]);

  // --- LOGIC XỬ LÝ CHỌN SẢN PHẨM ---
  const handleProductSelect = useCallback(async (productRaw: Product | null) => {
    if (!productRaw) {
      setSelectedProductDetail(null);
      setForm(prev => ({
        ...prev,
        productId: '',
        importPrice: '',
        profitMargin: 20,
        currency: 'USD'
      }));
      setIsPriceConfigured(false);
      return;
    }

    setLoadingInventory(true);
    try {
      const fullProduct = await fetchProductById(productRaw.productId);

      if (!fullProduct) return;

      // console.log(">>> FULL PRODUCT DATA (Latest History):", fullProduct);

      setSelectedProductDetail(fullProduct);
      setForm(prev => ({ ...prev, productId: fullProduct.productId }));

      const hasPrice = fullProduct.defaultRetailPrice != null && fullProduct.defaultRetailPrice > 0;
      setIsPriceConfigured(hasPrice);

      if (hasPrice) {
        // CASE 2: Đã có giá -> KHÓA FORM & ĐIỀN GIÁ LỊCH SỬ TỪ BE
        setForm(prev => ({
          ...prev,
          currency: (fullProduct.currency as 'USD' | 'VND') || 'USD',
          importPrice: fullProduct.latestImportPrice ?? 0,
          profitMargin: fullProduct.latestProfitMargin ?? 0
        }));
      } else {
        // CASE 1: Chưa có giá -> MỞ FORM
        setForm(prev => ({
          ...prev,
          importPrice: '',
          profitMargin: 20,
          currency: 'USD'
        }));
      }
    } catch (error) {
      console.error("Failed to fetch full product detail:", error);
    } finally {
      setLoadingInventory(false);
    }
  }, []);

  const handleChange = useCallback((field: keyof ImportStockFormState, value: unknown) => {
    if (isPriceConfigured && (field === 'importPrice' || field === 'profitMargin' || field === 'currency')) {
      return;
    }

    setForm((prev) => ({ ...prev, [field]: value }));

    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }, [fieldErrors, isPriceConfigured]);

  // --- [FIXED] HANDLE SUBMIT ---
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSubmitting(true);
    setFieldErrors({});
    setGlobalErrors([]);
    setSuccessMsg(null);

    // Snapshot lại giá trị đang nhập trên form (để chắc chắn không bị mất)
    const snapshotImportPrice = form.importPrice;
    const snapshotMargin = form.profitMargin;
    const snapshotCurrency = form.currency;

    const payload: ProductStockReceiptCreateDto = {
      productId: Number(form.productId),
      clinicId: Number(form.clinicId),
      quantityAdded: Number(form.quantityAdded),
      importPrice: Number(form.importPrice),
      profitMargin: Number(form.profitMargin),
      currency: form.currency,
      note: form.note,
    };

    try {
      // 1. Gọi API Import -> Nhận ngay kết quả receipt từ BE
      const receipt = await importStock(payload);
      setSuccessMsg('Stock imported successfully!');

      // 2. Cập nhật số lượng tồn kho (Inventory Status)
      const updatedStatus = await fetchProductInventoryStatus(Number(form.productId));
      setInventoryStatus(updatedStatus);

      // 3. [TỐI ƯU HÓA] CẬP NHẬT UI TỨC THÌ (OPTIMISTIC UPDATE)
      // Không gọi lại fetchProductById nữa để tránh delay/sai số.
      // Tự cập nhật context selectedProductDetail dựa trên kết quả vừa nhập.
      if (selectedProductDetail) {
        const updatedDetail: Product = {
          ...selectedProductDetail,
          // Cập nhật giá bán mới vừa được tính toán xong
          defaultRetailPrice: receipt.newRetailPrice,
          currency: snapshotCurrency,
          // Cập nhật lịch sử ảo để UI hiển thị đúng ngay lập tức
          latestImportPrice: Number(snapshotImportPrice),
          latestProfitMargin: Number(snapshotMargin)
        };

        setSelectedProductDetail(updatedDetail);
        setIsPriceConfigured(true); // Chắc chắn là đã có giá -> Khóa Form
      }

      // 4. Reset Form nhưng GIỮ NGUYÊN GIÁ TRỊ VỪA NHẬP
      setForm(prev => ({
        ...prev,
        clinicId: payload.clinicId, // Giữ kho
        quantityAdded: 1,           // Reset số lượng
        note: '',                   // Reset note

        // Giữ nguyên các con số giá trị để hiển thị trên UI đã khóa
        importPrice: snapshotImportPrice,
        profitMargin: snapshotMargin,
        currency: snapshotCurrency
      }));

    } catch (err) {
      const parsed = extractValidationErrors(err);
      setFieldErrors(parsed.fieldErrors);
      setGlobalErrors(parsed.globalErrors.length > 0 ? parsed.globalErrors : (parsed.reasonIfNotAll ? [parsed.reasonIfNotAll] : []));
    } finally {
      setSubmitting(false);
    }
  };

  const displayValues = useMemo(() => {
    if (isPriceConfigured && selectedProductDetail?.defaultRetailPrice) {
      return {
        retailPrice: selectedProductDetail.defaultRetailPrice,
        margin: form.profitMargin,
        isLocked: true
      };
    }

    const cost = Number(form.importPrice) || 0;
    const margin = Number(form.profitMargin) || 0;
    const retail = cost * (1 + margin / 100);

    return {
      retailPrice: retail,
      margin: form.profitMargin,
      isLocked: false
    };
  }, [isPriceConfigured, selectedProductDetail, form.importPrice, form.profitMargin]);

  return {
    form,
    clinicList,
    inventoryStatus,
    loadingInventory,
    loadingData,
    submitting,
    successMsg,
    fieldErrors,
    globalErrors,
    isFixedProduct: !!paramProductId,
    selectedProductDetail,
    isPriceConfigured,
    displayValues,
    handleProductSelect,
    handleChange,
    handleSubmit,
  };
}