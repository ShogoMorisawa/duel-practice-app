import React, { useReducer, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const initialState = {
  name: "",
  cards: Array(40).fill(null),
  isSubmitting: false,
  error: null,
};

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
  const [currentPage, setCurrentPage] = useState(0);
  const navigate = useNavigate();

  const handleCardDrop = (e, index) => {
    e.preventDefault();
    const url = e.dataTransfer.getData("text/uri-list");

    if (url && url.startsWith("https://")) {
      dispatch({ type: "SET_CARD", index, payload: url });
      return;
    }

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        dispatch({ type: "SET_CARD", index, payload: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch({ type: "SUBMIT_START" });

    try {
      await axios.post("http://localhost:3000/api/decks", {
        name: state.name,
        cards: state.cards.filter((card) => card !== null),
      });
      dispatch({ type: "SUBMIT_SUCCESS" });
      if (onDeckCreated) onDeckCreated();
      navigate("/");
    } catch (error) {
      console.error("Error creating deck:", error);
      dispatch({ type: "SUBMIT_ERROR", payload: error.message });
    }
  };

  const renderCardInputs = () => {
    const pageStartIndex = currentPage * 8;
    const pageCards = state.cards.slice(pageStartIndex, pageStartIndex + 8);

    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {pageCards.map((card, i) => {
          const index = pageStartIndex + i;
          return (
            <div
              key={index}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleCardDrop(e, index)}
              className="w-full h-32 border-2 border-dashed border-gray-400 rounded-md flex items-center justify-center bg-gray-50 relative"
            >
              {card ? (
                <img
                  src={card}
                  alt={`カード${index + 1}`}
                  className="w-full h-full object-cover rounded-md"
                />
              ) : (
                <span className="text-gray-400 text-sm">ここにドロップ</span>
              )}
            </div>
          );
        })}
      </div>
    );
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
            カード登録（40枚）
          </h3>

          {renderCardInputs()}

          {/* ページネーション */}
          <div className="flex justify-between items-center mt-6">
            <button
              type="button"
              disabled={currentPage === 0}
              onClick={() => setCurrentPage(currentPage - 1)}
              className={`px-4 py-2 rounded ${
                currentPage === 0
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              前へ
            </button>

            <div className="text-gray-700 font-medium">
              ページ {currentPage + 1} / 5
            </div>

            <button
              type="button"
              disabled={currentPage === 4}
              onClick={() => setCurrentPage(currentPage + 1)}
              className={`px-4 py-2 rounded ${
                currentPage === 4
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              次へ
            </button>
          </div>
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
