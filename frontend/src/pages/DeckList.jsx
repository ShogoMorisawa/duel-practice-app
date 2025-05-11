import React, { useEffect, useReducer, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, apiEndpoints, handleApiError } from "../utils/api";
import { useAuth } from "../contexts/AuthContext";

// アクションタイプを定義
const ACTIONS = {
  SET_DECKS: "set_decks",
  SET_LOADING: "set_loading",
  SET_ERROR: "set_error",
};

// 初期状態を定義
const initialState = {
  decks: [],
  isLoading: false,
  error: null,
};

// リデューサー関数を定義
function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_DECKS:
      return { ...state, decks: action.payload, isLoading: false, error: null };
    case ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload, error: null };
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, isLoading: false };
    default:
      return state;
  }
}

const DeckList = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [guestDecks, setGuestDecks] = useState([]);
  const [loadingGuestDecks, setLoadingGuestDecks] = useState(false);
  const [guestDecksError, setGuestDecksError] = useState(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // デッキ一覧の取得
  const fetchDecks = async () => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    try {
      const res = await api.get(apiEndpoints.decks.getAll());
      dispatch({ type: ACTIONS.SET_DECKS, payload: res.data });
    } catch (error) {
      const standardizedError = handleApiError(error, {
        context: "デッキ一覧取得",
      });
      dispatch({ type: ACTIONS.SET_ERROR, payload: standardizedError });
    }
  };

  // ゲストデッキの取得
  const fetchGuestDecks = async () => {
    setLoadingGuestDecks(true);
    setGuestDecksError(null);
    try {
      const response = await fetch("/data/guestDecks.json");
      if (!response.ok) {
        throw new Error("ゲストデッキの取得に失敗しました");
      }
      const data = await response.json();
      setGuestDecks(data);
    } catch (error) {
      console.error("Error fetching guest decks:", error);
      setGuestDecksError(error.message || "ゲストデッキの取得に失敗しました");
    } finally {
      setLoadingGuestDecks(false);
    }
  };

  useEffect(() => {
    fetchDecks();
    fetchGuestDecks();
  }, []);

  // デッキの削除
  const handleDelete = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();

    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    try {
      await api.delete(apiEndpoints.decks.delete(id));
      dispatch({
        type: ACTIONS.SET_DECKS,
        payload: state.decks.filter((deck) => deck.id !== id),
      });
    } catch (error) {
      const standardizedError = handleApiError(error, {
        context: "デッキ削除",
      });
      dispatch({ type: ACTIONS.SET_ERROR, payload: standardizedError });
    }
  };

  // サムネイル画像のURLを取得する関数
  const getThumbnailUrl = (deck) => {
    if (deck.cards && deck.cards.length > 0 && deck.cards[0].imageUrl) {
      return deck.cards[0].imageUrl;
    }
    // デフォルト画像
    return "/images/default-card.jpg";
  };

  // 共通のデッキカードコンポーネント
  const DeckCard = ({ deck, isGuest = false }) => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col">
      <div className="relative h-48 bg-gray-200">
        <img
          src={getThumbnailUrl(deck)}
          alt={deck.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = "/images/default-card.jpg";
          }}
        />
        {isGuest && (
          <div className="absolute top-0 right-0 bg-yellow-500 text-white px-2 py-1 text-xs font-bold">
            ゲスト
          </div>
        )}
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold text-gray-800 mb-2 truncate">
          {deck.name}
        </h3>
        <div className="mt-auto grid grid-cols-2 gap-2">
          <Link
            to={
              isGuest
                ? `/decks/guest/${deck.id.replace("guest-", "")}`
                : `/decks/${deck.id}`
            }
            className="px-3 py-2 bg-blue-500 text-white text-center rounded-md hover:bg-blue-600 transition-colors text-sm font-medium flex items-center justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            詳細
          </Link>
          <Link
            to={isGuest ? `/play/guest/${deck.id}` : `/play/${deck.id}`}
            className="px-3 py-2 bg-green-500 text-white text-center rounded-md hover:bg-green-600 transition-colors text-sm font-medium flex items-center justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                clipRule="evenodd"
              />
            </svg>
            プレイ
          </Link>
          {!isGuest && (
            <button
              onClick={(e) => handleDelete(e, deck.id)}
              className="col-span-2 mt-2 px-3 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors flex items-center justify-center"
              disabled={state.isLoading}
              aria-label="削除"
            >
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              削除
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl px-4 py-8 mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-2 border-b-2 border-blue-500">
          デッキ一覧
        </h2>

        {/* エラー表示 */}
        {state.error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-md text-red-700">
            <p className="font-medium">エラーが発生しました</p>
            <p>{state.error.message}</p>
            <button
              onClick={fetchDecks}
              className="mt-2 px-3 py-1 bg-red-100 border border-red-500 rounded-md hover:bg-red-200 text-sm"
            >
              再試行
            </button>
          </div>
        )}

        {/* ログイン済みユーザーのみ新規デッキ作成ボタンを表示 */}
        {isAuthenticated ? (
          <div className="mb-8 text-center">
            <Link
              to="/new"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-md transition-colors"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              新規デッキを作成
            </Link>
          </div>
        ) : (
          <div className="p-6 mb-8 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-700 mb-2">
              デッキを作成するにはログインが必要です
            </p>
            <button
              onClick={() => navigate("/login")}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              ログインする
            </button>
          </div>
        )}

        {/* ユーザーデッキセクション - ログイン済みの場合のみ表示 */}
        {isAuthenticated && (
          <section>
            <h2 className="text-xl font-bold mb-4 text-gray-800 pb-2 border-b border-gray-200">
              あなたのデッキ
            </h2>

            {/* ローディング表示 */}
            {state.isLoading && (
              <div className="flex justify-center items-center my-6">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-gray-600">読み込み中...</span>
              </div>
            )}

            {/* デッキがない場合の表示 */}
            {!state.isLoading && state.decks.length === 0 && !state.error && (
              <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg">
                <p className="mb-2 text-lg font-medium text-gray-700">
                  デッキがありません
                </p>
                <p className="text-gray-500 mb-4">
                  最初のデッキを作成しましょう！
                </p>
                {isAuthenticated && (
                  <Link
                    to="/new"
                    className="inline-flex items-center px-4 py-2 bg-blue-500 text-white font-medium rounded hover:bg-blue-600 shadow-sm"
                  >
                    新規デッキを作成
                  </Link>
                )}
              </div>
            )}

            {/* ユーザーデッキ一覧 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
              {state.decks.map((deck) => (
                <DeckCard key={deck.id} deck={deck} isGuest={false} />
              ))}
            </div>
          </section>
        )}

        {/* ゲストデッキセクション */}
        <section className={isAuthenticated ? "mt-10" : ""}>
          <h2 className="text-xl font-bold mb-4 text-gray-800 pb-2 border-b border-gray-200">
            ゲスト用デッキ
          </h2>

          {/* ゲストデッキのローディング表示 */}
          {loadingGuestDecks && (
            <div className="flex justify-center items-center my-6">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellow-500"></div>
              <span className="ml-2 text-gray-600">
                ゲストデッキを読み込み中...
              </span>
            </div>
          )}

          {/* ゲストデッキのエラー表示 */}
          {guestDecksError && (
            <div className="mb-6 p-4 bg-yellow-100 border border-yellow-300 rounded-md text-yellow-700">
              <p className="font-medium">
                ゲストデッキの読み込みに失敗しました
              </p>
              <p>{guestDecksError}</p>
              <button
                onClick={fetchGuestDecks}
                className="mt-2 px-3 py-1 bg-yellow-100 border border-yellow-500 rounded-md hover:bg-yellow-200 text-sm"
              >
                再試行
              </button>
            </div>
          )}

          {/* ゲストデッキ一覧 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {guestDecks.map((deck) => (
              <DeckCard key={deck.id} deck={deck} isGuest={true} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default DeckList;
