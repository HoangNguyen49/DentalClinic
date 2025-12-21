interface SectionHeaderProps {
  title: string;
  icon: React.ReactNode;
  color: string;
}

export default function SectionHeader({ title, icon, color }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className={`p-2 rounded-lg bg-gradient-to-br ${color} text-white shadow-md`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900">{title}</h3>
      <div className="flex-1 h-px bg-gradient-to-r from-slate-300 to-transparent"></div>
    </div>
  );
}
