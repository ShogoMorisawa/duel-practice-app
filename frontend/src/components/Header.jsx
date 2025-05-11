import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Header = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-700 to-indigo-800 shadow-lg overflow-hidden overscroll-none">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* ロゴエリア */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link
                to="/"
                className="text-2xl font-bold text-white hover:text-yellow-300 transition-colors flex items-center"
              >
                <svg
                  className="w-8 h-8 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z"></path>
                </svg>
                デュエマ一人回し
              </Link>
            </div>
          </div>

          {/* PC向けナビゲーション */}
          <nav className="hidden sm:ml-6 sm:flex sm:space-x-8">
            <Link
              to="/decks"
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-white hover:text-yellow-300 border-b-2 border-transparent hover:border-yellow-300 transition-colors"
            >
              デッキ一覧
            </Link>
            {isAuthenticated && (
              <Link
                to="/new"
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-white hover:text-yellow-300 border-b-2 border-transparent hover:border-yellow-300 transition-colors"
              >
                新規デッキ作成
              </Link>
            )}
          </nav>

          {/* 認証ボタン */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="ml-3 inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-800 bg-yellow-300 hover:bg-yellow-400 shadow-sm transition-colors"
              >
                ログアウト
              </button>
            ) : (
              <div className="flex space-x-3">
                <Link
                  to="/login"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white border border-white hover:bg-blue-600 shadow-sm transition-colors"
                >
                  ログイン
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-800 bg-yellow-300 hover:bg-yellow-400 shadow-sm transition-colors"
                >
                  新規登録
                </Link>
              </div>
            )}
          </div>

          {/* モバイル向けメニューボタン */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-yellow-300 hover:bg-blue-600 focus:outline-none"
            >
              <span className="sr-only">メニューを開く</span>
              {menuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* モバイル向けメニュー */}
      {menuOpen && (
        <div className="sm:hidden bg-indigo-700 border-t border-indigo-600">
          <div className="pt-2 pb-3 space-y-1">
            <Link
              to="/decks"
              className="block px-4 py-2 text-base font-medium text-white hover:text-yellow-300 hover:bg-indigo-600"
              onClick={() => setMenuOpen(false)}
            >
              デッキ一覧
            </Link>
            {isAuthenticated && (
              <Link
                to="/new"
                className="block px-4 py-2 text-base font-medium text-white hover:text-yellow-300 hover:bg-indigo-600"
                onClick={() => setMenuOpen(false)}
              >
                新規デッキ作成
              </Link>
            )}
          </div>
          <div className="pt-4 pb-3 border-t border-indigo-600">
            {isAuthenticated ? (
              <div className="flex items-center px-4">
                <button
                  onClick={() => {
                    handleLogout();
                    setMenuOpen(false);
                  }}
                  className="w-full block text-center px-4 py-2 text-base font-medium text-gray-800 bg-yellow-300 hover:bg-yellow-400 rounded-md"
                >
                  ログアウト
                </button>
              </div>
            ) : (
              <div className="flex flex-col space-y-2 px-4 py-2">
                <Link
                  to="/login"
                  className="block text-center px-4 py-2 text-base font-medium text-white border border-white hover:bg-indigo-600 rounded-md"
                  onClick={() => setMenuOpen(false)}
                >
                  ログイン
                </Link>
                <Link
                  to="/register"
                  className="block text-center px-4 py-2 text-base font-medium text-gray-800 bg-yellow-300 hover:bg-yellow-400 rounded-md"
                  onClick={() => setMenuOpen(false)}
                >
                  新規登録
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
