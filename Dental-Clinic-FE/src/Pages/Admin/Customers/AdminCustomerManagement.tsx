import { useEffect, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTranslation } from "react-i18next";
import { FaEye, FaBan, FaCheckCircle } from "react-icons/fa";

// Định nghĩa kiểu dữ liệu khách hàng cho admin
type AdminCustomer = {
  id: number;
  patientCode?: string;
  fullName: string;
  gender?: string;
  dateOfBirth?: string; // Định dạng ngày ISO (YYYY-MM-DD)
  phone?: string;
  email?: string;
  address?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  userId?: number; // ID tài khoản nếu có
};

const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080";

// Hàm chuyển đổi định dạng ngày sang hiển thị cho người dùng
function formatDate(value?: string) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
}

export default function AdminCustomerManagement() {
  const { t } = useTranslation("admin");
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<AdminCustomer | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const accessToken = localStorage.getItem("accessToken");

  // Hàm lấy danh sách khách hàng từ API
  const fetchCustomers = async (keyword?: string) => {
    if (!accessToken) {
      toast.error(t("customers.messages.noAccessToken", "Missing access token"));
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get<AdminCustomer[]>(`${apiBase}/api/admin/customers`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: keyword ? { search: keyword } : undefined,
      });
      setCustomers(response.data || []);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        t("customers.messages.loadFailed", "Unable to load customers");
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Hàm tìm kiếm khách hàng theo từ khóa
  const handleSearch = () => {
    fetchCustomers(search.trim());
  };

  // Hàm xem chi tiết khách hàng theo id
  const handleViewDetail = async (customerId: number) => {
    if (!accessToken) {
      toast.error(t("customers.messages.noAccessToken", "Missing access token"));
      return;
    }
    try {
      const response = await axios.get<AdminCustomer>(`${apiBase}/api/admin/customers/${customerId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setSelectedCustomer(response.data);
      setShowDetailModal(true);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        t("customers.messages.loadDetailFailed", "Unable to load customer details");
      toast.error(message);
    }
  };

  // Hàm khóa/bỏ khóa khách hàng
  const handleToggleStatus = async (customer: AdminCustomer) => {
    if (!accessToken) {
      toast.error(t("customers.messages.noAccessToken", "Missing access token"));
      return;
    }
    try {
      setUpdatingId(customer.id);
      await axios.patch(
        `${apiBase}/api/admin/customers/${customer.id}/status`,
        { isActive: !customer.isActive },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      setCustomers((prev) =>
        prev.map((item) =>
          item.id === customer.id
            ? {
                ...item,
                isActive: !customer.isActive,
              }
            : item
        )
      );
      toast.success(
        !customer.isActive
          ? t("customers.messages.activated", "Khách hàng đã được kích hoạt")
          : t("customers.messages.blocked", "Khách hàng đã bị chặn")
      );
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        t("customers.messages.updateFailed", "Unable to update customer status");
      toast.error(message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-gray-900">
          {t("pageTitles.customerManagement", "Quản lý khách hàng")}
        </h1>
        <p className="text-sm text-gray-600">
          {t(
            "customers.pageDescription",
            "Tổng quan về tất cả khách hàng trong hệ thống, bao gồm thông tin liên hệ và lịch sử."
          )}
        </p>
      </div>

      {/* Thanh tìm kiếm và nút xóa ô tìm kiếm */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex flex-col gap-4 md:flex-row md:items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("customers.filters.search", "Tìm kiếm")}
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            placeholder={t(
              "customers.filters.searchPlaceholder",
              "Tìm theo tên, mã bệnh nhân, SĐT hoặc email"
            )}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            {t("customers.actions.search", "Tìm kiếm")}
          </button>
          <button
            onClick={() => {
              setSearch("");
              fetchCustomers();
            }}
            className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100 transition"
          >
            {t("customers.actions.clear", "Xóa")}
          </button>
        </div>
      </div>

      {/* Bảng danh sách khách hàng */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {t("customers.table.customer", "Khách hàng")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {t("customers.table.contact", "Liên hệ")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {t("customers.table.address", "Địa chỉ")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {t("customers.table.status", "Trạng thái")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {t("customers.table.createdAt", "Ngày tạo")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {t("customers.table.actions", "Thao tác")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {/* Hiển thị trạng thái đang tải hoặc không có dữ liệu*/}
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  {t("customers.messages.loading", "Đang tải khách hàng...")}
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  {t("customers.messages.noData", "Không tìm thấy khách hàng")}
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 text-sm font-semibold">
                          {customer.fullName?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{customer.fullName}</div>
                        <div className="text-xs text-gray-500">
                          {customer.patientCode ? `Mã: ${customer.patientCode}` : `ID: ${customer.id}`}
                        </div>
                        {customer.userId && (
                          <div className="text-xs text-blue-600">Có tài khoản</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <div className="flex flex-col">
                      <span>{customer.phone || "-"}</span>
                      <span className="text-xs text-gray-500">{customer.email || "-"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                    {customer.address || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                        customer.isActive
                          ? "bg-green-100 text-green-700 border border-green-200"
                          : "bg-red-100 text-red-700 border border-red-200"
                      }`}
                    >
                      {customer.isActive
                        ? t("customers.table.active", "Hoạt động")
                        : t("customers.table.inactive", "Không hoạt động")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatDate(customer.createdAt)}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewDetail(customer.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                        title={t("customers.actions.viewDetail", "Xem chi tiết")}
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(customer)}
                        disabled={updatingId === customer.id}
                        className={`p-2 rounded transition ${
                          customer.isActive
                            ? "text-red-600 hover:bg-red-50"
                            : "text-green-600 hover:bg-green-50"
                        } ${updatingId === customer.id ? "opacity-50 cursor-not-allowed" : ""}`}
                        title={
                          customer.isActive
                            ? t("customers.actions.block", "Chặn khách hàng")
                            : t("customers.actions.unblock", "Bỏ chặn khách hàng")
                        }
                      >
                        {customer.isActive ? <FaBan /> : <FaCheckCircle />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal chi tiết khách hàng */}
      {showDetailModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {t("customers.detail.title", "Chi tiết khách hàng")}
                </h2>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedCustomer(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      {t("customers.detail.fullName", "Họ và tên")}
                    </label>
                    <p className="text-gray-900">{selectedCustomer.fullName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      {t("customers.detail.patientCode", "Mã bệnh nhân")}
                    </label>
                    <p className="text-gray-900">{selectedCustomer.patientCode || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      {t("customers.detail.gender", "Giới tính")}
                    </label>
                    <p className="text-gray-900">{selectedCustomer.gender || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      {t("customers.detail.dateOfBirth", "Ngày sinh")}
                    </label>
                    <p className="text-gray-900">
                      {selectedCustomer.dateOfBirth
                        ? formatDate(selectedCustomer.dateOfBirth)
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      {t("customers.detail.phone", "Số điện thoại")}
                    </label>
                    <p className="text-gray-900">{selectedCustomer.phone || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      {t("customers.detail.email", "Email")}
                    </label>
                    <p className="text-gray-900">{selectedCustomer.email || "-"}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-700">
                      {t("customers.detail.address", "Địa chỉ")}
                    </label>
                    <p className="text-gray-900">{selectedCustomer.address || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      {t("customers.detail.status", "Trạng thái")}
                    </label>
                    <p className="text-gray-900">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                          selectedCustomer.isActive
                            ? "bg-green-100 text-green-700 border border-green-200"
                            : "bg-red-100 text-red-700 border border-red-200"
                        }`}
                      >
                        {selectedCustomer.isActive
                          ? t("customers.table.active", "Hoạt động")
                          : t("customers.table.inactive", "Không hoạt động")}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      {t("customers.detail.userId", "ID Tài khoản")}
                    </label>
                    <p className="text-gray-900">
                      {selectedCustomer.userId ? selectedCustomer.userId : t("customers.detail.noAccount", "Không có")}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      {t("customers.detail.createdAt", "Ngày tạo")}
                    </label>
                    <p className="text-gray-900">{formatDate(selectedCustomer.createdAt)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      {t("customers.detail.updatedAt", "Cập nhật lần cuối")}
                    </label>
                    <p className="text-gray-900">{formatDate(selectedCustomer.updatedAt)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedCustomer(null);
                  }}
                  className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100 transition"
                >
                  {t("customers.actions.close", "Đóng")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
