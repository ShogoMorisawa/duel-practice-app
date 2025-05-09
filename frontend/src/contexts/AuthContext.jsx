import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  console.log("AuthProvider: Initializing...");
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);

  // トークンが変更されたときに認証状態を更新
  useEffect(() => {
    console.log("AuthProvider: Token changed", { token });
    setIsAuthenticated(!!token);
  }, [token]);

  const login = (newToken, userData) => {
    console.log("AuthProvider: Login called", { newToken, userData });
    setToken(newToken);
    setUser(userData);
    localStorage.setItem("token", newToken);
  };

  const logout = () => {
    console.log("AuthProvider: Logout called");
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
  };

  const value = {
    token,
    user,
    isAuthenticated,
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
