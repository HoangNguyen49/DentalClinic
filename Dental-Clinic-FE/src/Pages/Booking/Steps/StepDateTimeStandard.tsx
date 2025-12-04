interface StepProps {
  data: any;
  updateData: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function StepDateTimeStandard({ data, updateData, onNext, onPrev }: StepProps) {
  
  const today = new Date().toISOString().split('T')[0];
  
  const handleSelectSession = (session: 'MORNING' | 'AFTERNOON') => {
    // Quy ước ngầm: Sáng = 08:00, Chiều = 13:00 (Để Backend lưu mốc)
    const time = session === 'MORNING' ? '08:00' : '13:00';
    updateData({ 
        ...data, 
        time: time, 
        sessionLabel: session === 'MORNING' ? 'Buổi Sáng' : 'Buổi Chiều' // Để hiển thị ở Summary
    });
  };

  return (
    <div className="space-y-8 animate-fadeIn text-center">
       <div>
          <h3 className="text-2xl font-bold text-gray-800">Chọn Thời Gian Khám</h3>
          <p className="text-gray-500 mt-1">Lễ tân sẽ liên hệ để chốt giờ cụ thể sau</p>
       </div>

       {/* Date Picker */}
       <div className="max-w-xs mx-auto">
         <label className="block text-sm font-bold text-gray-700 mb-2 text-left">Ngày mong muốn</label>
         <input 
           type="date" 
           className="w-full p-3 border border-gray-300 rounded-xl text-center font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm cursor-pointer"
           min={today}
           value={data.date}
           onChange={(e) => updateData({ ...data, date: e.target.value, time: '' })}
         />
       </div>

       {/* Session Selection */}
       {data.date && (
           <div className="grid grid-cols-2 gap-6 max-w-lg mx-auto mt-8">
               <button
                 onClick={() => handleSelectSession('MORNING')}
                 className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 hover:shadow-lg
                    ${data.time === '08:00' 
                        ? 'border-orange-400 bg-orange-50 ring-1 ring-orange-400' 
                        : 'border-gray-200 hover:border-orange-300 bg-white'}`}
               >
                   <span className="text-5xl filter drop-shadow-sm">☀️</span>
                   <div>
                       <span className="font-bold text-gray-800 block text-lg">Buổi Sáng</span>
                       <span className="text-xs text-gray-500 font-medium">08:00 - 12:00</span>
                   </div>
                   {data.time === '08:00' && <span className="text-orange-500 font-bold text-xl">✓</span>}
               </button>

               <button
                 onClick={() => handleSelectSession('AFTERNOON')}
                 className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 hover:shadow-lg
                    ${data.time === '13:00' 
                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                        : 'border-gray-200 hover:border-blue-300 bg-white'}`}
               >
                   <span className="text-5xl filter drop-shadow-sm">🌤️</span>
                   <div>
                        <span className="font-bold text-gray-800 block text-lg">Buổi Chiều</span>
                        <span className="text-xs text-gray-500 font-medium">13:00 - 17:00</span>
                   </div>
                   {data.time === '13:00' && <span className="text-blue-600 font-bold text-xl">✓</span>}
               </button>
           </div>
       )}

       {/* Nav */}
       <div className="flex justify-between pt-6 mt-10 border-t border-gray-100">
          <button 
            onClick={onPrev} 
            className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-full transition font-medium"
          >
            Quay Lại
          </button>
          <button 
            onClick={onNext} 
            disabled={!data.time}
            className="px-10 py-3 rounded-full bg-gradient-to-r from-[#6699FF] to-[#3366FF] text-white font-bold shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all duration-300"
          >
            Tiếp Theo
          </button>
       </div>
    </div>
  );
}