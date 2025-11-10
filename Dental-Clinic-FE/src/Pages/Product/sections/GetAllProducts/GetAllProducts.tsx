import useGetAllProducts from "../GetAllProducts/useGetAllProducts";
import CardProduct from "../cardProduct";
import ToolbarProduct from "../toolbarProduct";
import PaginationProduct from "../paginationProduct";

export default function GetAllProducts() {
  const {
    list,
    loading,
    errorMsg,
    q,
    setQ,
    sort,
    setSort,
    page,
    setPage,
    totalPages,
    brandsOptions,
    brandFilters,
    setBrandFilters,
    typeFilters,        // <-- thêm
    setTypeFilters,     // <-- thêm
    typeOptions,       // <-- thêm
  } = useGetAllProducts(8);

  const glassInner = "rounded-full bg-white/10 backdrop-blur-xl border border-white/20";

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto space-y-6">
        {loading && <div className="text-center">Loading list...</div>}
        {errorMsg && <div className="text-center" style={{ color: "red" }}>Error: {errorMsg}</div>}
        {!loading && !errorMsg && (
          <>
            <ToolbarProduct
              q={q}
              setQ={setQ}
              sort={sort}
              setSort={setSort}
              glassInner={glassInner}
              brandsOptions={brandsOptions}
              brandFilters={brandFilters}
              setBrandFilters={setBrandFilters}
              typeFilters={typeFilters}        
              setTypeFilters={setTypeFilters}  
              typeOptions={typeOptions}      
            />


            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {list.map((p) => (
                <CardProduct key={p.productId} product={p} />
              ))}
            </div>

            <PaginationProduct page={page} setPage={setPage} totalPages={totalPages} glassInner={glassInner} />
          </>
        )}
      </div>
    </section>
  );
}
