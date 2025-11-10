import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  fetchAllProducts,
  fetchProductsPage,
  type Product,
  type ProductPageParams,
} from "../../../../huybro_api/productApi";

export type SortKey = "name-asc" | "name-desc" | "price-asc" | "price-desc";

function toSortParams(k: SortKey): Pick<ProductPageParams, "sortBy" | "order"> {
  if (k === "name-asc") return { sortBy: "name", order: "asc" };
  if (k === "name-desc") return { sortBy: "name", order: "desc" };
  if (k === "price-asc") return { sortBy: "price", order: "asc" };
  return { sortBy: "price", order: "desc" };
}

export default function useGetAllProducts(defaultPageSize = 8) {
  const ANIM_MS = 700;

  const [sp, setSp] = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const [q, setQ] = useState("");
  const [brandFilters, setBrandFilters] = useState<string[]>([]);
  const [typeFilters, setTypeFilters] = useState<string[]>([]);

  const [sortChain, setSortChain] = useState<SortKey[]>(["name-asc"]);
  const [sortUi, setSortUi] = useState<SortKey>("name-asc");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(defaultPageSize);

  const [list, setList] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [brandsOptions, setBrandsOptions] = useState<string[]>([]);
  const [typeOptions, setTypeOptions] = useState<string[]>([]);

  const suppressUntilRef = useRef(0);

  // ----------------------------
  // 1) ĐỌC QUERY -> STATE (chạy 1 lần)
  // ----------------------------
  useEffect(() => {
    const keyword = sp.get("keyword") ?? "";
    const brands = sp.getAll("brand");
    const types = sp.getAll("type");
    const sortBy = sp.get("sortBy");
    const order = sp.get("order");
    const pageQ = parseInt(sp.get("page") ?? "0", 10);

    if (keyword) setQ(keyword);
    if (brands.length) setBrandFilters(brands);
    if (types.length) setTypeFilters(types);

    if (sortBy === "price" || sortBy === "name") {
      const s: SortKey =
        sortBy === "price"
          ? (order === "desc" ? "price-desc" : "price-asc")
          : (order === "desc" ? "name-desc" : "name-asc");
      setSortChain([s]);
      setSortUi(s);
    }


    if (!Number.isNaN(pageQ)) setPage(Math.max(1, pageQ + 1));

    // pageSize đang cố định theo defaultPageSize; nếu URL khác thì vẫn render theo default
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // chỉ đọc 1 lần khi mount

  // ----------------------------
  // 2) STATE -> CẬP NHẬT URL (mỗi khi state đổi)
  // ----------------------------
  const lastQsRef = useRef<string>("");
  useEffect(() => {
    const params = new URLSearchParams();

    if (q.trim()) params.set("keyword", q.trim());
    brandFilters.forEach((b) => params.append("brand", b));
    typeFilters.forEach((t) => params.append("type", t));

    const primary = sortChain[0] ?? "name-asc";
    const { sortBy, order } = toSortParams(primary);
    params.set("sortBy", String(sortBy));
    params.set("order", String(order));

    params.set("page", String(Math.max(0, page - 1)));
    params.set("size", String(pageSize));

    const nextQs = params.toString();
    if (nextQs !== lastQsRef.current) {
      lastQsRef.current = nextQs;
      if (sp.toString() !== nextQs) setSp(params, { replace: true });
    }
  }, [q, brandFilters, typeFilters, sortChain, page, pageSize, sp, setSp]);

  // ----------------------------
  // 3) GỌI API PAGE (server-side)
  // ----------------------------
  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      setErrorMsg("");
      try {
        const primary = sortChain[0] ?? "name-asc";
        const { sortBy, order } = toSortParams(primary);
        const res = await fetchProductsPage({
          page: Math.max(0, page - 1),
          size: pageSize,
          sortBy,
          order,
          keyword: q.trim() || undefined,
          brand: brandFilters.length ? brandFilters : undefined,
          types: typeFilters.length ? typeFilters : undefined,
        });
        if (ignore) return;
        setList(Array.isArray(res.content) ? res.content : []);
        setTotal(res.totalElements ?? 0);
        setTotalPages(res.totalPages ?? 1);
      } catch (err: any) {
        if (ignore) return;
        setErrorMsg(err?.message ?? "Request failed");
        setList([]);
        setTotal(0);
        setTotalPages(1);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [q, brandFilters, typeFilters, sortChain, page, pageSize]);

  // ----------------------------
  // 4) Build options (brand, type) 1 lần
  // ----------------------------
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const all = await fetchAllProducts();
        if (ignore) return;
        const brandSet = new Set<string>();
        const typeSet = new Set<string>();
        for (const p of all ?? []) {
          if (p?.brand) brandSet.add(p.brand);
          for (const t of p?.typeNames ?? []) if (t) typeSet.add(t);
        }
        setBrandsOptions(Array.from(brandSet).sort((a, b) => a.localeCompare(b)));
        setTypeOptions(Array.from(typeSet).sort((a, b) => a.localeCompare(b)));
      } catch {
        if (!ignore) {
          setBrandsOptions([]);
          setTypeOptions([]);
        }
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const currentPage = Math.min(page, Math.max(1, totalPages));

  const sort = sortUi;

  const setSort = (v: SortKey) => {
    setSortUi(v); // UI đổi ngay -> overlay/rotate chạy mượt
    suppressUntilRef.current = performance.now() + ANIM_MS;

    // Hoãn thao tác gây thay đổi URL/API cho tới khi animation xong
    setTimeout(() => {
      // React 18: có thể bọc startTransition nếu muốn
      setSortChain((prev) => [v, ...prev.filter((x) => x !== v)]);
      setPage(1);
    }, ANIM_MS);
  };



  return {
    loading,
    errorMsg,

    q,
    setQ: (v: string) => {
      setQ(v);
      setPage(1);
    },

    // Brand filter
    brandsOptions,
    brandFilters,
    setBrandFilters: (v: string[]) => {
      setBrandFilters(v);
      setPage(1);
    },

    // Type filters
    typeFilters,
    setTypeFilters: (v: string[]) => {
      setTypeFilters(v);
      setPage(1);
    },
    typeOptions,

    // Sort + Paging
    sort,
    sortChain,
    setSort,
    page: currentPage,
    setPage,
    pageSize,
    total,
    totalPages,

    list,
  };
}
