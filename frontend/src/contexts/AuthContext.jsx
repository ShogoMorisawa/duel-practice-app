import { createContext, useContext, useState, useEffect } from "react";
import { api, apiEndpoints, handleApiError } from "../utils/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  console.log("AuthProvider: Initializing...");
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);
  const [isLoading, setIsLoading] = useState(false);

  // 初期化時に明示的にlocalStorageからトークンを読み込む
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    console.log(
      "AuthProvider: Initial localStorage token check:",
      storedToken ? "exists" : "not found"
    );
    if (storedToken && !token) {
      console.log("AuthProvider: Setting token from localStorage");
      setToken(storedToken);
      setIsAuthenticated(true);
    }
  }, []);

  // トークンが変更されたときに認証状態を更新
  useEffect(() => {
    console.log("AuthProvider: Token changed", { token });
    setIsAuthenticated(!!token);

    // トークンの変更を確実にlocalStorageに保存
    if (token) {
      console.log("AuthProvider: Saving token to localStorage");
      localStorage.setItem("token", token);
    } else {
      console.log("AuthProvider: Removing token from localStorage");
      localStorage.removeItem("token");
    }
  }, [token]);

  // トークンがある場合、初回マウント時にユーザー情報を取得
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!token) return;

      setIsLoading(true);
      try {
        // ユーザープロフィールを取得するAPIエンドポイントを呼び出す
        console.log("AuthProvider: Fetching user profile with token", token);

        // リクエストのデバッグ
        console.log(`Requesting: GET ${apiEndpoints.auth.profile()}`);
        console.log("Authorization header:", `Bearer ${token}`);

        const response = await api.get(`${apiEndpoints.auth.profile()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          withCredentials: false,
        });

        console.log("AuthProvider: Profile response", response.data);
        setUser(response.data.data.user);
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
        const standardizedError = handleApiError(error, {
          context: "ユーザー情報取得",
        });

        // 認証エラーの場合はログアウト
        if (standardizedError.statusCode === 401) {
          logout();
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [token]);

  const login = async (newToken, userData) => {
    console.log("AuthProvider: Login called", { newToken, userData });

    // まずlocalStorageに保存してから状態を更新
    localStorage.setItem("token", newToken);
    console.log("AuthProvider: Token saved to localStorage");

    // 状態を更新
    setToken(newToken);
    setUser(userData);
    setIsAuthenticated(true);

    console.log("AuthProvider: Login complete, authenticated:", true);
  };

  const logout = async () => {
    console.log("AuthProvider: Logout called");
    try {
      // 現在のトークンがあるか確認
      if (token) {
        // ログアウトAPIを呼び出す
        console.log("AuthProvider: Calling logout API");
        await api.delete(apiEndpoints.auth.logout(), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: false,
        });
        console.log("AuthProvider: Logout API call successful");
      } else {
        console.log("AuthProvider: No token found, skipping API call");
      }
    } catch (err) {
      console.warn("AuthProvider: Logout API error:", err);
    } finally {
      // ローカル状態をクリア
      setToken(null);
      setUser(null);
      localStorage.removeItem("token");
    }
  };

  const value = {
    token,
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
  };

  console.log("AuthProvider: Rendering with value", value);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  console.log("useAuth: Called, context =", context);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
