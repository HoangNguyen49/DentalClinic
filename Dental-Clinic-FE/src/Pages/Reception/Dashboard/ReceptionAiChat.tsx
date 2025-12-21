import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next"; // 1. Import i18n
import { Bot, Send, X, Sparkles, AlertCircle, Table as TableIcon } from "lucide-react"; // 2. Import Icons đẹp hơn

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

interface AiResponse {
  status: string;
  mode: "CHAT" | "SQL" | "ERROR";
  answer?: string;
  data?: any[];
  message?: string;
  generatedSql?: string;
}

interface Message {
  sender: "USER" | "AI";
  type: "TEXT" | "TABLE";
  content: string | any[];
  timestamp: Date;
}

export default function ReceptionAiChat() {
  const { t } = useTranslation("reception"); // 3. Hook dịch
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Khởi tạo tin nhắn chào mừng bằng i18n
  const [messages, setMessages] = useState<Message[]>([]);

  // Effect để set tin nhắn chào mừng khi component mount (đảm bảo dịch đúng ngôn ngữ hiện tại)
  useEffect(() => {
    if (messages.length === 0) {
        setMessages([
            {
                sender: "AI",
                type: "TEXT",
                content: t("aiChat.welcome"),
                timestamp: new Date(),
            }
        ]);
    }
  }, [t]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      sender: "USER",
      type: "TEXT",
      content: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.post<AiResponse>(
        `${API_BASE_URL}/api/reception/ai/ask`,
        { question: userMsg.content },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const aiData = res.data;

      if (aiData.status === "error") {
        setMessages((prev) => [...prev, {
          sender: "AI",
          type: "TEXT",
          content: `${t("aiChat.error")}: ${aiData.message}`,
          timestamp: new Date(),
        }]);
      } 
      else if (aiData.mode === "SQL") {
        const newMessages: Message[] = [];
        if (aiData.answer) {
            newMessages.push({
                sender: "AI",
                type: "TEXT",
                content: aiData.answer,
                timestamp: new Date(),
            });
        }
        if (aiData.data && aiData.data.length > 0) {
            newMessages.push({
                sender: "AI",
                type: "TABLE",
                content: aiData.data,
                timestamp: new Date(),
            });
        } else if (!aiData.answer) {
             // Nếu không có answer lẫn data
             newMessages.push({
                sender: "AI",
                type: "TEXT",
                content: t("aiChat.noData"),
                timestamp: new Date(),
            });
        }
        setMessages((prev) => [...prev, ...newMessages]);
      } 
      else {
        setMessages((prev) => [...prev, {
          sender: "AI",
          type: "TEXT",
          content: aiData.answer || "...",
          timestamp: new Date(),
        }]);
      }

    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          sender: "AI",
          type: "TEXT",
          content: `❌ ${t("aiChat.disconnect")}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER CONTENT ---
  const renderContent = (msg: Message) => {
    if (msg.type === "TEXT") {
      return (
        <div className="flex gap-2">
            {msg.sender === "AI" && <Sparkles className="w-4 h-4 text-yellow-500 mt-1 shrink-0 animate-pulse" />}
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content as string}</p>
        </div>
      );
    }

    const data = msg.content as any[];
    if (!data || data.length === 0) {
      return <p className="text-sm italic text-gray-500 flex items-center gap-1"><AlertCircle size={14}/> {t("aiChat.noData")}</p>;
    }

    const headers = Object.keys(data[0]);

    const formatValue = (key: string, value: any) => {
      if (value === null || value === undefined) return "-";
      const lowerKey = key.toLowerCase();
      if (lowerKey.includes("amount") || lowerKey.includes("price") || lowerKey.includes("revenue") || lowerKey.includes("total")) {
        return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(value));
      }
      return String(value);
    };

    return (
      <div className="mt-2 overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm max-w-full">
        <div className="bg-gray-50 px-3 py-2 border-b border-gray-100 flex items-center gap-2 text-xs font-bold text-gray-600 uppercase">
            <TableIcon size={14} /> {t("aiChat.foundResult", {count: data.length})}
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-gray-600">
            <thead className="bg-gray-50 font-semibold text-gray-700 uppercase tracking-wider">
                <tr>
                {headers.map((h) => (
                    <th key={h} className="px-3 py-2 border-b whitespace-nowrap">
                    {h.replace(/_/g, " ")}
                    </th>
                ))}
                </tr>
            </thead>
            <tbody>
                {data.map((row, idx) => (
                <tr key={idx} className="border-b last:border-0 hover:bg-indigo-50 transition-colors">
                    {headers.map((h) => (
                    <td key={h} className="px-3 py-2 truncate max-w-[180px]" title={String(row[h])}>
                        {formatValue(h, row[h])}
                    </td>
                    ))}
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* 1. NÚT MỞ CHAT (Floating Button - Đẹp hơn) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 group flex items-center justify-center w-14 h-14 bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-full shadow-lg hover:shadow-indigo-500/50 hover:scale-110 transition-all duration-300 z-[9999] animate-bounce-slow"
        >
          {/* Hiệu ứng ping */}
          <span className="absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-20 group-hover:animate-ping"></span>
          <Bot className="w-8 h-8" />
        </button>
      )}

      {/* 2. CỬA SỔ CHAT (Glassmorphism & Clean UI) */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[400px] h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden z-[9999] animate-fade-in-up font-sans">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-4 flex justify-between items-center text-white shadow-md shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-wide flex items-center gap-1">
                    AI Assistant <Sparkles size={12} className="text-yellow-300"/>
                </h3>
                <p className="text-[10px] opacity-90 font-light text-indigo-100">Dental Care Intelligence</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition">
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === "USER" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl p-3 shadow-sm text-sm ${
                    msg.sender === "USER"
                      ? "bg-indigo-600 text-white rounded-br-none"
                      : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"
                  }`}
                >
                  {renderContent(msg)}
                  <div className={`text-[9px] mt-1.5 flex items-center gap-1 opacity-70 ${msg.sender === "USER" ? "justify-end text-indigo-100" : "text-gray-400"}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl p-4 rounded-bl-none shadow-sm flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"></span>
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer */}
          <div className="p-3 bg-white border-t border-gray-100 shrink-0">
            <div className="flex items-center gap-2 bg-gray-50 rounded-full px-2 py-2 border border-gray-200 focus-within:border-indigo-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 transition-all shadow-inner">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={t("aiChat.placeholder")}
                className="flex-1 bg-transparent border-0 text-sm focus:ring-0 outline-none text-gray-700 placeholder-gray-400 px-3"
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className={`p-2 rounded-full transition-all duration-200 flex items-center justify-center ${
                  loading || !input.trim()
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md transform hover:scale-105 active:scale-95"
                }`}
              >
                <Send size={18} className={loading || !input.trim() ? "" : "ml-0.5"} />
              </button>
            </div>
            <div className="text-center mt-2 flex justify-center items-center gap-1 opacity-60">
                <Sparkles size={10} className="text-indigo-500"/>
                <span className="text-[10px] text-gray-400 font-medium tracking-wide">{t("aiChat.poweredBy")}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}