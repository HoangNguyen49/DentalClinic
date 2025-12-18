import React, { useState, useEffect } from "react";
import {
  Users,
  Package,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ArrowRight,
  DollarSign,
  TrendingUp,
  FileText,
  AlertCircle,
  Box
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";

// --- MOCK DATA (Mô phỏng BE trả về) ---
const MOCK_DATA = {
  payroll: {
    currentMonthEstimate: 450000000, // 450 triệu
    solvedSlips: 12, // Đã giải quyết 12 phiếu
    totalStaff: 25
  },
  inventory: {
    lowStock: [
      { id: 1, name: "Implant Nobel Biocare", sku: "IM-NB-001", stock: 2, threshold: 5 },
      { id: 2, name: "Composite 3M Filtek", sku: "CP-3M-02", stock: 0, threshold: 10 },
      { id: 3, name: "Găng tay y tế (Hộp)", sku: "GL-MED-M", stock: 4, threshold: 20 },
    ],
    // Case 1: Có sản phẩm Inactive
    inactive: [
       { id: 99, name: "Ghế nha khoa cũ (Thanh lý)", sku: "OLD-CHAIR-01", updated: "2024-02-10" }
    ]
    // Case 2: Không có sản phẩm Inactive (Uncomment dòng dưới để test)
    // inactive: [] 
  },
  urgentOrders: [
    { id: "ORD-2024-001", customer: "Nguyễn Văn A", type: "MEMBER: ID #46", total: 1200000, time: "10 mins ago" },
    { id: "ORD-2024-005", customer: "Khách Vãng Lai", type: "POTENTIAL", total: 450000, time: "30 mins ago" },
    { id: "ORD-2024-008", customer: "Trần Thị B", type: "MEMBER: ID #46", total: 3400000, time: "1 hour ago" },
  ],
  revenueChart: [
    { name: 'W1', vnd: 120000000 },
    { name: 'W2', vnd: 180000000 },
    { name: 'W3', vnd: 150000000 },
    { name: 'W4', vnd: 210000000 },
  ]
};

// --- UTILS FORMAT ---
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

const DashboardOverview = () => {
  const [loading, setLoading] = useState(true);
  
  // Giả lập Loading
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      
      {/* --- SECTION 1: PAYROLL & REVENUE KPI --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* KPI 1: Estimated Payroll */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Users className="w-24 h-24 text-blue-600" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <DollarSign className="w-6 h-6" />
            </div>
            <h3 className="text-gray-500 font-medium text-sm">Est. Payroll (This Month)</h3>
          </div>
          <div className="text-3xl font-bold text-gray-800">
            {formatCurrency(MOCK_DATA.payroll.currentMonthEstimate)}
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold">
              {MOCK_DATA.payroll.solvedSlips} Slips
            </span>
            <span>solved / {MOCK_DATA.payroll.totalStaff} staff</span>
          </div>
        </div>

         {/* KPI 2: Solved Slips Visualization */}
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-gray-500 font-medium text-sm">Payroll Progress</h3>
              </div>
              <div className="text-3xl font-bold text-gray-800">
                {Math.round((MOCK_DATA.payroll.solvedSlips / MOCK_DATA.payroll.totalStaff) * 100)}%
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 mt-4">
              <div 
                className="bg-emerald-500 h-2.5 rounded-full" 
                style={{ width: `${(MOCK_DATA.payroll.solvedSlips / MOCK_DATA.payroll.totalStaff) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-right">Target: {MOCK_DATA.payroll.totalStaff} slips</p>
        </div>

        {/* KPI 3: Quick Revenue Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
           <div className="flex justify-between items-center mb-4">
              <h3 className="text-gray-500 font-medium text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Revenue (Weekly)
              </h3>
           </div>
           <div className="h-32">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MOCK_DATA.revenueChart}>
                  <Bar dataKey="vnd" radius={[4, 4, 0, 0]}>
                    {MOCK_DATA.revenueChart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 3 ? '#3b82f6' : '#e5e7eb'} />
                    ))}
                  </Bar>
                  <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(value: number) => [formatCurrency(value), 'VND']}
                  />
                </BarChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* --- SECTION 2: URGENT ORDERS --- */}
      <div className="bg-white rounded-2xl shadow-sm border-l-4 border-l-orange-500 border-y border-r border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-orange-50/30">
          <div>
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              Urgent Orders Queue
            </h3>
            <p className="text-xs text-gray-500 mt-1">Orders from <span className="font-bold">VIP Members</span> or <span className="font-bold">Potential Leads</span> requiring immediate action.</p>
          </div>
          <span className="bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full animate-pulse">
            {MOCK_DATA.urgentOrders.length} Pending
          </span>
        </div>
        
        <div className="divide-y divide-gray-50">
          {MOCK_DATA.urgentOrders.map((order) => (
            <div key={order.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                  {order.id.split('-')[2]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800">{order.customer}</span>
                    {order.type.includes("MEMBER") ? (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded border border-purple-200">
                        {order.type}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded border border-emerald-200">
                        {order.type}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{order.time} • Total: {formatCurrency(order.total)}</p>
                </div>
              </div>
              <button className="opacity-0 group-hover:opacity-100 transition-opacity px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg shadow-sm hover:bg-blue-700 flex items-center gap-1">
                Process <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* --- SECTION 3: INVENTORY HEALTH --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 3.1: Inactive Products */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Box className="w-5 h-5 text-gray-600" />
            </div>
            <h3 className="font-bold text-gray-800">Inactive Products</h3>
          </div>

          <div className="space-y-3">
            {MOCK_DATA.inventory.inactive.length > 0 ? (
              MOCK_DATA.inventory.inactive.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                     <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                     <div>
                       <p className="text-sm font-medium text-gray-700">{item.name}</p>
                       <p className="text-xs text-gray-400">SKU: {item.sku}</p>
                     </div>
                  </div>
                  <span className="text-[10px] text-gray-400 bg-white px-2 py-1 rounded border">
                    Since: {item.updated}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                 <CheckCircle2 className="w-8 h-8 text-green-500 mb-2 opacity-50" />
                 <p className="text-sm text-gray-500 font-medium">Hiện tại không có sản phẩm nào đang bị Inactive</p>
              </div>
            )}
          </div>
        </div>

        {/* 3.2: Low Stock Alert */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
           <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-red-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="font-bold text-gray-800">Low Stock Alert</h3>
          </div>

          <div className="space-y-3">
             {MOCK_DATA.inventory.lowStock.map((item) => (
               <div key={item.id} className="flex items-center justify-between p-3 bg-red-50/50 rounded-xl border border-red-100">
                  <div className="flex items-center gap-3">
                     <div className="p-1.5 bg-white rounded-md shadow-sm">
                       <Package className="w-4 h-4 text-red-500" />
                     </div>
                     <div>
                       <p className="text-sm font-medium text-gray-800">{item.name}</p>
                       <p className="text-xs text-red-500">Remaining: <span className="font-bold">{item.stock}</span> (Safe: {item.threshold})</p>
                     </div>
                  </div>
                  <button className="text-xs bg-white border border-red-200 text-red-600 px-3 py-1.5 rounded-lg font-medium hover:bg-red-50 transition-colors">
                    Import
                  </button>
               </div>
             ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardOverview;