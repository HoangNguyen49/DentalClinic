import React from 'react';
import type { Activity } from '../../../types/patientDashboard';


const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export const FinancialCard = ({ totalSpent, rank }: { totalSpent: number, rank: string }) => (
    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-lg shadow-gray-50 flex flex-col justify-between h-full relative overflow-hidden group hover:border-blue-100 transition-colors">
        <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
            <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05 1.18 1.91 2.53 1.91 1.33 0 2.26-.87 2.26-1.94 0-1.02-.91-1.76-2.67-2.17-2.39-.56-3.57-1.79-3.57-3.37 0-1.75 1.37-2.91 3.01-3.26V4h2.67v1.9c1.6.32 2.89 1.42 3.04 3.16h-1.97c-.13-.88-1-1.63-2.31-1.63-1.12 0-2.02.77-2.02 1.8 0 .98.8 1.55 2.54 1.99 2.53.64 3.69 1.94 3.69 3.51 0 1.83-1.39 3.06-3.22 3.36z"/></svg>
        </div>
        
        <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-orange-50 rounded-xl text-orange-500">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <span className="text-gray-500 text-sm font-bold uppercase tracking-wider">Tổng chi tiêu</span>
        </div>
        
        <div>
            <h3 className="text-3xl font-black text-gray-800 tracking-tight">{formatCurrency(totalSpent)}</h3>
            <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-gray-400 font-medium">Hạng thành viên:</span>
                <span className="bg-gradient-to-r from-yellow-100 to-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold border border-amber-200">
                    {rank} ⭐️
                </span>
            </div>
        </div>
    </div>
);

export const RecentActivityList = ({ activities }: { activities: Activity[] }) => (
    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-lg shadow-gray-50 h-full flex flex-col">
        <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2 text-lg">
            Hoạt động gần đây
        </h3>
        <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                    <span className="text-2xl mb-2">💤</span>
                    <p className="text-sm">Chưa có hoạt động nào.</p>
                </div>
            ) : (
                activities.map((act, idx) => (
                    <div key={idx} className="relative pl-6 pb-1 last:pb-0 group">
                        {/* Timeline line */}
                        {idx !== activities.length - 1 && (
                            <div className="absolute top-2 left-[5px] w-[2px] h-full bg-gray-100 group-hover:bg-blue-100 transition-colors"></div>
                        )}
                        
                        {/* Timeline dot */}
                        <div className={`absolute top-2 left-0 w-3 h-3 rounded-full border-2 border-white ring-1 ${
                            act.type === 'COMPLETED' ? 'bg-green-500 ring-green-100' : 
                            act.type === 'CANCELLED' ? 'bg-red-500 ring-red-100' : 'bg-blue-500 ring-blue-100'
                        }`}></div>

                        <div className="bg-gray-50 p-3 rounded-xl hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-100">
                            <p className="text-sm font-bold text-gray-800 line-clamp-1">{act.title}</p>
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                {act.date}
                            </p>
                        </div>
                    </div>
                ))
            )}
        </div>
    </div>
);