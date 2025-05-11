import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-blue-100 text-gray-900">
      {/* Hero Section */}
      <div className="pt-16 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="mb-12">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-800 tracking-wide mb-4">
              デュエマ一人回し
            </h1>
            <p className="text-lg sm:text-xl text-gray-700 max-w-2xl mx-auto">
              デッキを自由に作成して、ドローやシャッフルを試せる
              <span className="font-bold">ソロプレイツール</span>。
              <br />
              オリジナルデッキの動きをチェックしよう！
            </p>
          </div>

          {/* Card illustration */}
          <div className="relative h-48 mb-12">
            <div className="absolute top-0 left-[calc(50%-35px)] transform -translate-x-1/2 -rotate-6 w-32 h-44 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg shadow-lg border-2 border-white"></div>
            <div className="absolute top-0 left-[calc(50%-35px)] transform -translate-x-1/2 translate-x-4 rotate-6 w-32 h-44 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg border-2 border-white"></div>
            <div className="absolute top-0 left-[calc(50%-35px)] transform -translate-x-1/2 translate-x-8 rotate-12 w-32 h-44 bg-gradient-to-br from-green-400 to-emerald-600 rounded-lg shadow-lg border-2 border-white"></div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
            {isAuthenticated ? (
              <button
                onClick={() => navigate("/decks")}
                className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-4 px-8 rounded-lg shadow-md transition-colors text-lg flex items-center justify-center"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z"
                    clipRule="evenodd"
                  ></path>
                </svg>
                マイデッキを見る
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate("/login")}
                  className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-4 px-8 rounded-lg shadow-md transition-colors text-lg flex items-center justify-center"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  ログインして始める
                </button>
                <button
                  onClick={() => navigate("/decks")}
                  className="bg-yellow-400 hover:bg-yellow-500 text-gray-800 font-bold py-4 px-8 rounded-lg shadow-md transition-colors text-lg flex items-center justify-center"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z"></path>
                  </svg>
                  ログインせずに試す
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-5xl mx-auto px-6 pb-20">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 py-6 px-8">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <svg
                className="w-6 h-6 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z"></path>
              </svg>
              遊び方
            </h2>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-indigo-50 rounded-xl p-6 text-center flex flex-col items-center">
                <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mb-4">
                  1
                </div>
                <h3 className="text-lg font-semibold text-blue-800 mb-2">
                  デッキ作成
                </h3>
                <p className="text-gray-700">
                  カード画像を40枚アップロードして自分だけのデッキを作成しよう
                </p>
              </div>

              <div className="bg-indigo-50 rounded-xl p-6 text-center flex flex-col items-center">
                <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mb-4">
                  2
                </div>
                <h3 className="text-lg font-semibold text-blue-800 mb-2">
                  デッキ選択
                </h3>
                <p className="text-gray-700">
                  作成したデッキを選んでプレイ画面へ進もう
                </p>
              </div>

              <div className="bg-indigo-50 rounded-xl p-6 text-center flex flex-col items-center">
                <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mb-4">
                  3
                </div>
                <h3 className="text-lg font-semibold text-blue-800 mb-2">
                  自由にプレイ
                </h3>
                <p className="text-gray-700">
                  ドロー・戻す・シャッフルなどの操作を思いのままに！
                </p>
              </div>
            </div>

            <div className="mt-8 text-center">
              {isAuthenticated ? (
                <Link
                  to="/decks"
                  className="inline-flex items-center text-blue-700 hover:text-blue-800 font-medium"
                >
                  デッキ一覧を見る
                  <svg
                    className="w-4 h-4 ml-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </Link>
              ) : (
                <Link
                  to="/decks"
                  className="inline-flex items-center text-blue-700 hover:text-blue-800 font-medium"
                >
                  ログインせずに遊ぶ
                  <svg
                    className="w-4 h-4 ml-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
