import React, { useReducer } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// 初期状態の定義
const initialState = {
  name: "",
  cards: Array(40).fill(""),
  isSubmitting: false,
  error: null,
};

// リデューサー関数
function deckFormReducer(state, action) {
  switch (action.type) {
    case "SET_NAME":
      return { ...state, name: action.payload };
    case "SET_CARD":
      const newCards = [...state.cards];
      newCards[action.index] = action.payload;
      return { ...state, cards: newCards };
    case "SUBMIT_START":
      return { ...state, isSubmitting: true, error: null };
    case "SUBMIT_SUCCESS":
      return { ...state, isSubmitting: false };
    case "SUBMIT_ERROR":
      return { ...state, isSubmitting: false, error: action.payload };
    default:
      return state;
  }
}

const NewDeckForm = ({ onDeckCreated }) => {
  const [state, dispatch] = useReducer(deckFormReducer, initialState);
  const navigate = useNavigate();

  const handleCardChange = (index, value) => {
    dispatch({ type: "SET_CARD", index, payload: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch({ type: "SUBMIT_START" });

    try {
      await axios.post("http://localhost:3000/api/decks", {
        name: state.name,
        cards: state.cards.filter((card) => card.trim() !== ""), // 空のカードをフィルタリング
      });
      dispatch({ type: "SUBMIT_SUCCESS" });
      if (onDeckCreated) onDeckCreated();
      navigate("/"); // 成功したらトップページへ
    } catch (error) {
      console.error("Error creating deck:", error);
      dispatch({ type: "SUBMIT_ERROR", payload: error.message });
    }
  };

  // カード入力フォームを8x5のグリッドで表示するための補助関数
  const renderCardInputs = () => {
    const rows = [];
    for (let i = 0; i < 5; i++) {
      const rowCards = [];
      for (let j = 0; j < 8; j++) {
        const index = i * 8 + j;
        if (index < 40) {
          rowCards.push(
            <div
              key={index}
              className="w-full sm:w-1/2 md:w-1/4 lg:w-1/8 px-1 mb-2"
            >
              <input
                type="text"
                placeholder={`カード ${index + 1}`}
                value={state.cards[index]}
                onChange={(e) => handleCardChange(index, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          );
        }
      }
      rows.push(
        <div key={i} className="flex flex-wrap -mx-1">
          {rowCards}
        </div>
      );
    }
    return rows;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-md p-6"
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-2 border-b-2 border-blue-500">
          デッキ作成
        </h2>

        <div className="mb-6">
          <label
            htmlFor="deck-name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            デッキ名
          </label>
          <input
            id="deck-name"
            type="text"
            placeholder="デッキ名を入力してください"
            value={state.name}
            onChange={(e) =>
              dispatch({ type: "SET_NAME", payload: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
            required
          />
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            カード名（40枚）
          </h3>
          <div className="space-y-3">{renderCardInputs()}</div>
        </div>

        {state.error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            エラー: {state.error}
          </div>
        )}

        <div className="flex justify-center mt-6">
          <button
            type="submit"
            className={`px-6 py-3 rounded-md text-white font-medium ${
              state.isSubmitting || !state.name.trim()
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            }`}
            disabled={state.isSubmitting || !state.name.trim()}
          >
            {state.isSubmitting ? "作成中..." : "デッキを作成"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewDeckForm;
