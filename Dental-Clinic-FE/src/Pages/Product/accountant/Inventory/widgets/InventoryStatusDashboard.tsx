import React from 'react';
import { Package, Building2, TrendingUp } from 'lucide-react';
import type { ProductInventoryStatusDto } from '../../../../../huybro_api/inventoryApi';

interface Props {
  status: ProductInventoryStatusDto | null;
  loading: boolean;
}

const InventoryStatusDashboard: React.FC<Props> = ({ status, loading }) => {
  if (loading) {
    return <div className="h-32 bg-gray-100 animate-pulse rounded-xl"></div>;
  }

  if (!status) return null;

  return (
    <div className="mt-4 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
        
        {/* Thành phần 2 lớn: Tổng Lượng */}
        <div className="p-5 bg-gradient-to-br from-blue-50 to-white flex flex-col justify-center items-center text-center">
          <div className="mb-2 p-3 bg-blue-100 rounded-full text-blue-600">
            <Package className="w-6 h-6" />
          </div>
          <div className="text-sm text-gray-500 font-medium uppercase tracking-wide">Total Inventory</div>
          <div className="text-3xl font-bold text-gray-900 mt-1">{status.totalQuantity}</div>
          <div className="text-xs text-blue-600 mt-1 font-medium flex items-center">
             <TrendingUp className="w-3 h-3 mr-1" /> Live Status
          </div>
        </div>

        {/* Thành phần 2 nhỏ: Chi tiết kho */}
        <div className="col-span-2 p-5">
          <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
            <Building2 className="w-4 h-4 mr-2 text-gray-500" />
            Warehouse Breakdown
          </h4>
          
          <div className="space-y-3">
            {status.breakdown.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No stock in any warehouse.</p>
            ) : (
                status.breakdown.map((wh) => (
                <div key={wh.clinicId} className="group flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                    <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-3"></div>
                    <div>
                        <div className="text-sm font-medium text-gray-700">{wh.clinicName}</div>
                        <div className="text-[10px] text-gray-400">ID: {wh.clinicId}</div>
                    </div>
                    </div>
                    <div className="font-mono text-sm font-bold text-gray-800 bg-gray-100 px-2 py-1 rounded">
                        {wh.quantity}
                    </div>
                </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryStatusDashboard;