import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import useGetProductById from "./useGetProductById";

export default function GetProductById() {
  const { id } = useParams();
  const { setIdInput, detail, loading, msg, errorMsg, handleLoad } = useGetProductById();

  const images = useMemo(
    () => (detail?.image ?? []).slice().sort((a, b) => a.imageOrder - b.imageOrder),
    [detail?.image]
  );
  const [imgIdx, setImgIdx] = useState(0);

  // tab state: 0 = Description, 1 = Reviews
  const [activeTab, setActiveTab] = useState<0 | 1>(0);

  useEffect(() => {
    if (id) {
      setIdInput(String(id));
      handleLoad(String(id)); // truyền id URL
    }
  }, [id]);

  const soldCount = 324;

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        {msg && <div>{msg}</div>}
        {loading && <div>Loading detail...</div>}
        {errorMsg && <div style={{ color: "red" }}>Error: {errorMsg}</div>}

        {!loading && !errorMsg && detail && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Thumbnails */}
            <aside className="lg:col-span-2">
              <div className="flex lg:flex-col gap-3">
                {images.map((img, i) => (
                  <button
                    key={img.imageId}
                    onClick={() => setImgIdx(i)}
                    className={`aspect-square w-16 lg:w-full rounded-xl overflow-hidden border ${imgIdx === i ? "border-black/40" : "border-black/10"
                      }`}
                  >
                    <img
                      src={`${import.meta.env.VITE_API_URL}${img.imageUrl}`}
                      alt={`${detail.productName} thumb ${img.imageOrder}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </aside>

            {/* Ảnh chính 1:1 – tràn khung */}
            <div className="lg:col-span-6">
              <div className="rounded-2xl overflow-hidden border border-black/10">
                <div className="relative aspect-square w-full bg-gray-50">
                  {images[imgIdx] ? (
                    <img
                      src={`${import.meta.env.VITE_API_URL}${images[imgIdx].imageUrl}`}
                      alt={`${detail.productName} ${images[imgIdx].imageOrder}`}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center text-gray-400">
                      No image
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Thông tin sản phẩm */}
            <div className="lg:col-span-4">
              <h1 className="text-3xl md:text-4xl font-semibold leading-tight">
                {detail.productName}
              </h1>

              {/* Giá */}
              <div className="mt-6 flex items-baseline gap-3">
                <span className="text-4xl font-bold">
                  {detail.defaultRetailPrice} {detail.currency}
                </span>
                <span className="text-2xl line-through text-gray-400">$99</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">Save 50% right now</p>

              {/* Số lượt bán */}
              <div className="mt-3 text-sm text-gray-600">
                Sold: <span className="font-medium text-black">{soldCount}</span> units
              </div>

              {/* Brands & Types */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Brands</div>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1.5 rounded-xl border border-black/10 text-sm bg-white">
                      {detail.brand || "Unknown"}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Types</div>
                  <div className="flex flex-wrap gap-2">
                    {(detail.typeNames?.length
                      ? detail.typeNames
                      : ["Full cotton", "Slim fit", "QC by JC"]
                    ).map((t) => (
                      <span
                        key={t}
                        className="px-3 py-1.5 rounded-xl border border-black/10 text-sm bg-white"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-8">
                <button
                  className="px-4 py-2 text-sm font-semibold rounded-full bg-gradient-to-r from-[#AACCFF] via-[#6699FF] to-[#3366FF] text-white border border-[#6699FF]/40 transition-transform duration-150 ease-out active:scale-[0.98] focus:outline-none"
                >
                  Add to cart
                </button>
              </div>

            </div>

            {/* Tabs: Description trước, Purchase History sau */}
            <div className="lg:col-span-12 mt-4">
              <div className="flex gap-6 border-b border-black/10">
                <button
                  onClick={() => setActiveTab(0)}
                  className={`py-3 px-1 font-medium ${activeTab === 0 ? "border-b-2 border-black" : "text-gray-500"
                    }`}
                >
                  Description
                </button>
                <button
                  onClick={() => setActiveTab(1)}
                  className={`py-3 px-1 font-medium ${activeTab === 1 ? "border-b-2 border-black" : "text-gray-500"
                    }`}
                >
                  Purchase History
                </button>
              </div>

              {activeTab === 0 ? (
                <pre className="mt-4 whitespace-pre-wrap text-sm text-gray-700">
                  {detail.productDescription}
                </pre>
              ) : (
                <div className="mt-4 space-y-4 text-sm text-gray-700">
                  {[
                    { user: "Alice Nguyen", price: "$49" },
                    { user: "David Tran", price: "$49" },
                    { user: "Linh Pham", price: "$99" },
                  ].map((r, idx) => (
                    <div
                      key={idx}
                      className="p-4 border border-black/10 rounded-xl bg-gray-50"
                    >
                      <span className="font-medium text-black">{r.user}</span> purchased this product for{" "}
                      <span className="font-semibold">{r.price}</span>.
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </section>
  );
}
