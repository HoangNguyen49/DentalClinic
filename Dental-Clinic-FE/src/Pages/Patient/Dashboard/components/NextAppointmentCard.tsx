import React from 'react';

import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { UpcomingAppointment } from '../../../types/patientDashboard';

interface Props {
    appointment: UpcomingAppointment | null;
}

const NextAppointmentCard: React.FC<Props> = ({ appointment }) => {
    // Trường hợp KHÔNG có lịch -> Hiện nút đặt lịch to
    if (!appointment) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 bg-white rounded-[2rem] border border-dashed border-gray-300 hover:border-blue-300 group transition-colors">
                <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mb-3 text-3xl group-hover:scale-110 transition-transform">📅</div>
                <p className="font-bold text-gray-700">Chưa có lịch hẹn</p>
                <button onClick={() => window.location.href='/booking'} className="mt-4 px-6 py-2 bg-[#3366FF] text-white rounded-full font-bold shadow-lg hover:bg-blue-700 transition">
                    + Đặt lịch mới
                </button>
            </div>
        );
    }

    // Trường hợp CÓ lịch -> Hiện thẻ vé
    const dateObj = new Date(appointment.startDateTime);

    return (
        <div className="h-full bg-gradient-to-br from-[#3366FF] to-[#1E40AF] rounded-[2rem] p-6 text-white shadow-xl shadow-blue-200 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl -mr-10 -mt-10"></div>
            
            <div className="relative z-10 flex justify-between items-start">
                <div>
                    <span className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-xs font-bold border border-white/10">SẮP TỚI</span>
                    <h3 className="text-xl font-bold mt-3 line-clamp-1">{appointment.serviceName}</h3>
                    <p className="text-blue-100 text-sm">BS. {appointment.doctorName}</p>
                </div>
            </div>

            <div className="relative z-10 mt-4 pt-4 border-t border-white/10 flex items-end justify-between">
                <div>
                    <p className="text-3xl font-bold">{format(dateObj, "HH:mm")}</p>
                    <p className="text-blue-100 text-sm">{format(dateObj, "EEEE, dd/MM/yyyy", { locale: vi })}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-blue-200 uppercase">Phòng</p>
                    <p className="font-bold">{appointment.roomName || "01"}</p>
                </div>
            </div>
        </div>
    );
};
export default NextAppointmentCard;