// APIのベースURLを動的に設定
const getApiBaseUrl = () => {
  const host = window.location.hostname;
  return `http://${host}:3000`;
};

export const API_BASE_URL = getApiBaseUrl();

// axiosの設定
import axios from "axios";

export const api = axios.create({
  baseURL: API_BASE_URL, // 絶対パスを使用
  headers: {
    "Content-Type": "application/json",
  },
});
