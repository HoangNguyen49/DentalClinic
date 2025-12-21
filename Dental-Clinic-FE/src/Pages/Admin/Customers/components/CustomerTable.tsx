import { Eye, UserCheck, UserX, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { type AdminCustomer } from "../../../../services/admin/adminApi";
import { formatDate } from "../../../../utils/adminUtils";
import TableSortHeader from "../../../../components/admin/TableSortHeader";
import type { SortState } from "../../../../hooks/useTableSort";
import type { SortDirection } from "../../../../components/admin/TableSortHeader";

interface CustomerTableProps {
  customers: AdminCustomer[];
  loading: boolean;
  selectedIds: Set<number>;
  isAllSelected: boolean;
  isIndeterminate: boolean;
  sortState: SortState;
  totalElements: number;
  updatingId: number | null;
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onSort: (key: string, direction: SortDirection) => void;
  onViewDetail: (id: number) => void;
  onToggleStatus: (customer: AdminCustomer) => void;
}

export default function CustomerTable({
  customers,
  loading,
  selectedIds,
  isAllSelected,
  isIndeterminate,
  sortState,
  totalElements,
  updatingId,
  onToggleSelect,
  onToggleSelectAll,
  onSort,
  onViewDetail,
  onToggleStatus,
}: CustomerTableProps) {
  const { t } = useTranslation("admin");

  return (
    <section className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {t("customers.table.listTitle", "Customer List")}
            </h2>
            <p className="text-sm text-slate-600">
              {t("customers.table.total", "Total")}: {totalElements}{" "}
              {totalElements !== 1
                ? t("customers.bulkActions.customersPlural", "customers")
                : t("customers.bulkActions.customers", "customer")}
            </p>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead className="bg-gradient-to-r from-slate-50 via-gray-50 to-slate-50">
            <tr>
              <th className="px-6 py-4 text-left">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = isIndeterminate;
                  }}
                  onChange={onToggleSelectAll}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  aria-label={t("customers.table.selectAll", "Select all")}
                />
              </th>
              <TableSortHeader
                label={t("customers.table.customer", "Customer")}
                sortKey="fullName"
                currentSortKey={sortState.key}
                currentDirection={sortState.direction}
                onSort={onSort}
              />
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                {t("customers.table.contact", "Contact")}
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                {t("customers.table.address", "Address")}
              </th>
              <TableSortHeader
                label={t("customers.table.status", "Status")}
                sortKey="isActive"
                currentSortKey={sortState.key}
                currentDirection={sortState.direction}
                onSort={onSort}
              />
              <TableSortHeader
                label={t("customers.table.createdAt", "Created")}
                sortKey="createdAt"
                currentSortKey={sortState.key}
                currentDirection={sortState.direction}
                onSort={onSort}
              />
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                {t("customers.table.actions", "Actions")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-slate-600 font-medium">
                      {t("customers.messages.loading", "Loading customers...")}
                    </p>
                  </div>
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 bg-slate-100 rounded-2xl">
                      <Users className="w-12 h-12 text-slate-400" />
                    </div>
                    <p className="text-slate-600 font-medium text-lg">
                      {t("customers.messages.noData", "No customers found")}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr
                  key={customer.id}
                  className="hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-indigo-50/20 transition-all duration-200"
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(customer.id)}
                      onChange={() => onToggleSelect(customer.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      aria-label={`Select ${customer.fullName}`}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg ring-4 ring-blue-100">
                        <span className="text-white text-base font-bold">
                          {customer.fullName?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">{customer.fullName}</div>
                        <div className="text-xs text-slate-500 font-medium">
                          {customer.patientCode
                            ? `${t("customers.table.code", "Code")}: ${customer.patientCode}`
                            : `${t("customers.table.id", "ID")}: ${customer.id}`}
                        </div>
                        {customer.userId && (
                          <span className="inline-flex mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                            {t("customers.table.hasAccount", "Has Account")}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{customer.phone || "-"}</span>
                      <span className="text-xs text-slate-500">{customer.email || "-"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700 max-w-xs truncate">
                    {customer.address || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`inline-flex px-3 py-1.5 rounded-full text-xs font-bold shadow-md ${
                        customer.isActive
                          ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-green-200/50"
                          : "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-red-200/50"
                      }`}
                    >
                      {customer.isActive
                        ? t("customers.table.active", "Active")
                        : t("customers.table.inactive", "Inactive")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700 font-medium">
                    {formatDate(customer.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onViewDetail(customer.id)}
                        className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all hover:shadow-md"
                        title={t("customers.actions.viewDetail", "View Details")}
                        aria-label={t("customers.actions.viewDetail", "View Details")}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onToggleStatus(customer)}
                        disabled={updatingId === customer.id}
                        className={`p-2.5 rounded-lg transition-all hover:shadow-md ${
                          customer.isActive
                            ? "text-red-600 hover:bg-red-50"
                            : "text-green-600 hover:bg-green-50"
                        } ${updatingId === customer.id ? "opacity-50 cursor-not-allowed" : ""}`}
                        title={
                          customer.isActive
                            ? t("customers.actions.block", "Block Customer")
                            : t("customers.actions.unblock", "Unblock Customer")
                        }
                        aria-label={
                          customer.isActive
                            ? t("customers.actions.block", "Block Customer")
                            : t("customers.actions.unblock", "Unblock Customer")
                        }
                      >
                        {customer.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

