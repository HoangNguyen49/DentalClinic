import React from 'react';
import type { KeyboardEvent } from 'react';

export default function MessageInput({ value, onChange, onSend, disabled }: { value: string; onChange: (v: string) => void; onSend: () => void; disabled?: boolean }) {
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSend(); }} className="flex gap-3">
      <textarea
        className="flex-1 border rounded p-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-200"
        rows={3}
        value={value}
        onKeyDown={handleKeyDown}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Nhập câu hỏi... (Ví dụ: SDC-00000009). Enter gửi, Shift+Enter xuống dòng"
        disabled={disabled}
        aria-label="Chat input"
      />
      <button type="submit" disabled={disabled} className="bg-blue-600 text-white px-4 py-2 rounded">
        {disabled ? 'Đang xử lý...' : 'Gửi'}
      </button>
    </form>
  );
}
