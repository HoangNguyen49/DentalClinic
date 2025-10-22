import useGetAllProducts from './useGetAllProducts';

export default function GetAllProducts() {
  const { list, loading, errorMsg } = useGetAllProducts();

  return (
    <section>
      <h2>GET /api/products</h2>

      {loading && <div>Loading list...</div>}
      {errorMsg && <div style={{ color: 'red' }}>Error: {errorMsg}</div>}

      {!loading && !errorMsg && (
        <>
          <div>Total: {list.length}</div>
          {list.map((p) => (
            <div key={p.productId}>
              <h3>{p.productName}</h3>
              <div>SKU: {p.sku}</div>
              <div>Brand: {p.brand}</div>
              <div>Price: {p.defaultRetailPrice} {p.currency}</div>
              <div>Types: {p.typeNames.join(', ')}</div>
              {p.imageUrls?.[0] ? (
                <img
                  src={`${import.meta.env.VITE_API_URL}${p.imageUrls[0]}`}
                  alt={p.productName}
                  width={160}
                  height={120}
                />
              ) : null}
              <pre>{p.productDescription}</pre>
              <hr />
            </div>
          ))}
        </>
      )}
    </section>
  );
}
