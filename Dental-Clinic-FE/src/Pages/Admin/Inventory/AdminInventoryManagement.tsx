import { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTranslation } from "react-i18next";
import { adminApi } from "../../../services/admin/adminApi";
import { formatMoney } from "../../../utils/adminUtils";
import { useAdminApi } from "../../../hooks/useAdminApi";
import { fetchProductsPage, type Product } from "../../../huybro_api/productApi";
import { exportToCSV } from "../../../utils/exportUtils";
import {
  Package,
  TrendingUp,
  AlertTriangle,
  XCircle,
  Loader2,
  List,
  Download,
} from "lucide-react";

// Interface thống kê kho
interface ProductStatistics {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  totalStockQuantity: number;
  lowStockProductsCount: number;
  outOfStockProductsCount: number;
  salesByClinic: ClinicSales[];
  topSellingProducts: TopProduct[];
  lowStockProducts: LowStockProduct[];
}

interface ClinicSales {
  clinicId: number;
  clinicName: string;
  totalItemsSold: number;
  totalRevenue: number;
  uniqueProductsSold: number;
  activeDoctorsCount: number;
  activeEmployeesCount: number;
}

interface TopProduct {
  productId: number;
  productName: string;
  sku: string;
  totalQuantitySold: number;
  totalRevenue: number;
  currentStock: number;
}

interface LowStockProduct {
  productId: number;
  productName: string;
  sku: string;
  currentStock: number;
  defaultRetailPrice: number;
}

