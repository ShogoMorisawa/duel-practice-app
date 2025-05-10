import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="max-w-2xl mx-auto text-center bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold text-gray-800 mb-6">
          デュエル練習アプリ
        </h1>

        <p className="text-xl text-gray-600 mb-8">
          自分だけのカードデッキを作成して、デュエルの練習ができるアプリです。
        </p>

        <div className="space-y-4">
          {isAuthenticated ? (
            <button
              onClick={() => navigate("/decks")}
              className="w-full py-3 px-6 text-white bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors"
            >
              マイデッキを見る
            </button>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="w-full py-3 px-6 text-white bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors"
            >
              ログインして遊ぶ
            </button>
          )}

          <button
            onClick={() => navigate("/play/guest")}
            className="w-full py-3 px-6 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
          >
            ログインなしで遊ぶ
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
