import { createContext, useContext, useState, useEffect } from "react";
import { api, apiEndpoints, handleApiError } from "../utils/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);
  const [isLoading, setIsLoading] = useState(false);

  // 初期化時に明示的にlocalStorageからトークンを読み込む
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken && !token) {
      setToken(storedToken);
      setIsAuthenticated(true);
    }
  }, []);

  // トークンが変更されたときに認証状態を更新
  useEffect(() => {
    setIsAuthenticated(!!token);

    // トークンの変更を確実にlocalStorageに保存
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

  // トークンがある場合、初回マウント時にユーザー情報を取得
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!token) return;

      setIsLoading(true);
      try {
        const response = await api.get(`${apiEndpoints.auth.profile()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          withCredentials: false,
        });

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
    // まずlocalStorageに保存してから状態を更新
    localStorage.setItem("token", newToken);

    // 状態を更新
    setToken(newToken);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      // 現在のトークンがあるか確認
      if (token) {
        // ログアウトAPIを呼び出す
        await api.delete(apiEndpoints.auth.logout(), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: false,
        });
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
