import React, { useState } from 'react';
import type { MedicalRecordDTO } from '../../../types/patientDashboard';

interface Props {
  history: MedicalRecordDTO[];
  isDashboard?: boolean; // Cờ đánh dấu: đang ở Dashboard hay trang Full
  onViewAll?: () => void; // Hàm xử lý khi bấm "Xem tất cả"
}

const MedicalHistoryList: React.FC<Props> = ({ history, isDashboard = false, onViewAll }) => {
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecordDTO | null>(null);

  // Nếu không có dữ liệu
  if (!history || history.length === 0) {
    return (
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 text-center">
        <span className="text-4xl">📭</span>
        <p className="text-gray-500 mt-2 text-sm">Chưa có hồ sơ bệnh án nào.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 flex flex-col h-full">

      {/* Header: Thay đổi tùy ngữ cảnh */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
          <span className="text-2xl">📋</span> {isDashboard ? "Khám gần đây" : "Toàn bộ lịch sử khám"}
        </h3>

        {/* Nếu là Dashboard và có hàm onViewAll -> Hiện nút Xem tất cả */}
        {isDashboard && onViewAll && (
          <button
            onClick={onViewAll}
            className="text-blue-600 text-xs font-bold hover:underline flex items-center gap-1"
          >
            Xem tất cả &rarr;
          </button>
        )}
      </div>

      {/* Table Container */}
      <div className="overflow-hidden rounded-xl border border-gray-100 flex-1">
        {/* Ở Dashboard thì không cần scroll cao, ở trang Full thì scroll */}
        <div className={`${isDashboard ? 'overflow-visible' : 'max-h-[600px] overflow-y-auto custom-scrollbar'}`}>
          <table className="w-full text-left border-collapse relative">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold sticky top-0 z-10">
              <tr>
                <th className="py-3 pl-4">Ngày khám</th>
                <th className="py-3 hidden md:table-cell">Bác sĩ</th>
                <th className="py-3">Chẩn đoán</th>
                <th className="py-3 hidden sm:table-cell">Điều trị</th>
                <th className="py-3 text-right pr-4"></th>
              </tr>
            </thead>
            <tbody className="text-sm bg-white divide-y divide-gray-50">
              {history.map((rec) => (
                <tr key={rec.recordId} className="group hover:bg-blue-50/40 transition-colors">
                  <td className="py-3 pl-4 font-medium text-gray-700 whitespace-nowrap">
                    {rec.visitDate}
                  </td>
                  <td className="py-3 text-gray-600 whitespace-nowrap hidden md:table-cell">
                    {rec.doctorName}
                  </td>
                  <td className="py-3 font-semibold text-gray-800 max-w-[150px] truncate" title={rec.diagnosis}>
                    {rec.diagnosis}
                  </td>
                  <td className="py-3 hidden sm:table-cell">
                    <span className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded border border-blue-100 truncate max-w-[120px]">
                      {rec.treatment}
                    </span>
                  </td>
                  <td className="py-3 text-right pr-4">
                    <button
                      onClick={() => setSelectedRecord(rec)}
                      className="text-blue-600 hover:text-blue-800 font-bold text-xs bg-white border border-blue-200 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all shadow-sm"
                    >
                      Xem
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CHI TIẾT (Giữ nguyên code Modal cũ của bạn ở đây) */}
      {selectedRecord && (
        // ... (Paste lại đoạn code Modal cũ vào đây không thay đổi gì) ...
        // Để tiết kiệm không gian chat mình không paste lại đoạn modal dài, bạn giữ nguyên nhé
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden relative animate-slide-up flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 text-white flex justify-between items-start flex-shrink-0">
              <div><h2 className="text-xl font-bold">Chi tiết hồ sơ</h2><p className="text-blue-100 text-sm mt-1">#{selectedRecord.recordId} • {selectedRecord.visitDate}</p></div>
              <button onClick={() => setSelectedRecord(null)} className="text-white/80 hover:text-white text-2xl">&times;</button>
            </div>
            {/* Body */}
            <div className="p-6 md:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100"><p className="text-xs font-bold text-gray-400 uppercase mb-2">Chẩn đoán</p><p className="font-bold text-gray-800 text-lg">{selectedRecord.diagnosis}</p></div>
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100"><p className="text-xs font-bold text-blue-400 uppercase mb-2">Điều trị</p><p className="font-bold text-blue-800 text-lg">{selectedRecord.treatment}</p><p className="text-xs text-blue-600 mt-2 pt-2 border-t border-blue-200">BS. {selectedRecord.doctorName}</p></div>
              </div>
              <div className="space-y-4">
                {selectedRecord.note && <div><h4 className="font-bold text-gray-700 text-sm uppercase mb-2">💬 Lời dặn</h4><div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 text-gray-700 italic">"{selectedRecord.note}"</div></div>}
                {selectedRecord.prescriptionNote && <div><h4 className="font-bold text-gray-700 text-sm uppercase mb-2">💊 Đơn thuốc</h4><div className="bg-green-50 p-4 rounded-xl border border-green-100 text-green-900 font-medium whitespace-pre-line">{selectedRecord.prescriptionNote}</div></div>}
              </div>
              {selectedRecord.imageUrl && <div><h4 className="font-bold text-gray-700 mb-3 text-sm uppercase">Hình ảnh</h4><div className="rounded-2xl overflow-hidden border border-gray-200"><img src={selectedRecord.imageUrl} alt="Evid" className="w-full h-auto object-contain max-h-[300px]" /></div></div>}
            </div>
            {/* Footer */}
            <div className="p-4 border-t border-gray-100 flex justify-end bg-gray-50 flex-shrink-0"><button onClick={() => setSelectedRecord(null)} className="px-6 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold rounded-xl transition shadow-sm">Đóng lại</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalHistoryList;