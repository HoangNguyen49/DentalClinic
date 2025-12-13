import axios from 'axios';

// Tạo một instance axios hoàn toàn mới, không dính dáng đến cấu hình chung của nhóm
const dentalAiApi = axios.create({
  // URL của Backend Spring Boot (Mặc định là 8080)
  baseURL: 'http://localhost:8080', 
  headers: {
    'Content-Type': 'application/json',
  },
});

export default dentalAiApi;