export default function AdminInventoryManagement() {
  const { t } = useTranslation("admin");
  const [statistics, setStatistics] = useState<ProductStatistics | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsPage, setProductsPage] = useState(0);
  const [productsTotalPages, setProductsTotalPages] = useState(0);
  const [productsTotalElements, setProductsTotalElements] = useState(0);
  const productsPageSize = 20;

  const { loading, execute } = useAdminApi<ProductStatistics>();

  // Hàm lấy dữ liệu thống kê kho
  const fetchStatistics = async () => {
    await execute(
      () => adminApi.inventory.getStatistics(),
      {
        showErrorToast: true,
        errorMessage: t("inventory.messages.loadFailed", "Unable to load inventory statistics"),
        onSuccess: (data) => {
          setStatistics(data);
        },
      }
    );
  };

  // Hàm lấy danh sách sản phẩm với pagination
  const fetchProducts = async (page: number = 0) => {
    setProductsLoading(true);
    try {
      const result = await fetchProductsPage({
        page,
        size: productsPageSize,
        sortBy: "name",
        order: "asc",
      });
      setProducts(result.content || []);
      setProductsTotalPages(result.totalPages || 0);
      setProductsTotalElements(result.totalElements || 0);
    } catch (error: any) {
      console.error("Error fetching products:", error);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
    fetchProducts(0);
  }, []);

  // Export handlers
  const handleExportSalesByClinic = () => {
    if (!statistics || statistics.salesByClinic.length === 0) {
      toast.warning("Không có dữ liệu để export");
      return;
    }
    exportToCSV(
      statistics.salesByClinic,
      {
        clinicName: { key: 'clinicName', label: 'Cơ sở' },
        totalItemsSold: { key: 'totalItemsSold', label: 'Số lượng đã bán' },
        uniqueProductsSold: { key: 'uniqueProductsSold', label: 'Sản phẩm khác nhau' },
        totalRevenue: { key: 'totalRevenue', label: 'Doanh thu (VND)' },
      },
      'doanh-so-theo-co-so'
    );
    toast.success("Đã export dữ liệu thành công!");
  };

  const handleExportTopProducts = () => {
    if (!statistics || statistics.topSellingProducts.length === 0) {
      toast.warning("Không có dữ liệu để export");
      return;
    }
    exportToCSV(
      statistics.topSellingProducts,
      {
        productName: { key: 'productName', label: 'Sản phẩm' },
        sku: { key: 'sku', label: 'SKU' },
        totalQuantitySold: { key: 'totalQuantitySold', label: 'Đã bán' },
        totalRevenue: { key: 'totalRevenue', label: 'Doanh thu (VND)' },
        currentStock: { key: 'currentStock', label: 'Tồn kho' },
      },
      'san-pham-ban-chay'
    );
    toast.success("Đã export dữ liệu thành công!");
  };

  const handleExportLowStock = () => {
    if (!statistics || statistics.lowStockProducts.length === 0) {
      toast.warning("Không có dữ liệu để export");
      return;
    }
    exportToCSV(
      statistics.lowStockProducts,
      {
        productName: { key: 'productName', label: 'Sản phẩm' },
        sku: { key: 'sku', label: 'SKU' },
        currentStock: { key: 'currentStock', label: 'Tồn kho' },
        defaultRetailPrice: { key: 'defaultRetailPrice', label: 'Giá bán (VND)' },
      },
      'san-pham-sap-het'
    );
    toast.success("Đã export dữ liệu thành công!");
  };

  // Hiển thị khi đang loading
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Hiển thị khi không có dữ liệu
  if (!statistics) {
    return (
      <div className="text-center text-gray-500 py-8">
        {t("inventory.messages.noData", "No data available")}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-gray-900">
          {t("pageTitles.inventoryManagement", "Quản lý kho sản phẩm")}
        </h1>
        <p className="text-sm text-gray-600">
          {t(
            "inventory.pageDescription",
            "Thống kê tổng quan về kho sản phẩm, doanh số theo cơ sở, sản phẩm bán chạy và danh sách sản phẩm sắp hết hàng."
          )}
        </p>
      </div>

      {/* Thẻ thống kê nhanh - Improved UI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Products Card */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 shadow-md hover:shadow-lg transition-all hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-blue-900">
                {statistics.totalProducts}
              </p>
            </div>
          </div>
          <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">
            {t("inventory.metrics.totalProducts")}
          </p>
          <div className="mt-3 pt-3 border-t border-blue-200 flex justify-between text-xs">
            <span className="text-green-700 font-semibold">
              ✓ {statistics.activeProducts} {t("inventory.metrics.active")}
            </span>
            <span className="text-slate-500 font-medium">
              ✕ {statistics.inactiveProducts} {t("inventory.metrics.inactive")}
            </span>
          </div>
        </div>

        {/* Total Stock Card */}
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-xl p-6 shadow-md hover:shadow-lg transition-all hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg shadow-md">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-emerald-900">
                {statistics.totalStockQuantity.toLocaleString()}
              </p>
            </div>
          </div>
          <p className="text-sm font-semibold text-emerald-700 uppercase tracking-wide">
            {t("inventory.metrics.totalStock")}
          </p>
        </div>

        {/* Low Stock Card */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-6 shadow-md hover:shadow-lg transition-all hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg shadow-md">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-amber-900">
                {statistics.lowStockProductsCount}
              </p>
            </div>
          </div>
          <p className="text-sm font-semibold text-amber-700 uppercase tracking-wide">
            {t("inventory.metrics.lowStock")}
          </p>
        </div>

        {/* Out of Stock Card */}
        <div className="bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200 rounded-xl p-6 shadow-md hover:shadow-lg transition-all hover:-translate-y-1 ring-2 ring-red-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-red-500 to-rose-600 rounded-lg shadow-md">
              <XCircle className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-red-900">
                {statistics.outOfStockProductsCount}
              </p>
            </div>
          </div>
          <p className="text-sm font-semibold text-red-700 uppercase tracking-wide">
            {t("inventory.metrics.outOfStock")}
          </p>
        </div>
      </div>

      {/* Bảng chi tiết doanh số theo từng cơ sở */}
      <div className="bg-white border-2 border-slate-200 rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden">
        <div className="px-6 py-5 border-b-2 border-slate-200 bg-gradient-to-r from-blue-50 to-cyan-50 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg shadow-md">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            {t("inventory.sections.salesByClinicTable", "Chi tiết doanh số theo cơ sở")}
          </h2>
          <button
            onClick={handleExportSalesByClinic}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-md hover:shadow-lg"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {t("inventory.table.clinic", "Cơ sở")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {t("inventory.table.itemsSold", "Số lượng đã bán")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {t("inventory.table.uniqueProducts", "Sản phẩm khác nhau")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {t("inventory.table.revenue", "Doanh thu")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {statistics.salesByClinic.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    {t("inventory.messages.noSalesData", "Chưa có dữ liệu bán hàng")}
                  </td>
                </tr>
              ) : (
                statistics.salesByClinic.map((clinic) => (
                  <tr key={clinic.clinicId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {clinic.clinicName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {clinic.totalItemsSold.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {clinic.uniqueProductsSold}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {formatMoney(clinic.totalRevenue)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bảng top sản phẩm bán chạy */}
      <div className="bg-white border-2 border-slate-200 rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden">
        <div className="px-6 py-5 border-b-2 border-slate-200 bg-gradient-to-r from-purple-50 to-pink-50 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg shadow-md">
              <Package className="w-5 h-5 text-white" />
            </div>
            {t("inventory.sections.topProductsTable", "Chi tiết top sản phẩm bán chạy")}
          </h2>
          <button
            onClick={handleExportTopProducts}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors shadow-md hover:shadow-lg"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {t("inventory.table.product", "Sản phẩm")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {t("inventory.table.quantitySold", "Đã bán")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {t("inventory.table.revenue", "Doanh thu")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {t("inventory.table.currentStock", "Tồn kho")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {statistics.topSellingProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    {t("inventory.messages.noTopProducts", "Chưa có sản phẩm bán chạy")}
                  </td>
                </tr>
              ) : (
                statistics.topSellingProducts.map((product) => (
                  <tr key={product.productId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {product.productName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{product.sku}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {product.totalQuantitySold.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {formatMoney(product.totalRevenue)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                          product.currentStock === 0
                            ? "bg-red-100 text-red-700"
                            : product.currentStock <= 10
                            ? "bg-orange-100 text-orange-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {product.currentStock}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Danh sách tất cả sản phẩm */}
      <div className="bg-white border-2 border-slate-200 rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden">
        <div className="px-6 py-5 border-b-2 border-slate-200 bg-gradient-to-r from-indigo-50 to-purple-50">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-md">
              <List className="w-5 h-5 text-white" />
            </div>
            {t("inventory.sections.allProducts", "Danh sách tất cả sản phẩm")}
          </h2>
        </div>
        {productsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      {t("inventory.table.product", "Sản phẩm")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      {t("inventory.table.price", "Giá bán")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Thương hiệu
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Trạng thái
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                        {t("inventory.messages.noProducts", "Chưa có sản phẩm nào")}
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => (
                      <tr key={product.productId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {product.productName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{product.sku || "N/A"}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          {formatMoney(product.defaultRetailPrice || 0)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {product.brand || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                              product.isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {product.isActive ? t("inventory.metrics.active") : t("inventory.metrics.inactive")}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {productsTotalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  {t("inventory.pagination.showing")} {productsPage * productsPageSize + 1} - {" "}
                  {Math.min((productsPage + 1) * productsPageSize, productsTotalElements)} {t("inventory.pagination.of")}{" "}
                  {productsTotalElements} {t("inventory.table.product").toLowerCase()}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const newPage = productsPage - 1;
                      if (newPage >= 0) {
                        setProductsPage(newPage);
                        fetchProducts(newPage);
                      }
                    }}
                    disabled={productsPage === 0}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t("inventory.pagination.previous")}
                  </button>
                  <span className="px-4 py-2 text-sm font-medium text-gray-700">
                    {t("inventory.pagination.page")} {productsPage + 1} / {productsTotalPages}
                  </span>
                  <button
                    onClick={() => {
                      const newPage = productsPage + 1;
                      if (newPage < productsTotalPages) {
                        setProductsPage(newPage);
                        fetchProducts(newPage);
                      }
                    }}
                    disabled={productsPage >= productsTotalPages - 1}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t("inventory.pagination.next")}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Hiển thị sản phẩm sắp hết kho */}
      {statistics.lowStockProducts.length > 0 && (
        <div className="bg-white border-2 border-amber-200 rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden ring-2 ring-amber-100">
          <div className="px-6 py-5 border-b-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg shadow-md">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              {t("inventory.sections.lowStock", "Sản phẩm sắp hết")}
            </h2>
            <button
              onClick={handleExportLowStock}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors shadow-md hover:shadow-lg"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    {t("inventory.table.product", "Sản phẩm")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    {t("inventory.table.currentStock", "Tồn kho")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    {t("inventory.table.price", "Giá bán")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {statistics.lowStockProducts.map((product) => (
                  <tr key={product.productId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {product.productName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{product.sku}</td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                          product.currentStock === 0
                            ? "bg-red-100 text-red-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {product.currentStock}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {formatMoney(product.defaultRetailPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
