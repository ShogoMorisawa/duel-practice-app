// APIのベースURLを動的に設定
const getApiBaseUrl = () => {
  // 環境変数が設定されていればそれを使用
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // 環境変数がない場合はRenderのAPIを使用
  return "https://duel-practice-api.onrender.com";
};

export const API_BASE_URL = getApiBaseUrl();
export const API_PREFIX = "/api"; // APIのプレフィックスを集中管理

// フルAPIベースURL（プロトコル+ホスト+ポート+プレフィックス）
export const getFullApiBaseUrl = () => {
  return API_BASE_URL + API_PREFIX;
};

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
  if (relativeUrl.startsWith("blob:")) return relativeUrl; // blob URLはそのまま返す

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
    Accept: "application/json",
  },
  // 大きなファイルをアップロードできるように設定を追加
  maxContentLength: 100 * 1024 * 1024, // 100MB
  maxBodyLength: 100 * 1024 * 1024, // 100MB
  // リクエストのタイムアウト設定
  timeout: 30000, // 30秒
});

// multipart/form-dataのPOSTリクエスト用に専用のインスタンスを作成
export const uploadApi = axios.create({
  baseURL: API_BASE_URL,
  // multipart/form-dataではContent-Typeヘッダーを設定せず、
  // axiosにboundaryを自動生成させる
  maxContentLength: 100 * 1024 * 1024, // 100MB
  maxBodyLength: 100 * 1024 * 1024, // 100MB
  timeout: 60000, // 60秒（アップロードには長めの時間を設定）
});

// 共通APIエンドポイントヘルパー関数
export const apiEndpoints = {
  // 認証関連
  auth: {
    login: () => `${API_PREFIX}/auth/login`,
    register: () => `${API_PREFIX}/auth/register`,
    logout: () => `${API_PREFIX}/auth/logout`,
    profile: () => `${API_PREFIX}/auth/profile`,
  },
  // デッキ関連
  decks: {
    getAll: () => `${API_PREFIX}/decks`,
    getOne: (id) => `${API_PREFIX}/decks/${id}`,
    create: () => `${API_PREFIX}/decks`,
    delete: (id) => `${API_PREFIX}/decks/${id}`,
  },
  // カード関連
  cards: {
    getImage: (deckId, cardId) =>
      deckId
        ? `${API_PREFIX}/decks/${deckId}/cards/${cardId}/image`
        : `${API_PREFIX}/cards/${cardId}/image`,
    getImageById: (cardId) => `${API_PREFIX}/cards/${cardId}/image`,
    getFallbackImage: () =>
      `${window.location.origin}/images/card-not-found.svg`, // 絶対パスで指定
  },
  // アップロード関連
  uploads: {
    create: () => `${API_PREFIX}/uploads`,
  },
  // プロキシ関連（CORSエラー対策用）
  proxy: (url) => `${API_PREFIX}/proxy?url=${encodeURIComponent(url)}`,
};

// リクエストインターセプターを追加して、すべてのリクエストにAuthorizationヘッダーを自動付与
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  console.log(`API Interceptor: Request to ${config.url}`);
  console.log(`API Interceptor: Token exists: ${!!token}`);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log(`API Interceptor: Authorization header set`);
  } else {
    console.log(
      `API Interceptor: No token found, skipping Authorization header`
    );
  }

  // Content-Typeが設定されていない場合のみ設定
  if (!config.headers["Content-Type"]) {
    config.headers["Content-Type"] = "application/json";
  }

  // 常にJSONレスポンスを要求
  config.headers["Accept"] = "application/json";

  console.log(`API Interceptor: Final headers:`, config.headers);
  return config;
});

// アップロードAPIにも同じインターセプターを適用
uploadApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
