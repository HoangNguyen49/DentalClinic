import React, { useState, useRef, useEffect } from "react";
import type { KeyboardEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { askChatbot } from "../../services/chatbotService";
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import InfoPanel from './InfoPanel';
import MedicalRecordList from './MedicalRecordList';
import GenericJsonRenderer from './GenericJsonRenderer';


interface DoctorChatbotProps {}

type Message = {
  id: string;
  role: "doctor" | "ai";
  text: string;
  payload?: unknown;
};


export const DoctorChatbot: React.FC<DoctorChatbotProps> = () => {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patientCode, setPatientCode] = useState<string | undefined>(undefined);
  const [appointmentId, setAppointmentId] = useState<string | undefined>(undefined);
  const [recordId, setRecordId] = useState<string | undefined>(undefined);
  // context panel removed per request — use props directly
  const [lastQuery, setLastQuery] = useState<string | null>(null);

  const pushMessage = (m: Message) => setMessages((s) => [...s, m]);
  const chatWindowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = chatWindowRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  const submit = async (e?: React.FormEvent, qParam?: string) => {
    e?.preventDefault();
    setError(null);

    const raw = qParam ?? question.trim();
    const trimmed = raw?.toString().trim();
    if (!trimmed) {
      setError("Vui lòng nhập câu hỏi");
      return;
    }

    // push user message
    const userMsg: Message = { id: String(Date.now()), role: "doctor", text: trimmed };
    pushMessage(userMsg);
    setLastQuery(trimmed);
    setLoading(true);
    setQuestion("");

    // auto-extract patientCode like SDC-00000009 from the question if present
    const codeMatch = trimmed.match(/([A-Z]{2,}-\d+)/i);
    const extractedCode = codeMatch ? codeMatch[1].toUpperCase() : undefined;
    if (extractedCode && !patientCode) {
      setPatientCode(extractedCode);
    }

    try {
      const payload: any = { question: trimmed };
      if (extractedCode) payload.patientCode = extractedCode;
      else if (patientCode) payload.patientCode = patientCode;
      if (appointmentId) payload.appointmentId = appointmentId;
      if (recordId) payload.recordId = recordId;

      const res = await askChatbot(payload);

      if (res.success && res.answer) {
        // try parse structured JSON payload
        let payload: unknown = undefined;
        let text = res.answer;
        try {
          const parsed: unknown = JSON.parse(res.answer);
          if (parsed !== undefined && parsed !== null && typeof parsed === 'object') {
            // Any object/array returned from AI should be presented as structured payload
            payload = parsed as Record<string, unknown> | unknown[];
            text = '';
          } else {
            // JSON primitive (string/number/boolean)
            text = String(parsed);
          }
        } catch {
          // not JSON, keep as text
        }

        const aiMsg: Message = { id: String(Date.now() + 1), role: "ai", text, payload };
        pushMessage(aiMsg);
      } else {
        setError(res.errorMessage || "Failed to get response from AI");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === 'Unauthorized') {
        window.location.href = '/login';
        return;
      }
      setError(msg || 'Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };


  const handleRetry = () => {
    if (lastQuery) submit(undefined, lastQuery);
  };

  const clearConversation = () => setMessages([]);
  const resetContext = () => {
    setPatientCode(undefined);
    setAppointmentId(undefined);
    setRecordId(undefined);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* LEFT: Chat Window (col-span-2) */}
      <section className="lg:col-span-2 flex flex-col h-[70vh]">
        <div className="flex-1 min-h-0 bg-white rounded-xl shadow p-4 border border-gray-200 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Trò chuyện với AI</h3>
            <div className="flex items-center gap-3">
              <button className="text-sm text-gray-500" onClick={() => { navigator.clipboard?.writeText(lastQuery || ''); }}>Sao chép câu hỏi</button>
              <button className="text-sm text-red-600" onClick={clearConversation}>Xóa hội thoại</button>
            </div>
          </div>

          <MessageList messages={messages.map((m) => ({ id: m.id, role: m.role, text: m.text, payload: m.payload }))} />

          <div className="mt-3 border-t pt-3">
            {error && (
              <div className="text-sm text-red-600 mb-2">{error} <button className="text-blue-600 underline ml-2" onClick={handleRetry}>Thử lại</button></div>
            )}
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-gray-500">{loading ? 'Đang gọi AI...' : 'Sẵn sàng'}</div>
              {loading && <div className="w-3 h-3 rounded-full bg-blue-600 animate-pulse" />}
            </div>
            <MessageInput value={question} onChange={setQuestion} onSend={() => submit()} disabled={loading} />
          </div>
        </div>
      </section>

      {/* RIGHT: Info Panel */}
      <aside className="lg:col-span-1">
        <InfoPanel
          patientCode={patientCode}
          setPatientCode={(v?: string) => setPatientCode(v)}
          appointmentId={appointmentId}
          setAppointmentId={(v?: string) => setAppointmentId(v)}
          recordId={recordId}
          setRecordId={(v?: string) => setRecordId(v)}
          patientInfo={null}
          onResetContext={resetContext}
        />
      </aside>
    </div>
  );
};

export default DoctorChatbot;

// --- Helper components ---
function ChatInput({ value, onChange, onSend, disabled }: { value: string; onChange: (v: string) => void; onSend: (e?: React.FormEvent, qParam?: string) => void; disabled?: boolean }) {
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSend(e); }} className="flex gap-3">
      <textarea
        className="flex-1 border rounded p-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-200"
        rows={3}
        value={value}
        onKeyDown={handleKeyDown}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Nhập câu hỏi... (Enter để gửi, Shift+Enter xuống dòng)"
        disabled={disabled}
      />
      <button type="submit" disabled={disabled} className="bg-blue-600 text-white px-4 py-2 rounded">
        {disabled ? "Đang xử lý..." : "Gửi"}
      </button>
    </form>
  );
}

function StructuredRenderer({ payload }: { payload: unknown }) {
  if (!payload) return null;

  const p = payload as Record<string, unknown>;

  // medical_records rendering
  if ('medical_records' in p) {
    const records = (p.medical_records as unknown) as any[] | undefined;
    return <MedicalRecordList records={records} />;
  }

  if (p.type === "table") {
    const tbl = p as unknown as { title?: string; columns: string[]; rows: string[][] };
    return <TableRenderer title={tbl.title} columns={tbl.columns} rows={tbl.rows} />;
  }

  if (p.type === "summary") {
    const summary = p as unknown as { cards: Array<{ title?: string; value?: string }> };
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {(summary.cards || []).map((c, idx) => (
          <div key={idx} className="p-3 border rounded bg-white">
            <div className="text-sm text-gray-500">{c.title}</div>
            <div className="text-lg font-semibold mt-1">{c.value}</div>
          </div>
        ))}
      </div>
    );
  }

  if (p.type === "bullets") {
    const bullets = p as unknown as { items: string[] };
    return (
      <ul className="list-disc list-inside text-sm">
        {(bullets.items || []).map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    );
  }

  // Fallback: generic JSON renderer for unknown object shapes
  return <GenericJsonRenderer data={payload} />;
}

function TableRenderer({ title, columns, rows }: { title?: string; columns: string[]; rows: string[][] }) {
  return (
    <div className="overflow-auto w-full">
      {title && <div className="text-sm text-gray-600 mb-2">{title}</div>}
      <table className="min-w-full table-fixed divide-y divide-gray-200 border">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((c) => (
              <th key={c} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-gray-50">
                {r.map((cell, j) => (
                <td key={j} className="px-4 py-2 text-sm text-gray-700 max-w-[220px] truncate whitespace-normal">
                  {(() => {
                    if (typeof cell === 'string' && /^https?:\/\//i.test(cell)) {
                      const isImg = /\.(png|jpe?g|gif|webp|avif|svg)(\?|$)/i.test(cell);
                      if (isImg) {
                        return (
                          <a href={cell} target="_blank" rel="noreferrer">
                            <img src={cell} alt={`img-${j}`} loading="lazy" className="max-w-[140px] max-h-[120px] object-contain rounded border" />
                          </a>
                        );
                      }
                      return <a href={cell} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs break-words">{cell}</a>;
                    }

                    if (Array.isArray(cell) || (cell && typeof cell === 'object')) {
                      return <pre className="text-xs max-h-[28vh] overflow-auto whitespace-pre-wrap">{JSON.stringify(cell, null, 2)}</pre>;
                    }

                    return String(cell ?? 'N/A');
                  })()}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
