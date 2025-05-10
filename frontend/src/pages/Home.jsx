import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-black text-white px-6 py-10">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        <h1 className="text-4xl font-extrabold text-blue-400">
          デュエル練習アプリ
        </h1>
        <p className="text-gray-300 text-lg leading-relaxed">
          デュエマのデッキを自由に作成して、カードを動かして試せるソロプレイツール。
          <br />
          ログインすれば保存・編集も可能。
          <br />
          まずは気軽にプレイしてみよう！
        </p>

        <div className="flex justify-center gap-4">
          {isAuthenticated ? (
            <button
              onClick={() => navigate("/decks")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-md"
            >
              マイデッキを見る
            </button>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-md"
            >
              ログインして始める
            </button>
          )}
          <button
            onClick={() => navigate("/play/guest")}
            className="bg-gray-700 border border-blue-400 text-blue-300 font-semibold px-6 py-3 rounded-md"
          >
            ログインせずに試す
          </button>
        </div>

        <section className="mt-10 text-left bg-gray-800 p-6 rounded-md shadow-md space-y-4">
          <h2 className="text-yellow-400 font-bold text-xl">🧪 遊び方</h2>
          <ol className="list-decimal pl-6 space-y-2 text-gray-300">
            <li>カード画像を40枚アップロードしてデッキを作成</li>
            <li>デッキを選んでプレイ画面へ</li>
            <li>ドロー・戻す・シャッフルなどを自由に操作！</li>
          </ol>
        </section>
      </div>
    </div>
  );
};

export default Home;
