import { useEffect, useState } from 'react';
import { fetchAllProductsForAccountant } from '../../../../../../huybro_api/productApi.ts';
import type {
    ProductCreateDto,
    ProductImageCreateDto,
    ValidationErrorResult,
    GeminiVisionResult,
    ProductImageBase64WithOrder,
} from '../../../../../../huybro_api/productApi.ts';
import {
    createProductForAccountant,
    uploadProductImage,
    extractValidationErrors,
    suggestSkuForAccountant,
    validateProductImagesAi,
    analyzeProductImagesAi,
} from '../../../../../../huybro_api/productApi.ts';

export interface ProductImageFormState extends ProductImageCreateDto {
    file?: File | null;
    previewUrl?: string;
    base64?: string;
}

export interface ProductCreateFormState
    extends Omit<ProductCreateDto, 'image'> {
    image: ProductImageFormState[];
}

export interface UseCreateProductResult {
    form: ProductCreateFormState;
    setForm: React.Dispatch<React.SetStateAction<ProductCreateFormState>>;
    submitting: boolean;
    uploadingImage: boolean;
    fieldErrors: Record<string, string[]>;
    globalErrors: string[];
    validationDebugReason?: string;
    typeOptions: string[];
    aiAnalyzing: boolean;
    aiWarning?: string | null;
    handleChange: (field: keyof ProductCreateFormState, value: unknown) => void;
    handleTypeNamesChange: (values: string[]) => void;
    handleImageFileChange: (index: number, file: File | null) => Promise<void>;
    handleSubmit: (e?: React.FormEvent<HTMLFormElement>) => Promise<void>;
    analyzeImagesWithAi: () => Promise<void>;
    resetForm: () => void;
    successMessage: string | null;
}

const defaultImages: ProductImageFormState[] = [
    { imageUrl: '', imageOrder: 1 },
    { imageUrl: '', imageOrder: 2 },
    { imageUrl: '', imageOrder: 3 },
];

const defaultForm: ProductCreateFormState = {
    sku: '',
    productName: '',
    brand: '',
    productDescription: '',
    unit: 0,                
    defaultRetailPrice: 0,  
    currency: 'USD',
    isTaxable: true,
    taxCode: 10,
    isActive: false,        
    image: defaultImages,
    typeNames: [],
};

function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result;
            if (typeof result === 'string') {
                const commaIndex = result.indexOf(',');
                if (commaIndex >= 0) {
                    resolve(result.slice(commaIndex + 1));
                } else {
                    resolve(result);
                }
            } else {
                reject(new Error('Cannot read file as base64 string'));
            }
        };
        reader.onerror = () => reject(reader.error ?? new Error('FileReader error'));
        reader.readAsDataURL(file);
    });
}

// KHÔNG tự validate số lượng ảnh ở FE, chỉ build base64 để gửi cho BE
const buildBase64ImagesFromForm = async (
    form: ProductCreateFormState,
): Promise<ProductImageBase64WithOrder[]> => {
    const result: ProductImageBase64WithOrder[] = [];

    for (const img of form.image) {
        // Ưu tiên dùng base64 đã lưu sẵn (sau lần upload đầu tiên)
        if (img.base64) {
            result.push({
                base64: img.base64,
                imageOrder: img.imageOrder,
            });
            continue;
        }

        // Nếu chưa có base64 nhưng còn file thì mới đọc lại từ file
        if (img.file) {
            const base64 = await fileToBase64(img.file);
            result.push({
                base64,
                imageOrder: img.imageOrder,
            });
        }
    }

    return result;
};



export function useCreateProduct(): UseCreateProductResult {
    const [form, setForm] = useState<ProductCreateFormState>(defaultForm);
    const [submitting, setSubmitting] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
    const [globalErrors, setGlobalErrors] = useState<string[]>([]);
    const [validationDebugReason, setValidationDebugReason] = useState<
        string | undefined
    >(undefined);
    const [skuTouchedByUser, setSkuTouchedByUser] = useState(false);

    const [typeOptions, setTypeOptions] = useState<string[]>([]);

    const [aiAnalyzing, setAiAnalyzing] = useState(false);
    const [aiWarning, setAiWarning] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    

    useEffect(() => {
        let ignore = false;
        (async () => {
            try {
                const all = await fetchAllProductsForAccountant();
                if (ignore) return;
                const typeSet = new Set<string>();
                for (const p of all ?? []) {
                    for (const t of p.typeNames ?? []) {
                        if (t) typeSet.add(t);
                    }
                }
                const sorted = Array.from(typeSet).sort((a, b) =>
                    a.localeCompare(b),
                );
                setTypeOptions(sorted);
            } catch {
                if (!ignore) {
                    setTypeOptions([]);
                }
            }
        })();
        return () => {
            ignore = true;
        };
    }, []);

    const clearErrors = () => {
        setFieldErrors({});
        setGlobalErrors([]);
        setValidationDebugReason(undefined);
        setAiWarning(null);
        setSuccessMessage(null);
    };

    const handleChange = (
        field: keyof ProductCreateFormState,
        value: unknown,
    ) => {
        if (field === 'sku') {
            setSkuTouchedByUser(true);
        }

        setForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleTypeNamesChange = (values: string[]) => {
        setForm((prev) => ({
            ...prev,
            typeNames: values,
        }));

        if (values.length === 0) {
            return;
        }

        if (skuTouchedByUser) {
            return;
        }

        (async () => {
            try {
                const suggestedSku = await suggestSkuForAccountant(values);
                setForm((prev) => {
                    if (skuTouchedByUser) {
                        return prev;
                    }
                    return {
                        ...prev,
                        sku: suggestedSku,
                    };
                });
            } catch {
                setGlobalErrors((prev) => [
                    ...prev,
                    'Không thể gợi ý SKU từ typeNames. Vui lòng nhập SKU thủ công.',
                ]);
            }
        })();
    };

    const handleImageFileChange = async (
        index: number,
        file: File | null,
    ): Promise<void> => {
        if (!file) return;

        const imageOrder = index + 1;
        setUploadingImage(true);
        clearErrors();
        setAiWarning(null);

        try {
            const base64 = await fileToBase64(file);

            const res = await uploadProductImage(
                file,
                form.sku && form.sku.trim().length > 0 ? form.sku.trim() : 'TEMP_SKU',
                imageOrder,
            );

            setForm((prev) => {
                const images = [...prev.image];
                const old = images[index] ?? { imageOrder };
                images[index] = {
                    ...old,
                    imageOrder,
                    imageUrl: res.imageUrl,
                    file,
                    previewUrl: URL.createObjectURL(file),
                    base64,
                };
                return { ...prev, image: images };
            });
        } catch (err) {
            const parsed: ValidationErrorResult = extractValidationErrors(err);
            setFieldErrors(parsed.fieldErrors);

            const prioritizedGlobal =
                parsed.globalErrors.length > 0
                    ? parsed.globalErrors
                    : parsed.reasonIfNotAll
                        ? [parsed.reasonIfNotAll]
                        : ['Upload image thất bại.'];

            setGlobalErrors(prioritizedGlobal);

            if (parsed.reasonIfNotAll) {
                setValidationDebugReason(parsed.reasonIfNotAll);
            }
        } finally {
            setUploadingImage(false);
        }
    };
    // Khi SKU được cập nhật từ trống/TEMP sang SKU thật,
    // tự động re-upload các ảnh đang mang đường dẫn TEMP_SKU_...
    useEffect(() => {
        const sku = form.sku.trim();
        if (!sku) return; 

        const imagesNeedingReupload = form.image.filter(
            (img) =>
                img.file &&
                img.imageUrl &&
                img.imageUrl.includes('TEMP_SKU'),
        );

        if (imagesNeedingReupload.length === 0) {
            return;
        }

        let cancelled = false;

        (async () => {
            setUploadingImage(true);
            try {
                const updates: { imageOrder: number; imageUrl: string }[] = [];

                for (const img of imagesNeedingReupload) {
                    const res = await uploadProductImage(
                        img.file as File,
                        sku,
                        img.imageOrder,
                    );
                    if (cancelled) return;
                    updates.push({
                        imageOrder: img.imageOrder,
                        imageUrl: res.imageUrl,
                    });
                }

                if (!cancelled) {
                    setForm((prev) => ({
                        ...prev,
                        image: prev.image.map((img) => {
                            const found = updates.find(
                                (u) => u.imageOrder === img.imageOrder,
                            );
                            return found ? { ...img, imageUrl: found.imageUrl } : img;
                        }),
                    }));
                }
            } finally {
                if (!cancelled) {
                    setUploadingImage(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [form.sku]);


    // B. analyze-images: dùng nút riêng, có thể bấm trước khi create
    const analyzeImagesWithAi = async (): Promise<void> => {
        clearErrors();
        setAiWarning(null);
        setAiAnalyzing(true);

        try {
            const base64Images = await buildBase64ImagesFromForm(form);

            const result: GeminiVisionResult = await analyzeProductImagesAi(
                base64Images,
                form.typeNames,
            );

            const aiTypeNames =
                Array.isArray(result.typeNames)
                    ? result.typeNames
                        .filter((t) => typeof t === 'string')
                        .map((t) => t.trim())
                        .filter((t) => t.length > 0)
                    : [];

            if (aiTypeNames.length > 0) {
                setTypeOptions((prev) => {
                    const set = new Set(prev);
                    aiTypeNames.forEach((t) => set.add(t));
                    return Array.from(set).sort((a, b) => a.localeCompare(b));
                });
            }

            setForm((prev) => ({
                ...prev,
                productName: result.productName ?? prev.productName,
                brand: result.brand ?? prev.brand,
                productDescription:
                    result.productDescription ?? prev.productDescription,
                typeNames: aiTypeNames.length > 0 ? aiTypeNames : prev.typeNames,
            }));

            if (aiTypeNames.length > 0 && !skuTouchedByUser) {
                try {
                    const suggestedSku = await suggestSkuForAccountant(aiTypeNames);
                    setForm((prev) => {
                        if (skuTouchedByUser) return prev;
                        return {
                            ...prev,
                            sku: suggestedSku,
                        };
                    });
                } catch {
                    setGlobalErrors((prev) => [
                        ...prev,
                        'Không thể gợi ý SKU từ AI typeNames. Vui lòng nhập SKU thủ công.',
                    ]);
                }
            }

            setSuccessMessage("AI Analysis complete! Data has been auto-filled.");
            if (result.needBetterImages === true) {
                setAiWarning('AI suggests better images for higher accuracy.');
            }
        } catch (err) {
            const parsed = extractValidationErrors(err);
            setFieldErrors(parsed.fieldErrors);

            const prioritizedGlobal =
                parsed.globalErrors.length > 0
                    ? parsed.globalErrors
                    : parsed.reasonIfNotAll
                        ? [parsed.reasonIfNotAll]
                        : ['AI analyze image thất bại.'];

            setGlobalErrors(prioritizedGlobal);

            if (parsed.reasonIfNotAll) {
                setValidationDebugReason(parsed.reasonIfNotAll);
            }
        } finally {
            setAiAnalyzing(false);
        }
    };

    const handleSubmit = async (
        e?: React.FormEvent<HTMLFormElement>,
    ): Promise<void> => {
        if (e) e.preventDefault();
        setSubmitting(true);
        clearErrors();
        setAiWarning(null);

        // 1. Giai đoạn 1: AI validate images
        try {
            const base64Images = await buildBase64ImagesFromForm(form);
            await validateProductImagesAi(base64Images);
        } catch (err) {
            // Nếu AI reject → DỪNG, KHÔNG create
            const parsed = extractValidationErrors(err);
            setFieldErrors(parsed.fieldErrors);

            const prioritizedGlobal =
                parsed.globalErrors.length > 0
                    ? parsed.globalErrors
                    : parsed.reasonIfNotAll
                        ? [parsed.reasonIfNotAll]
                        : ['AI validate image thất bại.'];

            setGlobalErrors(prioritizedGlobal);

            if (parsed.reasonIfNotAll) {
                setValidationDebugReason(parsed.reasonIfNotAll);
            }

            setSubmitting(false);
            return;
        }

        // 2. Giai đoạn 2: DTO validate & createProduct
        const payload: ProductCreateDto = {
            sku: form.sku.trim(),
            productName: form.productName.trim(),
            brand: form.brand.trim(),
            productDescription: form.productDescription.trim(),
            unit: Number(form.unit),
            defaultRetailPrice: Number(form.defaultRetailPrice),
            currency: form.currency,
            isTaxable: Boolean(form.isTaxable),
            taxCode: Number(form.taxCode),
            isActive: Boolean(form.isActive),
            image: form.image.map<ProductImageCreateDto>((img) => ({
                imageUrl: img.imageUrl,
                imageOrder: img.imageOrder,
            })),
            typeNames: form.typeNames
                .map((t) => t.trim())
                .filter((t) => t.length > 0),
        };

        try {
            await createProductForAccountant(payload);
            resetForm();
            setSuccessMessage("Product created successfully!");
        } catch (err) {
            const parsed = extractValidationErrors(err);
            if (
                Object.keys(parsed.fieldErrors).length === 0 &&
                parsed.globalErrors.length === 0
            ) {
                setGlobalErrors([
                    'Tạo sản phẩm thất bại nhưng không đọc được chi tiết lỗi từ API.',
                ]);
            } else {
                setFieldErrors(parsed.fieldErrors);
                setGlobalErrors(parsed.globalErrors);
            }
            if (parsed.reasonIfNotAll) {
                setValidationDebugReason(parsed.reasonIfNotAll);
            }
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setForm({
            ...defaultForm,
            image: defaultImages.map((img) => ({ ...img })),
        });
        clearErrors();
        setSkuTouchedByUser(false);
        setAiWarning(null);
        setAiAnalyzing(false);
    };

    return {
        form,
        setForm,
        submitting,
        uploadingImage,
        fieldErrors,
        globalErrors,
        validationDebugReason,
        typeOptions,
        aiAnalyzing,
        aiWarning,
        handleChange,
        handleTypeNamesChange,
        handleImageFileChange,
        handleSubmit,
        analyzeImagesWithAi,
        resetForm,
        successMessage,
    };
}
