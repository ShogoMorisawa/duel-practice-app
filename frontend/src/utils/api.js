// APIのベースURLを動的に設定
const getApiBaseUrl = () => {
  const host = window.location.hostname;
  console.log("host", host);
  return `http://${host}:3000`;
};

export const API_BASE_URL = getApiBaseUrl();

// axiosの設定
import axios from "axios";

// IPアドレス変更用のヘルパー関数
export const fixUrl = (url) => {
  if (!url) return url;
  // 古いIPアドレスを新しいIPアドレスに置換
  if (typeof url === "string" && url.includes("192.168.1.21")) {
    const host = window.location.hostname;
    return url.replace("192.168.1.21", host);
  }
  return url;
};

export const api = axios.create({
  baseURL: API_BASE_URL, // 絶対パスを使用
  headers: {
    "Content-Type": "application/json",
  },
});

// レスポンスインターセプター
api.interceptors.response.use((response) => {
  // データにURLが含まれている場合に修正
  if (response.data && typeof response.data === "object") {
    // imageUrlプロパティの処理
    if (response.data.imageUrl) {
      response.data.imageUrl = fixUrl(response.data.imageUrl);
    }

    // 配列データの処理
    if (Array.isArray(response.data)) {
      response.data.forEach((item) => {
        if (item && item.imageUrl) {
          item.imageUrl = fixUrl(item.imageUrl);
        }
      });
    }
  }
  return response;
});
