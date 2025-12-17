import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function MessageBubble({ role, text }: { role: 'doctor' | 'ai'; text: string }) {
  const isDoctor = role === 'doctor';
  return (
    <div className={`${isDoctor ? 'flex justify-end' : 'flex justify-start'} min-w-0`}>
      <div className={`${isDoctor ? 'bg-blue-50 text-right' : 'bg-gray-50 text-left'} min-w-0 max-w-[clamp(220px,60%,640px)] p-3 rounded-lg shadow-sm`}>
        <div className="text-xs text-gray-500 mb-1">{isDoctor ? 'Bác sĩ' : 'AI'}</div>
        <div className="max-h-[40vh] overflow-auto whitespace-pre-wrap break-words">
          <div className="prose prose-sm max-w-none break-words"><ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown></div>
        </div>
      </div>
    </div>
  );
}
