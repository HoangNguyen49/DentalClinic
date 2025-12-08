import { useEffect, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTranslation } from "react-i18next";
import {
  Package,
  TrendingUp,
  AlertTriangle,
  XCircle,
  ShoppingCart,
  Building2,
  Loader2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080";

// Định nghĩa interface thống kê kho
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

// Hàm định dạng số thành tiền VNĐ
const formatMoney = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

export default function AdminInventoryManagement() {
  const { t } = useTranslation("admin");
  const [statistics, setStatistics] = useState<ProductStatistics | null>(null);
  const [loading, setLoading] = useState(false);

  const accessToken = localStorage.getItem("accessToken");

  // Lấy dữ liệu thống kê
  const fetchStatistics = async () => {
    if (!accessToken) {
      toast.error(t("inventory.messages.noAccessToken", "Missing access token"));
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get<ProductStatistics>(
        `${apiBase}/api/admin/inventory/statistics`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      setStatistics(response.data);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        t("inventory.messages.loadFailed", "Unable to load inventory statistics");
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  // Hiển thị loading
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Không có dữ liệu
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
            "Thống kê tổng quan về kho sản phẩm, số lượng tồn kho và doanh số bán hàng theo từng cơ sở."
          )}
        </p>
      </div>

      {/* Thẻ thống kê chính */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {t("inventory.metrics.totalProducts", "Tổng sản phẩm")}
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {statistics.totalProducts}
              </p>
            </div>
            <Package className="w-10 h-10 text-blue-600" />
          </div>
          <div className="mt-4 text-xs text-gray-500">
            <span className="text-green-600">{statistics.activeProducts}</span> hoạt động /{" "}
            <span className="text-gray-500">{statistics.inactiveProducts}</span> ngừng
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {t("inventory.metrics.totalStock", "Tổng tồn kho")}
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {statistics.totalStockQuantity.toLocaleString()}
              </p>
            </div>
            <TrendingUp className="w-10 h-10 text-green-600" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {t("inventory.metrics.lowStock", "Sắp hết")}
              </p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {statistics.lowStockProductsCount}
              </p>
            </div>
            <AlertTriangle className="w-10 h-10 text-orange-600" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {t("inventory.metrics.outOfStock", "Hết hàng")}
              </p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {statistics.outOfStockProductsCount}
              </p>
            </div>
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
        </div>
      </div>

      {/* Doanh số theo cơ sở */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Biểu đồ số lượng bán theo cơ sở */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              {t("inventory.sections.salesByClinic", "Doanh số theo cơ sở")}
            </h2>
          </div>
          <div className="p-6">
            {statistics.salesByClinic.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                {t("inventory.messages.noSalesData", "Chưa có dữ liệu bán hàng")}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statistics.salesByClinic}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="clinicName"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => [
                      value.toLocaleString(),
                      t("inventory.table.itemsSold", "Số lượng đã bán"),
                    ]}
                  />
                  <Legend />
                  <Bar
                    dataKey="totalItemsSold"
                    fill="#3b82f6"
                    name={t("inventory.table.itemsSold", "Số lượng đã bán")}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Biểu đồ doanh thu theo cơ sở */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              {t("inventory.sections.revenueByClinic", "Doanh thu theo cơ sở")}
            </h2>
          </div>
          <div className="p-6">
            {statistics.salesByClinic.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                {t("inventory.messages.noSalesData", "Chưa có dữ liệu bán hàng")}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statistics.salesByClinic.map((c) => ({
                      name: c.clinicName,
                      value: c.totalRevenue,
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statistics.salesByClinic.map((_, index) => {
                      const colors = [
                        "#3b82f6",
                        "#10b981",
                        "#f59e0b",
                        "#ef4444",
                        "#8b5cf6",
                        "#ec4899",
                      ];
                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={colors[index % colors.length]}
                        />
                      );
                    })}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      const total = statistics.salesByClinic.reduce(
                        (sum, c) => sum + c.totalRevenue,
                        0
                      );
                      const percent = ((value / total) * 100).toFixed(1);
                      return [
                        `${formatMoney(value)} (${percent}%)`,
                        name,
                      ];
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Bảng chi tiết doanh số theo cơ sở */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            {t("inventory.sections.salesByClinicTable", "Chi tiết doanh số theo cơ sở")}
          </h2>
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

      {/* Top sản phẩm bán chạy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Biểu đồ top sản phẩm bán chạy theo số lượng */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              {t("inventory.sections.topProducts", "Top sản phẩm bán chạy")}
            </h2>
          </div>
          <div className="p-6">
            {statistics.topSellingProducts.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                {t("inventory.messages.noTopProducts", "Chưa có sản phẩm bán chạy")}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={statistics.topSellingProducts.map((p) => ({
                    name: p.productName.length > 20
                      ? p.productName.substring(0, 20) + "..."
                      : p.productName,
                    quantity: p.totalQuantitySold,
                    revenue: p.totalRevenue,
                  }))}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={150}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      if (name === "quantity") {
                        return [value.toLocaleString(), t("inventory.table.quantitySold", "Đã bán")];
                      }
                      return [formatMoney(value), t("inventory.table.revenue", "Doanh thu")];
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="quantity"
                    fill="#3b82f6"
                    name={t("inventory.table.quantitySold", "Số lượng đã bán")}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Biểu đồ top sản phẩm bán chạy theo doanh thu */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              {t("inventory.sections.topProductsRevenue", "Doanh thu top sản phẩm")}
            </h2>
          </div>
          <div className="p-6">
            {statistics.topSellingProducts.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                {t("inventory.messages.noTopProducts", "Chưa có sản phẩm bán chạy")}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={statistics.topSellingProducts.map((p) => ({
                    name: p.productName.length > 15
                      ? p.productName.substring(0, 15) + "..."
                      : p.productName,
                    revenue: p.totalRevenue,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    interval={0}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => formatMoney(value)}
                  />
                  <Legend />
                  <Bar
                    dataKey="revenue"
                    fill="#10b981"
                    name={t("inventory.table.revenue", "Doanh thu")}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Bảng top sản phẩm bán chạy */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            {t("inventory.sections.topProductsTable", "Chi tiết top sản phẩm bán chạy")}
          </h2>
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

      {/* Sản phẩm sắp hết kho */}
      {statistics.lowStockProducts.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              {t("inventory.sections.lowStock", "Sản phẩm sắp hết")}
            </h2>
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
