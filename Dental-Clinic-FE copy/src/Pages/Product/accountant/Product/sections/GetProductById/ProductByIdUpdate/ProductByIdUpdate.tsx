import React from 'react';
import { useParams } from 'react-router-dom';
import { getProductImageSrc } from '../../../../../../../huybro_api/productApi';
import { useProductByIdUpdate } from './useProductByIdUpdate';

const ProductByIdUpdate: React.FC = () => {
    const { id } = useParams<{ id: string }>();

    if (!id) {
        return <div>Product id is missing.</div>;
    }

    const {
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
    } = useProductByIdUpdate(id);

    const renderFieldErrors = (field: string) =>
        fieldErrors[field]?.map((msg) => (
            <div key={msg} className="mt-1 text-xs text-red-600">
                {msg}
            </div>
        ));

    const getTypeButtonClass = (selected: boolean) =>
        [
            'w-full text-left rounded-lg border px-3 py-2 text-sm leading-snug transition-colors break-words whitespace-normal min-h-[40px]',
            selected
                ? 'bg-blue-50 border-blue-600 text-blue-700 font-semibold'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50',
        ].join(' ');

    if (loading) {
        return <div>Loading product...</div>;
    }

    if (loadingError) {
        return <div>{loadingError}</div>;
    }

    if (!form) {
        return <div>No product data.</div>;
    }

    const isBusy = submitting || uploadingImage;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="border-b border-gray-200 bg-white">
                <div className="mx-auto flex max-w-5xl flex-col gap-2 px-6 py-5">
                    <div className="text-sm font-medium uppercase tracking-wide text-gray-400">
                        Accountant
                    </div>
                    <h1 className="text-2xl font-semibold text-gray-900">
                        Update product
                    </h1>
                    <p className="text-sm text-gray-500">
                        Edit product information, classifications and images. Changes will be applied to existing records.
                    </p>
                </div>
            </div>

            <div className="mx-auto max-w-5xl px-6 py-8">
                <form
                    onSubmit={handleSubmit}
                    className="space-y-8 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100"
                >
                    {/* Section 1: Product information */}
                    <section>
                        <h2 className="text-lg font-semibold text-gray-900">
                            Product information
                        </h2>
                        <p className="mb-4 text-sm text-gray-500">
                            Basic details used across the system and visible to customers.
                        </p>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    SKU
                                </label>
                                <input
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={form.sku}
                                    onChange={(e) => handleChange('sku', e.target.value)}
                                    placeholder="SKU"
                                />
                                {renderFieldErrors('sku')}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Product name
                                </label>
                                <input
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={form.productName}
                                    onChange={(e) => handleChange('productName', e.target.value)}
                                    placeholder="Enter product name"
                                />
                                {renderFieldErrors('productName')}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Brand
                                </label>
                                <input
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={form.brand}
                                    onChange={(e) => handleChange('brand', e.target.value)}
                                    placeholder="Enter brand"
                                />
                                {renderFieldErrors('brand')}
                            </div>

                            <div className="md:col-span-2">
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Description
                                </label>
                                <textarea
                                    className="min-h-[96px] w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={form.productDescription}
                                    onChange={(e) =>
                                        handleChange('productDescription', e.target.value)
                                    }
                                    placeholder="Key information about the product, ingredients, benefits…"
                                />
                                {renderFieldErrors('productDescription')}
                            </div>
                        </div>
                    </section>

                    {/* Section 2: Pricing & tax */}
                    <section>
                        <h2 className="text-lg font-semibold text-gray-900">
                            Pricing & tax
                        </h2>
                        <p className="mb-4 text-sm text-gray-500">
                            Set base unit, price and tax configuration for accounting reports.
                        </p>

                        <div className="grid gap-4 md:grid-cols-3">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Unit
                                </label>
                                <input
                                    type="number"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={form.unit}
                                    onChange={(e) => handleChange('unit', Number(e.target.value))}
                                    min={0}
                                />
                                {renderFieldErrors('unit')}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Default retail price
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={form.defaultRetailPrice}
                                    onChange={(e) =>
                                        handleChange(
                                            'defaultRetailPrice',
                                            Number(e.target.value),
                                        )
                                    }
                                    min={0}
                                />
                                {renderFieldErrors('defaultRetailPrice')}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Currency
                                </label>
                                <select
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={form.currency}
                                    onChange={(e) => handleChange('currency', e.target.value)}
                                >
                                    <option value="USD">USD</option>
                                    <option value="VND">VND</option>
                                </select>
                                {renderFieldErrors('currency')}
                            </div>
                        </div>

                        <div className="mt-4 grid gap-4 md:grid-cols-3">
                            <div className="flex items-center gap-2">
                                <input
                                    id="isTaxable"
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    checked={form.isTaxable}
                                    onChange={(e) => {
                                        const checked = e.target.checked;
                                        handleChange('isTaxable', checked);
                                        if (!checked) {
                                            handleChange('taxCode', null);
                                        }
                                    }}
                                />
                                <label
                                    htmlFor="isTaxable"
                                    className="text-sm font-medium text-gray-700"
                                >
                                    Taxable
                                </label>
                            </div>
                            {renderFieldErrors('isTaxable')}

                            {form.isTaxable && (
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                        Tax code
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        value={form.taxCode}
                                        onChange={(e) =>
                                            handleChange('taxCode', Number(e.target.value))
                                        }
                                    />
                                    {renderFieldErrors('taxCode')}
                                </div>
                            )}

                            <div className="flex items-center gap-2">
                                <input
                                    id="isActive"
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    checked={form.isActive}
                                    onChange={(e) => handleChange('isActive', e.target.checked)}
                                />
                                <label
                                    htmlFor="isActive"
                                    className="text-sm font-medium text-gray-700"
                                >
                                    Active
                                </label>
                                {renderFieldErrors('isActive')}
                            </div>
                        </div>

                    </section>

                    {/* Section 3: Classification */}
                    <section>
                        <div className="grid gap-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Type names
                                </label>
                                <p className="mb-2 text-xs text-gray-500">
                                    You can select multiple types. The system may use these types for reporting and SKU conventions.
                                </p>

                                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                                    {typeOptions.map((t) => {
                                        const selected = form.typeNames.includes(t);

                                        return (
                                            <button
                                                key={t}
                                                type="button"
                                                className={getTypeButtonClass(selected)}
                                                onClick={() => {
                                                    const next = selected
                                                        ? form.typeNames.filter((x) => x !== t)
                                                        : [...form.typeNames, t];

                                                    handleTypeNamesChange(next);
                                                }}
                                            >
                                                {t}
                                            </button>
                                        );
                                    })}
                                </div>

                                {renderFieldErrors('typeNames')}
                            </div>
                        </div>
                    </section>

                    {/* Section 4: Images (không còn mô tả + nút Analyze AI) */}
                    <section>
                        <h2 className="text-lg font-semibold text-gray-900">Images</h2>

                        <div className="mt-4 grid gap-6 md:grid-cols-3">
                            {form.image.map((img, idx) => {
                                const slotMeta = [
                                    {
                                        title: 'Image 1 – Main Image',
                                        hint: '',
                                    },
                                    {
                                        title: 'Image 2 – Secondary Image',
                                        hint: '',
                                    },
                                    {
                                        title: 'Image 3 – Secondary Image',
                                        hint: '',
                                    },
                                ][idx];

                                const currentPath =
                                    img.imageUrl || img.originalImageUrl || null;
                                const currentSrc = currentPath
                                    ? getProductImageSrc(currentPath)
                                    : null;

                                return (
                                    <div key={img.imageOrder} className="space-y-2">
                                        <div className="text-sm font-medium text-gray-800">
                                            {slotMeta?.title ?? `Image ${img.imageOrder}`}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {slotMeta?.hint}
                                        </div>

                                        <label className="inline-block cursor-pointer">
                                            <input
                                                type="file"
                                                accept=".jpg,.jpeg,.png"
                                                className="hidden"
                                                onChange={(e) =>
                                                    handleImageFileChange(
                                                        idx,
                                                        e.target.files ? e.target.files[0] : null,
                                                    )
                                                }
                                            />
                                            <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50">
                                                {currentSrc ? (
                                                    <img
                                                        src={currentSrc}
                                                        alt={`Product image ${img.imageOrder}`}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-3xl leading-none text-gray-900">
                                                        +
                                                    </span>
                                                )}
                                            </div>
                                        </label>

                                        {img.originalImageUrl && (
                                            <div className="break-all text-[11px] text-gray-500">
                                                Original path: <code>{img.originalImageUrl}</code>
                                            </div>
                                        )}

                                        {img.imageUrl &&
                                            img.imageUrl !== img.originalImageUrl && (
                                                <div className="break-all text-[11px] text-gray-500">
                                                    Updated path: <code>{img.imageUrl}</code>
                                                </div>
                                            )}

                                        {renderFieldErrors(`image[${idx}].imageUrl`)}
                                    </div>
                                );
                            })}
                        </div>

                        {renderFieldErrors('image')}

                        {/* Global errors / AI warning / debug giữ nguyên cơ chế hook */}
                        {globalErrors.length > 0 && (
                            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                <div className="mb-1 font-semibold">Errors</div>
                                <ul className="list-inside list-disc space-y-0.5">
                                    {globalErrors.map((e) => (
                                        <li key={e}>{e}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {aiWarning && (
                            <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
                                {aiWarning}
                            </div>
                        )}

                        {validationDebugReason && (
                            <div className="mt-4 text-xs text-orange-500">
                                Debug: {validationDebugReason}
                            </div>
                        )}
                    </section>

                    {/* Footer actions */}
                    <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
                        <button
                            type="button"
                            disabled={isBusy}
                            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || uploadingImage}
                            className="inline-flex items-center rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {submitting ? 'Saving...' : 'Update product'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductByIdUpdate;
