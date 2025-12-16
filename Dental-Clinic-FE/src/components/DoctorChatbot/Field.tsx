import React from 'react';

export default function Field({ label, value, multiline }: { label: string; value?: string | null; multiline?: boolean }) {
  const display = value && value.toString().trim() ? value : 'N/A';
  return (
    <div className="mb-3">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      {multiline ? (
        <div className="text-sm text-gray-700 whitespace-pre-wrap">{display}</div>
      ) : (
        <div className="text-sm text-gray-700">{display}</div>
      )}
    </div>
  );
}
