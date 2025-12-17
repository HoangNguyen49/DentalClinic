import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import GenericJsonRenderer from './GenericJsonRenderer';

export default function MessageList({ messages }: { messages: Array<{ id: string; role: 'doctor' | 'ai'; text: string; payload?: unknown }>; }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const isNearBottomRef = useRef(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Only auto-scroll when user was near the bottom before the new message
    if (isNearBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  // track user scrolling to detect if they are at/near bottom
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = () => {
      isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight <= 100;
    };
    // initialize
    handler();
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, []);

  return (
    <div ref={ref} className="flex-1 min-w-0 min-h-0 h-[60vh] overflow-y-auto overflow-x-hidden p-2 space-y-4">
      {messages.length === 0 && (
        <div className="text-sm text-gray-500">Chưa có cuộc trò chuyện. Nhập câu hỏi để bắt đầu.</div>
      )}
      {messages.map((m) => (
        <div key={m.id} className="">
          {m.payload ? (
            // render structured payload inside a message bubble style
            <div className={`${m.role === 'doctor' ? 'flex justify-end' : 'flex justify-start'} min-w-0`}>
              <div className={`${m.role === 'doctor' ? 'bg-blue-50 text-right' : 'bg-gray-50 text-left'} min-w-0 max-w-[clamp(220px,60%,640px)] p-3 rounded-lg shadow-sm`}> 
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-gray-500">{m.role === 'doctor' ? 'Bác sĩ' : 'AI'}</div>
                </div>
                <div className="max-h-[40vh] overflow-auto break-words">
                  {/* If payload looks like an error object, show the message cleanly */}
                  {m.payload && typeof m.payload === 'object' && ('error' in (m.payload as any) || 'errorMessage' in (m.payload as any)) ? (
                    <div className="text-sm text-red-600">{(m.payload as any).error || (m.payload as any).errorMessage || JSON.stringify(m.payload)}</div>
                  ) : (
                    <GenericJsonRenderer data={m.payload} />
                  )}
                </div>
              </div>
            </div>
          ) : (
            <MessageBubble role={m.role} text={m.text} />
          )}
        </div>
      ))}
    </div>
  );
}
