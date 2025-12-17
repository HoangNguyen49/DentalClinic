import { TrendingUp } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: "blue" | "green" | "orange" | "purple" | "red" | "indigo";
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export default function MetricCard({ title, value, icon, color, trend }: MetricCardProps) {
  const colorClasses = {
    blue: {
      bg: "bg-blue-50",
      text: "text-blue-600",
      border: "border-blue-200",
      iconBg: "bg-gradient-to-br from-blue-500 to-blue-600",
    },
    green: {
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      border: "border-emerald-200",
      iconBg: "bg-gradient-to-br from-emerald-500 to-emerald-600",
    },
    orange: {
      bg: "bg-orange-50",
      text: "text-orange-600",
      border: "border-orange-200",
      iconBg: "bg-gradient-to-br from-orange-500 to-orange-600",
    },
    purple: {
      bg: "bg-purple-50",
      text: "text-purple-600",
      border: "border-purple-200",
      iconBg: "bg-gradient-to-br from-purple-500 to-purple-600",
    },
    red: {
      bg: "bg-red-50",
      text: "text-red-600",
      border: "border-red-200",
      iconBg: "bg-gradient-to-br from-red-500 to-red-600",
    },
    indigo: {
      bg: "bg-indigo-50",
      text: "text-indigo-600",
      border: "border-indigo-200",
      iconBg: "bg-gradient-to-br from-indigo-500 to-indigo-600",
    },
  };

  const colors = colorClasses[color];

  return (
    <div className={`relative bg-white rounded-xl border-2 ${colors.border} p-5 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-lg ${colors.iconBg} text-white shadow-md`}>
          {icon}
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
              trend.isPositive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            <TrendingUp
              className={`w-3 h-3 ${trend.isPositive ? "" : "rotate-180"}`}
            />
            {trend.isPositive ? "+" : ""}
            {trend.value}%
          </div>
        )}
      </div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
        {title}
      </h3>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
