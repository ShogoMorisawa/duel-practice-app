import React, { useEffect, useReducer } from "react";
import { NavLink } from "react-router-dom";
import { api, apiEndpoints, handleApiError } from "../utils/api";

// アクションタイプを定義
const ACTIONS = {
  SET_DECKS: "set_decks",
  ADD_DECK: "add_deck",
  SET_NEW_DECK_NAME: "set_new_deck_name",
  SET_LOADING: "set_loading",
  SET_ERROR: "set_error",
};

// 初期状態を定義
const initialState = {
  decks: [],
  newDeckName: "",
  isLoading: false,
  error: null,
};

// リデューサー関数を定義
function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_DECKS:
      return { ...state, decks: action.payload, isLoading: false, error: null };
    case ACTIONS.ADD_DECK:
      return {
        ...state,
        decks: [...state.decks, action.payload],
        newDeckName: "",
        isLoading: false,
        error: null,
      };
    case ACTIONS.SET_NEW_DECK_NAME:
      return { ...state, newDeckName: action.payload };
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

  // デッキ一覧の取得
  const fetchDecks = async () => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    try {
      const res = await api.get(apiEndpoints.decks.getAll());
      dispatch({ type: ACTIONS.SET_DECKS, payload: res.data });
    } catch (error) {
      const standardizedError = handleApiError(error, { context: 'デッキ一覧取得' });
      dispatch({ type: ACTIONS.SET_ERROR, payload: standardizedError });
    }
  };

  useEffect(() => {
    fetchDecks();
  }, []);

  // 新規デッキの追加
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!state.newDeckName.trim()) return;

    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    try {
      const res = await api.post(apiEndpoints.decks.create(), { name: state.newDeckName });
      dispatch({ type: ACTIONS.ADD_DECK, payload: res.data });
    } catch (error) {
      const standardizedError = handleApiError(error, { context: 'デッキ作成' });
      dispatch({ type: ACTIONS.SET_ERROR, payload: standardizedError });
    }
  };

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
      const standardizedError = handleApiError(error, { context: 'デッキ削除' });
      dispatch({ type: ACTIONS.SET_ERROR, payload: standardizedError });
    }
  };

  return (
    <div className="max-w-6xl px-4 py-8 mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">デッキ一覧</h1>
        <div className="text-sm text-gray-500">{state.decks.length} デッキ</div>
      </div>

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

      <form
        onSubmit={handleSubmit}
        className="p-6 mb-8 bg-white border rounded-lg shadow-sm"
      >
        <input
          type="text"
          value={state.newDeckName}
          onChange={(e) =>
            dispatch({
              type: ACTIONS.SET_NEW_DECK_NAME,
              payload: e.target.value,
            })
          }
          placeholder="新しいデッキ名"
          className="flex-1 px-4 py-2 mb-2 border border-gray-300 rounded-md sm:mb-0 sm:mr-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={state.isLoading}
        />
        <button
          type="submit"
          className={`flex items-center justify-center px-4 py-2 font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${
            state.isLoading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={state.isLoading || !state.newDeckName.trim()}
        >
          {state.isLoading ? "処理中..." : "追加"}
        </button>
      </form>

      {/* ローディング表示 */}
      {state.isLoading && (
        <div className="flex justify-center items-center my-6">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">読み込み中...</span>
        </div>
      )}

      {/* デッキがない場合の表示 */}
      {!state.isLoading && state.decks.length === 0 && !state.error && (
        <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-lg">
          <p className="mb-2 text-xl font-medium text-gray-700">
            デッキがありません
          </p>
          <p className="text-gray-500">最初のデッキを作成しましょう！</p>
        </div>
      )}

      {/* デッキ一覧 */}
      <ul>
        {state.decks.map((deck) => (
          <li key={deck.id} className="block p-4 cursor-pointer">
            <NavLink
              to={`/decks/${deck.id}`}
              className="mb-2 text-lg font-semibold text-gray-800 truncate"
            >
              {deck.name}
            </NavLink>
            <button
              onClick={(e) => handleDelete(e, deck.id)}
              className="p-1 text-gray-400 rounded-full hover:bg-gray-100 hover:text-red-500 focus:outline-none"
              disabled={state.isLoading}
            >
              削除
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DeckList;
