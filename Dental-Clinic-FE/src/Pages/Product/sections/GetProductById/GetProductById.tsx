import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom"; 
import useGetProductById from "./useGetProductById.ts";
import { getProductImageSrc } from "../../../../huybro_api/productApi.ts";
import { addProductToCart } from "../../../../utils/cartSession";
import { formatMoney } from "../../../../utils/format.ts";
import { ArrowRight } from "lucide-react";

export default function GetProductById() {
  const { id } = useParams();
  const navigate = useNavigate(); // Hook để chuyển trang khi click sản phẩm gợi ý
  const { setIdInput, detail, loading, msg, errorMsg, handleLoad } = useGetProductById();

  const images = useMemo(
    () => (detail?.image ?? []).slice().sort((a, b) => a.imageOrder - b.imageOrder),
    [detail?.image]
  );
  const [imgIdx, setImgIdx] = useState(0);

  // tab state: 0 = Description, 1 = Purchase History
  const [activeTab, setActiveTab] = useState<0 | 1>(0);

  useEffect(() => {
    if (id) {
      setIdInput(String(id));
      handleLoad(String(id));
      window.scrollTo(0, 0); // Scroll lên đầu khi đổi sản phẩm
    }
  }, [id]);

  // Logic tính giá gốc để hiển thị gạch ngang (nếu đang giảm giá)
  const originalPrice = useMemo(() => {
    if (detail?.discountPercentage && detail.discountPercentage > 0) {
      return detail.defaultRetailPrice * (100 / (100 - detail.discountPercentage));
    }
    return null;
  }, [detail]);

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        {msg && <div>{msg}</div>}
        {loading && <div className="text-center py-10">Loading detail...</div>}
        {errorMsg && <div style={{ color: "red" }}>Error: {errorMsg}</div>}

        {!loading && !errorMsg && detail && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Thumbnails */}
              <aside className="lg:col-span-2">
                <div className="flex lg:flex-col gap-3 overflow-auto lg:overflow-visible">
                  {images.map((img, i) => (
                    <button
                      key={img.imageId}
                      onClick={() => setImgIdx(i)}
                      className={`aspect-square w-16 lg:w-full flex-shrink-0 rounded-xl overflow-hidden border ${
                        imgIdx === i ? "border-black/40" : "border-black/10"
                      }`}
                    >
                      <img
                        src={getProductImageSrc(img.imageUrl)}
                        alt={`${detail.productName} thumb ${img.imageOrder}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </aside>

              {/* Ảnh chính 1:1 – tràn khung */}
              <div className="lg:col-span-6">
                <div className="rounded-2xl overflow-hidden border border-black/10 relative">
                  <div className="relative aspect-square w-full bg-gray-50">
                    {images[imgIdx] ? (
                      <img
                        src={getProductImageSrc(images[imgIdx].imageUrl)}
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
                {/* Giá hiện tại */}
                <span className="text-4xl font-bold text-black">
                  {formatMoney(detail.defaultRetailPrice, detail.currency)}
                </span>

                {/* Chỉ hiển thị Giá Gốc & Tag % khi discount > 0 */}
                {originalPrice && detail.discountPercentage && detail.discountPercentage > 0 && (
                   <>
                     {/* Giá gốc gạch ngang: Màu xám trung tính */}
                     <span className="text-lg text-gray-400 line-through decoration-gray-400">
                       {formatMoney(originalPrice, detail.currency)}
                     </span>
                     
                     {/* Tag giảm giá: Chữ Xanh Đen Đậm (blue-900) - Nền Xanh Nhạt (blue-50) */}
                     <span className="px-2 py-0.5 text-xs font-bold text-blue-900 bg-blue-50 border border-blue-100 rounded">
                        -{detail.discountPercentage}%
                     </span>
                   </>
                )}
              </div>

                {/* Số lượt bán & Tồn kho */}
              <div className="mt-3 text-sm text-gray-600 flex items-center gap-3">
                <div>
                   Sold: <span className="font-medium text-black">{detail.soldCount}</span>
                </div>
                <span className="text-gray-300">|</span>
                
                {/* Sửa: Bỏ text-green-600, dùng text-black mặc định, chỉ đỏ khi <= 0 */}
                <div className={detail.unit > 0 ? "text-gray-900" : "text-red-600"}>
                   Stock: <span className="font-medium">{detail.unit}</span> available
                </div>
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
                        : ["Standard"]
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
                    disabled={!detail.isActive || detail.unit <= 0}
                    className={`px-4 py-2 text-sm font-semibold rounded-full text-white transition-transform duration-150 ease-out active:scale-[0.98] focus:outline-none w-full md:w-auto
                        ${detail.unit > 0 
                            ? "bg-gradient-to-r from-[#AACCFF] via-[#6699FF] to-[#3366FF]" 
                            : "bg-gray-300 cursor-not-allowed"
                        }
                    `}
                    onClick={() => {
                      if (detail && detail.unit > 0) {
                        addProductToCart(detail, 1);
                      }
                    }}
                  >
                    {detail.unit > 0 ? "Add to cart" : "Out of Stock"}
                  </button>
                </div>
              </div>

              {/* Tabs: Description trước, Purchase History sau */}
              <div className="lg:col-span-12 mt-4">
                <div className="flex gap-6 border-b border-black/10">
                  <button
                    onClick={() => setActiveTab(0)}
                    className={`py-3 px-1 font-medium ${
                      activeTab === 0 ? "border-b-2 border-black" : "text-gray-500"
                    }`}
                  >
                    Description
                  </button>
                  <button
                    onClick={() => setActiveTab(1)}
                    className={`py-3 px-1 font-medium ${
                      activeTab === 1 ? "border-b-2 border-black" : "text-gray-500"
                    }`}
                  >
                    Purchase History ({detail.recentPurchases?.length || 0})
                  </button>
                </div>

                {activeTab === 0 ? (
                  <pre className="mt-4 whitespace-pre-wrap text-sm text-gray-700 font-sans">
                    {detail.productDescription}
                  </pre>
                ) : (
                  <div className="mt-4 space-y-4 text-sm text-gray-700">
                    {/* [NEW] Dữ liệu thật từ recentPurchases */}
                    {detail.recentPurchases && detail.recentPurchases.length > 0 ? (
                        detail.recentPurchases.map((r, idx) => (
                            <div
                              key={idx}
                              className="p-4 border border-black/10 rounded-xl bg-gray-50 flex justify-between items-center"
                            >
                              <div>
                                  <span className="font-medium text-black">{r.customerName}</span> purchased{" "}
                                  <span className="font-medium text-black">{r.quantity}</span> item(s).
                              </div>
                              <div className="text-right">
                                  <div className="font-semibold">{formatMoney(r.price, detail.currency)}</div>
                                  <div className="text-xs text-gray-400">{new Date(r.purchaseDate).toLocaleDateString()}</div>
                              </div>
                            </div>
                          ))
                    ) : (
                        <div className="text-gray-400 italic py-4">No recent purchases recorded.</div>
                    )}
                  </div>
                )}
              </div>
            </div>

           {/* [NEW] Related Products Section - Tech Blue Style */}
            {detail.relatedProducts && detail.relatedProducts.length > 0 && (
                <div className="mt-16 pt-8 border-t border-black/5">
                    <h3 className="text-xl font-sans mb-6 tracking-tight text-gray-900">You might also like</h3>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {detail.relatedProducts.map((rel) => (
                            <div 
                                key={rel.productId} 
                                className="group cursor-pointer relative"
                                onClick={() => navigate(`../${rel.productId}`)}
                            >
                                {/* Border Container: Hover -> Blue Border & Blue Shadow */}
                                <div className="rounded-xl border border-gray-200 bg-white p-2 transition-all duration-300 group-hover:border-blue-600 group-hover:shadow-lg group-hover:shadow-blue-50">
                                    {/* Image */}
                                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 relative mb-3">
                                        {rel.image && rel.image.length > 0 ? (
                                            <img 
                                                src={getProductImageSrc(rel.image[0].imageUrl)} 
                                                alt={rel.productName} 
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full grid place-items-center text-gray-300 text-xs">No Img</div>
                                        )}
                                    </div>

                                    {/* Content inside card */}
                                    <div>
                                        {/* Tên sản phẩm chuyển xanh khi hover */}
                                        <h4 className="font-medium text-sm text-gray-900 truncate pr-2 transition-colors group-hover:text-blue-600">
                                            {rel.productName}
                                        </h4>
                                        
                                        <div className="flex justify-between items-center mt-1 h-6">
                                            <p className="text-sm font-bold text-gray-900">
                                                {formatMoney(rel.defaultRetailPrice, rel.currency)}
                                            </p>
                                            
                                            {/* Lucide Arrow Icon: Blue & Slide Effect */}
                                            <ArrowRight 
                                                size={18} 
                                                className="text-blue-600 opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" 
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}