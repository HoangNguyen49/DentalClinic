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
      <div key={msg} style={{ color: 'red', fontSize: 12 }}>
        {msg}
      </div>
    ));

  const handleTypeSelectChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selected = Array.from(e.currentTarget.options)
        .filter((opt) => opt.selected)
        .map((opt) => opt.value);

      handleTypeNamesChange(selected);
    },
    [handleTypeNamesChange],
  );

  return (
    <div>
      <h1>Create Product (Accountant)</h1>

      {globalErrors.length > 0 && (
        <div style={{ color: 'red' }}>
          <strong>Errors:</strong>
          <ul>
            {globalErrors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {aiWarning && (
        <div style={{ color: 'orange', marginTop: 8 }}>
          {aiWarning}
        </div>
      )}

      {validationDebugReason && (
        <div style={{ color: 'orange', fontSize: 12 }}>
          Debug: {validationDebugReason}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div>
          <label>SKU</label>
          <input
            value={form.sku}
            onChange={(e) => handleChange('sku', e.target.value)}
          />
          {renderFieldErrors('sku')}
        </div>

        <div>
          <label>Product name</label>
          <input
            value={form.productName}
            onChange={(e) => handleChange('productName', e.target.value)}
          />
          {renderFieldErrors('productName')}
        </div>

        <div>
          <label>Brand</label>
          <input
            value={form.brand}
            onChange={(e) => handleChange('brand', e.target.value)}
          />
          {renderFieldErrors('brand')}
        </div>

        <div>
          <label>Description</label>
          <textarea
            value={form.productDescription}
            onChange={(e) =>
              handleChange('productDescription', e.target.value)
            }
          />
          {renderFieldErrors('productDescription')}
        </div>

        <div>
          <label>Unit</label>
          <input
            type="number"
            value={form.unit}
            onChange={(e) => handleChange('unit', Number(e.target.value))}
          />
          {renderFieldErrors('unit')}
        </div>

        <div>
          <label>Default retail price</label>
          <input
            type="number"
            step="0.01"
            value={form.defaultRetailPrice}
            onChange={(e) =>
              handleChange('defaultRetailPrice', Number(e.target.value))
            }
          />
          {renderFieldErrors('defaultRetailPrice')}
        </div>

        <div>
          <label>Currency</label>
          <select
            value={form.currency}
            onChange={(e) => handleChange('currency', e.target.value)}
          >
            <option value="USD">USD</option>
            <option value="VND">VND</option>
          </select>
          {renderFieldErrors('currency')}
        </div>

        <div>
          <label>Is taxable</label>
          <input
            type="checkbox"
            checked={form.isTaxable}
            onChange={(e) => handleChange('isTaxable', e.target.checked)}
          />
          {renderFieldErrors('isTaxable')}
        </div>

        <div>
          <label>Tax code</label>
          <input
            type="number"
            step="0.1"
            value={form.taxCode}
            onChange={(e) => handleChange('taxCode', Number(e.target.value))}
          />
          {renderFieldErrors('taxCode')}
        </div>

        <div>
          <label>Is active</label>
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => handleChange('isActive', e.target.checked)}
          />
          {renderFieldErrors('isActive')}
        </div>

        <div>
          <label>Type names</label>
          <select
            multiple
            size={Math.min(8, Math.max(4, typeOptions.length || 4))}
            value={form.typeNames}
            onChange={handleTypeSelectChange}
          >
            {typeOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          {renderFieldErrors('typeNames')}
        </div>

        <hr />

        <div>
          <h3>Images (exactly 3)</h3>
          {form.image.map((img, idx) => (
            <div key={img.imageOrder}>
              <div>Image order: {img.imageOrder}</div>
              <input
                type="file"
                accept=".jpg,.jpeg,.png"
                onChange={(e) =>
                  handleImageFileChange(
                    idx,
                    e.target.files ? e.target.files[0] : null,
                  )
                }
              />
              {img.imageUrl && (
                <div style={{ fontSize: 12 }}>
                  Saved path: <code>{img.imageUrl}</code>
                </div>
              )}
              {renderFieldErrors(`image[${idx}].imageUrl`)}
            </div>
          ))}
          {renderFieldErrors('image')}

          <div style={{ marginTop: 12 }}>
            <button
              type="button"
              disabled={uploadingImage || aiAnalyzing || submitting}
              onClick={analyzeImagesWithAi}
            >
              {aiAnalyzing
                ? 'Analyzing & auto-fill with AI...'
                : 'Analyze & auto-fill with AI'}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting || uploadingImage}
          style={{ marginTop: 16 }}
        >
          {submitting ? 'Saving...' : 'Create product'}
        </button>
      </form>
    </div>
  );
};

export default CreateProduct;
