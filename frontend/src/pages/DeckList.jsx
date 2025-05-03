import React, { useEffect, useReducer } from "react";
import axios from "axios";
import { NavLink } from "react-router-dom";
import { API_BASE_URL } from "../utils/api";

// アクションタイプを定義
const ACTIONS = {
  SET_DECKS: "set_decks",
  ADD_DECK: "add_deck",
  SET_NEW_DECK_NAME: "set_new_deck_name",
};

// 初期状態を定義
const initialState = {
  decks: [],
  newDeckName: "",
};

// リデューサー関数を定義
function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_DECKS:
      return { ...state, decks: action.payload };
    case ACTIONS.ADD_DECK:
      return {
        ...state,
        decks: [...state.decks, action.payload],
        newDeckName: "",
      };
    case ACTIONS.SET_NEW_DECK_NAME:
      return { ...state, newDeckName: action.payload };
    default:
      return state;
  }
}

const DeckList = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/api/decks`)
      .then((res) => dispatch({ type: ACTIONS.SET_DECKS, payload: res.data }))
      .catch((err) => console.error("デッキ取得に失敗！", err));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!state.newDeckName.trim()) return;

    axios
      .post(`${API_BASE_URL}/api/decks`, { name: state.newDeckName })
      .then((res) => {
        dispatch({ type: ACTIONS.ADD_DECK, payload: res.data });
      })
      .catch((err) => console.error("デッキ追加に失敗！", err));
  };

  const handleDelete = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    axios
      .delete(`${API_BASE_URL}/api/decks/${id}`)
      .then(() => {
        dispatch({
          type: ACTIONS.SET_DECKS,
          payload: state.decks.filter((deck) => deck.id !== id),
        });
      })
      .catch((err) => console.error("デッキ削除に失敗！", err));
  };
  return (
    <div className="max-w-6xl px-4 py-8 mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">デッキ一覧</h1>
        <div className="text-sm text-gray-500">{state.decks.length} デッキ</div>
      </div>
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
        />
        <button
          type="submit"
          className="flex items-center justify-center px-4 py-2 font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:bg-blue-300 disabled:cursor-not-allowed"
        >
          追加
        </button>
      </form>
      {state.decks.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-lg">
          <p className="mb-2 text-xl font-medium text-gray-700">
            デッキがありません
          </p>
          <p className="text-gray-500">最初のデッキを作成しましょう！</p>
        </div>
      )}
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
