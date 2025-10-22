import useGetProductById from './useGetProductById';

export default function GetProductById() {
  const { idInput, setIdInput, detail, loading, msg, errorMsg, handleLoad } = useGetProductById();

  return (
    <section>
      <h2>GET /api/products/{'{id}'}</h2>

      <div>
        <input
          value={idInput}
          onChange={(e) => setIdInput(e.target.value)}
          placeholder="Enter product id"
        />
        <button onClick={handleLoad}>Load</button>
      </div>

      {msg && <div>{msg}</div>}
      {loading && <div>Loading detail...</div>}
      {errorMsg && <div style={{ color: 'red' }}>Error: {errorMsg}</div>}

      {!loading && !errorMsg && detail && (
        <div>
          <h3>{detail.productName}</h3>
          <div>ID: {detail.productId}</div>
          <div>SKU: {detail.sku}</div>
          <div>Brand: {detail.brand}</div>
          <div>Price: {detail.defaultRetailPrice} {detail.currency}</div>
          <div>Tax: {detail.isTaxable ? (detail.taxCode ?? '-') : 'Non-taxable'}</div>
          <div>Status: {detail.isActive ? 'Active' : 'Inactive'}</div>
          <div>Types: {detail.typeNames.join(', ')}</div>
          {detail.imageUrls?.map((u, i) => (
            <img
              key={i}
              src={`${import.meta.env.VITE_API_URL}${u}`}
              alt={`${detail.productName} ${i + 1}`}
              width={160}
              height={120}
            />
          ))}
          <pre>{detail.productDescription}</pre>
        </div>
      )}
    </section>
  );
}
