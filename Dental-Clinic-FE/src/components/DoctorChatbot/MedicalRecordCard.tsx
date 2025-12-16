import React, { useState } from 'react';
import Field from './Field';

export type MedicalRecord = {
  record_id?: string;
  record_date?: string; // dd/MM/yyyy
  diagnosis?: string;
  treatment_plan?: string;
  prescription?: string;
  service?: string;
  service_category?: string;
  treating_doctor?: string;
  notes?: string;
}

export default function MedicalRecordCard({ record }: { record: MedicalRecord }) {
  const [open, setOpen] = useState(false);

  return (
    <article className="border rounded-md p-4 bg-white shadow-sm">
      <header className="flex items-start justify-between">
        <div>
          <div className="text-sm font-semibold text-gray-800">{record.record_date ?? 'N/A'}</div>
          <div className="text-xs text-gray-500">Record ID: {record.record_id ?? 'N/A'}</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-700">{record.treating_doctor ?? 'N/A'}</div>
          <button
            aria-expanded={open}
            onClick={() => setOpen((s) => !s)}
            className="mt-2 text-xs text-blue-600 hover:underline"
          >
            {open ? 'Thu gọn' : 'Xem chi tiết'}
          </button>
        </div>
      </header>

      <div className="mt-3">
        <Field label="Chẩn đoán" value={record.diagnosis ?? 'N/A'} />
        {open && (
          <div className="mt-2">
            <Field label="Kế hoạch điều trị" value={record.treatment_plan ?? 'N/A'} multiline />
            <Field label="Đơn thuốc" value={record.prescription ?? 'N/A'} multiline />
            <Field label="Ghi chú" value={record.notes ?? 'N/A'} multiline />
            <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
              <div>{record.service ?? 'N/A'}</div>
              <div className="px-2 py-1 bg-gray-100 rounded text-xs">{record.service_category ?? 'N/A'}</div>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
