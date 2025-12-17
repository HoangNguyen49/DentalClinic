import React from 'react';
import DoctorChatbot from '../../components/DoctorChatbot/DoctorChatbot';

export default function DoctorChatbotPage() {
  return (
    <div className="p-6 min-h-screen bg-gray-100">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-[#0D1B3E] mb-4">Doctor Chatbot</h1>

        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <DoctorChatbot />
        </div>
      </div>
    </div>
  );
}
