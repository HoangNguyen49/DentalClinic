import axiosClient, { API_BASE_URL } from "../huybro_api/axiosClient";
import type { ChatbotRequest, ChatbotResponse } from "../types/chatbot";
import axios from "axios";

export const askChatbot = async (
  payload: ChatbotRequest
): Promise<ChatbotResponse> => {
  try {
    const url = `${API_BASE_URL}/api/doctors/chatbot`;
    const res = await axiosClient.post<ChatbotResponse>(url, payload);
    return res.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      const data = err.response?.data as ChatbotResponse | undefined;

      if (status === 401) {
        // Let caller handle redirect; include helpful message
        throw new Error("Unauthorized");
      }

      // If backend returned a structured error
      if (data && data.errorMessage) {
        throw new Error(data.errorMessage);
      }

      throw new Error(err.response?.data?.message || "Network error");
    }

    throw err;
  }
};
