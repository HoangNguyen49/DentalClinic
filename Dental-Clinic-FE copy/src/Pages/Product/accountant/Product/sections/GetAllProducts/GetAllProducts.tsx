import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye, MoreVertical, Pencil } from "lucide-react";

import { useGetAllProducts } from "./useGetAllProducts";
import { getProductImageSrc } from "../../../../../../huybro_api/productApi";
import { formatVNDateTime } from "../../../../../../utils/format";

import ProductToolbar from "../../widgets/ProductToolbar";
import ProductPagination from "../../widgets/ProductPagination";

function GetAllProduct() {
  const navigate = useNavigate();
  const {
    products,
    loading,
    error,
    page,
    size,
    totalPages,
    totalElements,
    setPage,
    setSize,
    keyword,
    setKeyword,
    brandFilters,
    setBrandFilters,
    typeFilters,
    setTypeFilters,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    active,
    setActive,
    brandsOptions,
    typeOptions,
  } = useGetAllProducts();


  const [searchInput, setSearchInput] = useState(keyword ?? "");
  const [searchParams, setSearchParams] = useSearchParams();
  const [initializedFromUrl, setInitializedFromUrl] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  useEffect(() => {
    if (initializedFromUrl) return;

    const urlKeyword = searchParams.get("keyword") ?? "";
    const urlPage = Number(searchParams.get("page") ?? "0");
    const urlSize = Number(searchParams.get("size") ?? "8");

    const urlBrands = searchParams.getAll("brand");
    const urlTypes = searchParams.getAll("type");

    const urlMinPriceRaw = searchParams.get("minPrice");
    const urlMaxPriceRaw = searchParams.get("maxPrice");
    const urlActiveRaw = searchParams.get("active");

    const urlMinPrice =
      urlMinPriceRaw != null && urlMinPriceRaw !== ""
        ? Number(urlMinPriceRaw)
        : undefined;
    const urlMaxPrice =
      urlMaxPriceRaw != null && urlMaxPriceRaw !== ""
        ? Number(urlMaxPriceRaw)
        : undefined;

    const urlActive =
      urlActiveRaw === "true"
        ? true
        : urlActiveRaw === "false"
          ? false
          : null;

    if (!Number.isNaN(urlPage)) setPage(urlPage);
    if (!Number.isNaN(urlSize)) setSize(urlSize);

    setKeyword(urlKeyword);
    setSearchInput(urlKeyword);

    if (urlBrands.length) setBrandFilters(urlBrands);
    if (urlTypes.length) setTypeFilters(urlTypes);

    setMinPrice(
      urlMinPrice !== undefined && !Number.isNaN(urlMinPrice)
        ? urlMinPrice
        : undefined
    );
    setMaxPrice(
      urlMaxPrice !== undefined && !Number.isNaN(urlMaxPrice)
        ? urlMaxPrice
        : undefined
    );
    setActive(urlActive);

    setInitializedFromUrl(true);
  }, [
    initializedFromUrl,
    searchParams,
    setActive,
    setBrandFilters,
    setKeyword,
    setMaxPrice,
    setMinPrice,
    setPage,
    setSize,
    setTypeFilters,
  ]);

  useEffect(() => {
    if (!initializedFromUrl) return;

    const sp = new URLSearchParams();

    if (keyword && keyword.trim() !== "") {
      sp.set("keyword", keyword.trim());
    }

    if (brandFilters.length) {
      brandFilters.forEach((b) => sp.append("brand", b));
    }

    if (typeFilters.length) {
      typeFilters.forEach((t) => sp.append("type", t));
    }

    if (minPrice !== undefined && !Number.isNaN(minPrice)) {
      sp.set("minPrice", String(minPrice));
    }

    if (maxPrice !== undefined && !Number.isNaN(maxPrice)) {
      sp.set("maxPrice", String(maxPrice));
    }

    if (active !== null) {
      sp.set("active", active ? "true" : "false");
    }

    sp.set("page", String(page));
    sp.set("size", String(size));

    setSearchParams(sp);
  }, [
    initializedFromUrl,
    page,
    size,
    keyword,
    brandFilters,
    typeFilters,
    minPrice,
    maxPrice,
    active,
    setSearchParams,
  ]);

  const handleSearch = () => {
    setKeyword(searchInput.trim());
    setPage(0);
  };

  const handleResetFilters = () => {
    setKeyword("");
    setSearchInput("");
    setBrandFilters([]);
    setTypeFilters([]);
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setActive(null);
    setPage(0);
  };

  const handleFilterChange = () => {
    setPage(0);
  };


  const handleMinPriceChange = (value: string) => {
    const num = value === "" ? undefined : Number(value);
    setMinPrice(Number.isNaN(num as number) ? undefined : num);
    handleFilterChange();
  };

  const handleMaxPriceChange = (value: string) => {
    const num = value === "" ? undefined : Number(value);
    setMaxPrice(Number.isNaN(num as number) ? undefined : num);
    handleFilterChange();
  };

  const handleStatusChange = (value: string) => {
    const newValue = value === "" ? null : value === "true";
    setActive(newValue);
    handleFilterChange();
  };

  return (
    <div className="p-6 min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto space-y-6">
        <ProductToolbar
          totalElements={totalElements || 0}
          onAddProduct={() => navigate("create")}
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          onSearch={handleSearch}
          minPrice={minPrice}
          maxPrice={maxPrice}
          onMinPriceChange={handleMinPriceChange}
          onMaxPriceChange={handleMaxPriceChange}
          active={active}
          onActiveChange={handleStatusChange}
          onClearFilters={handleResetFilters}
          brandsOptions={brandsOptions}
          brandFilters={brandFilters}
          setBrandFilters={(v) => {
            setBrandFilters(v);
            handleFilterChange();
          }}
          typeOptions={typeOptions}
          typeFilters={typeFilters}
          setTypeFilters={(v) => {
            setTypeFilters(v);
            handleFilterChange();
          }}
        />

        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          {error && (
            <div className="px-6 pt-4 text-sm text-red-600">
              {error}
            </div>
          )}

          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : products.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No product found
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Brand
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created at
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last updated
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => {
                      const mainImage = product.image?.[0];
                      const isDropdownOpen =
                        openDropdown === product.productId;

                      return (
                        <tr
                          key={product.productId}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                                {mainImage?.imageUrl ? (
                                  <img
                                    src={getProductImageSrc(mainImage.imageUrl)}
                                    alt={product.productName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-gray-500 text-xs font-medium">
                                    {product.productName
                                      .charAt(0)
                                      .toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div className="text-sm">
                                <div className="font-medium text-gray-900">
                                  {product.productName}
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                  SKU: {product.sku}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                            {product.brand || "-"}
                          </td>

                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                            {product.defaultRetailPrice.toLocaleString("en-US")}{" "}
                            {product.currency}
                          </td>

                          <td className="px-4 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${product.isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                                }`}
                            >
                              {product.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>

                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                            {product.createdAt
                              ? formatVNDateTime(product.createdAt)
                              : "-"}
                          </td>

                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                            {product.updatedAt &&
                              product.createdAt &&
                              product.updatedAt !== product.createdAt
                              ? formatVNDateTime(product.updatedAt)
                              : "-"}
                          </td>

                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="relative">
                              <button
                                onClick={() =>
                                  setOpenDropdown(
                                    isDropdownOpen
                                      ? null
                                      : product.productId
                                  )
                                }
                                className="p-1 rounded hover:bg-gray-100 transition-colors"
                                title="More actions"
                              >
                                <MoreVertical className="w-4 h-4 text-gray-600" />
                              </button>

                              {isDropdownOpen && (
                                <>
                                  <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setOpenDropdown(null)}
                                  />
                                  <div className="absolute right-0 mt-1 w-30 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1">
                                    <button
                                      onClick={() => {
                                        navigate(
                                          `/accountant/products/${product.productId}`
                                        );
                                        setOpenDropdown(null);
                                      }}
                                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                    >
                                      <Eye className="w-4 h-4" />
                                      View
                                    </button>
                                    <button
                                      onClick={() => {
                                        navigate(
                                          `update/${product.productId}`
                                        );
                                        setOpenDropdown(null);
                                      }}
                                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                    >
                                      <Pencil className="w-4 h-4" />
                                      Update
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <ProductPagination
                page={page}
                size={size}
                totalPages={totalPages}
                totalElements={totalElements}
                onPageChange={setPage}
                onSizeChange={setSize}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default GetAllProduct;
