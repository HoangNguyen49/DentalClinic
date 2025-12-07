import React from "react";
import { 
  Download, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  ShoppingCart, 
  XCircle, 
  Loader2,
  RefreshCcw,
  Wallet
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from "recharts";
import { useReport } from "./useReport";
import { formatMoney } from "../../../../utils/format";

const Report = () => {
  // Sử dụng Hook vừa tạo
  const { data, loading, filters, updateFilter, exportExcel, refresh } = useReport();

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 font-sans space-y-8 animate-fade-in-up">
      
      {/* --- 1. HEADER CONTROL BAR --- */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
        
        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <TrendingUp className="w-6 h-6" />
            </div>
            Revenue Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1 ml-1">Financial overview & Performance metrics</p>
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Currency Switcher */}
          <div className="bg-gray-100 p-1 rounded-xl flex items-center">
            {(["VND", "USD"] as const).map((curr) => (
              <button
                key={curr}
                onClick={() => updateFilter("currency", curr)}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
                  filters.currency === curr 
                    ? "bg-white text-blue-600 shadow-md transform scale-105" 
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {curr}
              </button>
            ))}
          </div>

          {/* Date Range Picker */}
          <div className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl shadow-sm hover:border-blue-400 transition-colors">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input 
              type="date" 
              className="text-sm outline-none text-gray-700 font-medium bg-transparent cursor-pointer"
              value={filters.startDate}
              onChange={(e) => updateFilter("startDate", e.target.value)}
            />
            <span className="text-gray-300">to</span>
            <input 
              type="date" 
              className="text-sm outline-none text-gray-700 font-medium bg-transparent cursor-pointer"
              value={filters.endDate}
              onChange={(e) => updateFilter("endDate", e.target.value)}
            />
          </div>

          {/* Refresh Button */}
          <button 
            onClick={refresh}
            className="p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
            title="Refresh Data"
          >
            <RefreshCcw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>

          {/* Export Button */}
          <button 
            onClick={exportExcel}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-emerald-200 transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
        </div>
      </div>

      {/* --- CONTENT LOADING STATE --- */}
      {loading && !data ? (
        <div className="h-96 flex flex-col items-center justify-center text-gray-400">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
          <p>Analyzing financial data...</p>
        </div>
      ) : data ? (
        <>
          {/* --- 2. KPI CARDS SECTION --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard 
              title="Net Revenue" 
              value={formatMoney(data.netRevenue, filters.currency)}
              sub="Completed Orders (Actual)"
              icon={<Wallet className="w-6 h-6 text-emerald-600" />}
              color="border-l-4 border-green-500"
              trend="Confirmed Income"
            />
            <KPICard 
              title="Potential Revenue" 
              value={formatMoney(data.potentialRevenue, filters.currency)} 
              sub="Processing & Confirmed"
              icon={<DollarSign className="w-6 h-6 text-blue-600" />}
              color="border-l-4 border-amber-500"
              trend="In Pipeline"
            />
            <KPICard 
              title="Total Orders" 
              value={data.totalOrdersCompleted.toLocaleString()} 
              sub="Successfully Delivered"
              icon={<ShoppingCart className="w-6 h-6 text-purple-600" />}
              color="border-l-4 border-blue-500"
              trend="Volume"
            />
            <KPICard 
              title="Lost Revenue" 
              value={formatMoney(data.lostRevenue, filters.currency)} 
              sub="Cancelled / Returned"
              icon={<XCircle className="w-6 h-6 text-red-500" />}
              color="border-l-4 border-red-500"
              trend="Needs Attention"
            />
          </div>

          {/* --- 3. CHARTS & TABLES SECTION --- */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* LEFT: Revenue Chart (Chiếm 2/3) */}
            <div className="xl:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
              <div className="mb-6 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg text-gray-800">Revenue Trends</h3>
                  <p className="text-xs text-gray-400">Daily revenue performance over time</p>
                </div>
                {/* Legend giả lập */}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="w-3 h-3 rounded-full bg-blue-500"></span> Revenue
                </div>
              </div>
              
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 12, fill: '#9ca3af'}}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 12, fill: '#9ca3af'}}
                      tickFormatter={(val) => 
                        new Intl.NumberFormat('en', { notation: "compact" }).format(val)
                      }
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                      itemStyle={{ color: '#1f2937', fontWeight: 600 }}
                      formatter={(value: number) => [formatMoney(value, filters.currency), "Revenue"]}
                      labelStyle={{ color: '#9ca3af', marginBottom: '4px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorRev)" 
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* RIGHT: Top Products (Chiếm 1/3) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[500px]">
              <div className="mb-4">
                <h3 className="font-bold text-lg text-gray-800">Top Selling Products</h3>
                <p className="text-xs text-gray-400">Best performers by revenue</p>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                {data.topProducts.map((prod, idx) => (
                  <div 
                    key={idx} 
                    className="group flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      {/* Rank Badge */}
                      <div className={`
                        w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-xs font-bold shadow-sm
                        ${idx === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-white' : 
                          idx === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white' : 
                          idx === 2 ? 'bg-gradient-to-br from-orange-300 to-orange-500 text-white' : 
                          'bg-gray-100 text-gray-500'}
                      `}>
                        {idx + 1}
                      </div>
                      
                      {/* Info */}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-700 truncate group-hover:text-blue-600 transition-colors">
                          {prod.productName}
                        </p>
                        <p className="text-[11px] text-gray-400 flex items-center gap-1">
                          SKU: <span className="font-mono">{prod.sku}</span>
                        </p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-gray-800">{formatMoney(prod.totalRevenue, filters.currency)}</p>
                      <p className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md inline-block mt-1">
                        {prod.totalSoldQty} sold
                      </p>
                    </div>
                  </div>
                ))}
                
                {data.topProducts.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <ShoppingCart className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-sm">No sales data yet</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </>
      ) : null}
    </div>
  );
};

// --- Sub-Component: KPI Card ---
interface KPICardProps {
  title: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  color: string;
  trend: string;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, sub, icon, color, trend }) => (
  <div className={`bg-white p-5 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 ${color}`}>
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-gray-50 rounded-xl">
        {icon}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
        {trend}
      </span>
    </div>
    <div>
      <h3 className="text-3xl font-bold text-gray-800 tracking-tight">{value}</h3>
      <p className="text-sm font-medium text-gray-500 mt-1">{title}</p>
      <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-100 flex items-center gap-1">
        {sub}
      </p>
    </div>
  </div>
);

export default Report;