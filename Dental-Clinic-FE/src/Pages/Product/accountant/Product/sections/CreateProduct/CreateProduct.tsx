import React, { useCallback } from 'react';
import { useCreateProduct } from './useCreateProduct';

const CreateProduct: React.FC = () => {
  const {
    form,
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
  } = useCreateProduct();

  const renderFieldErrors = (field: string) =>
    fieldErrors[field]?.map((msg) => (
      <div key={msg} className="mt-1 text-xs text-red-600">
        {msg}
      </div>
    ));

  const getTypeButtonClass = (selected: boolean) =>
    [
      "w-full text-left rounded-lg border px-3 py-2 text-sm leading-snug transition-colors break-words whitespace-normal min-h-[40px]",
      selected
        ? "bg-blue-50 border-blue-600 text-blue-700 font-semibold"
        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50",
    ].join(" ");



  const isBusy = submitting || uploadingImage || aiAnalyzing;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-6 py-5">
          <div className="text-sm font-medium uppercase tracking-wide text-gray-400">
            Accountant
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Create product
          </h1>
          <p className="text-sm text-gray-500">
            Fill in product information, classifications and images. AI will
            help you validate and auto-fill when possible.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <form
          onSubmit={handleSubmit}
          className="space-y-8 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100"
        >
          {/* Section 1: Basic info */}
          <section>
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-6">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-sm">
                1
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Product information</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  SKU
                </label>
                <input
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={form.sku}
                  onChange={(e) => handleChange('sku', e.target.value)}
                  placeholder="Auto suggested or enter manually"
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
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-6">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-sm">
                2
              </div>
              <h2 className="text-lg font-semibold text-gray-900"> Pricing & tax</h2>
            </div>
            {/* --- KHỐI THÔNG BÁO HƯỚNG DẪN --- */}
            <div className="mb-6 rounded-md bg-blue-50 p-4 border border-blue-200">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Auto-managed Fields
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      <strong>Unit</strong>, <strong>Retail Price</strong>, and <strong>Active Status</strong> are initially disabled.
                      They will be automatically updated and activated when you import stock via the <strong>Inventory</strong> module.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {/* UNIT - DISABLED */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-500">
                  Unit (Auto)
                </label>
                <input
                  type="number"
                  disabled // <--- KHÓA
                  className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-500 shadow-sm" // Style xám
                  value={form.unit}
                // onChange không cần thiết vì disabled
                />
              </div>

              {/* PRICE - DISABLED */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-500">
                  Default retail price (Auto)
                </label>
                <input
                  type="number"
                  disabled // <--- KHÓA
                  className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-500 shadow-sm"
                  value={form.defaultRetailPrice}
                />
              </div>

              {/* CURRENCY - DISABLED */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-500">
                  Currency (Auto)
                </label>
                <select
                  disabled // <--- KHÓA
                  className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-500 shadow-sm"
                  value={form.currency}
                >
                  <option value="USD">USD</option>
                  <option value="VND">VND</option>
                </select>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {/* TAXABLE - GIỮ NGUYÊN CHO NHẬP */}
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
                      handleChange('taxCode', 0); // Về 0 thay vì null để tránh lỗi controlled input
                    }
                  }}
                />
                <label htmlFor="isTaxable" className="text-sm font-medium text-gray-700">
                  Taxable
                </label>
              </div>
              {renderFieldErrors('isTaxable')}

              {form.isTaxable && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Tax code (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={form.taxCode}
                    onChange={(e) => handleChange('taxCode', Number(e.target.value))}
                  />
                  {renderFieldErrors('taxCode')}
                </div>
              )}

              {/* ACTIVE - DISABLED */}
              <div className="flex items-center gap-2">
                <input
                  id="isActive"
                  type="checkbox"
                  disabled // <--- KHÓA
                  className="h-4 w-4 cursor-not-allowed rounded border-gray-200 bg-gray-100 text-gray-400"
                  checked={form.isActive}
                // Không onChange
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-400">
                  Active (Waiting for stock)
                </label>
              </div>
            </div>
          </section>

          {/* Section 3: Classification */}
          <section>
            <div className="grid gap-4">
              <div>
                <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-6">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-sm">
                    3
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900"> Type names</h2>
                </div>

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

          {/* Section 4: Images with clear order */}
          <section>
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-6">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-sm">
                4
              </div>
              <h2 className="text-lg font-semibold text-gray-900"> Images</h2>
            </div>

            {/* --- KHỐI THÔNG BÁO HƯỚNG DẪN IMAGE --- */}
            <div className="mb-6 rounded-md bg-blue-50 p-4 border border-blue-200">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    AI Analysis Tips
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      You can use this feature with just one relevant product image.
                      However, to accurately generate the <strong>Product Name, Brand, Description, and Types</strong>,
                      we recommend uploading three images that clearly display all product information.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
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
                        {img.previewUrl || img.imageUrl ? (
                          <img
                            src={img.previewUrl || img.imageUrl}
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

                    {img.imageUrl && (
                      <div className="break-all text-[11px] text-gray-500">
                        Saved path: <code>{img.imageUrl}</code>
                      </div>
                    )}

                    {renderFieldErrors(`image[${idx}].imageUrl`)}
                  </div>
                );
              })}
            </div>

            {renderFieldErrors('image')}

            <div className="mt-4">
              <button
                type="button"
                disabled={uploadingImage || aiAnalyzing || submitting}
                onClick={analyzeImagesWithAi}
                className="inline-flex items-center rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {aiAnalyzing
                  ? 'Analyzing & auto-fill with AI ~ loading...'
                  : 'Analyze & auto-fill with AI'}
              </button>
            </div>
            {/* Global errors / debug / AI warning */}
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
              onClick={() => window.location.reload()}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || uploadingImage}
              className="inline-flex items-center rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Saving...' : 'Create product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProduct;
