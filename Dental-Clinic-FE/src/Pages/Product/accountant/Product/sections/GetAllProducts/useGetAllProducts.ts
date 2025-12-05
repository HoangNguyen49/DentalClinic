import { useEffect, useState } from "react";
import type {
  Product,
  PageResponse,
  AccountantProductPageParams,
} from "../../../../../../huybro_api/productApi";
import { fetchAccountantProductsPage } from "../../../../../../huybro_api/productApi";

export type UseGetAllProductsResult = {
  products: Product[];
  loading: boolean;
  error: string | null;

  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
  setPage: (v: number) => void;
  setSize: (v: number) => void;

  keyword: string;
  setKeyword: (v: string) => void;

  brandFilters: string[];
  setBrandFilters: (v: string[]) => void;

  typeFilters: string[];
  setTypeFilters: (v: string[]) => void;

  minPrice?: number;
  setMinPrice: (v: number | undefined) => void;

  maxPrice?: number;
  setMaxPrice: (v: number | undefined) => void;

  active: boolean | null;
  setActive: (v: boolean | null) => void;

  // NEW: options cho dropdown Brands & Types
  brandsOptions: string[]; // NEW
  typeOptions: string[];   // NEW
};

export function useGetAllProducts(): UseGetAllProductsResult {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(8);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [keyword, setKeyword] = useState("");
  const [brandFilters, setBrandFilters] = useState<string[]>([]);
  const [typeFilters, setTypeFilters] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [active, setActive] = useState<boolean | null>(null);

  const [brandsOptions, setBrandsOptions] = useState<string[]>([]); // NEW
  const [typeOptions, setTypeOptions] = useState<string[]>([]);     // NEW

  useEffect(() => {
    const params: AccountantProductPageParams = {
      page,
      size,
      keyword: keyword || undefined,
      brand: brandFilters.length ? brandFilters : undefined,
      types: typeFilters.length ? typeFilters : undefined,
      minPrice,
      maxPrice,
      active: active === null ? undefined : active,
    };

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchAccountantProductsPage(params)
      .then((res: PageResponse<Product>) => {
        if (cancelled) return;

        const list = res.content ?? [];
        setProducts(list);
        setTotalPages(res.totalPages ?? 0);
        setTotalElements(res.totalElements ?? 0);
      })
      .catch((err: unknown) => {
        if (cancelled) return;

        let message = "Cannot load products";
        const anyErr = err as {
          response?: { data?: any; status?: number };
          message?: string;
        };

        if (anyErr.response?.data) {
          const d = anyErr.response.data as { message?: string; error?: string };
          if (d.message) message = d.message;
          else if (d.error) message = d.error;
        } else if (anyErr.message) {
          message = anyErr.message;
        }

        setError(message);
        setProducts([]);
        setTotalPages(0);
        setTotalElements(0);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, size, keyword, brandFilters, typeFilters, minPrice, maxPrice, active]);

  // NEW: lấy full danh sách brand/type cho dropdown
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetchAccountantProductsPage({
          page: 0,
          size: 1000, // đủ lớn để gom brand/type; cần thì bạn tự chỉnh
        });

        if (cancelled) return;

        const brandSet = new Set<string>();
        const typeSet = new Set<string>();

        for (const p of res.content ?? []) {
          if (p.brand) brandSet.add(p.brand);
          for (const t of p.typeNames ?? []) {
            if (t) typeSet.add(t);
          }
        }

        setBrandsOptions(
          Array.from(brandSet).sort((a, b) => a.localeCompare(b))
        );
        setTypeOptions(
          Array.from(typeSet).sort((a, b) => a.localeCompare(b))
        );
      } catch {
        if (!cancelled) {
          setBrandsOptions([]);
          setTypeOptions([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []); // NEW

  return {
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
    brandsOptions, // NEW
    typeOptions,   // NEW
  };
}
