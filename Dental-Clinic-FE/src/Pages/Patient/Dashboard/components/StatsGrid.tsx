import React from 'react';

interface Props {
    totalVisits: number;
    aiTip: string;
}

const StatsGrid: React.FC<Props> = ({ totalVisits, aiTip }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
            {/* Card 1: Tổng số lần khám */}
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <div className="p-2 bg-purple-100 rounded-xl">
                        <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                    </div>
                    <span className="text-3xl font-bold text-gray-800">{totalVisits}</span>
                </div>
                <div>
                    <p className="text-gray-500 text-sm font-medium mt-2">Lần khám hoàn tất</p>
                    <p className="text-xs text-green-500 mt-1 flex items-center">
                        <span>+10 điểm tích lũy</span>
                    </p>
                </div>
            </div>

            {/* Card 2: AI Tip */}
            <div className="bg-gradient-to-br from-teal-50 to-green-50 p-5 rounded-3xl border border-teal-100 shadow-sm flex flex-col relative overflow-hidden">
                <div className="flex items-center space-x-2 mb-3 relative z-10">
                    <span className="bg-teal-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">AI TIP</span>
                    <span className="text-teal-800 font-semibold text-sm">Lời khuyên</span>
                </div>
                <p className="text-gray-700 text-sm italic leading-relaxed relative z-10">
                    "{aiTip}"
                </p>
                {/* Decoration Icon */}
                <div className="absolute -bottom-4 -right-4">
                     <svg className="w-20 h-20 text-teal-200 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                         <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                     </svg>
                </div>
            </div>
        </div>
    );
};

export default StatsGrid;