// APIのベースURLを動的に設定
const getApiBaseUrl = () => {
  const host = window.location.hostname;
  return `http://${host}:3000`;
};

export const API_BASE_URL = getApiBaseUrl();
export const API_PREFIX = "/api"; // APIのプレフィックスを集中管理

// エラータイプの定義
export const API_ERROR_TYPES = {
  NETWORK: "network_error",
  SERVER: "server_error",
  AUTH: "authentication_error",
  VALIDATION: "validation_error",
  NOT_FOUND: "not_found",
  UNKNOWN: "unknown_error",
};

/**
 * APIエラーを標準化して処理するユーティリティ
 * @param {Error} error - APIコールで発生したエラー
 * @param {Object} options - 追加オプション
 * @param {string} options.context - エラーが発生した場所や操作の説明
 * @param {Function} options.onAuthError - 認証エラー時のコールバック
 * @returns {Object} 標準化されたエラーオブジェクト
 */
export const handleApiError = (error, options = {}) => {
  console.error(
    `API Error${options.context ? ` in ${options.context}` : ""}:`,
    error
  );

  // デフォルトエラー情報
  const standardizedError = {
    type: API_ERROR_TYPES.UNKNOWN,
    message: "エラーが発生しました",
    originalError: error,
    statusCode: null,
    timestamp: new Date().toISOString(),
  };

  // axiosエラーの場合
  if (error.isAxiosError) {
    if (!error.response) {
      // ネットワークエラー
      standardizedError.type = API_ERROR_TYPES.NETWORK;
      standardizedError.message =
        "サーバーに接続できませんでした。ネットワーク接続を確認してください。";
    } else {
      // サーバーからのレスポンスがある場合
      const { status, data } = error.response;
      standardizedError.statusCode = status;

      switch (status) {
        case 400:
          standardizedError.type = API_ERROR_TYPES.VALIDATION;
          standardizedError.message =
            data.error || data.message || "入力データが正しくありません";
          standardizedError.validationErrors = data.errors || [];
          break;
        case 401:
        case 403:
          standardizedError.type = API_ERROR_TYPES.AUTH;
          standardizedError.message = "認証に失敗しました";
          // 認証エラー時のコールバックがあれば実行
          if (options.onAuthError) options.onAuthError();
          break;
        case 404:
          standardizedError.type = API_ERROR_TYPES.NOT_FOUND;
          standardizedError.message = "リソースが見つかりませんでした";
          break;
        case 500:
        case 502:
        case 503:
          standardizedError.type = API_ERROR_TYPES.SERVER;
          standardizedError.message =
            "サーバーエラーが発生しました。しばらく経ってからお試しください。";
          break;
        default:
          standardizedError.message =
            data.error || data.message || "予期せぬエラーが発生しました";
      }

      // バックエンドからのエラーメッセージがある場合は使用
      if (data && data.errors && Array.isArray(data.errors)) {
        standardizedError.details = data.errors;
      }
    }
  }

  return standardizedError;
};

// 画像URLを絶対パスに変換するヘルパー関数
export const getAbsoluteImageUrl = (relativeUrl) => {
  if (!relativeUrl) return null;
  if (relativeUrl.startsWith("http")) return relativeUrl;

  // 相対パスの場合、APIのホストと結合
  const apiBase = API_BASE_URL.replace(/\/+$/, ""); // 末尾のスラッシュを削除
  const path = relativeUrl.startsWith("/") ? relativeUrl : `/${relativeUrl}`;
  return `${apiBase}${path}`;
};

// axiosの設定
import axios from "axios";

export const api = axios.create({
  baseURL: API_BASE_URL, // 絶対パスを使用
  headers: {
    "Content-Type": "application/json",
  },
});

// 共通APIエンドポイントヘルパー関数
export const apiEndpoints = {
  // 認証関連
  auth: {
    login: () => `${API_PREFIX}/auth/login`,
    register: () => `${API_PREFIX}/auth/register`,
    logout: () => `${API_PREFIX}/auth/logout`,
  },
  // デッキ関連
  decks: {
    getAll: () => `${API_PREFIX}/decks`,
    getOne: (id) => `${API_PREFIX}/decks/${id}`,
    create: () => `${API_PREFIX}/decks`,
    delete: (id) => `${API_PREFIX}/decks/${id}`,
  },
  // アップロード関連
  uploads: {
    create: () => `${API_PREFIX}/uploads`,
  },
};
