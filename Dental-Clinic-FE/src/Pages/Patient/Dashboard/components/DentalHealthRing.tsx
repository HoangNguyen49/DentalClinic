import React, { useState } from 'react';

interface Props {
    score: number;
    status: string;
    breakdown: string[];
}

const DentalHealthRing: React.FC<Props> = ({ score, status, breakdown }) => {
    const radius = 55; // Tăng kích thước
    const stroke = 10; // Viền dày hơn chút
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (score / 100) * circumference;
    const [showTooltip, setShowTooltip] = useState(false);

    const getColor = (s: number) => {
        if (s >= 90) return { stroke: '#10B981', bg: 'bg-emerald-50', text: 'text-emerald-600', shadow: 'shadow-emerald-200' };
        if (s >= 70) return { stroke: '#3B82F6', bg: 'bg-blue-50', text: 'text-blue-600', shadow: 'shadow-blue-200' };
        if (s >= 50) return { stroke: '#F59E0B', bg: 'bg-amber-50', text: 'text-amber-600', shadow: 'shadow-amber-200' };
        return { stroke: '#EF4444', bg: 'bg-red-50', text: 'text-red-600', shadow: 'shadow-red-200' };
    };
    
    const style = getColor(score);

    return (
        <div className="relative flex flex-col items-center justify-center p-6 bg-white rounded-[2rem] shadow-lg shadow-gray-100 border border-white h-full overflow-visible">
            
            {/* Header nhỏ */}
            <div className="absolute top-5 left-5 right-5 flex justify-between items-start">
                <div>
                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest">Health Score</h3>
                    <p className={`text-sm font-bold ${style.text} mt-0.5`}>{status}</p>
                </div>
                <div 
                    className="cursor-pointer group relative"
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                >
                    <div className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    {/* Tooltip xịn hơn */}
                    {showTooltip && (
                        <div className="absolute right-0 mt-2 w-64 bg-gray-900 text-white text-xs rounded-xl p-4 shadow-2xl z-50 animate-fade-in-up">
                            <div className="absolute -top-1 right-3 w-3 h-3 bg-gray-900 transform rotate-45"></div>
                            <p className="font-bold text-gray-300 mb-2 uppercase text-[10px]">Cách tính điểm</p>
                            <ul className="space-y-2">
                                {breakdown.map((item, idx) => (
                                    <li key={idx} className="flex justify-between items-center border-b border-gray-700 pb-1 last:border-0 last:pb-0">
                                        <span className='opacity-90'>{item.split(':')[0]}</span>
                                        <span className="text-emerald-400 font-bold bg-emerald-400/10 px-1.5 py-0.5 rounded">{item.split(':')[1]}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            {/* Vòng tròn */}
            <div className="relative mt-4 group cursor-default">
                {/* Glow effect phía sau */}
                <div className={`absolute inset-0 rounded-full blur-2xl opacity-20 ${style.bg.replace('bg-', 'bg-')}`} style={{backgroundColor: style.stroke}}></div>
                
                <svg height={radius * 3} width={radius * 3} className="transform -rotate-90 relative z-10 drop-shadow-sm">
                    <circle stroke="#F3F4F6" strokeWidth={stroke} fill="transparent" r={normalizedRadius} cx={radius * 1.5} cy={radius * 1.5} strokeLinecap="round" />
                    <circle 
                        stroke={style.stroke} 
                        fill="transparent" 
                        strokeWidth={stroke} 
                        strokeDasharray={circumference + ' ' + circumference} 
                        style={{ strokeDashoffset, transition: 'stroke-dashoffset 1.5s ease-out' }} 
                        strokeLinecap="round" 
                        r={normalizedRadius} 
                        cx={radius * 1.5} 
                        cy={radius * 1.5} 
                    />
                </svg>
                
                {/* Số điểm ở giữa */}
                <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center z-20">
                    <span className={`text-5xl font-black ${style.text} tracking-tighter`}>{score}</span>
                    <span className="text-xs text-gray-400 font-semibold mt-1">/ 100</span>
                </div>
            </div>
            
            <div className="mt-4 text-center px-4">
                <p className="text-gray-500 text-xs leading-relaxed">
                    Bạn đang làm rất tốt! Hãy duy trì lịch khám để giữ hạng <span className={`font-bold ${style.text}`}>{status}</span>.
                </p>
            </div>
        </div>
    );
};

export default DentalHealthRing;