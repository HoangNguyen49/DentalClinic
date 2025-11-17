import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useTranslation } from "react-i18next";

type MonthlySummary = {
  departmentId: number;
  departmentName: string;
  totalEmployees: number;
  workingDays: number;
  present: number;
  late: number;
  absent: number;
  leave: number;
  offday: number;
  totalAttendance: number;
};

type MonthlyChartProps = {
  monthlySummary: MonthlySummary[];
  loading: boolean;
  loadingSummary: boolean;
};

export default function MonthlyChart({ monthlySummary, loading, loadingSummary }: MonthlyChartProps) {
  const { t } = useTranslation("attendance");
  
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 transition-opacity duration-300 ${loadingSummary ? 'opacity-50' : 'opacity-100'}`}>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          {t("chart.monthlyAttendanceStatistics")}
        </h2>
      </div>

      {loading ? (
        <div className="text-center py-8">{t("messages.loading")}</div>
      ) : monthlySummary.length === 0 ? (
        <div className="text-center py-8 text-gray-500">{t("chart.noDataAvailable")}</div>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={monthlySummary.map((item) => ({
              name: item.departmentName,
              Present: item.present,
              Late: item.late,
              Absent: item.absent,
              Leave: item.leave,
              Offday: item.offday,
              Total: item.present + item.late + item.absent + item.leave + item.offday,
            }))}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 60,
            }}
          >
            <defs>
              <linearGradient id="absentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                <stop offset="100%" stopColor="#6d28d9" stopOpacity={1} />
              </linearGradient>
              <linearGradient id="presentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                <stop offset="100%" stopColor="#047857" stopOpacity={1} />
              </linearGradient>
              <linearGradient id="lateGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
                <stop offset="100%" stopColor="#d97706" stopOpacity={1} />
              </linearGradient>
              <linearGradient id="leaveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                <stop offset="100%" stopColor="#2563eb" stopOpacity={1} />
              </linearGradient>
              <linearGradient id="offdayGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6b7280" stopOpacity={1} />
                <stop offset="100%" stopColor="#4b5563" stopOpacity={1} />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false} 
              stroke="#e5e7eb"
              opacity={0.5}
            />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12, fill: '#374151' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#374151' }}
              label={{ value: t("chart.numberOfAttendance"), angle: -90, position: 'insideLeft', fill: '#374151' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                color: '#374151',
              }}
              itemStyle={{ color: '#374151' }}
              labelStyle={{ color: '#374151' }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px', color: '#374151' }}
              iconType="square"
            />
            <Bar 
              dataKey="Absent" 
              stackId="a" 
              fill="url(#absentGradient)" 
              name="Absent"
              radius={[8, 8, 0, 0]}
            />
            <Bar 
              dataKey="Present" 
              stackId="a" 
              fill="url(#presentGradient)" 
              name="Present"
              radius={[0, 0, 0, 0]}
            />
            <Bar 
              dataKey="Late" 
              stackId="a" 
              fill="url(#lateGradient)" 
              name="Late"
              radius={[0, 0, 8, 8]}
            />
            <Bar 
              dataKey="Leave" 
              stackId="a" 
              fill="url(#leaveGradient)" 
              name="Leave"
              radius={[0, 0, 0, 0]}
            />
            <Bar 
              dataKey="Offday" 
              stackId="a" 
              fill="url(#offdayGradient)" 
              name="Offday"
              radius={[0, 0, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

