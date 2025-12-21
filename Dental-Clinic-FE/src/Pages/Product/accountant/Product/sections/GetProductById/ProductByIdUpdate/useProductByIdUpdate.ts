import { useCallback, useEffect, useState } from 'react';
import type {
    Product,
    ProductImageUpdateDto,
    ProductUpdateDto,
    ProductImageBase64WithOrder,
} from '../../../../../../../huybro_api/productApi';
import {
    fetchProductById,
    updateProductForAccountant,
    uploadProductImage,
    extractValidationErrors,
    validateProductImagesAi,
    fetchAllProductsForAccountant, 
} from '../../../../../../../huybro_api/productApi';
import { useNavigate } from 'react-router-dom';
type FieldErrors = Record<string, string[]>;

interface ProductUpdateFormImage extends ProductImageUpdateDto {
    file?: File | null;
    originalImageUrl?: string | null;
}

interface ProductUpdateForm extends ProductUpdateDto {
    image: ProductUpdateFormImage[];
}

function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(reader.error);
        reader.onload = () => {
            const result = reader.result;
            if (typeof result === 'string') {
                resolve(result.split(',')[1] ?? '');
            } else {
                reject(new Error('Cannot read file'));
            }
        };
        reader.readAsDataURL(file);
    });
}

function buildBase64ImagesFromForm(
    form: ProductUpdateForm,
): Promise<ProductImageBase64WithOrder[]> {
    const targets = form.image.filter((img) => !!img.file);

    return Promise.all(
        targets.map(async (img) => ({
            base64: await fileToBase64(img.file as File),
            imageOrder: img.imageOrder,
        })),
    );
}

function mapProductToForm(product: Product): ProductUpdateForm {
    return {
        sku: product.sku,
        productName: product.productName,
        brand: product.brand,
        productDescription: product.productDescription,
        unit: product.unit,
        defaultRetailPrice: product.defaultRetailPrice,
        currency: (product.currency as 'USD' | 'VND') ?? 'USD',
        isTaxable: product.isTaxable,
        taxCode: (product.taxCode ?? 0) as number,
        isActive: product.isActive,
        typeNames: product.typeNames ?? [],
        image: (product.image ?? [])
            .slice()
            .sort((a, b) => a.imageOrder - b.imageOrder)
            .map((img) => ({
                imageId: img.imageId,
                imageUrl: img.imageUrl,
                originalImageUrl: img.imageUrl,
                imageOrder: img.imageOrder,
                file: null,
            })),
    };
}

export function useProductByIdUpdate(productId: number | string) {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [loadingError, setLoadingError] = useState<string | null>(null);

    const [form, setForm] = useState<ProductUpdateForm | null>(null);

    const [submitting, setSubmitting] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [globalErrors, setGlobalErrors] = useState<string[]>([]);
    const [validationDebugReason, setValidationDebugReason] = useState<
        string | undefined
    >(undefined);

    const [typeOptions, setTypeOptions] = useState<string[]>([]);
    const [aiWarning, setAiWarning] = useState<string | null>(null);

    // 1. Load Product Detail
    useEffect(() => {
        let mounted = true;

        async function load() {
            setLoading(true);
            setLoadingError(null);
            try {
                const p = await fetchProductById(productId);
                if (!mounted) return;

                if (!p) {
                    setLoadingError('Product not found');
                    setForm(null);
                    return;
                }

                setForm(mapProductToForm(p));
            } catch (err) {
                if (!mounted) return;
                setLoadingError('Failed to load product');
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        }

        load();

        return () => {
            mounted = false;
        };
    }, [productId]);

    // 2. Load Type Options
    useEffect(() => {
        let ignore = false;
        (async () => {
            try {
                // [CHANGED] Use accountant API to get ALL products (active & inactive)
                // This ensures we get types even if they are only on inactive products
                const all = await fetchAllProductsForAccountant();
                
                if (ignore) return;

                const typeSet = new Set<string>();
                
                // Add types from all existing products
                for (const p of all ?? []) {
                    for (const t of p.typeNames ?? []) {
                        if (t) typeSet.add(t);
                    }
                }

                // [ADDED] Ensure current product's types are also in the list
                // This handles cases where the fetchAll might be paginated or have delay issues
                if (form && form.typeNames) {
                    form.typeNames.forEach(t => typeSet.add(t));
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
    }, [form]); // [ADDED] Depend on 'form' so we re-calculate if product loads later

    const resetErrors = useCallback(() => {
        setFieldErrors({});
        setGlobalErrors([]);
        setValidationDebugReason(undefined);
    }, []);

    const handleChange = useCallback(
        (field: keyof ProductUpdateForm, value: unknown) => {
            setForm((prev) => {
                if (!prev) return prev;
                // 'image' is handled by handleImageFileChange
                if (field === 'image') return prev;

                return {
                    ...prev,
                    [field]: value as never,
                };
            });
        },
        [],
    );

    const handleTypeNamesChange = useCallback(
        (values: string[]) => {
            if (!form) return;
            setForm({
                ...form,
                typeNames: values,
            });
        },
        [form],
    );

    const handleImageFileChange = useCallback(
        async (index: number, file: File | null) => {
            if (!form) return;

            const images = [...form.image];
            if (!images[index]) return;

            images[index] = { ...images[index], file: file ?? null };

            if (!file) {
                setForm({
                    ...form,
                    image: images,
                });
                return;
            }

            setUploadingImage(true);
            resetErrors();
            try {
                // Upload image immediately when selected
                const res = await uploadProductImage(
                    file,
                    form.sku,
                    images[index].imageOrder,
                );

                images[index] = {
                    ...images[index],
                    imageUrl: res.imageUrl,
                };

                setForm({
                    ...form,
                    image: images,
                });
            } catch (err) {
                const parsed = extractValidationErrors(err);
                setFieldErrors(parsed.fieldErrors);
                setGlobalErrors(parsed.globalErrors);
                setValidationDebugReason(parsed.reasonIfNotAll);
            } finally {
                setUploadingImage(false);
            }
        },
        [form, resetErrors],
    );

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            if (!form) return;

            resetErrors();
            setAiWarning(null);
            setSubmitting(true);

            try {
                // 1. AI validation for new images
                const base64Images = await buildBase64ImagesFromForm(form);

                if (base64Images.length > 0) {
                    try {
                        await validateProductImagesAi(base64Images);
                    } catch (err) {
                        const parsed = extractValidationErrors(err);
                        setFieldErrors(parsed.fieldErrors);

                        const prioritizedGlobal =
                            parsed.globalErrors.length > 0
                                ? parsed.globalErrors
                                : parsed.reasonIfNotAll
                                    ? [parsed.reasonIfNotAll]
                                    : ['AI validate image failed.'];

                        setGlobalErrors(prioritizedGlobal);

                        if (parsed.reasonIfNotAll) {
                            setValidationDebugReason(parsed.reasonIfNotAll);
                        }

                        setAiWarning(
                            parsed.globalErrors.length > 0
                                ? parsed.globalErrors.join('; ')
                                : 'AI validation failed.',
                        );

                        setSubmitting(false);
                        return;
                    }
                }

                // 2. Prepare payload
                const payload: ProductUpdateDto = {
                    sku: form.sku,
                    productName: form.productName,
                    brand: form.brand,
                    productDescription: form.productDescription,
                    unit: form.unit,
                    defaultRetailPrice: form.defaultRetailPrice,
                    currency: form.currency,
                    isTaxable: form.isTaxable,
                    taxCode: form.taxCode,
                    isActive: form.isActive,
                    typeNames: form.typeNames,
                    image: form.image.map<ProductImageUpdateDto>((img) => ({
                        imageId: img.imageId,
                        imageUrl: img.imageUrl,
                        imageOrder: img.imageOrder,
                    })),
                };

                await updateProductForAccountant(productId, payload);
                navigate('/accountant/product');
            } catch (err) {
                const parsed = extractValidationErrors(err);
                setFieldErrors(parsed.fieldErrors);
                setGlobalErrors(parsed.globalErrors);
                setValidationDebugReason(parsed.reasonIfNotAll);
            } finally {
                setSubmitting(false);
            }
        },
        [form, productId, resetErrors, navigate],
    );

    const handleCancel = useCallback(() => {
        window.history.back();
    }, []);

    return {
        form,
        loading,
        loadingError,
        submitting,
        uploadingImage,
        fieldErrors,
        globalErrors,
        validationDebugReason,
        typeOptions,
        aiWarning,
        handleChange,
        handleTypeNamesChange,
        handleImageFileChange,
        handleSubmit,
        handleCancel,
    };
}