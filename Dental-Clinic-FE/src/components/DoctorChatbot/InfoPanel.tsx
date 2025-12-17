import React from 'react';

export default function InfoPanel({
  patientCode,
  setPatientCode,
  appointmentId,
  setAppointmentId,
  recordId,
  setRecordId,
  patientInfo,
  onResetContext,
}: {
  patientCode?: string | undefined;
  setPatientCode: (v?: string) => void;
  appointmentId?: string | undefined;
  setAppointmentId: (v?: string) => void;
  recordId?: string | undefined;
  setRecordId: (v?: string) => void;
  patientInfo?: { fullName?: string; phone?: string; email?: string } | null;
  onResetContext: () => void;
}) {
  return (
    <aside className="w-80 bg-white rounded-xl shadow p-4 border border-gray-200">
      <h4 className="text-sm font-semibold mb-2">Thông tin truy vấn</h4>

      <div className="mb-3 text-xs text-gray-500">AI sẽ tự nhận diện <strong>patientCode</strong> nếu bạn nhập vào câu hỏi.</div>

      <div className="mb-3">
        <label className="block text-xs text-gray-600 mb-1">Patient Code</label>
        <input className="w-full border rounded px-3 py-2" value={patientCode ?? ''} onChange={(e) => setPatientCode(e.target.value || undefined)} placeholder="Ví dụ: SDC-00000009" />
      </div>

      <div className="mb-3">
        <label className="block text-xs text-gray-600 mb-1">Appointment ID</label>
        <input className="w-full border rounded px-3 py-2" value={appointmentId ?? ''} onChange={(e) => setAppointmentId(e.target.value || undefined)} placeholder="Optional" />
      </div>

      <div className="mb-3">
        <label className="block text-xs text-gray-600 mb-1">Record ID</label>
        <input className="w-full border rounded px-3 py-2" value={recordId ?? ''} onChange={(e) => setRecordId(e.target.value || undefined)} placeholder="Optional" />
      </div>

      <div className="mb-4">
        <button className="px-3 py-2 rounded border text-sm" onClick={onResetContext}>Làm mới</button>
      </div>

      <div className="pt-2 border-t">
        <div className="text-xs text-gray-500 mb-2">Thông tin bệnh nhân</div>
        <div className="text-sm text-gray-800">{patientInfo?.fullName ?? 'N/A'}</div>
        <div className="text-xs text-gray-500">{patientInfo?.phone ?? 'N/A'}</div>
        <div className="text-xs text-gray-500">{patientInfo?.email ?? 'N/A'}</div>
      </div>
    </aside>
  );
}
