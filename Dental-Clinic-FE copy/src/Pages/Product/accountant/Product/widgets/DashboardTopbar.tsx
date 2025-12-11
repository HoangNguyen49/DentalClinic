import type { ReactNode } from "react";

type DashboardTopbarProps = {
  title: string;
  subtitle?: string;
  rightContent?: ReactNode;
};

function DashboardTopbar({ title, subtitle, rightContent }: DashboardTopbarProps) {
  return (
    <header className="w-full bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0D1B3E]">{title}</h1>
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-4">{rightContent}</div>
      </div>
    </header>
  );
}

export default DashboardTopbar;
