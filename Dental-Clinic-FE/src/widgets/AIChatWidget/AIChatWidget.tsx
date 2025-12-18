import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  SparklesIcon,
  TrashIcon
} from '@heroicons/react/24/solid';
import dentalAiApi from './dentalAiApi';
// 1. Import hook
import { useTranslation } from 'react-i18next';

interface ServiceSuggestion {
  id: number;
  name: string;
  price: number;
  duration: string;
}

interface DoctorSuggestion {
  id: number;
  fullName: string;
  specialty: string;
  avatarUrl: string;
}

interface AIChatResponse {
  replyText: string;
  suggestedServices: ServiceSuggestion[];
  suggestedDoctors: DoctorSuggestion[];
}

interface Message {
  sender: 'user' | 'ai';
  text: string;
  services?: ServiceSuggestion[];
  doctors?: DoctorSuggestion[];
  timestamp: number;
}

const STORAGE_KEY = 'sunshine_chat_history';
const EXPIRE_TIME = 24 * 60 * 60 * 1000; // 24 giờ

function AIChatWidget() {
  // 2. Setup hook
  const { t, i18n } = useTranslation(["ai-chat"]);
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const navigate = useNavigate();

  // Helper format tiền tệ
  const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat(i18n.language === 'vi' ? 'vi-VN' : 'en-US', { 
          style: 'currency', 
          currency: 'VND' 
      }).format(amount);
  };

  // 1. Load History
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed: Message[] = JSON.parse(saved);
        const lastMsg = parsed[parsed.length - 1];
        if (lastMsg && (Date.now() - lastMsg.timestamp > EXPIRE_TIME)) {
          localStorage.removeItem(STORAGE_KEY);
          // Sử dụng t() cho tin nhắn mặc định
          setMessages([{ sender: 'ai', text: t('messages.welcome'), timestamp: Date.now() }]);
        } else {
          setMessages(parsed);
        }
      } catch (e) {
        setMessages([{ sender: 'ai', text: t('messages.welcomeShort'), timestamp: Date.now() }]);
      }
    } else {
      setMessages([{ sender: 'ai', text: t('messages.welcomeShort'), timestamp: Date.now() }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Chỉ chạy 1 lần khi mount, nhưng text welcome sẽ lấy theo ngôn ngữ LÚC ĐÓ

  // 2. Save History
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
    scrollToBottom();
  }, [messages, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const clearHistory = () => {
    localStorage.removeItem(STORAGE_KEY);
    // Sử dụng t() khi clear history
    setMessages([{ sender: 'ai', text: t('messages.historyCleared'), timestamp: Date.now() }]);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsgText = input;
    const newUserMsg: Message = { sender: 'user', text: userMsgText, timestamp: Date.now() };

    const newMessages = [...messages, newUserMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const historyPayload = newMessages.slice(-6).map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        content: m.text
      }));

      const response = await dentalAiApi.post<AIChatResponse>('/api/public/ai/chat', {
        message: userMsgText,
        history: historyPayload
      });

      const aiResponse = response.data;

      setMessages(prev => [...prev, {
        sender: 'ai',
        text: aiResponse.replyText,
        services: aiResponse.suggestedServices,
        doctors: aiResponse.suggestedDoctors,
        timestamp: Date.now()
      }]);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { sender: 'ai', text: t('messages.error'), timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- LOGIC ĐIỀU HƯỚNG THÔNG MINH ---

  const handleBookingService = (serviceId: number) => {
    setIsOpen(false);
    navigate(`/booking?prefillService=${serviceId}`);
  };

  const handleBookingDoctor = (doctorId: number, serviceId?: number) => {
    setIsOpen(false);
    const params = new URLSearchParams();
    params.set('type', 'VIP');
    params.set('prefillDoctor', doctorId.toString());
    
    if (serviceId) {
        params.set('prefillService', serviceId.toString());
    }
    
    navigate(`/booking?${params.toString()}`);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-instrument">
      {isOpen && (
        <div className="mb-4 w-[350px] md:w-[400px] h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-blue-100 animate-fade-in-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#3366FF] to-[#6699FF] p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-5 h-5" />
              <span className="font-bold text-lg">{t('header.title')}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={clearHistory} title={t('header.clearHistory')} className="hover:bg-white/20 p-1 rounded-full transition">
                <TrashIcon className="w-5 h-5" />
              </button>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Chat Body */}
          <div className="flex-1 overflow-y-auto p-4 bg-[#F6FAFF] space-y-4">
            {messages.map((msg, idx) => {
              
              // --- [AI FIX] LOGIC TỰ ĐỘNG TÌM SERVICE ID TỪ LỊCH SỬ CHAT ---
              let contextServiceId = msg.services && msg.services.length > 0 ? msg.services[0].id : undefined;
              
              if (!contextServiceId) {
                  const prevMsgWithService = messages.slice(0, idx).reverse().find(m => m.services && m.services.length > 0);
                  if (prevMsgWithService && prevMsgWithService.services) {
                      contextServiceId = prevMsgWithService.services[0].id;
                  }
              }
              // -------------------------------------------------------------

              return (
                <div key={idx} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  {/* Text Bubble */}
                  <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.sender === 'user'
                      ? 'bg-[#3366FF] text-white rounded-tr-none'
                      : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                    }`}>
                    {msg.text}
                  </div>

                  {/* Service Cards */}
                  {msg.services && msg.services.length > 0 && (
                    <div className="mt-2 space-y-2 w-full max-w-[90%]">
                      <p className="text-xs text-gray-500 ml-2">{t('suggestions.services')}</p>
                      {msg.services.map((svc) => (
                        <div 
                          key={svc.id} 
                          onClick={() => handleBookingService(svc.id)}
                          className="bg-white p-3 rounded-xl border border-blue-100 shadow-sm hover:shadow-md transition cursor-pointer flex justify-between items-center group"
                        >
                          <div>
                            <p className="font-bold text-[#0D1B3E] text-sm group-hover:text-[#3366FF] transition">{svc.name}</p>
                            <p className="text-xs text-gray-500">{svc.duration} • {formatCurrency(svc.price)}</p>
                          </div>
                          <button className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg font-semibold group-hover:bg-blue-600 group-hover:text-white transition">
                              {t('suggestions.bookNow')}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Doctor Cards */}
                  {msg.doctors && msg.doctors.length > 0 && (
                    <div className="mt-2 space-y-2 w-full max-w-[90%]">
                      <p className="text-xs text-gray-500 ml-2">{t('suggestions.doctors')}</p>
                      {msg.doctors.map((doc) => (
                        <div 
                          key={doc.id} 
                          onClick={() => handleBookingDoctor(doc.id, contextServiceId)}
                          className="bg-white p-2 rounded-xl border border-blue-100 shadow-sm flex items-center gap-3 hover:shadow-md transition cursor-pointer group"
                        >
                          <img src={doc.avatarUrl || "https://res.cloudinary.com/dchzko3lj/image/upload/v1762616672/default-avatar_brvdfn.png"} alt="Dr" className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                          <div className="flex-1">
                            <p className="font-bold text-[#0D1B3E] text-xs group-hover:text-[#3366FF] transition">{doc.fullName}</p>
                            <p className="text-[10px] text-gray-500">{doc.specialty}</p>
                          </div>
                          <button className="text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded-md font-semibold group-hover:bg-amber-500 group-hover:text-white transition">
                              {t('suggestions.selectVip')}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-start">
                <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none shadow-sm border border-gray-100">
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-gray-100">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder={t('input.placeholder')}
                className="w-full pl-4 pr-12 py-3 bg-gray-50 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#3366FF] border-transparent"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="absolute right-2 p-2 bg-[#3366FF] text-white rounded-full hover:bg-blue-700 disabled:opacity-50 transition shadow-md"
              >
                <PaperAirplaneIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${isOpen ? 'scale-0' : 'scale-100'} transition-transform duration-300 flex items-center justify-center w-14 h-14 bg-gradient-to-r from-[#3366FF] to-[#00C2FF] text-white rounded-full shadow-lg hover:shadow-2xl hover:scale-110 active:scale-95`}
      >
        <ChatBubbleLeftRightIcon className="w-7 h-7" />
        <span className="absolute top-0 right-0 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
      </button>
    </div>
  );
}

export default AIChatWidget;