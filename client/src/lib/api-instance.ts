import axios from "axios";

// Tạo API client với cấu hình nâng cao
const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  timeout: 10000, // Timeout sau 10 giây
  headers: {
    'Accept': 'application/json',
    'Cache-Control': 'max-age=300' // Cho phép cache 5 phút ở browser
  }
});

export default api;