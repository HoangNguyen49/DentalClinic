import axiosClient from "../../huybro_api/axiosClient";

export interface Room {
    id: number;
    roomName: string;
    isPrivate: boolean;
    isActive: boolean;
}

export const receptionApi = {
    // lấy danh sách phòng trống
    getAvailableRooms: (clinicId: number, start: string, end: string) => {
        return axiosClient.get<Room[]>("/api/reception/rooms/available", {
            params: { clinicId, start, end }
        });
    },

    // gán phòng cho lịch hẹn
    assignRoom:(appointmentId: number, roomId: number) => {
        return axiosClient.put(`/api/reception/appointments/${appointmentId}/assign-room`, null, {
            params: { roomId }
        });
    }
}