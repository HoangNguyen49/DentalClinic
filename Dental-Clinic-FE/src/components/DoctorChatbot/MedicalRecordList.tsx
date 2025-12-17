import React, { useMemo } from 'react';
import { parse, isValid, compareDesc } from 'date-fns';
import MedicalRecordCard from './MedicalRecordCard';
import type { MedicalRecord } from './MedicalRecordCard';

function parseRecordDate(str?: string) {
  if (!str) return new Date(0);
  try {
    const d = parse(str, 'dd/MM/yyyy', new Date());
    return isValid(d) ? d : new Date(0);
  } catch {
    return new Date(0);
  }
}

export default function MedicalRecordList({ records }: { records?: MedicalRecord[] | null }) {
  const sorted = useMemo(() => {
    const arr = Array.isArray(records) ? records.slice() : [];
    arr.sort((a, b) => compareDesc(parseRecordDate(a?.record_date), parseRecordDate(b?.record_date)));
    return arr;
  }, [records]);

  if (!sorted || sorted.length === 0) {
    return <div className="text-sm text-gray-500">Không tìm thấy hồ sơ bệnh án</div>;
  }

  return (
    <div className="space-y-3">
      {sorted.map((r, idx) => (
        <div key={r.record_id ?? idx} className="">
          <MedicalRecordCard record={r} />
        </div>
      ))}
    </div>
  );
}
